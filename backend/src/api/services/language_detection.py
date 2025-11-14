"""
Language detection service.

Supports multiple detection methods:
- langdetect (primary, lightweight)
- fastText (optional, more accurate)
"""

import logging

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

# Set seed for consistent results
if LANGDETECT_AVAILABLE and DetectorFactory is not None:
    DetectorFactory.seed = 0


class LanguageDetectionService:
    """Service for detecting language in text."""

    def __init__(self):
        """Initialize language detection service."""
        self.use_fasttext = bool(settings.FASTTEXT_MODEL_PATH)
        if self.use_fasttext:
            self._load_fasttext()

    def _load_fasttext(self) -> None:
        """Load FastText model if available."""
        try:
            import fasttext  # type: ignore[import-untyped]

            logger.info(f"Loading FastText model from {settings.FASTTEXT_MODEL_PATH}")
            self.fasttext_model = fasttext.load_model(settings.FASTTEXT_MODEL_PATH)
            logger.info("FastText model loaded successfully")
        except ImportError:
            logger.warning("FastText not available. Falling back to langdetect.")
            self.use_fasttext = False
        except Exception as e:
            logger.error(f"Failed to load FastText model: {e}. Falling back to langdetect.")
            self.use_fasttext = False

    def detect_language(self, text: str) -> tuple[str, float]:
        """
        Detect the language of the given text.

        Args:
            text: Text to analyze

        Returns:
            Tuple of (language_code, confidence). Language code is ISO 639-1 format.

        Raises:
            ValueError: If language cannot be detected
        """
        if not text or len(text.strip()) < 10:
            raise ValueError("Text too short for reliable language detection")

        text = text.strip()

        # Try FastText first if available
        if self.use_fasttext and hasattr(self, "fasttext_model"):
            try:
                predictions = self.fasttext_model.predict(text, k=1)
                if predictions and len(predictions) > 0:
                    label, confidence = predictions[0]
                    # FastText returns labels like "__label__en", remove prefix
                    lang_code = label.replace("__label__", "")
                    return lang_code, float(confidence)
            except Exception as e:
                logger.warning(f"FastText detection failed: {e}. Falling back to langdetect.")

        # Fallback to langdetect
        if LANGDETECT_AVAILABLE and detect is not None:
            try:
                lang_code = detect(text)
                # langdetect doesn't provide confidence, so we use a default
                return lang_code, 0.8
            except LangDetectException as e:  # type: ignore[misc]
                logger.error(f"Language detection failed: {e}")
                raise ValueError(f"Could not detect language: {e}") from e

        # Last resort: default to English
        logger.warning("No language detection available. Defaulting to English.")
        return "en", 0.5

    def is_supported_language(self, lang_code: str) -> bool:
        """
        Check if a language is in the primary support list.

        Primary supported languages have localized prompt templates.
        """
        primary_languages = {
            "en",  # English
            "es",  # Spanish
            "fr",  # French
            "de",  # German
            "it",  # Italian
            "pt",  # Portuguese
            "nl",  # Dutch
            "pl",  # Polish
            "tr",  # Turkish
            "ru",  # Russian
            "zh",  # Chinese (Simplified)
            "ja",  # Japanese
            "ko",  # Korean
            "ar",  # Arabic
        }
        return lang_code.lower() in primary_languages
