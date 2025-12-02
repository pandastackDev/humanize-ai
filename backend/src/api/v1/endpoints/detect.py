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


def sanitize_text(text: str) -> str:
    """
    Sanitize and pre-process text for detection.

    - Remove markdown formatting (to avoid AI detection)
    - Convert non-ASCII characters to ASCII equivalents
    - Remove/nullify control characters and null bytes
    - Normalize excessive whitespace
    - Ensure UTF-8 encoding
    """
    from api.utils.sanitization import InputSanitizer

    # Use InputSanitizer which handles markdown removal and ASCII conversion
    return InputSanitizer.sanitize(text)


@router.post("/", response_model=DetectResponse, summary="Detect AI-generated content")
async def detect_ai_content(request: DetectRequest) -> DetectResponse:
    """
    Detect AI-generated content using multiple detection methods.

    This endpoint analyzes text using:
    - External API detectors (GPTZero, CopyLeaks, Sapling, Writer, etc.)
    - Internal linguistic analysis (perplexity, entropy, n-gram patterns)

    Workflow:
    1. Validate and sanitize input text
    2. Pre-process text (normalize encoding, remove control chars)
    3. Run external detector APIs in parallel
    4. Compute internal feature metrics
    5. Aggregate and normalize scores
    6. Return unified detection results

    Returns unified scores and detailed results from each detector.
    """
    start_time = time.time()

    try:
        # Step 1: Validate input
        if not request.text or not request.text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Text cannot be empty",
            )

        # Step 2: Sanitize & Pre-process text
        sanitized_text = sanitize_text(request.text)

        if not sanitized_text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Text contains only invalid characters",
            )

        word_count = count_words(sanitized_text)
        if word_count < 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Text must contain at least 10 words for accurate detection",
            )

        # Step 3: Extract metadata and detect language
        language = request.language
        if not language:
            # Create language detection service instance
            lang_service = LanguageDetectionService()
            language, _ = lang_service.detect_language(sanitized_text)

        # Get detection service
        detection_service = get_detection_service()

        # Step 4 & 5: Run external detector APIs and compute internal metrics
        # (This is handled by the detection service)
        detector_results, internal_analysis, cached = await detection_service.detect(
            text=sanitized_text,
            detectors=request.detectors,
            include_internal=request.include_internal_analysis,
            enable_caching=request.enable_caching,
        )

        # Step 6: Aggregate & Normalize Scores
        human_likelihood_pct, ai_likelihood_pct, confidence = _calculate_overall_scores(
            detector_results, internal_analysis
        )

        # Step 7: Build response
        processing_time_ms = (time.time() - start_time) * 1000
        text_sample = sanitized_text[:200] + ("..." if len(sanitized_text) > 200 else "")

        metadata = {
            "word_count": word_count,
            "character_count": len(sanitized_text),
            "processing_time_ms": processing_time_ms,
            "detectors_used": len(detector_results),
            "detectors_succeeded": sum(1 for r in detector_results if r.error is None),
            "detectors_failed": sum(1 for r in detector_results if r.error is not None),
            "internal_analysis_enabled": request.include_internal_analysis,
        }

        # Step 8: Logging (already handled by middleware, but can add specific logging here)
        logger.info(
            f"Detection completed: human_likelihood={human_likelihood_pct:.1f}%, "
            f"word_count={word_count}, detectors_used={len(detector_results)}, "
            f"processing_time={processing_time_ms:.0f}ms"
        )

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

    Uses weighted average of ONLY successful API detector results (excludes internal analysis).
    Only includes detectors that have no errors and confidence > 0.
    """
    # Collect valid detector scores (only from successful API calls)
    human_scores = []
    confidences = []
    detector_names = []

    for result in detector_results:
        # Only include detectors with no errors and positive confidence
        if result.error is None and result.confidence > 0:
            human_scores.append(result.human_probability)
            confidences.append(result.confidence)
            detector_names.append(result.detector.value)

    # Log what detectors are being used for calculation
    if detector_names:
        logger.info(
            f"Calculating overall score from {len(detector_names)} detectors: {', '.join(detector_names)}"
        )
        logger.info(
            f"Detector scores: {[(name, f'{h * 100:.1f}% Human') for name, h in zip(detector_names, human_scores)]}"
        )
    else:
        logger.warning("No valid detector results found for overall score calculation")

    # NOTE: Internal analysis is excluded to rely only on real API results
    # If you want to include it, uncomment below:
    # if internal_analysis and internal_analysis.ai_likelihood_internal is not None:
    #     human_from_internal = 1.0 - internal_analysis.ai_likelihood_internal
    #     human_scores.append(human_from_internal)
    #     confidences.append(0.85)
    #     logger.info(f"Internal analysis included: {human_from_internal*100:.1f}% Human")

    # If no valid scores, return neutral
    if not human_scores:
        logger.warning("No valid detector scores available, returning neutral 50/50")
        return 50.0, 50.0, 0.0

    # Calculate weighted average
    total_weight = sum(confidences)
    if total_weight == 0:
        weighted_human = sum(human_scores) / len(human_scores)
        logger.info(f"Using unweighted average: {weighted_human * 100:.1f}% Human")
    else:
        weighted_human = sum(s * c for s, c in zip(human_scores, confidences)) / total_weight
        logger.info(
            f"Using weighted average (weights: {[f'{c:.2f}' for c in confidences]}): {weighted_human * 100:.1f}% Human"
        )

    # Calculate overall confidence (average of individual confidences)
    overall_confidence = sum(confidences) / len(confidences) if confidences else 0.0

    # Convert to percentages
    human_likelihood_pct = weighted_human * 100
    ai_likelihood_pct = (1 - weighted_human) * 100

    logger.info(
        f"Final overall score: {human_likelihood_pct:.1f}% Human, {ai_likelihood_pct:.1f}% AI, Confidence: {overall_confidence * 100:.1f}%"
    )

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
