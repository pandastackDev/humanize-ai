"""
AI Detection endpoints - Detect AI-generated content using multiple detectors.
"""

import logging
import time
from typing import Any

from fastapi import APIRouter, HTTPException, status

from api.models import (
    DetectCompareRequest,
    DetectorResult,
    DetectorType,
    DetectRequest,
    DetectResponse,
)
from api.services.detection_service import get_detection_service
from api.services.language_detection import LanguageDetectionService

router = APIRouter()
logger = logging.getLogger(__name__)


def count_words(text: str) -> int:
    """Count words in text."""
    words = text.split()
    return len(words)


@router.post("/", response_model=DetectResponse, summary="Detect AI-generated content")
async def detect_ai_content(request: DetectRequest) -> DetectResponse:
    """
    Detect AI-generated content using multiple detection methods.

    This endpoint analyzes text using:
    - External API detectors (GPTZero, CopyLeaks, Sapling, Writer, etc.)
    - Internal linguistic analysis (perplexity, entropy, n-gram patterns)

    Returns unified scores and detailed results from each detector.
    """
    start_time = time.time()

    try:
        # Validate input
        if not request.text or not request.text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Text cannot be empty",
            )

        word_count = count_words(request.text)
        if word_count < 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Text must contain at least 10 words for accurate detection",
            )

        # Detect language if not provided
        language = request.language
        if not language:
            # Create language detection service instance
            lang_service = LanguageDetectionService()
            language, _ = lang_service.detect_language(request.text)

        # Get detection service
        detection_service = get_detection_service()

        # Run detection
        detector_results, internal_analysis, cached = await detection_service.detect(
            text=request.text,
            detectors=request.detectors,
            include_internal=request.include_internal_analysis,
            enable_caching=request.enable_caching,
        )

        # Calculate overall scores
        human_likelihood_pct, ai_likelihood_pct, confidence = _calculate_overall_scores(
            detector_results, internal_analysis
        )

        # Build response
        processing_time_ms = (time.time() - start_time) * 1000
        text_sample = request.text[:200] + ("..." if len(request.text) > 200 else "")

        metadata = {
            "word_count": word_count,
            "character_count": len(request.text),
            "processing_time_ms": processing_time_ms,
            "detectors_used": len(detector_results),
            "detectors_succeeded": sum(1 for r in detector_results if r.error is None),
            "detectors_failed": sum(1 for r in detector_results if r.error is not None),
            "internal_analysis_enabled": request.include_internal_analysis,
        }

        return DetectResponse(
            text_sample=text_sample,
            language=language,
            human_likelihood_pct=human_likelihood_pct,
            ai_likelihood_pct=ai_likelihood_pct,
            confidence=confidence,
            detector_results=detector_results,
            internal_analysis=internal_analysis,
            metadata=metadata,
            cached=cached,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Detection failed: {e!s}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Detection failed: {e!s}",
        ) from e


def _calculate_overall_scores(
    detector_results: list[DetectorResult],
    internal_analysis: Any,
) -> tuple[float, float, float]:
    """
    Calculate overall human/AI likelihood and confidence.

    Uses weighted average of detector results and internal analysis.
    """
    # Collect valid detector scores
    human_scores = []
    confidences = []

    for result in detector_results:
        if result.error is None and result.confidence > 0:
            human_scores.append(result.human_probability)
            confidences.append(result.confidence)

    # Add internal analysis if available
    if internal_analysis and internal_analysis.ai_likelihood_internal is not None:
        human_from_internal = 1.0 - internal_analysis.ai_likelihood_internal
        human_scores.append(human_from_internal)
        confidences.append(0.85)  # Internal analysis has decent confidence

    # If no valid scores, return neutral
    if not human_scores:
        return 50.0, 50.0, 0.0

    # Calculate weighted average
    total_weight = sum(confidences)
    if total_weight == 0:
        weighted_human = sum(human_scores) / len(human_scores)
    else:
        weighted_human = sum(s * c for s, c in zip(human_scores, confidences)) / total_weight

    # Calculate overall confidence (average of individual confidences)
    overall_confidence = sum(confidences) / len(confidences) if confidences else 0.0

    # Convert to percentages
    human_likelihood_pct = weighted_human * 100
    ai_likelihood_pct = (1 - weighted_human) * 100

    return human_likelihood_pct, ai_likelihood_pct, overall_confidence


@router.post("/compare", summary="Compare detection before and after humanization")
async def compare_detection(request: DetectCompareRequest) -> dict:
    """
    Compare AI detection scores before and after humanization.

    This is useful for evaluating the effectiveness of the humanization process.

    Args:
        original_text: Original (possibly AI-generated) text
        humanized_text: Humanized version of the text
        detectors: Optional list of specific detectors to use

    Returns:
        Comparison results showing improvement in human likelihood
    """
    # Basic validation on inputs
    if count_words(request.original_text) < 10 or count_words(request.humanized_text) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both original_text and humanized_text must have at least 10 words",
        )

    detection_service = get_detection_service()
    detector_types: list[DetectorType] | None = request.detectors

    # Detect both texts
    original_results, original_internal, _ = await detection_service.detect(
        text=request.original_text,
        detectors=detector_types,
        include_internal=True,
        enable_caching=True,
    )

    humanized_results, humanized_internal, _ = await detection_service.detect(
        text=request.humanized_text,
        detectors=detector_types,
        include_internal=True,
        enable_caching=True,
    )

    # Calculate scores
    orig_human_pct, orig_ai_pct, orig_conf = _calculate_overall_scores(
        original_results, original_internal
    )
    hum_human_pct, hum_ai_pct, hum_conf = _calculate_overall_scores(
        humanized_results, humanized_internal
    )

    # Calculate improvement
    improvement_pct = hum_human_pct - orig_human_pct

    return {
        "original": {
            "human_likelihood_pct": orig_human_pct,
            "ai_likelihood_pct": orig_ai_pct,
            "confidence": orig_conf,
        },
        "humanized": {
            "human_likelihood_pct": hum_human_pct,
            "ai_likelihood_pct": hum_ai_pct,
            "confidence": hum_conf,
        },
        "improvement": {
            "human_likelihood_delta": improvement_pct,
            "ai_likelihood_delta": -improvement_pct,
            "improvement_percentage": (
                (improvement_pct / (100 - orig_human_pct)) * 100 if orig_human_pct < 100 else 0
            ),
        },
        "summary": (
            f"Humanization {'improved' if improvement_pct > 0 else 'reduced'} "
            f"human likelihood by {abs(improvement_pct):.1f}%"
        ),
    }
