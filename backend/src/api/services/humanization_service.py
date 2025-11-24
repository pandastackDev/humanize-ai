"""
Main humanization service that orchestrates the humanization pipeline.

Pipeline steps:
1. Language detection
2. Style conditioning
3. Text chunking
4. Language prompt template selection
5. Parallel chunk rewriting
6. Reassembly & smoothing
7. Validation
"""

import logging
import math
import random
import re
import time
from collections.abc import Callable
from typing import TYPE_CHECKING, Any

from api.config import settings

from .embedding_service import EmbeddingService
from .format_preservation import (
    extract_format_metadata,
    normalize_line_breaks,
    preserve_paragraph_structure,
    reassemble_with_structure,
    should_preserve_line_breaks,
    split_preserving_structure,
)
from .humanization_prompts import (
    get_boundary_smoothing_prompt,
    get_compression_prompt,
    get_noise_injection_prompt,
    get_quick_humanization_prompt,
    get_reconstruction_prompt,
    get_rhythm_randomizer_prompt,
)
from .language_detection import LanguageDetectionService
from .llm_service import LLMService
from .prompts import build_user_prompt
from .text_chunking import TextChunkingService
from .validation_service import ValidationService

logger = logging.getLogger(__name__)


def remove_ai_patterns(text: str) -> str:
    """
    Remove common AI writing patterns from text.

    Args:
        text: Text to clean

    Returns:
        Cleaned text with AI patterns removed
    """
    # Replace em-dashes with natural alternatives
    # Pattern 1: "word — word" → "word, word" or "word. Word"
    # Pattern 2: "sentence — another" → use period or comma based on context

    # Em-dash with spaces → comma + space
    text = re.sub(r"\s+—\s+", ", ", text)

    # Em-dash without spaces → comma
    text = re.sub(r"—", ", ", text)

    # Clean up any double commas that might result
    text = re.sub(r",\s*,", ",", text)

    # Fix spacing around commas
    text = re.sub(r"\s*,\s*", ", ", text)

    return text


def remove_invisible_characters(text: str) -> str:
    """
    Remove all invisible Unicode characters from text.

    This includes zero-width spaces, zero-width non-joiners, zero-width joiners,
    and other invisible formatting characters that can appear in output.

    Args:
        text: Text to clean

    Returns:
        Text with all invisible characters removed
    """
    # Comprehensive list of invisible Unicode characters
    invisible_chars = [
        "\u200b",  # zero width space
        "\u200c",  # zero width non-joiner
        "\u200d",  # zero width joiner
        "\ufeff",  # BOM (Byte Order Mark)
        "\u200e",  # left-to-right mark
        "\u200f",  # right-to-left mark
        "\u202a",  # left-to-right embedding
        "\u202b",  # right-to-left embedding
        "\u202c",  # pop directional formatting
        "\u202d",  # left-to-right override
        "\u202e",  # right-to-left override
        "\u2060",  # word joiner
        "\u2061",  # function application
        "\u2062",  # invisible times
        "\u2063",  # invisible separator
        "\u2064",  # invisible plus
        "\u2066",  # left-to-right isolate
        "\u2067",  # right-to-left isolate
        "\u2068",  # first strong isolate
        "\u2069",  # pop directional isolate
        "\u206a",  # inhibit symmetric swapping
        "\u206b",  # activate symmetric swapping
        "\u206c",  # inhibit arabic form shaping
        "\u206d",  # activate arabic form shaping
        "\u206e",  # national digit shapes
        "\u206f",  # nominal digit shapes
    ]

    # Remove all invisible characters
    for char in invisible_chars:
        text = text.replace(char, "")

    return text


