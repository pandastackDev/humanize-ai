"""
Humanize endpoint for text rewriting and humanization.
"""

import logging

from fastapi import APIRouter, HTTPException

from api.models import HumanizeRequest, HumanizeResponse, LengthMode
from api.services import HumanizationService

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize service (singleton pattern)
_humanization_service: HumanizationService | None = None


def get_humanization_service() -> HumanizationService:
    """Get or create humanization service instance."""
    global _humanization_service
    if _humanization_service is None:
        _humanization_service = HumanizationService()
    return _humanization_service


@router.post("/humanize", response_model=HumanizeResponse, tags=["Humanize"])
async def humanize_text(request: HumanizeRequest) -> HumanizeResponse:
    """
    Humanize AI-generated text to make it sound more natural and human-like.

    This endpoint processes text through:
    1. Language detection (auto or provided)
    2. Text chunking (if needed for long texts)
    3. Style conditioning (if style_sample provided)
    4. LLM rewriting (OpenRouter -> OpenAI/Anthropic fallback)
    5. Smoothing and reassembly
    6. Semantic/style validation

    Args:
        request: HumanizeRequest containing input text and parameters

    Returns:
        HumanizeResponse with humanized text and metrics

    Raises:
        HTTPException: If humanization fails
    """
    try:
        logger.info(f"Humanize request received. Text length: {len(request.input_text)}")

        # Get service instance
        service = get_humanization_service()

        # Convert LengthMode enum to string
        length_mode_str = request.length_mode.value if isinstance(request.length_mode, LengthMode) else request.length_mode

        # Call humanization service
        result = service.humanize(
            input_text=request.input_text,
            tone=request.tone,
            length_mode=length_mode_str,
            style_sample=request.style_sample,
            readability_level=request.readability_level,
            language=request.language,
        )

        logger.info(f"Humanization successful. Output length: {len(result['humanized_text'])}")

        # Convert dict result to response model
        return HumanizeResponse(
            humanized_text=result["humanized_text"],
            language=result.get("language"),
            metrics=result.get("metrics"),
            metadata=result.get("metadata"),
        )

    except ValueError as e:
        logger.error(f"Validation error in humanize: {e}")
        raise HTTPException(status_code=400, detail=str(e)) from e
    except RuntimeError as e:
        logger.error(f"Runtime error in humanize: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"Service unavailable: {str(e)}. Please check API key configuration.",
        ) from e
    except Exception as e:
        logger.exception(f"Unexpected error in humanize: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to humanize text: {str(e)}"
        ) from e


