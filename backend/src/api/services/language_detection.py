"""
Language detection service.

Supports multiple detection methods with fallback chain:
- Lingua-py (primary) - Modern, accurate, ~75 languages
- Cloud API (optional) - For languages outside Lingua's support or high scalability
- langdetect (fallback) - Lightweight fallback
- Manual heuristics (ultra-short text < 30 words)

Includes benchmarking and metrics tracking for accuracy and latency.
"""

import logging
import re
import time
from collections import defaultdict
from typing import Any

# Try to import Lingua-py (primary)
try:
    from lingua import Language, LanguageDetectorBuilder

    LINGUA_AVAILABLE = True
except ImportError:
    LINGUA_AVAILABLE = False
    logging.warning("Lingua-py not available. Install with: pip install lingua-language-detector")

# Try to import langdetect (fallback)
try:
    from langdetect import DetectorFactory, detect
    from langdetect.lang_detect_exception import LangDetectException

    LANGDETECT_AVAILABLE = True
except ImportError:
    LANGDETECT_AVAILABLE = False
    # Define dummy values for type checking
    detect = None  # type: ignore
    DetectorFactory = None  # type: ignore
    LangDetectException = Exception  # type: ignore
    logging.warning("langdetect not available. Install with: pip install langdetect")

from api.config import settings

logger = logging.getLogger(__name__)

# Set seed for consistent results (langdetect)
if LANGDETECT_AVAILABLE and DetectorFactory is not None:
    DetectorFactory.seed = 0

# Common language codes mapping for compatibility
LANGUAGE_CODE_MAP = {
    "zh_cn": "zh",  # Chinese Simplified
    "zh_tw": "zh",  # Chinese Traditional
    "pt_br": "pt",  # Portuguese Brazil
    "pt_pt": "pt",  # Portuguese Portugal
}


