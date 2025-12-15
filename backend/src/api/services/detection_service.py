"""
AI Detection Service - External APIs and Internal Analysis.

This service provides:
1. Integration with external AI detection APIs (GPTZero, CopyLeaks, etc.)
2. Internal linguistic feature analysis (perplexity, entropy, n-gram variance)
3. Unified scoring and caching
"""

import asyncio
import hashlib
import logging
import math
import re
import time
import urllib.parse
from collections import Counter
from typing import Any

import httpx
from anthropic import Anthropic
from writerai import Writer

from api.config import settings
from api.models import DetectorResult, DetectorType, InternalAnalysis
from api.services.crossplag_detector import CrossPlagDetector
from api.services.gptzero_detector import GPTZeroDetector
from api.services.grammarly_detector import GrammarlyDetector
from api.services.quillbot_detector import QuillBotDetector

logger = logging.getLogger(__name__)


def parse_cookie_string(cookie_string: str) -> dict[str, str]:
    """
    Parse a cookie string and extract all cookies.

    Args:
        cookie_string: Cookie string from browser (semicolon-separated)

    Returns:
        Dictionary with all cookies
    """
    cookies = {}

    for cookie in cookie_string.split(";"):
        cookie = cookie.strip()
        if "=" in cookie:
            key, value = cookie.split("=", 1)
            key = key.strip()
            value = value.strip()

            # Store all cookies with URL-decoded values
            cookies[key] = urllib.parse.unquote(value)

    return cookies


class DetectionCache:
    """Simple in-memory cache for detection results."""

    def __init__(self, max_size: int = 1000, ttl_seconds: int = 3600):
        """
        Initialize detection cache.

        Args:
            max_size: Maximum number of entries to cache
            ttl_seconds: Time to live for cache entries in seconds
        """
        self._cache: dict[str, tuple[Any, float]] = {}
        self._max_size = max_size
        self._ttl = ttl_seconds

    def _generate_key(self, text: str, detectors: list[str] | None) -> str:
        """Generate cache key from text and detectors."""
        detector_str = ",".join(sorted(detectors or []))
        content = f"{text}:{detector_str}"
        return hashlib.sha256(content.encode()).hexdigest()

    def get(self, text: str, detectors: list[str] | None) -> Any | None:
        """Get cached result if available and not expired."""
        key = self._generate_key(text, detectors)
        if key in self._cache:
            result, timestamp = self._cache[key]
            if time.time() - timestamp < self._ttl:
                logger.info(f"Cache hit for key: {key[:16]}...")
                return result
            # Expired, remove it
            del self._cache[key]
        return None

    def set(self, text: str, detectors: list[str] | None, result: Any) -> None:
        """Cache a detection result."""
        # Simple LRU: if full, remove oldest entry
        if len(self._cache) >= self._max_size:
            oldest_key = min(self._cache.items(), key=lambda x: x[1][1])[0]
            del self._cache[oldest_key]

        key = self._generate_key(text, detectors)
        self._cache[key] = (result, time.time())
        logger.info(f"Cached result for key: {key[:16]}...")


