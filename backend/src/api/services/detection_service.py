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
from collections import Counter
from typing import Any

import httpx
from anthropic import Anthropic
from writerai import Writer

from api.config import settings
from api.models import DetectorResult, DetectorType, InternalAnalysis

logger = logging.getLogger(__name__)


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

        # Run detections in parallel
        tasks = []

        # External API detectors
        if detectors is None or DetectorType.GPTZERO in detectors:
            tasks.append(self._detect_gptzero(text))
        if detectors is None or DetectorType.COPYLEAKS in detectors:
            tasks.append(self._detect_copyleaks(text))
        if detectors is None or DetectorType.SAPLING in detectors:
            tasks.append(self._detect_sapling(text))
        if detectors is None or DetectorType.WRITER in detectors:
            tasks.append(self._detect_writer(text))
        if detectors is None or DetectorType.ZEROGPT in detectors:
            tasks.append(self._detect_zerogpt(text))
        if detectors is None or DetectorType.ORIGINALITY in detectors:
            tasks.append(self._detect_originality(text))
        if detectors is None or DetectorType.QUILLBOT in detectors:
            tasks.append(self._detect_quillbot(text))

        # Run all external detectors concurrently
        detector_results = []
        if tasks:
            detector_results = await asyncio.gather(*tasks, return_exceptions=True)
            # Filter out exceptions and convert to DetectorResult
            detector_results = [r for r in detector_results if isinstance(r, DetectorResult)]

        # Internal analysis
        internal_analysis = None
        if include_internal:
            internal_analysis = await self._internal_analysis(text)

        # Cache the result
        if enable_caching:
            detector_names = [d.value for d in detectors] if detectors else None
            self._cache.set(text, detector_names, (detector_results, internal_analysis))

        return detector_results, internal_analysis, False

    async def _detect_gptzero(self, text: str) -> DetectorResult:
        """
        Detect using GPTZero API.

        API: https://gptzero.me/docs/api
        """
        start_time = time.time()
        try:
            # Placeholder - real implementation would call actual API
            # For now, return mock data to demonstrate structure
            await asyncio.sleep(0.1)  # Simulate API call

            # Simple heuristic for demo: check for AI-like patterns
            ai_score = self._simple_ai_heuristic(text)

            return self._create_detector_result(
                detector=DetectorType.GPTZERO,
                ai_probability=ai_score,
                human_probability=1 - ai_score,
                confidence=0.85,
                response_time_ms=(time.time() - start_time) * 1000,
                details={"note": "Demo mode - configure GPTZERO_API_KEY for real detection"},
                error=None,
            )
        except Exception as e:
            logger.error(f"GPTZero detection failed: {e!s}")
            return self._create_detector_result(
                detector=DetectorType.GPTZERO,
                ai_probability=0.5,
                human_probability=0.5,
                confidence=0.0,
                error=str(e),
                response_time_ms=(time.time() - start_time) * 1000,
                details=None,
            )

    async def _detect_copyleaks(self, text: str) -> DetectorResult:
        """Detect using CopyLeaks AI Content Detector API."""
        start_time = time.time()
        try:
            await asyncio.sleep(0.1)
            ai_score = self._simple_ai_heuristic(text)

            return self._create_detector_result(
                detector=DetectorType.COPYLEAKS,
                ai_probability=ai_score,
                human_probability=1 - ai_score,
                confidence=0.82,
                response_time_ms=(time.time() - start_time) * 1000,
                details={"note": "Demo mode - configure COPYLEAKS_API_KEY for real detection"},
                error=None,
            )
        except Exception as e:
            logger.error(f"CopyLeaks detection failed: {e!s}")
            return self._create_detector_result(
                detector=DetectorType.COPYLEAKS,
                ai_probability=0.5,
                human_probability=0.5,
                confidence=0.0,
                error=str(e),
                response_time_ms=(time.time() - start_time) * 1000,
                details=None,
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
                # Fallback to heuristic if API key not configured
                await asyncio.sleep(0.1)
                ai_score = self._simple_ai_heuristic(text)
                return self._create_detector_result(
                    detector=DetectorType.SAPLING,
                    ai_probability=ai_score,
                    human_probability=1 - ai_score,
                    confidence=0.80,
                    response_time_ms=(time.time() - start_time) * 1000,
                    details={"note": "Demo mode - configure SAPLING_API_KEY for real detection"},
                    error=None,
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
                            logger.info(f"Sapling API response data: {data}")

                            # Parse Sapling response format
                            # Based on API docs, response may contain: score, score_breakdown, etc.
                            ai_score = 0.5
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
                                    # Log the full response for debugging
                                    logger.warning(
                                        f"Unexpected Sapling response format. Keys: {list(data.keys())}, Full response: {data}"
                                    )
                                    # Try to find any numeric value that might be the score
                                    for key, value in data.items():
                                        if isinstance(value, (int, float)) and 0 <= value <= 1:
                                            ai_score = float(value)
                                            logger.info(f"Using {key}={value} as AI score")
                                            break
                                    if ai_score == 0.5:
                                        # Fallback to heuristic if we couldn't parse
                                        logger.warning(
                                            "Could not parse Sapling response, using heuristic"
                                        )
                                        ai_score = self._simple_ai_heuristic(text)

                                # Calculate confidence based on how far from 0.5
                                confidence = abs(ai_score - 0.5) * 2
                            else:
                                # Unexpected response format
                                logger.warning(
                                    f"Unexpected Sapling response type: {type(data)}, value: {data}"
                                )
                                ai_score = self._simple_ai_heuristic(text)
                                confidence = 0.5

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
                # Fallback to heuristic if API key not configured
                await asyncio.sleep(0.1)
                ai_score = self._simple_ai_heuristic(text)
                return self._create_detector_result(
                    detector=DetectorType.WRITER,
                    ai_probability=ai_score,
                    human_probability=1 - ai_score,
                    confidence=0.83,
                    response_time_ms=(time.time() - start_time) * 1000,
                    details={"note": "Demo mode - configure WRITER_API_KEY for real detection"},
                    error=None,
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
        Headers: ApiKey, Content-Type
        Body: {"input_text": text, "textWords": word_count, ...}
        """
        start_time = time.time()
        try:
            if not settings.ZEROGPT_API_KEY:
                # Fallback to heuristic if API key not configured
                await asyncio.sleep(0.1)
                ai_score = self._simple_ai_heuristic(text)
                return self._create_detector_result(
                    detector=DetectorType.ZEROGPT,
                    ai_probability=ai_score,
                    human_probability=1 - ai_score,
                    confidence=0.78,
                    response_time_ms=(time.time() - start_time) * 1000,
                    details={"note": "Demo mode - configure ZEROGPT_API_KEY for real detection"},
                    error=None,
                )

            # Prepare request body
            word_count = len(text.split())
            body = {
                "input_text": text,
                "textWords": word_count,
                "aiWords": 0,
                "fakePercentage": 0,
                "sentences": [],
                "h": [],
                "collection_id": 0,
                "fileName": "",
                "feedback": "",
            }

            # Call ZeroGPT API
            async with httpx.AsyncClient(timeout=30.0) as client:
                try:
                    response = await client.post(
                        "https://api.zerogpt.com/api/detect/detectText",
                        headers={
                            "ApiKey": settings.ZEROGPT_API_KEY,
                            "Content-Type": "application/json",
                        },
                        json=body,
                    )

                    logger.info(f"ZeroGPT API response status: {response.status_code}")

                    if 200 <= response.status_code < 300:
                        try:
                            data = response.json()
                            logger.info(f"ZeroGPT API response data: {data}")

                            # Parse ZeroGPT response format
                            # Response typically contains fakePercentage, aiWords, or similar fields
                            ai_score = 0.5
                            confidence = 0.0

                            if isinstance(data, dict):
                                # Try different possible response field names
                                if "fakePercentage" in data:
                                    # fakePercentage is likely 0-100 where 100 = fully AI
                                    fake_pct = float(data["fakePercentage"])
                                    ai_score = fake_pct / 100.0  # Normalize 0-100 to 0-1
                                elif "aiPercentage" in data:
                                    ai_pct = float(data["aiPercentage"])
                                    ai_score = ai_pct / 100.0
                                elif "aiWords" in data and "textWords" in data:
                                    # Calculate percentage from word counts
                                    ai_words = float(data.get("aiWords", 0))
                                    text_words = float(data.get("textWords", word_count))
                                    if text_words > 0:
                                        ai_score = ai_words / text_words
                                elif "score" in data:
                                    score = float(data["score"])
                                    if score > 1:
                                        ai_score = score / 100.0
                                    else:
                                        ai_score = score
                                elif "probability" in data:
                                    ai_score = float(data["probability"])
                                elif "ai_probability" in data:
                                    ai_score = float(data["ai_probability"])
                                elif "result" in data and isinstance(data["result"], dict):
                                    # Try nested result object
                                    result = data["result"]
                                    if "fakePercentage" in result:
                                        fake_pct = float(result["fakePercentage"])
                                        ai_score = fake_pct / 100.0
                                    elif "aiPercentage" in result:
                                        ai_pct = float(result["aiPercentage"])
                                        ai_score = ai_pct / 100.0
                                else:
                                    # Log the full response for debugging
                                    logger.warning(
                                        f"Unexpected ZeroGPT response format. Keys: {list(data.keys())}, Full response: {data}"
                                    )
                                    # Try to find any numeric value that might be the score
                                    for key, value in data.items():
                                        if isinstance(value, (int, float)) and 0 <= value <= 100:
                                            ai_score = (
                                                float(value) / 100.0 if value > 1 else float(value)
                                            )
                                            logger.info(f"Using {key}={value} as AI score")
                                            break
                                    if ai_score == 0.5:
                                        # Fallback to heuristic if we couldn't parse
                                        logger.warning(
                                            "Could not parse ZeroGPT response, using heuristic"
                                        )
                                        ai_score = self._simple_ai_heuristic(text)

                                # Calculate confidence based on how far from 0.5
                                confidence = abs(ai_score - 0.5) * 2
                            else:
                                # Unexpected response format
                                logger.warning(
                                    f"Unexpected ZeroGPT response type: {type(data)}, value: {data}"
                                )
                                ai_score = self._simple_ai_heuristic(text)
                                confidence = 0.5

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
                                    "api_version": "v1",
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
                    else:
                        # API returned error status
                        error_text = response.text[:500]  # Limit error text length
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

        except httpx.TimeoutException as e:
            logger.error(f"ZeroGPT detection timeout: {e!s}")
            return self._create_detector_result(
                detector=DetectorType.ZEROGPT,
                ai_probability=0.5,
                human_probability=0.5,
                confidence=0.0,
                error=f"Request timeout: {e!s}",
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
                error=str(e),
                response_time_ms=(time.time() - start_time) * 1000,
                details=None,
            )

    async def _detect_originality(self, text: str) -> DetectorResult:
        """Detect using Originality.ai API."""
        start_time = time.time()
        try:
            await asyncio.sleep(0.1)
            ai_score = self._simple_ai_heuristic(text)

            return self._create_detector_result(
                detector=DetectorType.ORIGINALITY,
                ai_probability=ai_score,
                human_probability=1 - ai_score,
                confidence=0.87,
                response_time_ms=(time.time() - start_time) * 1000,
                details={"note": "Demo mode - configure ORIGINALITY_API_KEY for real detection"},
                error=None,
            )
        except Exception as e:
            logger.error(f"Originality detection failed: {e!s}")
            return self._create_detector_result(
                detector=DetectorType.ORIGINALITY,
                ai_probability=0.5,
                human_probability=0.5,
                confidence=0.0,
                error=str(e),
                response_time_ms=(time.time() - start_time) * 1000,
                details=None,
            )

    async def _detect_quillbot(self, text: str) -> DetectorResult:
        """Detect using QuillBot AI Detector API."""
        start_time = time.time()
        try:
            await asyncio.sleep(0.1)
            ai_score = self._simple_ai_heuristic(text)

            return self._create_detector_result(
                detector=DetectorType.QUILLBOT,
                ai_probability=ai_score,
                human_probability=1 - ai_score,
                confidence=0.81,
                response_time_ms=(time.time() - start_time) * 1000,
                details={"note": "Demo mode - configure QUILLBOT_API_KEY for real detection"},
                error=None,
            )
        except Exception as e:
            logger.error(f"QuillBot detection failed: {e!s}")
            return self._create_detector_result(
                detector=DetectorType.QUILLBOT,
                ai_probability=0.5,
                human_probability=0.5,
                confidence=0.0,
                error=str(e),
                response_time_ms=(time.time() - start_time) * 1000,
                details=None,
            )

    def _simple_ai_heuristic(self, text: str) -> float:
        """
        Simple heuristic to estimate AI probability for demo purposes.

        This is a placeholder that uses basic linguistic features.
        Real implementations would use the actual API services.
        """
        # Check for overly formal language patterns
        formal_words = [
            "utilize",
            "facilitate",
            "implement",
            "demonstrate",
            "consequently",
            "furthermore",
            "moreover",
            "nevertheless",
            "subsequently",
            "accordingly",
        ]

        words = text.lower().split()
        if len(words) == 0:
            return 0.5

        # Count formal words
        formal_count = sum(1 for word in words if any(f in word for f in formal_words))
        formal_ratio = formal_count / len(words)

        # Check sentence structure uniformity
        sentences = re.split(r"[.!?]+", text)
        sentences = [s.strip() for s in sentences if s.strip()]

        if len(sentences) > 1:
            sentence_lengths = [len(s.split()) for s in sentences]
            avg_length = sum(sentence_lengths) / len(sentence_lengths)
            variance = sum((length - avg_length) ** 2 for length in sentence_lengths) / len(
                sentence_lengths
            )
            uniformity_score = 1.0 / (1.0 + math.sqrt(variance) / 10)
        else:
            uniformity_score = 0.5

        # Combine metrics
        ai_score = formal_ratio * 0.4 + uniformity_score * 0.6
        return min(max(ai_score, 0.0), 1.0)

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