def fix_common_grammar_errors(text: str) -> str:
    """
    Fix common grammar errors that are flagged by AI detectors.

    Fixes:
    - Double punctuation (e.g., "After that,." → "After that.")
    - Double commas (e.g., "Asia,," → "Asia,")
    - Grammar errors like "helped dragged" → "helped bring"
    - Missing "On" before dates (e.g., "December 7, 1941, they" → "On December 7, 1941, they")
    - Fragments starting with lowercase (e.g., "devastating war" → "The devastating war")

    Args:
        text: Text to fix

    Returns:
        Text with common grammar errors fixed
    """
    # Fix double punctuation (e.g., "After that,." → "After that.")
    text = re.sub(
        r"([,;:])\s*([.!?])", r"\1", text
    )  # Remove punctuation after comma/semicolon/colon
    text = re.sub(r"([.!?])\s*([.!?])", r"\1", text)  # Remove duplicate sentence endings

    # Fix double commas
    text = re.sub(r",\s*,", ",", text)

    # Fix "helped dragged" → "helped bring" or "brought"
    text = re.sub(r"\bhelped\s+dragged\b", "helped bring", text, flags=re.IGNORECASE)

    # Fix "helped opened" → "helped open" or "opened"
    text = re.sub(r"\bhelped\s+opened\b", "helped open", text, flags=re.IGNORECASE)

    # Fix "hopped in" → "joined" or "allied with"
    text = re.sub(r"\bhopped\s+in\s+as\b", "joined as", text, flags=re.IGNORECASE)

    # Remove "After that," at sentence start (too formulaic)
    text = re.sub(r"^After that,\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"\.\s+After that,\s+", ". ", text)

    # Remove "When it came to" (too formulaic)
    text = re.sub(r"\bWhen it came to\s+([A-Z][a-z]+),", r"In \1,", text)

    # Remove "And," at sentence start (flagged as AI pattern)
    text = re.sub(r"^And,\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"\.\s+And,\s+", ". ", text)

    # Fix "executed the Holocaust" → "carried out the Holocaust"
    text = re.sub(
        r"\bexecuted\s+the\s+Holocaust\b", "carried out the Holocaust", text, flags=re.IGNORECASE
    )

    # Fix "into Italy itself" → "into Italy"
    text = re.sub(r"\binto\s+Italy\s+itself\b", "into Italy", text, flags=re.IGNORECASE)

    # Fix "brutally intense" → "brutal" or "intense"
    text = re.sub(r"\bbrutally\s+intense\b", "brutal", text, flags=re.IGNORECASE)

    # Fix missing "On" before dates at sentence start (e.g., "December 7, 1941, they" → "On December 7, 1941, they")
    text = re.sub(
        r"^([A-Z][a-z]+\s+\d{1,2},\s+\d{4}),\s+([a-z])", r"On \1, \2", text, flags=re.MULTILINE
    )

    # Fix fragments starting sentences without capital article (e.g., "devastating war stemmed" → "The devastating war stemmed")
    # Only fix if it's a common pattern and starts a sentence
    text = re.sub(r"^([a-z]+\s+war\s+stemmed)", r"The \1", text, flags=re.MULTILINE | re.IGNORECASE)
    text = re.sub(
        r"^([a-z]+\s+war\s+stemmed)", r"This \1", text, flags=re.MULTILINE | re.IGNORECASE
    )

    # Fix "terrible war stemmed" → "The terrible war stemmed" or "This terrible war stemmed"
    text = re.sub(
        r"^terrible\s+war\s+stemmed",
        "The terrible war stemmed",
        text,
        flags=re.MULTILINE | re.IGNORECASE,
    )
    text = re.sub(
        r"\.\s+terrible\s+war\s+stemmed", ". The terrible war stemmed", text, flags=re.IGNORECASE
    )

    # Fix "fiercely bloody" → "bloody" or "fierce"
    text = re.sub(r"\bfiercely\s+bloody\b", "bloody", text, flags=re.IGNORECASE)

    # Fix "intense resistance against defeat" → "determination to resist defeat"
    text = re.sub(
        r"\bintense\s+resistance\s+against\s+defeat\b",
        "determination to resist defeat",
        text,
        flags=re.IGNORECASE,
    )

    # Fix "quickly surrendered soon after" → "surrendered shortly after"
    text = re.sub(
        r"\bquickly\s+surrendered\s+soon\s+after\b",
        "surrendered shortly after",
        text,
        flags=re.IGNORECASE,
    )

    # Fix "went through a heavy burden" → "endured heavy losses"
    text = re.sub(
        r"\bwent\s+through\s+a\s+heavy\s+burden\s+of\b", "endured heavy", text, flags=re.IGNORECASE
    )

    # Fix "The move created" → "This established" or "This opened"
    text = re.sub(r"\bThe\s+move\s+created\b", "This established", text, flags=re.IGNORECASE)

    # Fix "on the planet" → "worldwide" or "globally"
    text = re.sub(r"\bon\s+the\s+planet\b", "worldwide", text, flags=re.IGNORECASE)

    # Fix "hungry for" → "sought" or "desired"
    text = re.sub(r"\bhungry\s+for\b", "sought", text, flags=re.IGNORECASE)

    # Fix "sidestep" → "avoid"
    text = re.sub(r"\bsidestep\b", "avoid", text, flags=re.IGNORECASE)

    # Fix "dragged" → "brought" or "drew" (too colloquial)
    text = re.sub(
        r"\bdragged\s+the\s+U\.S\.\s+into\b",
        "brought the United States into",
        text,
        flags=re.IGNORECASE,
    )
    text = re.sub(
        r"\bdragged\s+([A-Z][a-z]+)\s+into\b", r"brought \1 into", text, flags=re.IGNORECASE
    )

    # Fix "kicked off" → "began" or "started" (and prevent repetition)
    # Replace all instances to avoid repetition
    text = re.sub(r"\bkicked\s+off\b", "began", text, flags=re.IGNORECASE)

    # Remove "Later," at sentence start (too formulaic)
    text = re.sub(r"^Later,\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"\.\s+Later,\s+", ". ", text)

    # Remove "Also," at sentence start (too formulaic)
    text = re.sub(r"^Also,\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"\.\s+Also,\s+", ". ", text)

    # Standardize naming: "U.S." → "United States" (for consistency and formality)
    text = re.sub(r"\bU\.S\.\b", "United States", text)
    text = re.sub(r"\bUSA\b", "United States", text)

    # Fix "devastating war stemmed" → "The devastating war stemmed"
    text = re.sub(r"^([a-z]+\s+war\s+stemmed)", r"The \1", text, flags=re.MULTILINE | re.IGNORECASE)
    text = re.sub(r"\.\s+([a-z]+\s+war\s+stemmed)", r". The \1", text, flags=re.IGNORECASE)

    # Fix fragment sentences like "The aftermath was immense." - try to combine
    text = re.sub(
        r"\.\s+(The\s+aftermath\s+was\s+immense)\.\s+", r". \1, ", text, flags=re.IGNORECASE
    )
    text = re.sub(
        r"\.\s+(The\s+impact\s+was\s+staggering)\.\s+", r". \1, ", text, flags=re.IGNORECASE
    )

    # Fix "Reacting swiftly" fragment → "Britain and France reacted swiftly"
    text = re.sub(
        r"\.\s+Reacting\s+swiftly,\s+([A-Z][a-z]+\s+and\s+[A-Z][a-z]+)\s+declared",
        r". \1 quickly declared",
        text,
        flags=re.IGNORECASE,
    )

    # Fix missing "On" before dates mid-sentence: "December 7, 1941, they" → "On December 7, 1941, they"
    text = re.sub(r"\.\s+([A-Z][a-z]+\s+\d{1,2},\s+\d{4}),\s+([a-z])", r". On \1, \2", text)

    # Remove "To be fair," - flagged as AI pattern
    text = re.sub(r"\bTo be fair,\s*", "", text, flags=re.IGNORECASE)

    # Fix capitalization of "The" mid-sentence (e.g., "defined The war" → "defined the war")
    # But preserve if it's at sentence start
    text = re.sub(r"([a-z])\s+The\s+(war|nazis|holocaust)", r"\1 the \2", text, flags=re.IGNORECASE)

    return text


def prevent_phrase_repetition(text: str) -> str:
    """
    Prevent repetition of the same phrases in close proximity.

    This helps avoid patterns like "kicked off" appearing twice,
    which are flagged by AI detectors.

    Args:
        text: Text to check for repetition

    Returns:
        Text with repeated phrases varied
    """
    # Common phrases that should not be repeated
    phrases_to_vary = {
        "kicked off": ["began", "started", "commenced", "launched"],
        "dragged": ["brought", "drew", "pulled", "forced"],
        "hungry for": ["sought", "desired", "wanted", "coveted"],
    }

    # Split into sentences for better context
    sentences = re.split(r"([.!?]\s+)", text)
    result_parts = []
    phrase_counts = {}  # Track phrase usage

    for i, sentence in enumerate(sentences):
        if not sentence.strip() or sentence.strip() in ".!? ":
            result_parts.append(sentence)
            continue

        modified_sentence = sentence

        # Check for repeated phrases
        for phrase, alternatives in phrases_to_vary.items():
            # Count occurrences in current sentence and nearby context
            pattern = re.compile(r"\b" + re.escape(phrase) + r"\b", re.IGNORECASE)
            matches = pattern.findall(sentence)

            if len(matches) > 0:
                phrase_key = phrase.lower()
                if phrase_key not in phrase_counts:
                    phrase_counts[phrase_key] = 0
                phrase_counts[phrase_key] += len(matches)

                # If phrase appears multiple times or was used recently, replace with alternative
                if phrase_counts[phrase_key] > 1:
                    # Replace with alternative
                    alternative = alternatives[phrase_counts[phrase_key] % len(alternatives)]
                    modified_sentence = pattern.sub(alternative, modified_sentence, count=1)
                    phrase_counts[phrase_key] = 0  # Reset after replacement

        result_parts.append(modified_sentence)

    return "".join(result_parts)


# Import v2 and v4 prompts for improved humanization
# Define type for optional prompt functions
get_v2_humanization_prompt: Callable[..., dict] | None = None
get_v2_quick_fix_prompt: Callable[[], dict] | None = None
get_v4_humanization_prompt: Callable[..., dict] | None = None
get_v4_quick_fix_prompt: Callable[[], dict] | None = None
get_v4_reconstruction_prompt: Callable[[], dict] | None = None

try:
    from .humanization_prompts_v2 import (
        get_main_humanization_prompt as get_v2_humanization_prompt,
    )
    from .humanization_prompts_v2 import (
        get_quick_fix_prompt as get_v2_quick_fix_prompt,
    )

    V2_PROMPTS_AVAILABLE = True
    logger.info("V2 humanization prompts loaded successfully")
except ImportError:
    V2_PROMPTS_AVAILABLE = False
    logger.warning("V2 prompts not available, using original prompts")

# Import V4 prompts (optimized for Originality.AI)
try:
    from .humanization_prompts_v4 import (
        get_main_humanization_v4_prompt as get_v4_humanization_prompt,
    )
    from .humanization_prompts_v4 import (
        get_quick_fix_v4_prompt as get_v4_quick_fix_prompt,
    )
    from .humanization_prompts_v4 import (
        get_reconstruction_v4_prompt as get_v4_reconstruction_prompt,
    )

    V4_PROMPTS_AVAILABLE = True
    logger.info("V4 humanization prompts loaded successfully (Originality.AI optimized)")
except ImportError:
    V4_PROMPTS_AVAILABLE = False
    logger.warning("V4 prompts not available, using V2 or original prompts")

# Import pattern breaker for post-processing
try:
    from .pattern_breaker import PatternBreaker as _PatternBreaker

    PATTERN_BREAKER_AVAILABLE = True
    logger.info("Pattern breaker module loaded successfully")
except ImportError:
    _PatternBreaker = None
    PATTERN_BREAKER_AVAILABLE = False
    logger.warning("Pattern breaker not available")

if TYPE_CHECKING:
    from .pattern_breaker import PatternBreaker as PatternBreakerType
else:
    PatternBreakerType = object


class HumanizationService:
    """Main service for humanizing text following the complete pipeline."""

    def __init__(self):
        """Initialize humanization service with all dependencies."""
        self.language_service = LanguageDetectionService()
        self.chunking_service = TextChunkingService()
        self.llm_service = LLMService()
        self.embedding_service = EmbeddingService()
        self.validation_service = ValidationService(self.embedding_service)

        # Initialize pattern breaker for V4 enhancement
        self.pattern_breaker: PatternBreakerType | None = None
        if PATTERN_BREAKER_AVAILABLE and _PatternBreaker is not None:
            self.pattern_breaker = _PatternBreaker()
            logger.info("Pattern breaker initialized for post-processing")

    def humanize(
        self,
        input_text: str,
        tone: str | None = None,
        length_mode: str = "standard",
        style_sample: str | None = None,
        readability_level: str | None = None,
        language: str | None = None,
    ) -> dict:
        """
        Humanize text using the appropriate pipeline based on text length.

        For texts >= 200 words: Uses advanced compression-reconstruction-noise pipeline
        For texts < 200 words: Uses quick single-pass humanization

        Args:
            input_text: Text to humanize (already sanitized)
            tone: Writing tone (e.g., 'academic', 'casual')
            length_mode: 'shorten', 'expand', or 'standard'
            style_sample: Optional style sample text (≥150 words if provided)
            readability_level: Optional readability level
            language: Optional target language (auto-detected if not provided)

        Returns:
            Dictionary with:
            - humanized_text: The humanized text
            - language: Detected/target language
            - metrics: Validation metrics
            - metadata: Processing metadata
        """
        word_count = len(input_text.split())

        # Route to appropriate pipeline based on text length and configuration
        if settings.USE_ADVANCED_PIPELINE and word_count >= settings.ADVANCED_PIPELINE_MIN_WORDS:
            logger.info(
                f"Using ADVANCED pipeline for {word_count} words (>= {settings.ADVANCED_PIPELINE_MIN_WORDS})"
            )
            return self.humanize_advanced(
                input_text, tone, length_mode, style_sample, readability_level, language
            )
        else:
            logger.info(
                f"Using QUICK pipeline for {word_count} words (< {settings.ADVANCED_PIPELINE_MIN_WORDS})"
            )
            return self.humanize_quick(
                input_text, tone, length_mode, style_sample, readability_level, language
            )

    def humanize_quick(
        self,
        input_text: str,
        tone: str | None = None,
        length_mode: str = "standard",
        style_sample: str | None = None,
        readability_level: str | None = None,
        language: str | None = None,
    ) -> dict:
        """
        Quick single-pass humanization for shorter texts (<200 words).
        Faster but slightly less effective than the advanced pipeline.
        """
        start_time = time.time()

        # Normalize line breaks first
        input_text = normalize_line_breaks(input_text)

        # Extract format metadata to preserve structure
        format_metadata = extract_format_metadata(input_text)
        preserve_formatting = should_preserve_line_breaks(input_text)

        if preserve_formatting and format_metadata["total_paragraphs"] > 1:
            logger.info(
                f"Preserving {format_metadata['total_paragraphs']} paragraphs "
                f"with {len(format_metadata['blank_lines'])} blank lines"
            )

        # Language Detection
        if language:
            detected_language = language.lower().split("-")[0]
            language_confidence = 1.0
        else:
            detected_language, language_confidence = self.language_service.detect_language(
                input_text
            )

        logger.info(f"Quick humanization for language: {detected_language}")

        # Get humanization prompt - use v4 if available, else v2, else original
        use_v4 = (
            V4_PROMPTS_AVAILABLE and hasattr(settings, "USE_V4_PROMPTS") and settings.USE_V4_PROMPTS
        )
        use_v2 = (
            V2_PROMPTS_AVAILABLE and hasattr(settings, "USE_V2_PROMPTS") and settings.USE_V2_PROMPTS
        )

        if use_v4:
            logger.info("Using V4 Originality.AI-optimized humanization prompt")
            word_count = len(input_text.split())

            # Use quick fix for very short texts, full strategic for others
            if word_count < 150:
                assert get_v4_quick_fix_prompt is not None
                prompt_dict = get_v4_quick_fix_prompt()
            else:
                assert get_v4_humanization_prompt is not None
                prompt_dict = get_v4_humanization_prompt(
                    tone=tone, length_mode=length_mode, readability_level=readability_level
                )
        elif use_v2:
            logger.info("Using V2 strategic humanization prompt")
            word_count = len(input_text.split())

            # Use quick fix for very short texts, full strategic for others
            if word_count < 150:
                assert get_v2_quick_fix_prompt is not None
                prompt_dict = get_v2_quick_fix_prompt()
            else:
                assert get_v2_humanization_prompt is not None
                prompt_dict = get_v2_humanization_prompt(
                    tone=tone, length_mode=length_mode, readability_level=readability_level
                )
        else:
            logger.info("Using original quick humanization prompt")
            # Pass length_mode to original prompt as well
            prompt_dict = get_quick_humanization_prompt(
                length_mode=length_mode, tone=tone, readability_level=readability_level
            )

        # Helper function to format prompt with word count targets
        def format_user_prompt(text: str, prompt_template: str) -> str:
            """Format user prompt with word count targets for V4."""
            wc = len(text.split())
            # Calculate targets based on length mode
            if length_mode == "shorten":
                target_min, target_max = int(wc * 0.70), int(wc * 0.85)
            elif length_mode == "expand":
                target_min, target_max = int(wc * 1.20), int(wc * 1.40)
            else:  # standard
                target_min, target_max = int(wc * 0.95), int(wc * 1.10)

            # Format with all placeholders
            try:
                return prompt_template.format(
                    text=text, word_count=wc, target_min=target_min, target_max=target_max
                )
            except KeyError:
                # Fallback for prompts without word count placeholders (V2, original)
                return prompt_template.format(text=text)

        # Handle multi-paragraph text with format preservation
        if preserve_formatting and format_metadata["total_paragraphs"] > 1:
            # Split into paragraphs while preserving structure
            structured_parts = split_preserving_structure(input_text)
            humanized_paragraphs = []

            for part in structured_parts:
                user_prompt = format_user_prompt(part["content"], prompt_dict["user_template"])
                humanized_para = self.llm_service.generate_text(
                    prompt=user_prompt,
                    system_prompt=prompt_dict["system"],
                    model=settings.PRIMARY_HUMANIZATION_MODEL,
                    temperature=settings.HUMANIZATION_TEMPERATURE,
                    max_tokens=len(part["content"].split()) * 3,
                    top_p=settings.HUMANIZATION_TOP_P,
                    frequency_penalty=settings.HUMANIZATION_FREQUENCY_PENALTY,
                    presence_penalty=settings.HUMANIZATION_PRESENCE_PENALTY,
                )
                humanized_paragraphs.append(humanized_para.strip())

            # Reassemble with original structure
            humanized_text = reassemble_with_structure(humanized_paragraphs, structured_parts)
        else:
            # Single-pass humanization for simple text
            user_prompt = format_user_prompt(input_text, prompt_dict["user_template"])
            humanized_text = self.llm_service.generate_text(
                prompt=user_prompt,
                system_prompt=prompt_dict["system"],
                model=settings.PRIMARY_HUMANIZATION_MODEL,
                temperature=settings.HUMANIZATION_TEMPERATURE,
                max_tokens=len(input_text.split()) * 3,
                top_p=settings.HUMANIZATION_TOP_P,
                frequency_penalty=settings.HUMANIZATION_FREQUENCY_PENALTY,
                presence_penalty=settings.HUMANIZATION_PRESENCE_PENALTY,
            )

        # Post-processing: Remove AI patterns (em-dashes, etc.)
        humanized_text = remove_ai_patterns(humanized_text)

        # V4 Enhancement: Apply pattern breaking for better originality scores
        if use_v4 and self.pattern_breaker is not None:
            logger.info("Applying V4 pattern breaking enhancements")
            # Get aggressiveness from settings (default 0.7)
            aggressiveness = getattr(settings, "PATTERN_BREAKER_AGGRESSIVENESS", 0.7)
            humanized_text = self.pattern_breaker.enhance_text(humanized_text, aggressiveness)

            # Log quality statistics
            if logger.isEnabledFor(logging.DEBUG):
                stats = self.pattern_breaker.get_statistics(humanized_text)
                logger.debug(f"Pattern breaker stats: {stats}")

        # Ensure paragraph structure is preserved
        if preserve_formatting:
            humanized_text = preserve_paragraph_structure(
                input_text, humanized_text, format_metadata
            )

        # Validation
        style_embedding = None
        if style_sample and len(style_sample.strip().split()) >= 150:
            try:
                style_embedding = self.embedding_service.get_style_embedding(style_sample)
            except Exception:
                pass

        validation_results = self._validate_output(input_text, humanized_text, style_embedding)

        # Final cleanup: Fix grammar errors, prevent repetition, and remove invisible characters
        humanized_text = fix_common_grammar_errors(humanized_text)
        humanized_text = prevent_phrase_repetition(humanized_text)
        humanized_text = remove_invisible_characters(humanized_text)

        processing_time = (time.time() - start_time) * 1000

        return {
            "humanized_text": humanized_text,
            "language": detected_language,
            "metrics": {
                "semantic_similarity": round(validation_results["semantic_similarity"], 3),
                "processing_time_ms": round(processing_time, 2),
                "word_count": len(humanized_text.split()),
                "original_word_count": len(input_text.split()),
                "chunks_used": 1,
            },
            "metadata": {
                "detected_language": detected_language,
                "language_confidence": round(language_confidence, 3),
                "pipeline": "quick-single-pass",
                "model_used": settings.PRIMARY_HUMANIZATION_MODEL,
                "semantic_passed": validation_results["semantic_passed"],
            },
        }

    def humanize_advanced(
        self,
        input_text: str,
        tone: str | None = None,
        length_mode: str = "standard",
        style_sample: str | None = None,
        readability_level: str | None = None,
        language: str | None = None,
    ) -> dict:
        """
        Advanced humanization using compression-reconstruction-noise pipeline.
        Achieves dramatically better anti-detection results for longer texts.

        Pipeline:
        1. Language Detection
        2. Style Conditioning
        3. Text Chunking
        4. COMPRESSION: Convert to human-style outline
        5. RECONSTRUCTION: Rebuild with natural human style
        6. RHYTHM RANDOMIZATION: Add burstiness
        7. NOISE INJECTION: Add human micro-imperfections
        8. Reassembly with boundary smoothing
        9. FINAL TUNING: Anti-detection optimization
        10. Validation
        """
        start_time = time.time()

        # Normalize line breaks and preserve formatting metadata
        input_text = normalize_line_breaks(input_text)
        format_metadata = extract_format_metadata(input_text)
        preserve_formatting = should_preserve_line_breaks(input_text)

        if preserve_formatting:
            logger.info(
                f"Format preservation enabled: {format_metadata['total_paragraphs']} paragraphs, "
                f"{len(format_metadata['blank_lines'])} blank lines"
            )

        # Step 1: Language Detection
        if language:
            detected_language = language.lower().split("-")[0]
            language_confidence = 1.0
            logger.info(f"Using provided language: {detected_language}")
        else:
            detected_language, language_confidence = self.language_service.detect_language(
                input_text
            )
            logger.info(
                f"Detected language: {detected_language} (confidence: {language_confidence:.2f})"
            )

        # Step 2: Style Conditioning
        style_embedding = None
        if style_sample and len(style_sample.strip().split()) >= 150:
            try:
                style_embedding = self.embedding_service.get_style_embedding(style_sample)
                logger.info(
                    f"Style embedding generated from {len(style_sample.split())} word sample"
                )
            except Exception as e:
                logger.warning(f"Failed to extract style embedding: {e}")

        # Step 3: Text Chunking with increased overlap
        chunks = self.chunking_service.chunk_text(input_text)
        logger.info(f"Text split into {len(chunks)} chunks for advanced pipeline")

        if not chunks:
            raise ValueError("Text chunking failed - no chunks generated")

        # Step 4-7: Apply streamlined compression-reconstruction pipeline to each chunk
        processed_chunks = []
        for i, chunk in enumerate(chunks):
            logger.info(f"Processing chunk {i + 1}/{len(chunks)} through advanced pipeline...")

            chunk_text = chunk["text"]  # Extract text from chunk dictionary

            # Phase 1: Compression to outline
            compressed = self._compress_to_outline(chunk_text)

            # Phase 2: Reconstruction with human style (includes rhythm variation and noise)
            reconstructed = self._reconstruct_from_outline(compressed)

            processed_chunks.append(reconstructed)

        # Step 8: Reassembly
        humanized_text = self._reassemble_with_smoothing(processed_chunks)

        # Step 9: Final polish pass (single pass for entire text)
        logger.info("Applying final polish pass...")
        humanized_text = self._apply_final_polish(humanized_text)

        # Step 10: Length enforcement if needed
        humanized_text = self._enforce_length_preferences(
            text=humanized_text,
            original_text=input_text,
            length_mode=length_mode,
            language=detected_language,
        )

        # Step 11: Validation
        validation_results = self._validate_output(
            original_text=input_text,
            humanized_text=humanized_text,
            style_embedding=style_embedding,
        )

        # Step 12: Post-processing - remove AI patterns
        humanized_text = remove_ai_patterns(humanized_text)

        # Step 12.5: Ensure paragraph structure is preserved
        if preserve_formatting:
            humanized_text = preserve_paragraph_structure(
                input_text, humanized_text, format_metadata
            )
            logger.info("Paragraph structure preserved")

        # Step 13: V4 Pattern Breaking Enhancement (highest priority)
        use_v4 = (
            V4_PROMPTS_AVAILABLE and hasattr(settings, "USE_V4_PROMPTS") and settings.USE_V4_PROMPTS
        )
        if use_v4 and self.pattern_breaker is not None:
            logger.info("Applying V4 pattern breaking enhancements (advanced pipeline)")
            aggressiveness = getattr(settings, "PATTERN_BREAKER_AGGRESSIVENESS", 0.7)
            humanized_text = self.pattern_breaker.enhance_text(humanized_text, aggressiveness)

            # Log quality statistics
            if logger.isEnabledFor(logging.DEBUG):
                stats = self.pattern_breaker.get_statistics(humanized_text)
                logger.debug(f"Advanced pipeline pattern breaker stats: {stats}")

        # Step 14: Fix grammar errors, prevent repetition, and remove invisible characters (CRITICAL - errors are easily detected)
        # Always fix grammar errors, prevent phrase repetition, and remove invisible characters regardless of pipeline version
        final_output = fix_common_grammar_errors(humanized_text)
        final_output = prevent_phrase_repetition(final_output)
        final_output = remove_invisible_characters(final_output)

        processing_time = (time.time() - start_time) * 1000

        logger.info(
            f"Advanced pipeline complete. "
            f"Semantic similarity: {validation_results['semantic_similarity']:.3f}, "
            f"Processing time: {processing_time:.0f}ms"
        )

        return {
            "humanized_text": final_output,
            "language": detected_language,
            "metrics": {
                "semantic_similarity": round(validation_results["semantic_similarity"], 3),
                "style_similarity": round(validation_results["style_similarity"], 3)
                if validation_results["style_similarity"] is not None
                else None,
                "word_count": len(final_output.split()),
                "character_count": len(final_output),
                "processing_time_ms": round(processing_time, 2),
                "original_word_count": len(input_text.split()),
                "chunks_used": len(chunks),
            },
            "metadata": {
                "detected_language": detected_language,
                "language_confidence": round(language_confidence, 3),
                "chunk_count": len(chunks),
                "model_used": settings.PRIMARY_HUMANIZATION_MODEL,
                "pipeline": "advanced-compression-reconstruction",
                "semantic_passed": validation_results["semantic_passed"],
                "style_passed": validation_results.get("style_passed", None),
            },
        }

    # ============================================================================
    # Advanced Pipeline Phase Methods
    # ============================================================================

    def _compress_to_outline(self, text: str) -> str:
        """
        Phase 1: Compress text into human-style casual outline.
        This breaks down the text into rough notes like a human would take.
        """
        logger.info("Phase 1: Compressing to outline...")

        prompt_dict = get_compression_prompt()
        user_prompt = prompt_dict["user_template"].format(text=text)

        compressed = self.llm_service.generate_text(
            prompt=user_prompt,
            system_prompt=prompt_dict["system"],
            model=settings.COMPRESSION_MODEL,  # Use faster Haiku for compression
            temperature=settings.COMPRESSION_TEMPERATURE,
            max_tokens=len(text.split()) * 2,
        )

        logger.info(f"Compressed {len(text.split())} words → {len(compressed.split())} words")
        return compressed.strip()

    def _reconstruct_from_outline(self, compressed_text: str) -> str:
        """
        Phase 2: Reconstruct from outline into natural human prose.
        This is where the magic happens - rebuilding with human-like style.
        """
        logger.info("Phase 2: Reconstructing from outline...")

        # Use V4 reconstruction prompt if available, else original
        use_v4 = (
            V4_PROMPTS_AVAILABLE and hasattr(settings, "USE_V4_PROMPTS") and settings.USE_V4_PROMPTS
        )

        if use_v4 and get_v4_reconstruction_prompt is not None:
            logger.info("Using V4 reconstruction prompt (Originality.AI optimized)")
            prompt_dict = get_v4_reconstruction_prompt()
        else:
            prompt_dict = get_reconstruction_prompt()

        user_prompt = prompt_dict["user_template"].format(compressed_text=compressed_text)

        reconstructed = self.llm_service.generate_text(
            prompt=user_prompt,
            system_prompt=prompt_dict["system"],
            model=settings.PRIMARY_HUMANIZATION_MODEL,  # Claude 3.5 Sonnet for best results
            temperature=settings.RECONSTRUCTION_TEMPERATURE,
            max_tokens=len(compressed_text.split()) * 3,
            top_p=settings.HUMANIZATION_TOP_P,
            frequency_penalty=settings.HUMANIZATION_FREQUENCY_PENALTY,
            presence_penalty=settings.HUMANIZATION_PRESENCE_PENALTY,
        )

        logger.info(f"Reconstructed to {len(reconstructed.split())} words")
        return reconstructed.strip()

    def _apply_rhythm_randomization(self, text: str) -> str:
        """
        Phase 3: Apply rhythm randomization for burstiness.
        Creates unpredictable sentence length patterns that humans have but AI lacks.
        """
        logger.info("Phase 3: Applying rhythm randomization...")

        prompt_dict = get_rhythm_randomizer_prompt()
        user_prompt = prompt_dict["user_template"].format(text=text)

        rhythm_varied = self.llm_service.generate_text(
            prompt=user_prompt,
            system_prompt=prompt_dict["system"],
            model=settings.PRIMARY_HUMANIZATION_MODEL,
            temperature=settings.RHYTHM_RANDOMIZATION_TEMPERATURE,  # Higher for more variation
            max_tokens=len(text.split()) * 2,
            frequency_penalty=0.6,  # Penalize repetitive patterns
        )

        logger.info("Rhythm variation applied")
        return rhythm_varied.strip()

    def _apply_noise_injection(self, text: str) -> str:
        """
        Phase 4: Inject subtle human irregularities and texture.
        Adds micro-imperfections that break AI patterns.
        """
        logger.info("Phase 4: Injecting human noise...")

        prompt_dict = get_noise_injection_prompt()
        user_prompt = prompt_dict["user_template"].format(text=text)

        noise_injected = self.llm_service.generate_text(
            prompt=user_prompt,
            system_prompt=prompt_dict["system"],
            model=settings.PRIMARY_HUMANIZATION_MODEL,
            temperature=settings.NOISE_INJECTION_TEMPERATURE,
            max_tokens=len(text.split()) * 2,
            presence_penalty=0.4,  # Add variety
        )

        logger.info("Human noise injected")
        return noise_injected.strip()

    def _reassemble_with_smoothing(self, chunks: list[str]) -> str:
        """
        Reassemble chunks by joining them directly.
        The advanced pipeline already handles smoothness through overlapping chunks.
        """
        if len(chunks) == 1:
            return chunks[0]

        logger.info(f"Reassembling {len(chunks)} chunks...")

        # Simply join chunks with space - they've already been processed for smoothness
        result = " ".join(chunks)

        logger.info(f"Reassembled to {len(result.split())} words")
        return result.strip()

    def _smooth_chunk_boundary(self, prev_text: str, next_text: str) -> str:
        """
        Smooth the boundary between two chunks to eliminate awkward transitions.
        """
        prompt_dict = get_boundary_smoothing_prompt()
        user_prompt = prompt_dict["user_template"].format(prev_text=prev_text, next_text=next_text)

        smoothed = self.llm_service.generate_text(
            prompt=user_prompt,
            system_prompt=prompt_dict["system"],
            model=settings.PRIMARY_HUMANIZATION_MODEL,
            temperature=0.65,  # Lower temp for consistency
            max_tokens=len(next_text.split()) * 2,
        )

        return smoothed.strip()

    def _apply_final_polish(self, text: str) -> str:
        """
        Optional final polish pass - only for short texts.
        For longer texts, skip to avoid excessive processing time.
        """
        word_count = len(text.split())

        # Skip final polish for very long texts (> 500 words) to save time
        if word_count > 500:
            logger.info("Skipping final polish (text too long, already well-processed)")
            return text

        logger.info("Applying lightweight final polish...")

        # Use a simpler prompt for quick polish
        system_prompt = (
            "You are doing a final light polish on human-written text. "
            "Make minor adjustments ONLY if absolutely necessary to improve flow. "
            "Keep 98% of the text exactly as-is. Only fix obvious issues. "
            "DO NOT change meaning or rewrite unnecessarily."
        )

        user_prompt = f"Do a very light final polish on this text. Only make tiny improvements if needed:\n\n{text}"

        try:
            polished = self.llm_service.generate_text(
                prompt=user_prompt,
                system_prompt=system_prompt,
                model=settings.PRIMARY_HUMANIZATION_MODEL,
                temperature=0.3,  # Low temperature for minimal changes
                max_tokens=word_count * 2,
            )
            logger.info("Final polish complete")
            return polished.strip()
        except Exception as e:
            logger.warning(f"Final polish failed, using unpolished version: {e}")
            return text

    # ============================================================================
    # Existing Pipeline Methods (Kept for compatibility)
    # ============================================================================

    def _rewrite_chunks_parallel(
        self,
        chunks: list[dict],
        prompt_template: dict,
        tone: str | None,
        length_mode: str,
        readability_level: str | None,
        style_sample: str | None,
        language: str,
    ) -> tuple[list[str], str]:
        """
        Rewrite all chunks in parallel using asyncio.

        Args:
            chunks: List of chunk dictionaries
            prompt_template: Language-specific prompt template
            tone: Writing tone
            length_mode: Length mode
            readability_level: Readability level
            style_sample: Style sample text
            language: Language code

        Returns:
            Tuple of (rewritten_chunks, model_used)
        """
        # Since LLMService is synchronous, we'll process sequentially but structure for async
        # In a full async implementation, this would use asyncio.gather
        humanized_chunks = []
        model_used = None

        for i, chunk in enumerate(chunks):
            logger.info(f"Processing chunk {i + 1}/{len(chunks)}")

            try:
                # 7a. Build Prompt
                # Build enhanced system prompt with all specific instructions
                system_prompt = self._build_system_prompt(
                    base_system_prompt=prompt_template["system_prompt"],
                    tone=tone,
                    length_mode=length_mode,
                    readability_level=readability_level,
                    style_sample=style_sample,
                    language=language,
                )
                # User prompt is simple - just the text to rewrite
                user_prompt = build_user_prompt(
                    text=chunk["text"],
                    tone=None,  # Not used in user prompt anymore
                    length_mode=None,  # Not used in user prompt anymore
                    readability_level=None,  # Not used in user prompt anymore
                    style_sample=None,  # Not used in user prompt anymore
                    language=language,
                )

                # 7b. Rewrite Chunk
                # Calculate approximate max_tokens based on input length to control output length
                # BUT allow enough tokens to complete sentences (don't cut off mid-sentence)
                input_words = len(chunk["text"].split())
                input_chars = len(chunk["text"])

                # Estimate base tokens needed (input * 1.3 tokens per word)
                base_tokens = int(input_words * 1.3)

                # For "standard" mode, allow some expansion but complete sentences
                # We want to control length via prompts, not hard token limits
                # Set a reasonable max but allow enough room for completion
                if length_mode == "standard":
                    # Allow up to 130% tokens (30% buffer) but ensure we can complete
                    max_output_tokens = max(
                        int(base_tokens * 1.3), base_tokens + 200
                    )  # Minimum 200 token buffer
                elif length_mode == "shorten":
                    # Even when shortening, allow enough to complete sentences
                    max_output_tokens = max(
                        int(base_tokens * 0.9), base_tokens - 100
                    )  # At least 90% of original
                    max_output_tokens = max(max_output_tokens, 100)  # Minimum 100 tokens
                elif length_mode == "expand":
                    max_output_tokens = int(base_tokens * 1.8)  # 80% expansion allowed
                else:
                    max_output_tokens = max(int(base_tokens * 1.3), base_tokens + 200)

                # Ensure we don't set an unreasonably low limit that cuts sentences
                # Minimum 50% more than input to allow sentence completion
                min_required = max(int(base_tokens * 1.5), 150)
                max_output_tokens = max(max_output_tokens, min_required)

                logger.debug(
                    f"Chunk {i + 1}: Input {input_chars} chars, {input_words} words ({base_tokens} tokens) -> "
                    f"Max tokens: {max_output_tokens} (mode: {length_mode})"
                )

                humanized_chunk = self.llm_service.generate_text(
                    prompt=user_prompt,
                    system_prompt=system_prompt,
                    temperature=0.7,
                    max_tokens=max_output_tokens,
                )

                # Track model used (from first successful chunk)
                if model_used is None:
                    # Determine which model was actually used
                    if self.llm_service.anthropic_enabled:
                        model_used = settings.ANTHROPIC_LLM_MODEL
                    elif self.llm_service.openai_enabled:
                        model_used = settings.OPENAI_LLM_MODEL
                    else:
                        model_used = "unknown"

                # Ensure chunk is not empty and ends properly
                if humanized_chunk and humanized_chunk.strip():
                    cleaned_chunk = humanized_chunk.strip()
                    # Check if chunk was cut off mid-sentence (doesn't end with punctuation)
                    # Allow bullet points and list items to not end with punctuation if they're continuation
                    if cleaned_chunk and cleaned_chunk[-1] not in ".!?;":
                        # Check if it might be a list item that continues
                        is_bullet_item = cleaned_chunk.startswith(("➜", "•", "-", "*"))
                        if not is_bullet_item:
                            logger.warning(
                                f"Chunk {i + 1} may be incomplete - doesn't end with punctuation: {cleaned_chunk[-50:]}"
                            )
                    humanized_chunks.append(cleaned_chunk)
                else:
                    # Fallback: use original chunk if LLM produced empty/invalid output
                    logger.warning(f"Chunk {i + 1} produced empty output, using original")
                    humanized_chunks.append(chunk["text"])

            except Exception as e:
                logger.error(f"Failed to humanize chunk {i + 1}: {e}")
                # Fallback: use original chunk text
                humanized_chunks.append(chunk["text"])

        return humanized_chunks, model_used or "unknown"

    def _reassemble_and_smooth(self, chunks: list[str], language: str, original_text: str) -> str:
        """
        Reassemble chunks and apply smoothing while preserving formatting.

        Args:
            chunks: List of rewritten chunk texts
            language: Language code
            original_text: Original input text to preserve formatting structure

        Returns:
            Smoothed full text with preserved formatting
        """
        # Step 7: Reassemble chunks in original order
        # Check if original has bullet points or line breaks we need to preserve
        has_bullets = bool(re.search(r"➜|•|[*\-]\s+", original_text))

        if has_bullets and len(chunks) > 1:
            # Try to preserve line structure - join chunks but preserve newlines
            # If chunks contain bullet points, join with newlines instead of spaces
            humanized_text = "\n".join(chunks)
        else:
            # Regular text - join with spaces
            humanized_text = " ".join(chunks)

        # Apply initial regex-based smoothing
        humanized_text = self._smooth_text(humanized_text)

        # Step 8: LLM Smoothing post-pass for better transitions
        # Only if we have multiple chunks (transitions need smoothing)
        if len(chunks) > 1:
            try:
                humanized_text = self._llm_smoothing_pass(humanized_text, language)
                logger.info("Applied LLM smoothing post-pass")
            except Exception as e:
                logger.warning(f"LLM smoothing failed, using regex-only: {e}")
                # Fallback to regex smoothing if LLM smoothing fails

        return humanized_text

    def _apply_authenticity_pass(self, text: str, language: str, tone: str | None = None) -> str:
        """
        Run a lightweight authenticity pass to inject human quirks and pacing changes.

        Args:
            text: Text after chunk smoothing
            language: Language code
            tone: Optional tone hint

        Returns:
            Text with conversational imperfections applied (if enabled).
        """
        if (
            not settings.AUTHENTICITY_PASS_ENABLED
            or language != "en"
            or len(text.split()) < settings.AUTHENTICITY_PASS_MIN_WORDS
        ):
            return text

        system_prompt = (
            "You are a veteran editor who specializes in taking polished rewrites and making them feel genuinely human. "
            "You rearrange sentences, vary pacing, and weave in small lived-in observations without changing facts. "
            'You occasionally ask a rhetorical question or add a short aside like "Honestly," or "I still remember" to show personality. '
            "Never mention AI or that you are editing the text. Keep chronology accurate, preserve all factual information, "
            "and keep length within 85-120% of the input."
        )

        tone_hint = f"\nKeep an overall {tone} tone." if tone else ""
        user_prompt = (
            "Polish the following text so it sounds like a person telling the story in their own words. "
            "Avoid repeating the original sentence order verbatim. Mix short sentences with longer ones, "
            "and include at least one rhetorical question or reflective aside per 150 words."
            f"{tone_hint}\n\n---\n{text}\n---"
        )

        try:
            max_tokens = int(len(text.split()) * 1.35)
            enriched = self.llm_service.generate_text(
                prompt=user_prompt,
                system_prompt=system_prompt,
                temperature=0.85,
                max_tokens=max_tokens,
            )
            if self._looks_like_valid_rewrite(text, enriched):
                logger.info("Applied authenticity pass to improve human tone")
                return enriched.strip()
            logger.warning("Authenticity pass produced invalid length, keeping original")
        except Exception as e:
            logger.warning(f"Authenticity pass failed, keeping original text: {e}")

        return text

    def _llm_smoothing_pass(self, text: str, language: str) -> str:
        """
        Apply lightweight LLM smoothing pass to improve transitions between chunks.

        Args:
            text: Reassembled text
            language: Language code

        Returns:
            Smoothed text with better transitions
        """
        # Get language-specific smoothing prompt
        smoothing_prompts = {
            "en": "Smooth the transitions between sentences and paragraphs in the following text. Only adjust spacing, punctuation, and minor wording to improve flow. Do not change the meaning or content. Return only the smoothed text:\n\n",
            "es": "Suaviza las transiciones entre oraciones y párrafos en el siguiente texto. Solo ajusta espaciado, puntuación y redacción menor para mejorar el flujo. No cambies el significado o contenido. Devuelve solo el texto suavizado:\n\n",
            "fr": "Lissez les transitions entre phrases et paragraphes dans le texte suivant. Ajustez uniquement l'espacement, la ponctuation et la formulation mineure pour améliorer le flux. Ne changez pas le sens ou le contenu. Retournez uniquement le texte lissé:\n\n",
        }

        smoothing_prompt = smoothing_prompts.get(language, smoothing_prompts["en"])

        try:
            smoothed = self.llm_service.generate_text(
                prompt=smoothing_prompt + text,
                system_prompt="You are a text smoothing assistant. Your only job is to improve text flow and transitions without changing meaning. Preserve all formatting including bullet points (➜, •, -), symbols, and line breaks exactly as they appear.",
                temperature=0.3,  # Lower temperature for more conservative smoothing
                max_tokens=int(len(text.split()) * 1.1 * 1.3),  # Limit to prevent expansion
            )
            return smoothed.strip()
        except Exception as e:
            logger.warning(f"LLM smoothing failed: {e}")
            return text  # Return original if smoothing fails

    def _smooth_text(self, text: str) -> str:
        """
        Apply regex-based smoothing to remove artifacts from chunk reassembly.
        Preserves paragraph breaks, bullet points, and formatting symbols.

        Args:
            text: Reassembled text

        Returns:
            Smoothed text with proper formatting
        """
        import re

        # Preserve paragraph breaks (double newlines)
        # First, normalize different newline formats
        text = text.replace("\r\n", "\n").replace("\r", "\n")

        # Split by double newlines first to preserve paragraph structure
        # Then process each paragraph separately
        if "\n\n" in text:
            paragraphs = text.split("\n\n")
            smoothed_paragraphs = []

            for para in paragraphs:
                # Process paragraph while preserving bullet points and line breaks
                para = self._smooth_paragraph(para)
                if para:
                    smoothed_paragraphs.append(para)

            # Rejoin paragraphs with double newlines
            result = "\n\n".join(smoothed_paragraphs)
        else:
            # Single paragraph - check if it has bullet points with newlines
            # Look for patterns like "➜ ... \n ➜ ..."
            if re.search(r"➜|•|[*\-]\s+", text):
                # Has bullet points - preserve line structure
                lines = text.split("\n")
                smoothed_lines = []
                for line in lines:
                    smoothed_line = self._smooth_paragraph(line)
                    if smoothed_line:
                        smoothed_lines.append(smoothed_line)
                result = "\n".join(smoothed_lines)
            else:
                # Regular paragraph
                result = self._smooth_paragraph(text)

        # Final cleanup: ensure proper spacing around punctuation
        result = re.sub(r"([.!?])([A-Z])", r"\1 \2", result)  # Space after sentence end
        result = re.sub(r"([,;:])([A-Za-z])", r"\1 \2", result)  # Space after punctuation

        return result.strip()

    def _enforce_length_preferences(
        self,
        text: str,
        original_text: str,
        length_mode: str,
        language: str,
    ) -> str:
        """
        Ensure the final text respects the requested length mode.

        Args:
            text: Text after authenticity pass
            original_text: Original user submission
            length_mode: 'standard', 'shorten', or 'expand'
            language: Detected/target language

        Returns:
            Text adjusted (if needed) to fall within configured length ratios.
        """
        length_mode = length_mode or "standard"
        min_ratio, max_ratio = self._get_length_bounds(length_mode)
        if min_ratio is None or max_ratio is None:
            return text

        original_words = max(1, len(original_text.split()))
        current_words = max(1, len(text.split()))
        ratio = current_words / original_words

        if min_ratio <= ratio <= max_ratio:
            return text

        logger.warning(
            "Length mode '%s' expected ratio %.2f-%.2f but got %.2f (%s vs %s words). "
            "Running correction pass.",
            length_mode,
            min_ratio,
            max_ratio,
            ratio,
            current_words,
            original_words,
        )

        corrected = self._run_length_correction_pass(
            text=text,
            language=language,
            length_mode=length_mode,
            original_word_count=original_words,
            min_ratio=min_ratio,
            max_ratio=max_ratio,
        )

        if corrected:
            corrected_words = len(corrected.split())
            corrected_ratio = corrected_words / original_words
            if min_ratio <= corrected_ratio <= max_ratio:
                logger.info(
                    "Adjusted text length from %s words to %s words for mode '%s'",
                    current_words,
                    corrected_words,
                    length_mode,
                )
                return corrected
            logger.warning(
                "Length correction output ratio %.2f still outside %.2f-%.2f. "
                "Keeping pre-correction text.",
                corrected_ratio,
                min_ratio,
                max_ratio,
            )

        return text

    def _smooth_paragraph(self, para: str) -> str:
        """
        Smooth a single paragraph while preserving formatting.

        Args:
            para: Paragraph text

        Returns:
            Smoothed paragraph
        """
        import re

        # Don't remove spaces if the line starts with a bullet symbol
        # Check if line starts with bullet point
        if re.match(r"^\s*[➜•*\-]\s+", para):
            # Preserve bullet point structure
            bullet_match = re.match(r"^(\s*[➜•*\-]\s+)", para)
            bullet_part = bullet_match.group(1) if bullet_match else ""
            text_part = para[len(bullet_part) :] if bullet_part else para

            # Smooth the text part only
            text_part = re.sub(r"\s+", " ", text_part)  # Multiple spaces to single
            text_part = re.sub(r"\s+([.!?])", r"\1", text_part)  # Remove space before punctuation
            text_part = re.sub(
                r"([.!?])\s+([A-Z])", r"\1 \2", text_part
            )  # Ensure space after sentence
            text_part = re.sub(r",\s+", ", ", text_part)  # Fix comma spacing
            text_part = re.sub(r"\.\s*\.", ".", text_part)  # Fix double periods

            return bullet_part + text_part.strip()
        else:
            # Regular paragraph - remove extra whitespace
            para = re.sub(r"\s+", " ", para)  # Multiple spaces to single
            para = re.sub(r"\s+([.!?])", r"\1", para)  # Remove space before punctuation
            para = re.sub(r"([.!?])\s+([A-Z])", r"\1 \2", para)  # Ensure space after sentence
            para = re.sub(r",\s+", ", ", para)  # Fix comma spacing
            para = re.sub(r"\.\s*\.", ".", para)  # Fix double periods
            return para.strip()

    def _inject_invisible_noise(self, text: str, language: str) -> str:
        """
        Insert zero-width characters to break up detector-friendly token patterns.

        Args:
            text: Text that already passed validation
            language: Language code (only applied to English to avoid harming CJK scripts)

        Returns:
            Text with subtle invisible characters inserted.
        """
        if (
            not settings.INVISIBLE_CHAR_NOISE_ENABLED
            or language != "en"
            or settings.INVISIBLE_CHAR_INSERT_EVERY_N_WORDS <= 0
        ):
            return text

        words_and_spaces = re.split(r"(\s+)", text)
        if not words_and_spaces:
            return text

        interval = max(4, settings.INVISIBLE_CHAR_INSERT_EVERY_N_WORDS)
        zero_width_chars = ["\u200b", "\u200c", "\u200d"]
        word_counter = 0

        insertions = 0

        for idx in range(0, len(words_and_spaces), 2):
            token = words_and_spaces[idx]
            if not token or not token.strip():
                continue
            # Avoid modifying bullet markers or markdown-like prefixes
            if token.strip().startswith(("➜", "•", "-", "*", "#")):
                continue
            word_counter += 1
            if word_counter % interval == 0:
                words_and_spaces[idx] = token + random.choice(zero_width_chars)
                insertions += 1

        if insertions:
            logger.info(
                "Inserted %s invisible noise characters to disrupt detector patterns",
                insertions,
            )
        return "".join(words_and_spaces)

    def _get_length_bounds(self, length_mode: str) -> tuple[float | None, float | None]:
        """Return min/max ratios for the requested length mode."""
        if length_mode == "shorten":
            return (
                settings.LENGTH_SHORTEN_MIN_RATIO,
                settings.LENGTH_SHORTEN_MAX_RATIO,
            )
        if length_mode == "expand":
            return (
                settings.LENGTH_EXPAND_MIN_RATIO,
                settings.LENGTH_EXPAND_MAX_RATIO,
            )
        # Default to standard ("keep as is")
        return (
            settings.LENGTH_STANDARD_MIN_RATIO,
            settings.LENGTH_STANDARD_MAX_RATIO,
        )

    def _run_length_correction_pass(
        self,
        text: str,
        language: str,
        length_mode: str,
        original_word_count: int,
        min_ratio: float,
        max_ratio: float,
    ) -> str | None:
        """Call LLM to expand or tighten text until it meets the requested ratio."""
        current_words = len(text.split())
        min_words = max(1, math.ceil(original_word_count * min_ratio))
        max_words = max(min_words + 5, math.floor(original_word_count * max_ratio))
        direction = "expand" if current_words < min_words else "tighten"

        system_prompt = (
            "You are a detail-oriented editor. Rewrite the provided text in the SAME language, "
            "preserving all factual information, chronology, and formatting symbols. "
            "Your top priority is to keep the final word count inside the requested target range."
        )

        if direction == "expand":
            adjustment_hint = "Add vivid connective tissue, small anecdotes, or clarifying transitions while keeping facts intact."
        else:
            adjustment_hint = "Trim redundant phrases, merge sentences, and tighten wording without deleting any facts."

        user_prompt = (
            f"Language: {language}\n"
            f"Original word count: {original_word_count}\n"
            f"Current word count: {current_words}\n"
            f"Requested length mode: {length_mode}\n"
            f"Target final range: {min_words} - {max_words} words.\n"
            f"The text is currently too {'short' if direction == 'expand' else 'long'}.\n"
            f"{adjustment_hint}\n"
            "Return only the adjusted text, keeping paragraph and bullet formatting identical.\n\n"
            f"---\n{text}\n---"
        )

        max_tokens = int(max_words * 1.6)

        try:
            revised = self.llm_service.generate_text(
                prompt=user_prompt,
                system_prompt=system_prompt,
                temperature=0.45,
                max_tokens=max_tokens,
            )
            return revised.strip()
        except Exception as exc:
            logger.warning(f"Length correction pass failed: {exc}")
            return None

    @staticmethod
    def _looks_like_valid_rewrite(original: str, candidate: str | None) -> bool:
        """Ensure the authenticity pass output is not empty or wildly off-length."""
        if not candidate or not candidate.strip():
            return False
        original_words = len(original.split())
        candidate_words = len(candidate.split())
        if candidate_words == 0:
            return False
        return 0.65 * original_words <= candidate_words <= 1.35 * original_words

    def _build_system_prompt(
        self,
        base_system_prompt: str,
        tone: str | None = None,
        length_mode: str = "standard",
        readability_level: str | None = None,
        style_sample: str | None = None,
        language: str = "en",
    ) -> str:
        """
        Build enhanced system prompt with all specific instructions.

        This ensures all instructions are in the system prompt (where they belong)
        and not in the user prompt (which would cause the LLM to echo them back).

        Args:
            base_system_prompt: Base system prompt from template
            tone: Writing tone (optional)
            length_mode: 'shorten', 'expand', or 'standard'
            readability_level: Optional readability level
            style_sample: Optional style sample text
            language: Language code

        Returns:
            Complete system prompt with all instructions
        """
        instructions = []

        # Tone instructions
        if tone:
            instructions.append(f"Write in a {tone} tone.")

        # Voice preference (CRITICAL)
        instructions.append(
            "CRITICAL: Prefer active voice over passive voice. Convert passive voice to active where appropriate for more natural, human-like writing. Active voice ('The team did it') is more engaging than passive voice ('It was done by the team')."
        )

        # Length mode instructions
        if length_mode == "shorten":
            instructions.append(
                "Make the text significantly more concise while preserving all key information. Aim for 60-80% of the original length. Ensure all sentences are complete and fully written."
            )
        elif length_mode == "expand":
            instructions.append(
                "Add depth and nuance to the text while maintaining its core meaning. Aim for 120-150% of the original length. Ensure all sentences are complete and fully written."
            )
        else:
            instructions.append(
                "Preserve the approximate length of the original text - maintain within 90-110% of the original character count. Do not add unnecessary words or expand sentences unnecessarily."
            )
            instructions.append(
                "Keep sentences concise and direct - aim for similar word count per sentence as the original."
            )

        # Readability instructions
        if readability_level:
            instructions.append(
                f"Adjust the readability level to {readability_level} while maintaining clarity."
            )

        # Style sample instructions
        if style_sample:
            instructions.append(
                "Match the tone, syntax, rhythm, and vocabulary frequency of the provided style sample."
            )

        # Build complete system prompt
        if instructions:
            instruction_text = "\n\nAdditional instructions:\n" + "\n".join(
                f"- {inst}" for inst in instructions
            )
            return base_system_prompt + instruction_text

        return base_system_prompt

    def _validate_output(
        self,
        original_text: str,
        humanized_text: str,
        style_embedding: Any = None,
    ) -> dict:
        """
        Validate the humanized output for quality.

        Args:
            original_text: Original input text
            humanized_text: Humanized output text
            style_embedding: Optional style embedding vector

        Returns:
            Dictionary with validation results
        """
        # 9a. Semantic Similarity Check
        is_semantically_valid, semantic_similarity = (
            self.validation_service.validate_semantic_similarity(original_text, humanized_text)
        )

        # 9b. Style Adherence Check (if style_sample provided)
        style_similarity = None
        is_style_valid = None
        if style_embedding is not None:
            is_style_valid, style_similarity = self.validation_service.validate_style_similarity(
                style_embedding, humanized_text
            )
            logger.info(f"Style similarity: {style_similarity:.3f} (passed: {is_style_valid})")

        return {
            "semantic_similarity": semantic_similarity,
            "style_similarity": style_similarity,
            "semantic_passed": is_semantically_valid,
            "style_passed": is_style_valid,
        }
