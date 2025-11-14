"""
Humanize endpoint for text rewriting and humanization.
"""

import logging

from fastapi import APIRouter, HTTPException

from api.models import HumanizeRequest, HumanizeResponse, LengthMode
from api.services import HumanizationService
from api.utils.sanitization import InputSanitizer

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


@router.post("/", response_model=HumanizeResponse, tags=["Humanize"])
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
        logger.info("=" * 80)
        logger.info("📥 HUMANIZE REQUEST RECEIVED")
        logger.info("=" * 80)
        logger.info(f"Input Text Length: {len(request.input_text)} characters")
        logger.info(f"Input Text Preview: {request.input_text[:200]}...")
        logger.info(f"Tone: {request.tone or 'Not specified'}")
        logger.info(f"Length Mode: {request.length_mode or 'standard'}")
        logger.info(f"Readability Level: {request.readability_level or 'Not specified'}")
        logger.info(f"Language: {request.language or 'Auto-detect'}")
        logger.info(f"Style Sample: {'Provided' if request.style_sample else 'Not provided'}")

        # Step 2: Input Sanitization
        sanitizer = InputSanitizer()
        sanitized_input_text = sanitizer.sanitize(request.input_text)
        sanitized_style_sample = sanitizer.sanitize_optional(request.style_sample)

        logger.info(f"Sanitized Input Length: {len(sanitized_input_text)} characters")

        # Get service instance
        service = get_humanization_service()

        # Convert LengthMode enum to string
        length_mode_str = (
            request.length_mode.value
            if isinstance(request.length_mode, LengthMode)
            else request.length_mode
        )

        # Call humanization service with sanitized input
        result = service.humanize(
            input_text=sanitized_input_text,
            tone=request.tone,
            length_mode=length_mode_str,
            style_sample=sanitized_style_sample,
            readability_level=request.readability_level,
            language=request.language,
        )

        logger.info("=" * 80)
        logger.info("✅ HUMANIZATION SUCCESSFUL")
        logger.info("=" * 80)
        logger.info(f"Output Text Length: {len(result['humanized_text'])} characters")
        logger.info(f"Output Text Preview: {result['humanized_text'][:200]}...")

        if result.get("metrics"):
            metrics = result["metrics"]
            logger.info("-" * 80)
            logger.info("Metrics:")
            logger.info(f"  • Semantic Similarity: {metrics.get('semantic_similarity', 'N/A')}")
            logger.info(f"  • Style Similarity: {metrics.get('style_similarity', 'N/A')}")
            logger.info(f"  • Processing Time: {metrics.get('processing_time_ms', 'N/A')} ms")
            logger.info(f"  • Word Count: {metrics.get('word_count', 'N/A')}")
            logger.info(f"  • Chunks Used: {metrics.get('chunks_used', 'N/A')}")

        if result.get("metadata"):
            metadata = result["metadata"]
            logger.info("-" * 80)
            logger.info("Metadata:")
            logger.info(f"  • Detected Language: {metadata.get('detected_language', 'N/A')}")
            logger.info(f"  • Language Confidence: {metadata.get('language_confidence', 'N/A')}")
            logger.info(f"  • Chunk Count: {metadata.get('chunk_count', 'N/A')}")
            logger.info(f"  • Model Used: {metadata.get('model_used', 'N/A')}")
            logger.info(f"  • Semantic Passed: {metadata.get('semantic_passed', 'N/A')}")
            logger.info(f"  • Style Passed: {metadata.get('style_passed', 'N/A')}")

        logger.info("=" * 80)

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
        raise HTTPException(status_code=500, detail=f"Failed to humanize text: {str(e)}") from e