class AIDetectionService:
    """Service for AI detection using multiple APIs and internal analysis."""

    _ORIGINALITY_BASE_URL = "https://core.originality.ai/api/v2/user/content-scans/lite"

    def __init__(self):
        """Initialize detection service with cache."""
        self._cache = DetectionCache()
        self._anthropic_client: Anthropic | None = None
        if settings.ANTHROPIC_API_KEY:
            self._anthropic_client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self._writer_client: Writer | None = None
        if settings.WRITER_API_KEY:
            self._writer_client = Writer(api_key=settings.WRITER_API_KEY)

    def _create_detector_result(
        self,
        detector: DetectorType,
        ai_probability: float,
        human_probability: float,
        confidence: float,
        response_time_ms: float | None = None,
        details: dict | None = None,
        error: str | None = None,
    ) -> DetectorResult:
        """
        Helper method to create DetectorResult with percentage fields.

        Automatically calculates percentage fields from 0-1 probability values.
        """
        return DetectorResult(
            detector=detector,
            ai_probability=ai_probability,
            human_probability=human_probability,
            ai_probability_pct=round(ai_probability * 100, 2),
            human_probability_pct=round(human_probability * 100, 2),
            confidence=confidence,
            confidence_pct=round(confidence * 100, 2),
            response_time_ms=response_time_ms,
            details=details,
            error=error,
        )

    async def detect(
        self,
        text: str,
        detectors: list[DetectorType] | None = None,
        include_internal: bool = True,
        enable_caching: bool = True,
    ) -> tuple[list[DetectorResult], InternalAnalysis | None, bool]:
        """
        Run AI detection on text using specified detectors.

        Args:
            text: Text to analyze
            detectors: List of detectors to use (all if None)
            include_internal: Whether to include internal analysis
            enable_caching: Whether to use caching

        Returns:
            Tuple of (detector_results, internal_analysis, cached)
        """
        # Check cache first
        if enable_caching:
            detector_names = [d.value for d in detectors] if detectors else None
            cached_result = self._cache.get(text, detector_names)
            if cached_result is not None:
                return cached_result[0], cached_result[1], True

        # Run detections sequentially (one after another)
        detector_results = []

        # External API detectors - run each one and wait for completion before starting next
        if detectors is None or DetectorType.GPTZERO in detectors:
            logger.info("Running GPTZero detection...")
            result = await self._detect_gptzero(text)
            if isinstance(result, DetectorResult):
                detector_results.append(result)

        if detectors is None or DetectorType.COPYLEAKS in detectors:
            logger.info("Running CopyLeaks detection...")
            result = await self._detect_copyleaks(text)
            if isinstance(result, DetectorResult):
                detector_results.append(result)

        if detectors is None or DetectorType.SAPLING in detectors:
            logger.info("Running Sapling detection...")
            result = await self._detect_sapling(text)
            if isinstance(result, DetectorResult):
                detector_results.append(result)

        if detectors is None or DetectorType.WRITER in detectors:
            logger.info("Running Writer detection...")
            result = await self._detect_writer(text)
            if isinstance(result, DetectorResult):
                detector_results.append(result)

        if detectors is None or DetectorType.ZEROGPT in detectors:
            logger.info("Running ZeroGPT detection...")
            result = await self._detect_zerogpt(text)
            if isinstance(result, DetectorResult):
                detector_results.append(result)

        if detectors is None or DetectorType.ORIGINALITY in detectors:
            logger.info("Running Originality.AI detection...")
            result = await self._detect_originality(text)
            if isinstance(result, DetectorResult):
                detector_results.append(result)

        if detectors is None or DetectorType.QUILLBOT in detectors:
            logger.info("Running QuillBot detection...")
            result = await self._detect_quillbot(text)
            if isinstance(result, DetectorResult):
                detector_results.append(result)

        if detectors is None or DetectorType.TURNITIN in detectors:
            logger.info("Running Turnitin detection...")
            result = await self._detect_turnitin(text)
            if isinstance(result, DetectorResult):
                detector_results.append(result)

        if detectors is None or DetectorType.GRAMMARLY in detectors:
            logger.info("Running Grammarly detection...")
            result = await self._detect_grammarly(text)
            if isinstance(result, DetectorResult):
                detector_results.append(result)

        if detectors is None or DetectorType.SCRIBBR in detectors:
            logger.info("Running Scribbr detection...")
            result = await self._detect_scribbr(text)
            if isinstance(result, DetectorResult):
                detector_results.append(result)

        if detectors is None or DetectorType.CROSSPLAG in detectors:
            logger.info("Running CrossPlag detection...")
            result = await self._detect_crossplag(text)
            if isinstance(result, DetectorResult):
                detector_results.append(result)

        # Log summary
        successful = sum(1 for r in detector_results if not r.error)
        failed = sum(1 for r in detector_results if r.error)
        logger.info(
            f"Detection complete - {successful} successful, {failed} failed out of {len(detector_results)} total detectors"
        )

        # Internal analysis
        internal_analysis = None
        if include_internal:
            logger.info("Running internal analysis...")
            internal_analysis = await self._internal_analysis(text)

        # Cache the result
        if enable_caching:
            detector_names = [d.value for d in detectors] if detectors else None
            self._cache.set(text, detector_names, (detector_results, internal_analysis))

        return detector_results, internal_analysis, False

    async def _detect_gptzero(self, text: str) -> DetectorResult:
        """
        Detect using GPTZero API (browser session authentication).

        Uses the user's working implementation with browser cookies.
        API: https://api.gptzero.me/v3/ai/text
        Authentication: Uses cookie string (GPTZERO_COOKIE_STRING)
        """
        start_time = time.time()
        try:
            # Check if cookie string is configured - read from backend/.env
            cookie_string = settings.GPTZERO_COOKIE_STRING
            if not cookie_string or not cookie_string.strip():
                message = (
                    "GPTZero cookie string not configured. Please set GPTZERO_COOKIE_STRING in .env"
                )
                logger.warning(message)
                return self._create_detector_result(
                    detector=DetectorType.GPTZERO,
                    ai_probability=0.5,
                    human_probability=0.5,
                    confidence=0.0,
                    response_time_ms=(time.time() - start_time) * 1000,
                    details=None,
                    error=message,
                )

            # Parse cookies
            try:
                cookies_dict = parse_cookie_string(cookie_string)
                logger.info(f"GPTZero cookies parsed: {len(cookies_dict)} cookies")
            except Exception as e:
                error_msg = f"Failed to parse GPTZero cookies: {e}"
                logger.error(error_msg)
                return self._create_detector_result(
                    detector=DetectorType.GPTZERO,
                    ai_probability=0.5,
                    human_probability=0.5,
                    confidence=0.0,
                    response_time_ms=(time.time() - start_time) * 1000,
                    details=None,
                    error=error_msg,
                )

            # Get scan ID from settings with fallback to working scan ID
            scan_id = getattr(settings, "GPTZERO_SCAN_ID", None)
            if not scan_id:
                # Use the working scan ID from your test script
                scan_id = "ef6eec63-f673-4764-8e96-32875529b4f6"
                logger.info(f"Using default scan ID: {scan_id}")

            # Create detector instance
            detector = GPTZeroDetector(cookies_dict=cookies_dict, scan_id=scan_id, timeout=30)

            # Run detection (async)
            result = await detector.detect_async(text)

            # Check if successful
            if not result.get("success"):
                error_msg = result.get("error", "Unknown error")

                # Provide helpful error messages for common issues
                if "404" in error_msg or "Scan not found" in error_msg:
                    logger.warning(
                        f"GPTZero scan not found (scan_id: {scan_id}). "
                        f"Create a scan at https://app.gptzero.me/ and update GPTZERO_SCAN_ID in .env"
                    )
                    error_msg = (
                        "Scan not found. Please create a scan at https://app.gptzero.me/ "
                        "and set GPTZERO_SCAN_ID in your .env file"
                    )
                elif "401" in error_msg or "Unauthorized" in error_msg:
                    logger.warning("GPTZero authentication failed. Cookies may be expired.")
                    error_msg = (
                        "Authentication failed. Please refresh your GPTZero cookies. "
                        "See docs/GPTZERO_SETUP.md for instructions."
                    )

                logger.error(f"GPTZero detection failed: {error_msg}")
                return self._create_detector_result(
                    detector=DetectorType.GPTZERO,
                    ai_probability=0.5,
                    human_probability=0.5,
                    confidence=0.0,
                    response_time_ms=result.get(
                        "response_time_ms", (time.time() - start_time) * 1000
                    ),
                    details=None,
                    error=error_msg,
                )

            # Extract probabilities
            ai_prob = result.get("ai_probability", 0.5)
            human_prob = result.get("human_probability", 0.5)
            mixed_prob = result.get("mixed_probability", 0.0)
            confidence = result.get("confidence", 0.0)

            # Create details dict
            details = {
                "class_probabilities": result.get("class_probabilities", {}),
                "mixed_probability": mixed_prob,
                "scan_id": result.get("scan_id"),
            }

            logger.info(
                f"GPTZero success: AI={ai_prob:.2%}, Human={human_prob:.2%}, "
                f"Mixed={mixed_prob:.2%}, Confidence={confidence:.2f}"
            )

            return self._create_detector_result(
                detector=DetectorType.GPTZERO,
                ai_probability=ai_prob,
                human_probability=human_prob,
                confidence=confidence,
                response_time_ms=result.get("response_time_ms", (time.time() - start_time) * 1000),
                details=details,
                error=None,
            )

            # Prepare request body
            # GPTZero API accepts either "text" or "document" key
            body = {
                "text": text,
            }

            # Prepare headers with browser-like headers for better compatibility
            headers = {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Origin": "https://app.gptzero.me",
                "Referer": "https://app.gptzero.me/",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
            }

            # Call GPTZero API
            async with httpx.AsyncClient(timeout=30.0) as client:
                try:
                    endpoint = "https://api.gptzero.me/v3/ai/text"

                    # Prepare request
                    response = await client.post(
                        endpoint,
                        headers=headers,
                        json=body,
                    )

                    logger.info(
                        f"GPTZero API response status: {response.status_code} from {endpoint}"
                    )

                    if 200 <= response.status_code < 300:
                        try:
                            data = response.json()
                            logger.info(f"GPTZero API response data: {data}")

                            # Parse GPTZero response format
                            # Expected format: {"documents": [{"class_probabilities": {"ai": 0.95, "mixed": 0.05, "human": 0.0}, ...}], ...}
                            ai_score: float | None = None
                            mixed_score: float | None = None
                            confidence = 0.0

                            if isinstance(data, dict):
                                # Get the first document
                                documents = data.get("documents", [])
                                if documents and isinstance(documents, list) and len(documents) > 0:
                                    document = documents[0]

                                    # Get class_probabilities
                                    class_probabilities = document.get("class_probabilities", {})

                                    if isinstance(class_probabilities, dict):
                                        # Extract AI probability
                                        ai_score = class_probabilities.get("ai")
                                        if ai_score is None:
                                            # Try alternative field names
                                            ai_score = class_probabilities.get("ai_probability")

                                        # Extract mixed probability (optional, for details)
                                        mixed_score = class_probabilities.get("mixed")

                                        # If ai_score is still None, try to calculate from other fields
                                        if ai_score is None:
                                            # Try completely_generated_prob as fallback
                                            completely_generated_prob = document.get(
                                                "completely_generated_prob"
                                            )
                                            if completely_generated_prob is not None:
                                                ai_score = float(completely_generated_prob)

                                        # Calculate confidence from confidence_score if available
                                        confidence_score = document.get("confidence_score")
                                        if confidence_score is not None:
                                            confidence = float(confidence_score)

                                        # If no confidence_score, calculate from how far from 0.5
                                        if confidence == 0.0 and ai_score is not None:
                                            confidence = abs(ai_score - 0.5) * 2
                                    else:
                                        logger.warning(
                                            f"GPTZero response missing class_probabilities. Keys in document: {list(document.keys())}, Full response: {data}"
                                        )
                                else:
                                    logger.warning(
                                        f"GPTZero response missing or empty documents array. Keys: {list(data.keys())}, Full response: {data}"
                                    )
                            else:
                                logger.warning(
                                    f"Unexpected GPTZero response format. Keys: {list(data.keys()) if isinstance(data, dict) else 'not a dict'}, Full response: {data}"
                                )

                            if ai_score is None:
                                raise ValueError(
                                    f"GPTZero response missing AI score. Response: {data}"
                                )

                            # Ensure scores are in valid range
                            ai_score = max(0.0, min(1.0, float(ai_score)))
                            human_probability = 1 - ai_score

                            # Calculate confidence if not already set
                            if confidence == 0.0:
                                confidence = abs(ai_score - 0.5) * 2

                            return self._create_detector_result(
                                detector=DetectorType.GPTZERO,
                                ai_probability=ai_score,
                                human_probability=human_probability,
                                confidence=confidence,
                                response_time_ms=(time.time() - start_time) * 1000,
                                details={
                                    "raw_response": data,
                                    "api_version": "v3",
                                    "mixed_probability": mixed_score,
                                },
                                error=None,
                            )
                        except ValueError as e:
                            # JSON parsing error
                            error_msg = f"Failed to parse GPTZero response: {e!s}. Response text: {response.text[:200]}"
                            logger.error(error_msg)
                            return self._create_detector_result(
                                detector=DetectorType.GPTZERO,
                                ai_probability=0.5,
                                human_probability=0.5,
                                confidence=0.0,
                                error=error_msg,
                                response_time_ms=(time.time() - start_time) * 1000,
                                details=None,
                            )
                        except Exception as e:
                            # Other parsing errors
                            error_msg = f"Failed to parse GPTZero response: {e!s}. Response text: {response.text[:200] if response else 'No response'}"
                            logger.error(error_msg, exc_info=True)
                            return self._create_detector_result(
                                detector=DetectorType.GPTZERO,
                                ai_probability=0.5,
                                human_probability=0.5,
                                confidence=0.0,
                                error=error_msg,
                                response_time_ms=(time.time() - start_time) * 1000,
                                details=None,
                            )
                    else:
                        # API returned error status
                        try:
                            error_data = response.json()
                            error_text = str(error_data)
                        except Exception:
                            error_text = (
                                response.text[:500] if response.text else "No error message"
                            )
                        error_msg = f"HTTP {response.status_code}: {error_text}"
                        logger.error(f"GPTZero API error: {error_msg}")
                        return self._create_detector_result(
                            detector=DetectorType.GPTZERO,
                            ai_probability=0.5,
                            human_probability=0.5,
                            confidence=0.0,
                            error=error_msg,
                            response_time_ms=(time.time() - start_time) * 1000,
                            details=None,
                        )
                except httpx.TimeoutException as e:
                    error_msg = f"Request timeout: {e!s}"
                    logger.error(f"GPTZero detection timeout: {error_msg}")
                    return self._create_detector_result(
                        detector=DetectorType.GPTZERO,
                        ai_probability=0.5,
                        human_probability=0.5,
                        confidence=0.0,
                        error=error_msg,
                        response_time_ms=(time.time() - start_time) * 1000,
                        details=None,
                    )
                except httpx.RequestError as e:
                    error_msg = f"Request error: {e!s}"
                    logger.error(f"GPTZero API request error: {error_msg}")
                    return self._create_detector_result(
                        detector=DetectorType.GPTZERO,
                        ai_probability=0.5,
                        human_probability=0.5,
                        confidence=0.0,
                        error=error_msg,
                        response_time_ms=(time.time() - start_time) * 1000,
                        details=None,
                    )

        except Exception as e:
            logger.error(f"GPTZero detection failed: {e!s}", exc_info=True)
            return self._create_detector_result(
                detector=DetectorType.GPTZERO,
                ai_probability=0.5,
                human_probability=0.5,
                confidence=0.0,
                error=f"Unexpected error: {e!s}",
                response_time_ms=(time.time() - start_time) * 1000,
                details=None,
            )

    async def _detect_copyleaks(self, text: str) -> DetectorResult:
        """Detect using CopyLeaks AI Content Detector API."""
        start_time = time.time()
        message = "CopyLeaks detector not implemented. Requires real API integration."
        logger.warning(message)
        return self._create_detector_result(
            detector=DetectorType.COPYLEAKS,
            ai_probability=0.5,
            human_probability=0.5,
            confidence=0.0,
            response_time_ms=(time.time() - start_time) * 1000,
            details=None,
            error=message,
        )

    async def _detect_sapling(self, text: str) -> DetectorResult:
        """
        Detect using Sapling AI Detector API.

        API: https://api.sapling.ai/api/v1/aidetect
        Method: POST
        Body: {"key": API_KEY, "text": text_to_analyze}
        """
        start_time = time.time()
        try:
            if not settings.SAPLING_API_KEY:
                message = "Sapling API key not configured"
                logger.warning(message)
                return self._create_detector_result(
                    detector=DetectorType.SAPLING,
                    ai_probability=0.5,
                    human_probability=0.5,
                    confidence=0.0,
                    response_time_ms=(time.time() - start_time) * 1000,
                    details=None,
                    error=message,
                )

            # Call Sapling AI detect API
            async with httpx.AsyncClient(timeout=30.0) as client:
                try:
                    response = await client.post(
                        "https://api.sapling.ai/api/v1/aidetect",
                        json={
                            "key": settings.SAPLING_API_KEY,
                            "text": text,
                        },
                        headers={
                            "Content-Type": "application/json",
                        },
                    )

                    logger.info(f"Sapling API response status: {response.status_code}")

                    if 200 <= response.status_code < 300:
                        try:
                            data = response.json()
                            # logger.info(f"Sapling API response data: {data}")

                            # Parse Sapling response format
                            # Based on API docs, response may contain: score, score_breakdown, etc.
                            ai_score: float | None = None
                            confidence = 0.0

                            if isinstance(data, dict):
                                # Try different possible response field names
                                if "score" in data:
                                    # Score is typically 0-1 where 1 = AI, 0 = Human
                                    score = float(data["score"])
                                    if score > 1:
                                        ai_score = score / 100.0  # Normalize 0-100 to 0-1
                                    else:
                                        ai_score = score
                                elif "ai_score" in data:
                                    ai_score = float(data["ai_score"])
                                elif "probability" in data:
                                    ai_score = float(data["probability"])
                                elif "ai_probability" in data:
                                    ai_score = float(data["ai_probability"])
                                elif "score_breakdown" in data and isinstance(
                                    data["score_breakdown"], dict
                                ):
                                    # Try to extract from score_breakdown
                                    breakdown = data["score_breakdown"]
                                    if "ai" in breakdown:
                                        ai_score = float(breakdown["ai"])
                                    elif "score" in breakdown:
                                        ai_score = float(breakdown["score"])
                                else:
                                    logger.warning(
                                        f"Unexpected Sapling response format. Keys: {list(data.keys())}, Full response: {data}"
                                    )

                                # Calculate confidence based on how far from 0.5
                                if ai_score is not None:
                                    confidence = abs(ai_score - 0.5) * 2
                            else:
                                raise ValueError(
                                    f"Unexpected Sapling response type: {type(data)}, value: {data}"
                                )

                            if ai_score is None:
                                raise ValueError(
                                    f"Sapling response missing AI score. Keys: {list(data.keys())}"
                                )

                            # Ensure scores are in valid range
                            ai_score = max(0.0, min(1.0, ai_score))
                            human_probability = 1 - ai_score

                            return self._create_detector_result(
                                detector=DetectorType.SAPLING,
                                ai_probability=ai_score,
                                human_probability=human_probability,
                                confidence=confidence,
                                response_time_ms=(time.time() - start_time) * 1000,
                                details={
                                    "raw_response": data,
                                    "api_version": "v1",
                                },
                                error=None,
                            )
                        except ValueError as e:
                            # JSON parsing error
                            error_msg = f"Failed to parse Sapling response: {e!s}. Response text: {response.text[:200]}"
                            logger.error(error_msg)
                            return self._create_detector_result(
                                detector=DetectorType.SAPLING,
                                ai_probability=0.5,
                                human_probability=0.5,
                                confidence=0.0,
                                error=error_msg,
                                response_time_ms=(time.time() - start_time) * 1000,
                                details=None,
                            )
                    else:
                        # API returned error status
                        error_text = response.text[:500]  # Limit error text length
                        error_msg = f"HTTP {response.status_code}: {error_text}"
                        logger.error(f"Sapling API error: {error_msg}")
                        return self._create_detector_result(
                            detector=DetectorType.SAPLING,
                            ai_probability=0.5,
                            human_probability=0.5,
                            confidence=0.0,
                            error=error_msg,
                            response_time_ms=(time.time() - start_time) * 1000,
                            details=None,
                        )
                except httpx.RequestError as e:
                    error_msg = f"Request error: {e!s}"
                    logger.error(f"Sapling API request error: {error_msg}")
                    return self._create_detector_result(
                        detector=DetectorType.SAPLING,
                        ai_probability=0.5,
                        human_probability=0.5,
                        confidence=0.0,
                        error=error_msg,
                        response_time_ms=(time.time() - start_time) * 1000,
                        details=None,
                    )

        except httpx.TimeoutException as e:
            logger.error(f"Sapling detection timeout: {e!s}")
            return self._create_detector_result(
                detector=DetectorType.SAPLING,
                ai_probability=0.5,
                human_probability=0.5,
                confidence=0.0,
                error=f"Request timeout: {e!s}",
                response_time_ms=(time.time() - start_time) * 1000,
                details=None,
            )
        except Exception as e:
            logger.error(f"Sapling detection failed: {e!s}", exc_info=True)
            return self._create_detector_result(
                detector=DetectorType.SAPLING,
                ai_probability=0.5,
                human_probability=0.5,
                confidence=0.0,
                error=str(e),
                response_time_ms=(time.time() - start_time) * 1000,
                details=None,
            )

    async def _detect_writer(self, text: str) -> DetectorResult:
        """
        Detect using Writer.com AI Content Detector API.

        API: https://dev.writer.com/reference/ai-detect
        Response format: {"label": "fake" | "real", "score": float (0-1)}
        - "fake" = AI-generated (score closer to 1 = more AI-like)
        - "real" = Human-written (score closer to 1 = more human-like)
        """
        start_time = time.time()
        try:
            if not self._writer_client:
                message = "Writer API key not configured"
                logger.warning(message)
                return self._create_detector_result(
                    detector=DetectorType.WRITER,
                    ai_probability=0.5,
                    human_probability=0.5,
                    confidence=0.0,
                    response_time_ms=(time.time() - start_time) * 1000,
                    details=None,
                    error=message,
                )

            # Call Writer AI detect API
            # Note: writerai library is synchronous, so we run it in executor
            # Store client in local variable for type checker
            writer_client = self._writer_client
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None, lambda: writer_client.tools.ai_detect(input=text)
            )

            # Parse response
            # Response format: {"label": "fake" | "real", "score": float}
            # Handle both object and dict responses
            if isinstance(response, dict):
                label = response.get("label", "fake")
                score = response.get("score", 0.5)
            else:
                label = getattr(response, "label", "fake")
                score = getattr(response, "score", 0.5)

            # Convert Writer format to our format
            # "fake" = AI-generated, "real" = Human-written
            if label == "fake":
                # Score represents AI probability (higher = more AI)
                ai_probability = float(score)
                human_probability = 1 - ai_probability
            else:  # "real"
                # Score represents human probability (higher = more human)
                human_probability = float(score)
                ai_probability = 1 - human_probability

            # Confidence based on how far from 0.5 the score is
            confidence = abs(score - 0.5) * 2  # Scale to 0-1

            return self._create_detector_result(
                detector=DetectorType.WRITER,
                ai_probability=ai_probability,
                human_probability=human_probability,
                confidence=confidence,
                response_time_ms=(time.time() - start_time) * 1000,
                details={
                    "label": label,
                    "raw_score": score,
                    "api_version": "writerai",
                },
                error=None,
            )
        except Exception as e:
            logger.error(f"Writer detection failed: {e!s}", exc_info=True)
            return self._create_detector_result(
                detector=DetectorType.WRITER,
                ai_probability=0.5,
                human_probability=0.5,
                confidence=0.0,
                error=str(e),
                response_time_ms=(time.time() - start_time) * 1000,
                details=None,
            )

    async def _detect_zerogpt(self, text: str) -> DetectorResult:
        """
        Detect using ZeroGPT API.

        API: https://api.zerogpt.com/api/detect/detectText
        Method: POST
        Headers: Authorization (Bearer token), Content-Type, and browser-like headers
        Body: {"input_text": text}

        Response format: {"success": true, "data": {"isHuman": 0-100, "fakePercentage": 0-100, ...}}
        """
        start_time = time.time()
        try:
            # Check if API key is configured
            api_key = settings.ZEROGPT_API_KEY
            if not api_key or not api_key.strip():
                message = "ZeroGPT API key not configured"
                logger.warning(message)
                return self._create_detector_result(
                    detector=DetectorType.ZEROGPT,
                    ai_probability=0.5,
                    human_probability=0.5,
                    confidence=0.0,
                    response_time_ms=(time.time() - start_time) * 1000,
                    details=None,
                    error=message,
                )

            # Log API key status (first 20 chars for debugging, not full key for security)
            api_key_preview = api_key[:20] + "..." if len(api_key) > 20 else api_key
            logger.info(f"ZeroGPT API key loaded (preview: {api_key_preview})")

            # Prepare request body
            body = {
                "input_text": text,
            }

            # Prepare headers matching the test script
            # Note: API key is used as Bearer token in Authorization header
            headers = {
                "accept": "application/json, text/plain, */*",
                "accept-encoding": "gzip, deflate, br, zstd",
                "accept-language": "en-US,en;q=0.9",
                "authorization": f"Bearer {api_key.strip()}",
                "content-type": "application/json",
                "origin": "https://www.zerogpt.com",
                "referer": "https://www.zerogpt.com/",
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
            }

            # Call ZeroGPT API
            async with httpx.AsyncClient(timeout=30.0) as client:
                try:
                    endpoint = "https://api.zerogpt.com/api/detect/detectText"

                    response = await client.post(
                        endpoint,
                        headers=headers,
                        json=body,
                    )

                    logger.info(
                        f"ZeroGPT API response status: {response.status_code} from {endpoint}"
                    )

                    if 200 <= response.status_code < 300:
                        try:
                            data = response.json()
                            # logger.info(f"ZeroGPT API response data: {data}")

                            # Parse ZeroGPT response format based on test script
                            # Expected format: {"success": true, "data": {"isHuman": 0-100, "fakePercentage": 0-100, ...}}
                            ai_score: float | None = None
                            confidence = 0.0

                            if isinstance(data, dict):
                                # Check for success flag and data object (matching test script format)
                                if "success" in data:
                                    if not data.get("success"):
                                        # API returned success: false
                                        error_message = data.get(
                                            "message", "ZeroGPT API returned success: false"
                                        )
                                        logger.error(f"ZeroGPT API error: {error_message}")
                                        return self._create_detector_result(
                                            detector=DetectorType.ZEROGPT,
                                            ai_probability=0.5,
                                            human_probability=0.5,
                                            confidence=0.0,
                                            error=error_message,
                                            response_time_ms=(time.time() - start_time) * 1000,
                                            details={"raw_response": data},
                                        )

                                    # success: true, check for data object
                                    if "data" in data and isinstance(data["data"], dict):
                                        data_obj = data["data"]

                                        # Primary field: fakePercentage (0-100) - AI score
                                        if "fakePercentage" in data_obj:
                                            fake_pct = float(data_obj["fakePercentage"])
                                            ai_score = fake_pct / 100.0  # Normalize 0-100 to 0-1
                                        # Alternative: isHuman (0-100) - inverse of AI score
                                        elif "isHuman" in data_obj:
                                            human_pct = float(data_obj["isHuman"])
                                            ai_score = 1.0 - (human_pct / 100.0)  # Inverse
                                        # Fallback: calculate from aiWords and textWords
                                        elif "aiWords" in data_obj and "textWords" in data_obj:
                                            ai_words = float(data_obj.get("aiWords", 0))
                                            text_words = float(data_obj.get("textWords", 0))
                                            if text_words > 0:
                                                ai_score = ai_words / text_words
                                        else:
                                            logger.warning(
                                                f"ZeroGPT response missing score fields. Keys in data: {list(data_obj.keys())}, Full response: {data}"
                                            )
                                    else:
                                        logger.warning(
                                            f"ZeroGPT response has success=true but missing or invalid data object. Keys: {list(data.keys())}, Full response: {data}"
                                        )
                                # Legacy format: direct fakePercentage at root
                                elif "fakePercentage" in data:
                                    fake_pct = float(data["fakePercentage"])
                                    ai_score = fake_pct / 100.0
                                # Legacy format: direct isHuman at root
                                elif "isHuman" in data:
                                    human_pct = float(data["isHuman"])
                                    ai_score = 1.0 - (human_pct / 100.0)
                                else:
                                    logger.warning(
                                        f"Unexpected ZeroGPT response format. Keys: {list(data.keys())}, Full response: {data}"
                                    )

                                if ai_score is None:
                                    raise ValueError(
                                        f"ZeroGPT response missing AI score. Keys: {list(data.keys())}, Response: {data}"
                                    )

                                # Calculate confidence based on how far from 0.5
                                confidence = abs(ai_score - 0.5) * 2
                            else:
                                raise ValueError(
                                    f"Unexpected ZeroGPT response type: {type(data)}, value: {data}"
                                )

                            # Ensure scores are in valid range
                            ai_score = max(0.0, min(1.0, ai_score))
                            human_probability = 1 - ai_score

                            return self._create_detector_result(
                                detector=DetectorType.ZEROGPT,
                                ai_probability=ai_score,
                                human_probability=human_probability,
                                confidence=confidence,
                                response_time_ms=(time.time() - start_time) * 1000,
                                details={
                                    "raw_response": data,
                                    "api_version": "detect/detectText",
                                },
                                error=None,
                            )
                        except ValueError as e:
                            # JSON parsing error
                            error_msg = f"Failed to parse ZeroGPT response: {e!s}. Response text: {response.text[:200]}"
                            logger.error(error_msg)
                            return self._create_detector_result(
                                detector=DetectorType.ZEROGPT,
                                ai_probability=0.5,
                                human_probability=0.5,
                                confidence=0.0,
                                error=error_msg,
                                response_time_ms=(time.time() - start_time) * 1000,
                                details=None,
                            )
                        except Exception as e:
                            # Other parsing errors
                            error_msg = f"Failed to parse ZeroGPT response: {e!s}. Response text: {response.text[:200] if response else 'No response'}"
                            logger.error(error_msg, exc_info=True)
                            return self._create_detector_result(
                                detector=DetectorType.ZEROGPT,
                                ai_probability=0.5,
                                human_probability=0.5,
                                confidence=0.0,
                                error=error_msg,
                                response_time_ms=(time.time() - start_time) * 1000,
                                details=None,
                            )
                    else:
                        # API returned error status
                        try:
                            error_data = response.json()
                            error_text = str(error_data)
                        except Exception:
                            error_text = (
                                response.text[:500] if response.text else "No error message"
                            )
                        error_msg = f"HTTP {response.status_code}: {error_text}"
                        logger.error(f"ZeroGPT API error: {error_msg}")
                        return self._create_detector_result(
                            detector=DetectorType.ZEROGPT,
                            ai_probability=0.5,
                            human_probability=0.5,
                            confidence=0.0,
                            error=error_msg,
                            response_time_ms=(time.time() - start_time) * 1000,
                            details=None,
                        )
                except httpx.TimeoutException as e:
                    error_msg = f"Request timeout: {e!s}"
                    logger.error(f"ZeroGPT detection timeout: {error_msg}")
                    return self._create_detector_result(
                        detector=DetectorType.ZEROGPT,
                        ai_probability=0.5,
                        human_probability=0.5,
                        confidence=0.0,
                        error=error_msg,
                        response_time_ms=(time.time() - start_time) * 1000,
                        details=None,
                    )
                except httpx.RequestError as e:
                    error_msg = f"Request error: {e!s}"
                    logger.error(f"ZeroGPT API request error: {error_msg}")
                    return self._create_detector_result(
                        detector=DetectorType.ZEROGPT,
                        ai_probability=0.5,
                        human_probability=0.5,
                        confidence=0.0,
                        error=error_msg,
                        response_time_ms=(time.time() - start_time) * 1000,
                        details=None,
                    )

        except Exception as e:
            logger.error(f"ZeroGPT detection failed: {e!s}", exc_info=True)
            return self._create_detector_result(
                detector=DetectorType.ZEROGPT,
                ai_probability=0.5,
                human_probability=0.5,
                confidence=0.0,
                error=f"Unexpected error: {e!s}",
                response_time_ms=(time.time() - start_time) * 1000,
                details=None,
            )

    def _split_into_sentences(self, text: str) -> list[str]:
        """
        Split text into sentences for Originality.AI API.

        Uses improved regex pattern matching from test script for better accuracy.
        """
        # Remove HTML tags if present
        if "<" in text and ">" in text:
            text = re.sub(r"<[^>]+>", "", text)

        # Remove extra whitespace
        text = re.sub(r"\s+", " ", text.strip())

        # Split by sentence endings (improved pattern from test script)
        # Uses positive lookbehind to keep punctuation with sentences
        sentences = re.split(r"(?<=[.!?])\s+", text)

        # Filter out empty sentences and strip whitespace
        sentences = [s.strip() for s in sentences if s.strip()]

        # Fallback: if no sentences found, return text as single sentence
        return sentences if sentences else [text]

    def _analyze_blocks(self, blocks: list[dict]) -> dict:
        """
        Analyze block-level results to identify AI-like vs human-like sentences.

        Args:
            blocks: List of block results from Originality.AI API

        Returns:
            Dictionary with analysis including:
            - human_like_count: Number of sentences with real > 0.8
            - ai_like_count: Number of sentences with fake > 0.5
            - ai_like_sentences: List of sentences flagged as AI-like
            - human_like_sentences: List of sentences flagged as human-like
            - patterns: Identified patterns (excessive commas, formal connectors, etc.)
        """
        human_like_count = 0
        ai_like_count = 0
        ai_like_sentences = []
        human_like_sentences = []
        patterns = {
            "excessive_commas": [],
            "formal_connectors": [],
            "overly_complex": [],
            "repetitive": [],
            "forced_emotional": [],
        }

        # Formal connectors that are AI-like
        formal_connectors = [
            "furthermore",
            "moreover",
            "consequently",
            "additionally",
            "subsequently",
            "nevertheless",
            "therefore",
            "thus",
            "hence",
        ]

        for block in blocks:
            text = block.get("text", "").strip()
            result = block.get("result", {})
            fake_score = result.get("fake", 0.5)
            real_score = result.get("real", 0.5)

            if real_score >= 0.8:
                human_like_count += 1
                human_like_sentences.append(
                    {
                        "text": text,
                        "real_score": real_score,
                        "fake_score": fake_score,
                    }
                )
            elif fake_score >= 0.5:
                ai_like_count += 1
                ai_like_sentences.append(
                    {
                        "text": text,
                        "real_score": real_score,
                        "fake_score": fake_score,
                    }
                )

                # Analyze patterns in AI-like sentences
                # Check for excessive commas (4+ in one sentence)
                comma_count = text.count(",")
                if comma_count >= 4:
                    patterns["excessive_commas"].append(text[:100] + "...")

                # Check for formal connectors
                text_lower = text.lower()
                for connector in formal_connectors:
                    if connector in text_lower:
                        patterns["formal_connectors"].append(connector)
                        break

                # Check for overly complex sentences (40+ words)
                word_count = len(text.split())
                if word_count >= 40:
                    patterns["overly_complex"].append(text[:100] + "...")

        return {
            "human_like_count": human_like_count,
            "ai_like_count": ai_like_count,
            "total_blocks": len(blocks),
            "ai_like_sentences": ai_like_sentences[:5],  # Limit to first 5 for size
            "human_like_sentences": human_like_sentences[:5],  # Limit to first 5
            "patterns": patterns,
        }

    def _create_formatted_content(self, text: str) -> str:
        """
        Convert plain text to HTML formatted content for Originality.AI API.

        Matches the formatting from the test script.
        """
        # Split by double newlines (paragraphs)
        paragraphs = text.split("\n\n")

        # Wrap each paragraph in <p> tags
        formatted_paragraphs = []
        for para in paragraphs:
            para = para.strip()
            if para:
                # Replace single newlines with spaces within paragraphs
                para = re.sub(r"\n+", " ", para)
                formatted_paragraphs.append(f"<p>{para}</p>")

        # If no paragraphs found, wrap entire text
        if not formatted_paragraphs:
            text = re.sub(r"\n+", " ", text.strip())
            formatted_paragraphs.append(f"<p>{text}</p>")

        return "".join(formatted_paragraphs)

    async def _poll_originality_scan(
        self,
        client: httpx.AsyncClient,
        scan_id: int,
        max_wait_time: int = 180,
        poll_interval: float = 2.0,
    ) -> dict:
        """
        Poll Originality.AI for scan completion.

        Args:
            client: Shared HTTPX client
            scan_id: Scan identifier returned from create call
            max_wait_time: Maximum seconds to wait for completion
            poll_interval: Delay between polling attempts

        Returns:
            Final scan result payload

        Raises:
            TimeoutError: If scan does not complete in allotted time
        """
        start_time = time.time()

        while True:
            response = await client.get(
                f"{self._ORIGINALITY_BASE_URL}/{scan_id}",
                headers={
                    "Authorization": f"Bearer {settings.ORIGINALITY_API_KEY}",
                    "Accept": "application/json",
                },
            )

            if response.status_code >= 400:
                raise RuntimeError(
                    f"Originality.AI polling failed (status {response.status_code}): "
                    f"{response.text[:300]}"
                )

            data = response.json()
            scan_results = data.get("scan_results", {})
            scan = scan_results.get("scan", {})
            running = scan.get("running", 1)
            jobs_remaining = scan.get("jobs_remaining", 0)

            if running == 0 and jobs_remaining == 0:
                return data

            elapsed = time.time() - start_time
            if elapsed >= max_wait_time:
                raise TimeoutError(
                    f"Originality.AI scan {scan_id} did not finish within {max_wait_time}s "
                    f"(running={running}, jobs_remaining={jobs_remaining})"
                )

            await asyncio.sleep(poll_interval)

    async def _detect_originality(self, text: str) -> DetectorResult:
        """Detect using Originality.ai API."""
        start_time = time.time()

        # Check if API key is configured
        if not settings.ORIGINALITY_API_KEY:
            message = "Originality API key not configured"
            logger.warning(message)
            return self._create_detector_result(
                detector=DetectorType.ORIGINALITY,
                ai_probability=0.5,
                human_probability=0.5,
                confidence=0.0,
                response_time_ms=(time.time() - start_time) * 1000,
                details=None,
                error=message,
            )

        try:
            # Split text into sentences for Originality.AI API (improved method)
            sentences = self._split_into_sentences(text)

            # Create formatted HTML content (improved method)
            formatted_content = self._create_formatted_content(text)

            # Generate title from first sentence if not provided
            title = text[:50] + "..." if len(text) > 50 else text
            if sentences:
                first_sentence = sentences[0]
                if len(first_sentence) > 50:
                    title = first_sentence[:50] + "..."
                else:
                    title = first_sentence

            # Calculate credit cost (rough estimate: 1 credit per 100 words)
            word_count = len(text.split())
            credit_cost = max(1, (word_count + 99) // 100)

            # Prepare request body according to Originality.AI API format
            request_body = {
                "sentences": sentences,
                "originalContent": text,
                "formattedContent": formatted_content,
                "creditCost": credit_cost,
                "title": title,
                "aiModelVersion": 1,
                "excludedUrls": [],
                "pcoTargetedCountry": "United States",
                "pcoTargetedDevice": "desktop",
                "pcoPublishingDomain": "",
                "pcoTargetedQuery": "",
                "egcPresetGuideline": None,
                "egcGuidelineID": None,
                "scan_ai": True,
                "scan_plag": True,
                "scan_facts": False,
                "scan_readability": False,
                "scan_grammar_spelling": False,
                "scan_pco": False,
                "scan_egc": False,
            }

            # Call Originality.AI API with optimized timeout
            async with httpx.AsyncClient(timeout=httpx.Timeout(30.0, connect=10.0)) as client:
                create_response = await client.post(
                    self._ORIGINALITY_BASE_URL,
                    headers={
                        "Authorization": f"Bearer {settings.ORIGINALITY_API_KEY}",
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                    },
                    json=request_body,
                )

                logger.info(
                    f"Originality.AI API called - Status: {create_response.status_code}, "
                    f"Sentences={len(sentences)}"
                )

                if 200 <= create_response.status_code < 300:
                    create_data = create_response.json()
                    scan_id = create_data.get("scanID") or create_data.get("scan", {}).get("id")

                    if not scan_id:
                        logger.error(f"Originality.AI response missing scan ID: {create_data}")
                        raise RuntimeError("Originality.AI response missing scan ID")

                    scan_results = create_data.get("scan_results", {})
                    scan_meta = scan_results.get("scan", {})

                    if not scan_results or scan_meta.get("running", 1) != 0:
                        final_data = await self._poll_originality_scan(client, scan_id)
                    else:
                        final_data = create_data

                    scan_results = final_data.get("scan_results", {})
                    scan = scan_results.get("scan", {})
                    ai_results = scan_results.get("aiResults", {})
                    plag_results = scan_results.get("plagResults", {})

                    ai_fake_score = ai_results.get("ai_fake_score")
                    if ai_fake_score is None:
                        ai_fake_score = scan.get("ai_fake_score")
                    if ai_fake_score is None:
                        ai_fake_score = ai_results.get("fake")
                    if ai_fake_score is None:
                        ai_fake_score = 0.5

                    ai_real_score = ai_results.get("ai_real_score")
                    if ai_real_score is None:
                        ai_real_score = scan.get("ai_real_score")
                    if ai_real_score is None:
                        ai_real_score = ai_results.get("real")
                    if ai_real_score is None:
                        ai_real_score = 0.5

                    ai_probability = float(ai_fake_score)
                    human_probability = float(ai_real_score)
                    confidence = abs(ai_probability - 0.5) * 2

                    block_analysis = None
                    if ai_results and "blocks" in ai_results:
                        block_analysis = self._analyze_blocks(ai_results.get("blocks", []))

                    plagiarism_score = None
                    if plag_results:
                        plagiarism_score = plag_results.get("documentScore")

                    logger.info(
                        f"Originality.AI API: AI={ai_probability:.3f}, "
                        f"Human={human_probability:.3f}, Confidence={confidence:.3f}, "
                        f"ScanID={scan.get('id') or scan_id}"
                    )

                    if block_analysis:
                        logger.info(
                            f"Block analysis: {block_analysis['human_like_count']} human-like, "
                            f"{block_analysis['ai_like_count']} AI-like sentences"
                        )

                    return self._create_detector_result(
                        detector=DetectorType.ORIGINALITY,
                        ai_probability=ai_probability,
                        human_probability=human_probability,
                        confidence=confidence,
                        response_time_ms=(time.time() - start_time) * 1000,
                        details={
                            "ai_fake_score": ai_fake_score,
                            "ai_real_score": ai_real_score,
                            "plagiarism_score": plagiarism_score,
                            "scan_id": scan.get("id") or scan_id,
                            "block_analysis": block_analysis,
                        },
                        error=None,
                    )
                else:
                    error_msg = f"Originality.AI API returned status {create_response.status_code}"
                    error_text = (
                        create_response.text[:500]
                        if hasattr(create_response, "text")
                        else "No error details"
                    )
                    logger.error(f"{error_msg}: {error_text}")

                    logger.debug(f"Request URL: {self._ORIGINALITY_BASE_URL}")
                    logger.debug(f"Request body keys: {list(request_body.keys())}")
                    logger.debug(f"Sentences count: {len(sentences)}")

                    return self._create_detector_result(
                        detector=DetectorType.ORIGINALITY,
                        ai_probability=0.5,
                        human_probability=0.5,
                        confidence=0.0,
                        response_time_ms=(time.time() - start_time) * 1000,
                        details={"error": error_msg, "error_details": error_text},
                        error=error_msg,
                    )
        except httpx.TimeoutException:
            logger.error("Originality.AI API timeout")
            return self._create_detector_result(
                detector=DetectorType.ORIGINALITY,
                ai_probability=0.5,
                human_probability=0.5,
                confidence=0.0,
                response_time_ms=(time.time() - start_time) * 1000,
                details={"error": "API timeout"},
                error="API timeout",
            )
        except TimeoutError as e:
            logger.error(f"Originality.AI polling timeout: {e!s}")
            return self._create_detector_result(
                detector=DetectorType.ORIGINALITY,
                ai_probability=0.5,
                human_probability=0.5,
                confidence=0.0,
                response_time_ms=(time.time() - start_time) * 1000,
                details={"error": "Polling timeout", "error_details": str(e)},
                error=str(e),
            )
        except Exception as e:
            logger.error(f"Originality detection failed: {e!s}")
            return self._create_detector_result(
                detector=DetectorType.ORIGINALITY,
                ai_probability=0.5,
                human_probability=0.5,
                confidence=0.0,
                response_time_ms=(time.time() - start_time) * 1000,
                details={"error": str(e)},
                error=str(e),
            )

    async def _detect_quillbot(self, text: str) -> DetectorResult:
        """
        Detect using QuillBot AI Detector API (browser session authentication).

        Uses the 3-step workflow:
        1. Get AI score from /api/ai-detector/score
        2. Create document in /api/docupine/documents
        3. Upload content to /api/docupine/documents/{id}/content

        Authentication: Uses cookie string (QUILLBOT_COOKIE_STRING) and useridtoken (QUILLBOT_USERIDTOKEN)
        """
        start_time = time.time()
        try:
            # Check if cookie string is configured
            cookie_string = settings.QUILLBOT_COOKIE_STRING
            useridtoken = settings.QUILLBOT_USERIDTOKEN
            if not cookie_string or not cookie_string.strip():
                message = "QuillBot cookie string not configured. Please set QUILLBOT_COOKIE_STRING in .env"
                logger.warning(message)
                return self._create_detector_result(
                    detector=DetectorType.QUILLBOT,
                    ai_probability=0.5,
                    human_probability=0.5,
                    confidence=0.0,
                    response_time_ms=(time.time() - start_time) * 1000,
                    details=None,
                    error=message,
                )

            # Create detector instance
            detector = QuillBotDetector(
                cookie_string=cookie_string, useridtoken=useridtoken, timeout=60
            )

            # Run detection (synchronous call wrapped in asyncio)
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(None, detector.detect, text)

            # Check if detection was successful
            if not result.get("success", False):
                error_msg = result.get("error", "Unknown error")
                logger.error(f"QuillBot detection failed: {error_msg}")
                return self._create_detector_result(
                    detector=DetectorType.QUILLBOT,
                    ai_probability=result.get("ai_probability", 0.5),
                    human_probability=result.get("human_probability", 0.5),
                    confidence=result.get("confidence", 0.0),
                    response_time_ms=(time.time() - start_time) * 1000,
                    details=result.get("raw_response"),
                    error=error_msg,
                )

            # Extract probabilities
            ai_prob = result.get("ai_probability", 0.5)
            human_prob = result.get("human_probability", 0.5)
            confidence = result.get("confidence", 0.0)

            response_time = (time.time() - start_time) * 1000

            logger.info(
                f"QuillBot detection complete: AI={ai_prob:.2%}, Human={human_prob:.2%}, "
                f"Confidence={confidence:.2%}, Time={response_time:.0f}ms"
            )

            return self._create_detector_result(
                detector=DetectorType.QUILLBOT,
                ai_probability=ai_prob,
                human_probability=human_prob,
                confidence=confidence,
                response_time_ms=response_time,
                details={
                    "document_id": result.get("document_id"),
                    "total_ai_score": result.get("total_ai_score"),
                    "raw_response": result.get("raw_response"),
                },
                error=None,
            )

        except Exception as e:
            error_msg = f"QuillBot detection error: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return self._create_detector_result(
                detector=DetectorType.QUILLBOT,
                ai_probability=0.5,
                human_probability=0.5,
                confidence=0.0,
                response_time_ms=(time.time() - start_time) * 1000,
                details=None,
                error=error_msg,
            )

    async def _internal_analysis(self, text: str) -> InternalAnalysis:
        """
        Perform internal linguistic feature analysis.

        Analyzes:
        - Perplexity (via Claude API if available)
        - Entropy
        - N-gram variance
        - Sentence patterns
        - Lexical diversity
        - Burstiness
        """
        words = text.split()
        word_count = len(words)

        # Sentence analysis
        sentences = re.split(r"[.!?]+", text)
        sentences = [s.strip() for s in sentences if s.strip()]
        sentence_lengths = [len(s.split()) for s in sentences]

        avg_sentence_length = (
            sum(sentence_lengths) / len(sentence_lengths) if sentence_lengths else 0
        )
        sentence_length_variance = (
            sum((length - avg_sentence_length) ** 2 for length in sentence_lengths)
            / len(sentence_lengths)
            if sentence_lengths
            else 0
        )

        # Lexical diversity (unique words / total words)
        unique_words = len(set(word.lower() for word in words))
        lexical_diversity = unique_words / word_count if word_count > 0 else 0

        # N-gram variance (bigram analysis)
        ngram_variance = self._calculate_ngram_variance(words)

        # Entropy calculation
        entropy_score = self._calculate_entropy(words)

        # Burstiness (variation in word repetition patterns)
        burstiness = self._calculate_burstiness(words)

        # Perplexity (if Anthropic API available)
        perplexity_score = await self._calculate_perplexity(text)

        # Combine metrics for AI likelihood
        # Lower perplexity = more AI-like
        # Lower entropy = more uniform/AI-like
        # Lower n-gram variance = more repetitive/AI-like
        # Lower burstiness = more uniform/AI-like
        # Higher sentence uniformity = more AI-like

        perplexity_factor = (1 - (perplexity_score / 100)) if perplexity_score else 0.5
        entropy_factor = 1 - entropy_score
        ngram_factor = 1 - ngram_variance
        burstiness_factor = 1 - burstiness
        uniformity_factor = 1 / (1 + math.sqrt(sentence_length_variance) / 10)

        ai_likelihood = (
            perplexity_factor * 0.25
            + entropy_factor * 0.20
            + ngram_factor * 0.20
            + burstiness_factor * 0.20
            + uniformity_factor * 0.15
        )

        return InternalAnalysis(
            perplexity_score=perplexity_score,
            entropy_score=entropy_score,
            ngram_variance=ngram_variance,
            avg_sentence_length=avg_sentence_length,
            sentence_length_variance=sentence_length_variance,
            lexical_diversity=lexical_diversity,
            burstiness_score=burstiness,
            ai_likelihood_internal=min(max(ai_likelihood, 0.0), 1.0),
        )

    def _calculate_ngram_variance(self, words: list[str], n: int = 2) -> float:
        """Calculate n-gram variance (default bigrams)."""
        if len(words) < n:
            return 0.0

        ngrams = [tuple(words[i : i + n]) for i in range(len(words) - n + 1)]
        ngram_counts = Counter(ngrams)

        if not ngram_counts:
            return 0.0

        frequencies = list(ngram_counts.values())
        avg_freq = sum(frequencies) / len(frequencies)
        variance = sum((f - avg_freq) ** 2 for f in frequencies) / len(frequencies)

        # Normalize to 0-1 range
        normalized = min(math.sqrt(variance) / 10, 1.0)
        return normalized

    async def _detect_turnitin(self, text: str) -> DetectorResult:
        """
        Detect using Turnitin AI Detector API.

        Note: Turnitin typically requires institutional access.
        This is a placeholder implementation.
        """
        start_time = time.time()
        try:
            if not settings.TURNITIN_API_KEY:
                message = "Turnitin API key not configured"
                logger.warning(message)
                return self._create_detector_result(
                    detector=DetectorType.TURNITIN,
                    ai_probability=0.5,
                    human_probability=0.5,
                    confidence=0.0,
                    response_time_ms=(time.time() - start_time) * 1000,
                    details=None,
                    error=message,
                )

            # Placeholder - Turnitin API integration would go here
            message = "Turnitin detector not yet implemented - requires institutional access"
            logger.info(message)
            return self._create_detector_result(
                detector=DetectorType.TURNITIN,
                ai_probability=0.5,
                human_probability=0.5,
                confidence=0.0,
                response_time_ms=(time.time() - start_time) * 1000,
                details={"message": message},
                error=message,
            )

        except Exception as e:
            logger.error(f"Turnitin detection failed: {e!s}", exc_info=True)
            return self._create_detector_result(
                detector=DetectorType.TURNITIN,
                ai_probability=0.5,
                human_probability=0.5,
                confidence=0.0,
                error=str(e),
                response_time_ms=(time.time() - start_time) * 1000,
                details=None,
            )

    async def _detect_grammarly(self, text: str) -> DetectorResult:
        """
        Detect using Grammarly AI Detector API (browser session authentication).

        Uses browser session cookies to authenticate with Grammarly's API.
        API: https://capi.grammarly.com/api/check/aidetector
        Authentication: Uses cookie string (GRAMMARLY_COOKIE_STRING)
        """
        start_time = time.time()
        try:
            # Check if cookie string is configured
            cookie_string = settings.GRAMMARLY_COOKIE_STRING
            if not cookie_string or not cookie_string.strip():
                message = "Grammarly cookie string not configured. Please set GRAMMARLY_COOKIE_STRING in .env"
                logger.warning(message)
                return self._create_detector_result(
                    detector=DetectorType.GRAMMARLY,
                    ai_probability=0.5,
                    human_probability=0.5,
                    confidence=0.0,
                    response_time_ms=(time.time() - start_time) * 1000,
                    details=None,
                    error=message,
                )

            # Parse cookies
            try:
                cookies_dict = parse_cookie_string(cookie_string)
                logger.info(f"Grammarly cookies parsed: {len(cookies_dict)} cookies")
            except Exception as e:
                error_msg = f"Failed to parse Grammarly cookies: {e}"
                logger.error(error_msg)
                return self._create_detector_result(
                    detector=DetectorType.GRAMMARLY,
                    ai_probability=0.5,
                    human_probability=0.5,
                    confidence=0.0,
                    response_time_ms=(time.time() - start_time) * 1000,
                    details=None,
                    error=error_msg,
                )

            # Get CSRF token and container ID from settings
            csrf_token = settings.GRAMMARLY_CSRF_TOKEN or cookies_dict.get("csrf-token", "")
            container_id = settings.GRAMMARLY_CONTAINER_ID or cookies_dict.get(
                "gnar_containerId", ""
            )

            # Create detector instance
            detector = GrammarlyDetector(
                cookies_dict=cookies_dict,
                csrf_token=csrf_token,
                container_id=container_id,
                timeout=60,
            )

            # Run detection (sync wrapper for async context)
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(None, detector.detect, text)

            # Check if successful
            if not result.get("success"):
                error_msg = result.get("error", "Unknown error")

                # Provide helpful error messages for common issues
                if "401" in error_msg or "Unauthorized" in error_msg:
                    logger.warning("Grammarly authentication failed. Cookies may be expired.")
                    error_msg = "Authentication failed. Please refresh your Grammarly cookies."
                elif "403" in error_msg or "Forbidden" in error_msg:
                    logger.warning("Grammarly access denied. Check CSRF token and container ID.")
                    error_msg = (
                        "Access denied. Please check your Grammarly CSRF token and container ID."
                    )

                logger.error(f"Grammarly detection failed: {error_msg}")
                return self._create_detector_result(
                    detector=DetectorType.GRAMMARLY,
                    ai_probability=0.5,
                    human_probability=0.5,
                    confidence=0.0,
                    response_time_ms=(time.time() - start_time) * 1000,
                    details=result.get("raw_response"),
                    error=error_msg,
                )

            # Extract results
            ai_probability = result.get("ai_probability", 0.5)
            human_probability = result.get("human_probability", 0.5)
            confidence = result.get("confidence", 0.0)

            logger.info(
                f"Grammarly detection complete - "
                f"AI: {ai_probability:.2%}, "
                f"Human: {human_probability:.2%}, "
                f"Confidence: {confidence:.2%}"
            )

            return self._create_detector_result(
                detector=DetectorType.GRAMMARLY,
                ai_probability=ai_probability,
                human_probability=human_probability,
                confidence=confidence,
                response_time_ms=result.get("response_time_ms"),
                details=result.get("raw_response"),
            )

        except Exception as e:
            logger.error(f"Grammarly detection failed: {e!s}", exc_info=True)
            return self._create_detector_result(
                detector=DetectorType.GRAMMARLY,
                ai_probability=0.5,
                human_probability=0.5,
                confidence=0.0,
                error=str(e),
                response_time_ms=(time.time() - start_time) * 1000,
                details=None,
            )

    async def _detect_scribbr(self, text: str) -> DetectorResult:
        """
        Detect using Scribbr AI Detector API.

        API: https://www.scribbr.com/ai-detector/
        Note: Scribbr uses a proprietary AI detection model.
        This is a placeholder implementation.
        """
        start_time = time.time()
        try:
            if not settings.SCRIBBR_API_KEY:
                message = "Scribbr API key not configured"
                logger.warning(message)
                return self._create_detector_result(
                    detector=DetectorType.SCRIBBR,
                    ai_probability=0.5,
                    human_probability=0.5,
                    confidence=0.0,
                    response_time_ms=(time.time() - start_time) * 1000,
                    details=None,
                    error=message,
                )

            # Placeholder - Scribbr API integration would go here
            message = "Scribbr detector not yet implemented - API documentation needed"
            logger.info(message)
            return self._create_detector_result(
                detector=DetectorType.SCRIBBR,
                ai_probability=0.5,
                human_probability=0.5,
                confidence=0.0,
                response_time_ms=(time.time() - start_time) * 1000,
                details={"message": message},
                error=message,
            )

        except Exception as e:
            logger.error(f"Scribbr detection failed: {e!s}", exc_info=True)
            return self._create_detector_result(
                detector=DetectorType.SCRIBBR,
                ai_probability=0.5,
                human_probability=0.5,
                confidence=0.0,
                error=str(e),
                response_time_ms=(time.time() - start_time) * 1000,
                details=None,
            )

    async def _detect_crossplag(self, text: str) -> DetectorResult:
        """
        Detect using CrossPlag AI Detector API (public, no auth required).

        API: https://lkv1fgxnwa.execute-api.eu-central-1.amazonaws.com/production/detect
        Note: CrossPlag specializes in plagiarism and AI content detection.
        No authentication required - this is a free public endpoint.
        """
        start_time = time.time()
        try:
            # Create detector instance (no auth needed)
            detector = CrossPlagDetector(timeout=60)

            # Run detection (sync wrapper for async context)
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(None, detector.detect, text)

            # Check if successful
            if not result.get("success"):
                error_msg = result.get("error", "Unknown error")

                # Provide helpful error messages for common issues
                if "timeout" in error_msg.lower():
                    logger.warning("CrossPlag request timed out.")
                    error_msg = "Request timed out. Please try again."
                elif "403" in error_msg or "Forbidden" in error_msg:
                    logger.warning("CrossPlag access denied.")
                    error_msg = "Access denied. Service may be temporarily unavailable."

                logger.error(f"CrossPlag detection failed: {error_msg}")
                return self._create_detector_result(
                    detector=DetectorType.CROSSPLAG,
                    ai_probability=0.5,
                    human_probability=0.5,
                    confidence=0.0,
                    response_time_ms=(time.time() - start_time) * 1000,
                    details=result.get("raw_response"),
                    error=error_msg,
                )

            # Extract results
            ai_probability = result.get("ai_probability", 0.5)
            human_probability = result.get("human_probability", 0.5)
            confidence = result.get("confidence", 0.0)

            # Check for ambiguous results that might indicate an error
            # If confidence is 0 and probability is exactly 0.5, it's likely an error
            if confidence == 0.0 and ai_probability == 0.5 and human_probability == 0.5:
                error_msg = "Ambiguous result from CrossPlag API - service may be unavailable"
                logger.warning(f"CrossPlag returned ambiguous result: {error_msg}")
                return self._create_detector_result(
                    detector=DetectorType.CROSSPLAG,
                    ai_probability=0.5,
                    human_probability=0.5,
                    confidence=0.0,
                    response_time_ms=result.get("response_time_ms"),
                    details=result.get("raw_response"),
                    error=error_msg,
                )

            logger.info(
                f"CrossPlag detection complete - "
                f"AI: {ai_probability:.2%}, "
                f"Human: {human_probability:.2%}, "
                f"Confidence: {confidence:.2%}"
            )

            return self._create_detector_result(
                detector=DetectorType.CROSSPLAG,
                ai_probability=ai_probability,
                human_probability=human_probability,
                confidence=confidence,
                response_time_ms=result.get("response_time_ms"),
                details=result.get("raw_response"),
            )

        except Exception as e:
            logger.error(f"CrossPlag detection failed: {e!s}", exc_info=True)
            return self._create_detector_result(
                detector=DetectorType.CROSSPLAG,
                ai_probability=0.5,
                human_probability=0.5,
                confidence=0.0,
                error=str(e),
                response_time_ms=(time.time() - start_time) * 1000,
                details=None,
            )

    def _calculate_entropy(self, words: list[str]) -> float:
        """Calculate Shannon entropy of word distribution."""
        if not words:
            return 0.0

        word_counts = Counter(word.lower() for word in words)
        total_words = len(words)

        entropy = 0.0
        for count in word_counts.values():
            probability = count / total_words
            entropy -= probability * math.log2(probability)

        # Normalize to 0-1 range (max entropy for English is roughly 10-12)
        max_entropy = math.log2(len(word_counts)) if len(word_counts) > 1 else 1
        normalized = min(entropy / max_entropy, 1.0) if max_entropy > 0 else 0.0

        return normalized

    def _calculate_burstiness(self, words: list[str]) -> float:
        """
        Calculate burstiness score (variation in word usage patterns).

        Human writing tends to be "bursty" - words appear in clusters rather than evenly.
        """
        if len(words) < 10:
            return 0.5

        word_positions: dict[str, list[int]] = {}
        for i, word in enumerate(words):
            word_lower = word.lower()
            if word_lower not in word_positions:
                word_positions[word_lower] = []
            word_positions[word_lower].append(i)

        # Calculate inter-arrival times for words that appear multiple times
        burstiness_scores = []
        for positions in word_positions.values():
            if len(positions) > 1:
                gaps = [positions[i + 1] - positions[i] for i in range(len(positions) - 1)]
                avg_gap = sum(gaps) / len(gaps)
                variance = sum((g - avg_gap) ** 2 for g in gaps) / len(gaps)
                # Higher variance = more bursty = more human-like
                burstiness_scores.append(math.sqrt(variance))

        if not burstiness_scores:
            return 0.5

        avg_burstiness = sum(burstiness_scores) / len(burstiness_scores)
        # Normalize to 0-1 range
        normalized = min(avg_burstiness / 50, 1.0)

        return normalized

    async def _calculate_perplexity(self, text: str) -> float | None:
        """
        Calculate perplexity using Claude API if available.

        Lower perplexity = more predictable = more likely AI-generated
        """
        if not self._anthropic_client:
            return None

        try:
            # Use Claude to estimate perplexity
            # We ask it to analyze the text's predictability
            prompt = f"""Analyze the following text and rate its linguistic predictability on a scale of 0-100, where:
- 0-30: Highly unpredictable, creative, varied language (typical of human writing)
- 30-60: Moderate predictability with some variation
- 60-100: Highly predictable, uniform, repetitive patterns (typical of AI writing)

Only respond with a number between 0-100.

Text to analyze:
{text[:1000]}"""  # Limit to first 1000 chars to save tokens

            response = self._anthropic_client.messages.create(
                model="claude-3-haiku-20240307",  # Use fast model for analysis
                max_tokens=10,
                messages=[{"role": "user", "content": prompt}],
            )

            # Extract number from response
            first_block: Any = response.content[0]
            if not hasattr(first_block, "text"):
                return None
            content = first_block.text.strip()
            match = re.search(r"\d+\.?\d*", content)
            if match is None:
                return None
            score = float(match.group())
            return min(max(score, 0.0), 100.0)

        except Exception as e:
            logger.warning(f"Perplexity calculation failed: {e!s}")
            return None


# Singleton instance
_detection_service: AIDetectionService | None = None


def get_detection_service() -> AIDetectionService:
    """Get or create singleton detection service instance."""
    global _detection_service
    if _detection_service is None:
        _detection_service = AIDetectionService()
    return _detection_service
