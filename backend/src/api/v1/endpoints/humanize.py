"""
Humanize endpoint for text rewriting and humanization.
"""

import logging
import re

from fastapi import APIRouter, Header, HTTPException

from api.config import settings
from api.models import (
    HumanizeRequest,
    HumanizeResponse,
    LengthMode,
    Metadata,
    Metrics,
    SubscriptionCheckRequest,
)
from api.services import HumanizationService
from api.services.stealthwriter_service import StealthWriterService
from api.utils.sanitization import InputSanitizer
from api.v1.endpoints.subscriptions import check_subscription

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


def count_words(text: str) -> int:
    """Count words in text."""
    # Simple word count using whitespace and punctuation
    words = re.findall(r"\b\w+\b", text)
    return len(words)


@router.post("/", response_model=HumanizeResponse)
async def humanize_text(
    request: HumanizeRequest,
    x_user_id: str | None = Header(None, alias="X-User-Id"),
    x_organization_id: str | None = Header(None, alias="X-Organization-Id"),
) -> HumanizeResponse:
    """
    Humanize AI-generated text to make it sound more natural and human-like.

    This endpoint processes text through:
    1. Subscription and usage limit checks
    2. Language detection (auto or provided)
    3. Text chunking (if needed for long texts)
    4. Style conditioning (if style_sample provided)
    5. LLM rewriting (Anthropic -> OpenAI fallback)
    6. Smoothing and reassembly
    7. Semantic/style validation

    Args:
        request: HumanizeRequest containing input text and parameters
        x_user_id: WorkOS user ID (optional, required for subscription checks)
        x_organization_id: WorkOS organization ID (optional)

    Returns:
        HumanizeResponse with humanized text and metrics

    Raises:
        HTTPException: If humanization fails or limits are exceeded
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
        logger.info(f"User ID: {x_user_id or 'Not provided'}")
        logger.info(f"Organization ID: {x_organization_id or 'Not provided'}")

        # Count words in input text
        input_word_count = count_words(request.input_text)

        # Check subscription limits if user_id is provided
        if x_user_id:
            try:
                subscription_check = SubscriptionCheckRequest(
                    user_id=x_user_id, organization_id=x_organization_id
                )
                subscription_info = await check_subscription(subscription_check)

                # Check word limit per request
                request_limit = settings.REQUEST_LIMITS.get(
                    subscription_info.plan.value, settings.REQUEST_LIMITS["Pro"]
                )

                if input_word_count > request_limit:
                    raise HTTPException(
                        status_code=403,
                        detail=(
                            f"Request limit exceeded. Your plan ({subscription_info.plan.value}) "
                            f"allows up to {request_limit} words per request, but you provided {input_word_count} words. "
                            f"Please reduce the text length or upgrade your plan."
                        ),
                    )

                # Check monthly word limit
                if subscription_info.words_remaining < input_word_count:
                    raise HTTPException(
                        status_code=403,
                        detail=(
                            f"Monthly limit exceeded. You have {subscription_info.words_remaining} words remaining "
                            f"this month, but your request requires {input_word_count} words. "
                            f"Please upgrade your plan or wait until next billing period."
                        ),
                    )

                logger.info(
                    f"Subscription Check: Plan={subscription_info.plan.value}, "
                    f"Words Used={subscription_info.words_used}/{subscription_info.word_limit}, "
                    f"Remaining={subscription_info.words_remaining}"
                )
            except HTTPException:
                raise
            except Exception as e:
                logger.warning(f"Subscription check failed, proceeding anyway: {e}")
                # Continue with processing even if subscription check fails
        else:
            # No user ID provided - use default free limits
            request_limit = settings.REQUEST_LIMITS["free"]
            if input_word_count > request_limit:
                raise HTTPException(
                    status_code=403,
                    detail=(
                        f"Request limit exceeded. Free tier allows up to {request_limit} words per request. "
                        f"Please sign in and upgrade your plan."
                    ),
                )

        # Step 2: Input Sanitization
        sanitizer = InputSanitizer()
        sanitized_input_text = sanitizer.sanitize(request.input_text)
        sanitized_style_sample = sanitizer.sanitize_optional(request.style_sample)

        logger.info(f"Sanitized Input Length: {len(sanitized_input_text)} characters")

        # Step 3: Route based on Advanced Mode
        logger.info("=" * 80)
        if request.advanced_mode:
            logger.info("🚀 ADVANCED MODE: Using StealthWriter API only")
            logger.info("=" * 80)

            # Advanced Mode: Use ONLY StealthWriter API - no fallback
            if not settings.DEFAULT_COOKIE_STRING or not settings.DEFAULT_COOKIE_STRING.strip():
                raise HTTPException(
                    status_code=503,
                    detail="Advanced mode requires StealthWriter to be configured. Please configure DEFAULT_COOKIE_STRING in backend/.env",
                )

            try:
                logger.info("📝 Input to StealthWriter:")
                logger.info(f"   • Length: {len(sanitized_input_text)} characters")
                logger.info(f"   • Words: {len(sanitized_input_text.split())} words")
                logger.info(
                    f"   • Preview: {sanitized_input_text[:150]}..."
                    if len(sanitized_input_text) > 150
                    else f"   • Text: {sanitized_input_text}"
                )

                stealthwriter = StealthWriterService(cookie_string=settings.DEFAULT_COOKIE_STRING)

                if not stealthwriter.is_valid():
                    raise HTTPException(
                        status_code=503,
                        detail="StealthWriter service is not valid. Please check your DEFAULT_COOKIE_STRING configuration.",
                    )

                stealthwriter_result = stealthwriter.humanize_text(
                    text=sanitized_input_text,
                    level=8,  # Use level from service default
                    n=5,  # Number of variations
                )

                if not stealthwriter_result:
                    raise HTTPException(
                        status_code=503,
                        detail="StealthWriter API call failed. Please check your cookies or try again later.",
                    )

                final_humanized_text = stealthwriter.extract_humanized_text(stealthwriter_result)

                if not final_humanized_text or not final_humanized_text.strip():
                    raise HTTPException(
                        status_code=503,
                        detail="StealthWriter returned empty result. Please try again.",
                    )

                logger.info("✅ StealthWriter processing complete")
                logger.info(f"   • Output length: {len(final_humanized_text)} chars")
                logger.info(f"   • Output words: {len(final_humanized_text.split())} words")
                logger.info(
                    f"   • Preview: {final_humanized_text[:200]}..."
                    if len(final_humanized_text) > 200
                    else f"   • Text: {final_humanized_text}"
                )

                # Return response with StealthWriter results
                return HumanizeResponse(
                    humanized_text=final_humanized_text,
                    language=request.language,  # Use provided language or None
                    metrics=Metrics(
                        word_count=len(final_humanized_text.split()),
                        character_count=len(final_humanized_text),
                        processing_time_ms=0.0,  # We don't track time for StealthWriter
                    ),
                    metadata=Metadata(
                        detected_language=request.language or "unknown",
                        model_used="stealthwriter",
                    ),
                )

            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"StealthWriter processing failed: {e}", exc_info=True)
                raise HTTPException(
                    status_code=503, detail=f"StealthWriter processing failed: {str(e)}"
                )

        else:
            # Standard Mode: Use ONLY our own humanization workflow
            logger.info("🔧 STANDARD MODE: Using our own humanization workflow")
            logger.info("=" * 80)

            # Standard Mode: Use ONLY our own humanization workflow
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
                logger.info(
                    f"  • Language Confidence: {metadata.get('language_confidence', 'N/A')}"
                )
                logger.info(f"  • Chunk Count: {metadata.get('chunk_count', 'N/A')}")
                logger.info(f"  • Model Used: {metadata.get('model_used', 'N/A')}")
                logger.info(f"  • Semantic Passed: {metadata.get('semantic_passed', 'N/A')}")
                logger.info(f"  • Style Passed: {metadata.get('style_passed', 'N/A')}")

            logger.info("=" * 80)

            final_humanized_text = result["humanized_text"]

            logger.info("=" * 80)
            logger.info("📤 FINAL OUTPUT")
            logger.info("=" * 80)
            logger.info(f"Final text length: {len(final_humanized_text)} characters")
            logger.info(f"Final text words: {len(final_humanized_text.split())} words")
            logger.info(
                f"Final preview: {final_humanized_text[:200]}..."
                if len(final_humanized_text) > 200
                else f"Final text: {final_humanized_text}"
            )
            logger.info("=" * 80)

            # Convert dict result to response model
            return HumanizeResponse(
                humanized_text=final_humanized_text,
                language=result.get("language"),
                metrics=result.get("metrics"),
                metadata=result.get("metadata"),
            )

    except HTTPException:
        # Re-raise HTTPExceptions to preserve their status codes (403, 400, etc.)
        raise
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