class LanguageDetectionService:
    """Service for detecting language in text with multiple fallback methods."""

    def __init__(self):
        """Initialize language detection service with fallback chain."""
        # Metrics tracking for benchmarking
        self.metrics_enabled = settings.ENABLE_LANGUAGE_DETECTION_METRICS
        self.metrics = {
            "detection_times": defaultdict(list),  # method -> [latency_ms, ...]
            "detection_count": defaultdict(int),  # method -> count
            "fallback_count": defaultdict(int),  # method -> fallback count
            "errors": defaultdict(int),  # method -> error count
        }

        # Initialize Lingua-py (primary)
        self.lingua_detector = None
        if LINGUA_AVAILABLE:
            try:
                # Build detector with all available languages for best accuracy
                self.lingua_detector = (
                    LanguageDetectorBuilder.from_all_languages()
                    .with_preloaded_language_models()
                    .build()
                )
                logger.info("Lingua-py detector initialized successfully")
            except Exception as e:
                logger.warning(f"Failed to initialize Lingua-py: {e}. Will use fallback methods.")
                self.lingua_detector = None

        # Initialize Cloud API (optional fallback)
        self.use_cloud_api = settings.USE_CLOUD_LANGUAGE_DETECTION and bool(
            settings.GOOGLE_CLOUD_TRANSLATE_API_KEY
        )
        if self.use_cloud_api:
            logger.info("Google Cloud Translation API enabled for language detection")

    def _detect_with_heuristics(self, text: str) -> tuple[str, float]:
        """
        Simple heuristic-based detection for ultra-short texts (< 30 words).

        Uses basic pattern matching for common languages.
        """
        text_lower = text.lower()
        word_count = len(text.split())

        # English patterns
        english_patterns = [
            r"\b(the|and|or|but|in|on|at|to|for|of|with|by)\b",
            r"\b(is|are|was|were|been|being|have|has|had|do|does|did)\b",
        ]
        english_score = sum(1 for pattern in english_patterns if re.search(pattern, text_lower))

        # Spanish patterns
        spanish_patterns = [
            r"\b(el|la|los|las|de|del|en|con|por|para|que|es|son|fue|fueron)\b",
            r"[áéíóúñü]",
        ]
        spanish_score = sum(1 for pattern in spanish_patterns if re.search(pattern, text_lower))

        # French patterns
        french_patterns = [
            r"\b(le|la|les|de|du|des|en|avec|pour|que|est|sont|était|étaient)\b",
            r"[àâäéèêëïîôùûüÿç]",
        ]
        french_score = sum(1 for pattern in french_patterns if re.search(pattern, text_lower))

        # German patterns
        german_patterns = [
            r"\b(der|die|das|und|oder|aber|in|auf|mit|für|von|zu|ist|sind|war|waren)\b",
            r"[äöüß]",
        ]
        german_score = sum(1 for pattern in german_patterns if re.search(pattern, text_lower))

        # Find highest score
        scores = {
            "en": english_score,
            "es": spanish_score,
            "fr": french_score,
            "de": german_score,
        }
        best_lang = max(scores, key=scores.get)  # type: ignore
        best_score = scores[best_lang]

        # Normalize confidence (0.5-0.7 for heuristics, lower than ML methods)
        confidence = 0.5 + (best_score / max(word_count, 10)) * 0.2
        confidence = min(confidence, 0.7)  # Cap at 0.7 for heuristics

        return best_lang, confidence

    def _detect_with_cloud_api(self, text: str) -> tuple[str, float] | None:
        """
        Detect language using Google Cloud Translation API.

        Useful for:
        - Languages outside Lingua's supported set
        - High scalability scenarios
        - When cloud API is preferred

        Returns None if API call fails or is not configured.
        """
        if not self.use_cloud_api:
            return None

        try:
            # Try v2 first, fallback to v3
            try:
                from google.cloud import translate_v2 as translate  # type: ignore[import-untyped]
            except ImportError:
                from google.cloud import translate  # type: ignore[import-untyped]

            client = translate.Client(api_key=settings.GOOGLE_CLOUD_TRANSLATE_API_KEY)

            # Detect language
            result = client.detect_language(text)
            lang_code = result.get("language") if isinstance(result, dict) else None

            if not lang_code:
                logger.warning("Google Cloud API did not return a language code")
                return None

            confidence = result.get("confidence", 0.9) if isinstance(result, dict) else 0.9

            # Normalize to ISO 639-1
            lang_code = LANGUAGE_CODE_MAP.get(lang_code, lang_code)
            if lang_code and len(lang_code) > 2:
                lang_code = lang_code[:2]  # Take first 2 chars (ISO 639-1)

            if not lang_code:
                return None

            logger.info(
                f"Google Cloud API detected language: {lang_code} (confidence: {confidence:.2f})"
            )
            return lang_code, float(confidence)
        except ImportError:
            logger.warning(
                "google-cloud-translate not installed. Install with: pip install google-cloud-translate"
            )
            return None
        except Exception as e:
            logger.warning(f"Google Cloud API detection failed: {e}")
            return None

    def _track_metrics(
        self, method: str, latency_ms: float, success: bool = True, fallback: bool = False
    ) -> None:
        """Track detection metrics for benchmarking."""
        if not self.metrics_enabled:
            return

        self.metrics["detection_times"][method].append(latency_ms)
        if success:
            self.metrics["detection_count"][method] += 1
        else:
            self.metrics["errors"][method] += 1

        if fallback:
            self.metrics["fallback_count"][method] += 1

    def get_metrics_summary(self) -> dict[str, Any]:
        """
        Get summary of detection metrics for benchmarking.

        Returns:
            Dictionary with average latency, success rates, fallback rates per method
        """
        summary: dict[str, Any] = {}

        for method in self.metrics["detection_times"]:
            times = self.metrics["detection_times"][method]
            count = self.metrics["detection_count"][method]
            errors = self.metrics["errors"][method]
            fallbacks = self.metrics["fallback_count"][method]

            summary[method] = {
                "total_detections": count,
                "total_errors": errors,
                "total_fallbacks": fallbacks,
                "average_latency_ms": sum(times) / len(times) if times else 0,
                "min_latency_ms": min(times) if times else 0,
                "max_latency_ms": max(times) if times else 0,
                "success_rate": count / (count + errors) if (count + errors) > 0 else 0,
                "fallback_rate": fallbacks / count if count > 0 else 0,
            }

        return summary

    def _lingua_to_iso639(self, lingua_lang: Language) -> str:
        """Convert Lingua Language enum to ISO 639-1 code."""
        # Map Lingua language codes to ISO 639-1
        lingua_code_map = {
            Language.CHINESE: "zh",
            Language.PORTUGUESE: "pt",
            Language.SPANISH: "es",
            Language.FRENCH: "fr",
            Language.GERMAN: "de",
            Language.ITALIAN: "it",
            Language.DUTCH: "nl",
            Language.POLISH: "pl",
            Language.TURKISH: "tr",
            Language.RUSSIAN: "ru",
            Language.JAPANESE: "ja",
            Language.KOREAN: "ko",
            Language.ARABIC: "ar",
            Language.ENGLISH: "en",
        }

        # Try direct mapping first
        if lingua_lang in lingua_code_map:
            return lingua_code_map[lingua_lang]

        # Try to get ISO code from enum attribute
        try:
            # Try different possible attribute names
            if hasattr(lingua_lang, "iso_code_639_1"):
                iso_code = lingua_lang.iso_code_639_1
                if hasattr(iso_code, "name"):
                    return iso_code.name.lower()
                elif hasattr(iso_code, "value"):
                    return str(iso_code.value).lower()
            elif hasattr(lingua_lang, "iso_code_639_1"):
                return str(lingua_lang.iso_code_639_1).lower()
            elif hasattr(lingua_lang, "name"):
                # Fallback to enum name
                lang_name = lingua_lang.name.lower()
                # Try to extract from name like "ENGLISH" -> "en"
                if lang_name.startswith("chinese"):
                    return "zh"
                # Default to first two letters for common languages
                if len(lang_name) >= 2:
                    return lang_name[:2]
        except Exception as e:
            logger.debug(f"Failed to extract ISO code from Lingua Language: {e}")

        # Ultimate fallback: try to use string representation
        lang_str = str(lingua_lang).lower()
        if lang_str in lingua_code_map.values():
            return lang_str

        # Last resort: default to English
        logger.warning(
            f"Could not convert Lingua Language {lingua_lang} to ISO 639-1. Defaulting to 'en'"
        )
        return "en"

    def detect_language(self, text: str) -> tuple[str, float]:
        """
        Detect the language of the given text using fallback chain.

        Priority order:
        1. Lingua-py (primary) - Modern, accurate, ~75 languages
        2. Cloud API (optional) - For languages outside Lingua's support or high scalability
        3. langdetect (fallback) - Lightweight fallback
        4. Heuristics (ultra-short < 30 words)

        Args:
            text: Text to analyze

        Returns:
            Tuple of (language_code, confidence). Language code is ISO 639-1 format.

        Raises:
            ValueError: If language cannot be detected
        """
        if not text or not text.strip():
            raise ValueError("Text cannot be empty for language detection")

        text = text.strip()
        word_count = len(text.split())
        start_time = time.time()
        logger.info(f"Starting language detection for {word_count} words ({len(text)} characters)")

        # Ultra-short text handling (< 30 words)
        if word_count < 30:
            logger.info(
                f"Text is very short ({word_count} words). Using heuristics as primary method."
            )
            try:
                # Still try Lingua-py first if available (it can handle short text)
                if self.lingua_detector is not None:
                    try:
                        detected_lang = self.lingua_detector.detect_language_of(text)
                        # Check for UNKNOWN language (if it exists in this version)
                        try:
                            unknown_lang = getattr(Language, "UNKNOWN", None)
                            if detected_lang is not None and (
                                unknown_lang is None or detected_lang != unknown_lang
                            ):
                                lang_code = self._lingua_to_iso639(detected_lang)
                                # Lower confidence for short texts
                                confidence = 0.6 + (word_count / 30) * 0.2
                                confidence = min(confidence, 0.85)
                                logger.info(
                                    f"Lingua-py detected language: {lang_code} (confidence: {confidence:.2f}) for short text"
                                )
                                return lang_code, confidence
                        except (AttributeError, NameError):
                            # Language.UNKNOWN might not exist in this version
                            if detected_lang is not None:
                                lang_code = self._lingua_to_iso639(detected_lang)
                                confidence = 0.6 + (word_count / 30) * 0.2
                                confidence = min(confidence, 0.85)
                                logger.info(
                                    f"Lingua-py detected language: {lang_code} (confidence: {confidence:.2f}) for short text"
                                )
                                return lang_code, confidence
                    except Exception as e:
                        logger.debug(f"Lingua-py failed on short text: {e}. Trying heuristics.")

                # Fallback to heuristics for very short text
                lang_code, confidence = self._detect_with_heuristics(text)
                logger.info(
                    f"Heuristic detection for short text: {lang_code} (confidence: {confidence:.2f})"
                )
                return lang_code, confidence
            except Exception as e:
                logger.warning(f"Short text detection failed: {e}. Defaulting to English.")
                return "en", 0.5

        # Normal length text - use ML methods
        # Try Lingua-py first (primary)
        if self.lingua_detector is not None:
            try:
                # Lingua-py returns Language enum or None
                method_start = time.time()
                logger.debug(f"Calling Lingua-py detect_language_of for {word_count} words...")
                detected_lang = self.lingua_detector.detect_language_of(text)
                logger.debug("Lingua-py detect_language_of completed")
                latency_ms = (time.time() - method_start) * 1000

                # Check for UNKNOWN language (if it exists in this version)
                unknown_lang = getattr(Language, "UNKNOWN", None)
                if detected_lang is not None and (
                    unknown_lang is None or detected_lang != unknown_lang
                ):
                    lang_code = self._lingua_to_iso639(detected_lang)
                    # For longer texts, confidence is higher
                    # Lingua-py is very accurate, so we use high confidence
                    confidence = 0.85 + min(word_count / 200, 0.1)
                    confidence = min(confidence, 0.95)
                    logger.info(
                        f"Lingua-py detected language: {lang_code} (confidence: {confidence:.2f})"
                    )
                    self._track_metrics("lingua", latency_ms, success=True, fallback=False)
                    return lang_code, confidence
                elif unknown_lang is not None and detected_lang == unknown_lang:
                    logger.debug("Lingua-py returned UNKNOWN language. Trying fallback methods.")
                    self._track_metrics("lingua", latency_ms, success=False, fallback=True)
            except AttributeError:
                # Handle case where Language.UNKNOWN doesn't exist in this version
                try:
                    method_start = time.time()
                    detected_lang = self.lingua_detector.detect_language_of(text)
                    latency_ms = (time.time() - method_start) * 1000

                    if detected_lang is not None:
                        lang_code = self._lingua_to_iso639(detected_lang)
                        confidence = 0.85 + min(word_count / 200, 0.1)
                        confidence = min(confidence, 0.95)
                        self._track_metrics("lingua", latency_ms, success=True, fallback=False)
                        logger.info(
                            f"Lingua-py detected language: {lang_code} (confidence: {confidence:.2f}, latency: {latency_ms:.2f}ms)"
                        )
                        return lang_code, confidence
                    self._track_metrics("lingua", latency_ms, success=False, fallback=True)
                except Exception as e:
                    method_start = time.time()
                    latency_ms = (time.time() - method_start) * 1000
                    self._track_metrics("lingua", latency_ms, success=False, fallback=True)
                    logger.warning(f"Lingua-py detection failed: {e}. Trying fallback methods.")
            except Exception as e:
                method_start = time.time()
                latency_ms = (time.time() - method_start) * 1000
                self._track_metrics("lingua", latency_ms, success=False, fallback=True)
                logger.warning(f"Lingua-py detection failed: {e}. Trying fallback methods.")

        # Try Cloud API (optional fallback for languages outside Lingua's support)
        if self.use_cloud_api:
            try:
                method_start = time.time()
                result = self._detect_with_cloud_api(text)
                latency_ms = (time.time() - method_start) * 1000

                if result:
                    lang_code, confidence = result
                    self._track_metrics("cloud_api", latency_ms, success=True, fallback=True)
                    logger.info(
                        f"Cloud API detected language: {lang_code} (confidence: {confidence:.2f}, latency: {latency_ms:.2f}ms)"
                    )
                    return lang_code, confidence
                self._track_metrics("cloud_api", latency_ms, success=False, fallback=True)
            except Exception as e:
                method_start = time.time()
                latency_ms = (time.time() - method_start) * 1000
                self._track_metrics("cloud_api", latency_ms, success=False, fallback=True)
                logger.warning(f"Cloud API detection failed: {e}. Trying langdetect.")

        # Fallback to langdetect (last resort)
        if LANGDETECT_AVAILABLE and detect is not None:
            try:
                method_start = time.time()
                lang_code = detect(text)
                latency_ms = (time.time() - method_start) * 1000
                # langdetect doesn't provide confidence, estimate based on text length
                confidence = 0.75 + min(word_count / 300, 0.15)
                confidence = min(confidence, 0.9)
                self._track_metrics("langdetect", latency_ms, success=True, fallback=True)
                logger.info(
                    f"langdetect detected language: {lang_code} (confidence: {confidence:.2f}, latency: {latency_ms:.2f}ms)"
                )
                return lang_code, confidence
            except LangDetectException as e:  # type: ignore[misc]
                method_start = time.time()
                latency_ms = (time.time() - method_start) * 1000
                self._track_metrics("langdetect", latency_ms, success=False, fallback=True)
                logger.error(f"langdetect detection failed: {e}")

        # Last resort: use heuristics even for longer texts
        logger.warning("All ML detection methods failed. Using heuristics as last resort.")
        try:
            method_start = time.time()
            lang_code, confidence = self._detect_with_heuristics(text)
            latency_ms = (time.time() - method_start) * 1000
            self._track_metrics("heuristics", latency_ms, success=True, fallback=True)
            return lang_code, confidence
        except Exception:
            # Absolute last resort: default to English
            total_latency = (time.time() - start_time) * 1000
            logger.warning(
                f"All language detection methods failed. Defaulting to English. Total latency: {total_latency:.2f}ms"
            )
            return "en", 0.5

    def is_supported_language(self, lang_code: str) -> bool:
        """
        Check if a language is in the primary support list.

        Primary supported languages have localized prompt templates.
        """
        primary_languages = {
            "en",  # English
            "zh",  # Chinese (Simplified/Traditional)
            "hi",  # Hindi
            "es",  # Spanish
            "ar",  # Arabic
            "bn",  # Bengali
            "pt",  # Portuguese
            "ru",  # Russian
            "ur",  # Urdu
            "id",  # Indonesian
            "fr",  # French
            "de",  # German
            "ja",  # Japanese
            "sw",  # Swahili
            "mr",  # Marathi
            "te",  # Telugu
            "tr",  # Turkish
            "vi",  # Vietnamese
            "ko",  # Korean
            "ta",  # Tamil
            "it",  # Italian
            "th",  # Thai
            "gu",  # Gujarati
            "pl",  # Polish
            "uk",  # Ukrainian
            "fa",  # Persian
            "ml",  # Malayalam
            "af",  # Afrikaans
            "sq",  # Albanian
            "bg",  # Bulgarian
            "ca",  # Catalan
            "hr",  # Croatian
            "cs",  # Czech
            "da",  # Danish
            "nl",  # Dutch
            "et",  # Estonian
            "tl",  # Tagalog
            "fi",  # Finnish
            "el",  # Greek
            "hu",  # Hungarian
            "kn",  # Kannada
            "lv",  # Latvian
            "lt",  # Lithuanian
            "mk",  # Macedonian
            "ne",  # Nepali
            "no",  # Norwegian
            "pa",  # Punjabi
            "ro",  # Romanian
            "sk",  # Slovak
            "sl",  # Slovene
            "so",  # Somali
            "sv",  # Swedish
            "cy",  # Welsh
        }
        return lang_code.lower() in primary_languages
