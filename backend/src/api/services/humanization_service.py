"""
Main humanization service that orchestrates the humanization pipeline.

Pipeline steps:
1. Language detection
2. Text chunking (if needed)
3. Style conditioning
4. LLM rewriting
5. Reassembly and smoothing
6. Validation
"""

import logging
import time
from typing import Optional

from api.config import settings

from .embedding_service import EmbeddingService
from .language_detection import LanguageDetectionService
from .llm_service import LLMService
from .text_chunking import TextChunkingService
from .validation_service import ValidationService

logger = logging.getLogger(__name__)


class HumanizationService:
    """Main service for humanizing text."""

    def __init__(self):
        """Initialize humanization service with all dependencies."""
        self.language_service = LanguageDetectionService()
        self.chunking_service = TextChunkingService()
        self.llm_service = LLMService()
        self.embedding_service = EmbeddingService()
        self.validation_service = ValidationService(self.embedding_service)

    def humanize(
        self,
        input_text: str,
        tone: Optional[str] = None,
        length_mode: str = "standard",
        style_sample: Optional[str] = None,
        readability_level: Optional[str] = None,
        language: Optional[str] = None,
    ) -> dict:
        """
        Humanize text using the full pipeline.

        Args:
            input_text: Text to humanize
            tone: Writing tone (e.g., 'academic', 'casual')
            length_mode: 'shorten', 'expand', or 'standard'
            style_sample: Optional style sample text (min 150 words recommended)
            readability_level: Optional readability level
            language: Optional target language (auto-detected if not provided)

        Returns:
            Dictionary with:
            - humanized_text: The humanized text
            - language: Detected/target language
            - metrics: Validation metrics
            - metadata: Processing metadata
        """
        start_time = time.time()

        # Step 1: Language detection
        if language:
            detected_language = language.lower()
            language_confidence = 1.0
        else:
            detected_language, language_confidence = (
                self.language_service.detect_language(input_text)
            )
            logger.info(f"Detected language: {detected_language} (confidence: {language_confidence:.2f})")

        # Step 2: Style conditioning
        style_embedding = None
        if style_sample and len(style_sample.split()) >= 150:
            try:
                style_embedding = self.embedding_service.get_style_embedding(
                    style_sample
                )
                logger.info("Style embedding extracted from style sample")
            except Exception as e:
                logger.warning(f"Failed to extract style embedding: {e}")

        # Step 3: Text chunking
        chunks = self.chunking_service.chunk_text(input_text)
        logger.info(f"Text split into {len(chunks)} chunks")

        # Step 4: LLM rewriting
        humanized_chunks = []
        model_used = None

        for i, chunk in enumerate(chunks):
            logger.info(f"Processing chunk {i + 1}/{len(chunks)}")
            try:
                # Build prompt based on parameters
                system_prompt = self._build_system_prompt(
                    tone, length_mode, readability_level, detected_language, style_sample
                )
                user_prompt = self._build_user_prompt(chunk["text"], style_sample)

                # Generate humanized text
                humanized_chunk = self.llm_service.generate_text(
                    prompt=user_prompt,
                    system_prompt=system_prompt,
                    temperature=0.7,
                )

                # Store model used (from first chunk)
                if model_used is None:
                    model_used = settings.OPENROUTER_MODEL_GPT4

                humanized_chunks.append(humanized_chunk.strip())

            except Exception as e:
                logger.error(f"Failed to humanize chunk {i + 1}: {e}")
                # Fallback: use original chunk text
                humanized_chunks.append(chunk["text"])

        # Step 5: Reassembly
        humanized_text = " ".join(humanized_chunks)

        # Step 6: Smoothing (lightweight post-processing)
        humanized_text = self._smooth_text(humanized_text)

        # Step 7: Validation
        is_semantically_valid, semantic_similarity = (
            self.validation_service.validate_semantic_similarity(
                input_text, humanized_text
            )
        )

        style_similarity = None
        if style_embedding is not None:
            is_style_valid, style_similarity = (
                self.validation_service.validate_style_similarity(
                    style_embedding, humanized_text
                )
            )
            logger.info(
                f"Style similarity: {style_similarity:.3f} "
                f"(valid: {is_style_valid})"
            )

        naturalness_metrics = self.validation_service.calculate_naturalness_metrics(
            humanized_text
        )

        processing_time = (time.time() - start_time) * 1000  # Convert to ms

        logger.info(
            f"Humanization complete. Semantic similarity: {semantic_similarity:.3f} "
            f"(valid: {is_semantically_valid}), Processing time: {processing_time:.0f}ms"
        )

        return {
            "humanized_text": humanized_text,
            "language": detected_language,
            "metrics": {
                "semantic_similarity": round(semantic_similarity, 3),
                "style_similarity": round(style_similarity, 3) if style_similarity else None,
                "word_count": len(humanized_text.split()),
                "character_count": len(humanized_text),
                "processing_time_ms": round(processing_time, 2),
                **naturalness_metrics,
            },
            "metadata": {
                "detected_language": detected_language,
                "language_confidence": round(language_confidence, 3),
                "chunk_count": len(chunks),
                "model_used": model_used,
            },
        }

    def _build_system_prompt(
        self,
        tone: Optional[str],
        length_mode: str,
        readability_level: Optional[str],
        language: str,
        style_sample: Optional[str],
    ) -> str:
        """Build system prompt for LLM."""
        prompts = []

        prompts.append(
            "You are an expert text rewriting engine that humanizes AI-generated text "
            "to make it sound natural, authentic, and written by a human."
        )

        # Length mode instructions
        if length_mode == "shorten":
            prompts.append("Make the text more concise while preserving all key information.")
        elif length_mode == "expand":
            prompts.append("Add depth and nuance to the text while maintaining its core meaning.")
        else:
            prompts.append("Preserve the approximate length of the original text.")

        # Tone instructions
        if tone:
            prompts.append(f"Write in a {tone} tone.")

        # Readability instructions
        if readability_level:
            prompts.append(
                f"Adjust the readability level to {readability_level} while maintaining clarity."
            )

        # Language instructions
        if language and language != "en":
            prompts.append(f"Ensure the output is in {language} with proper grammar and idiom.")

        # Style instructions
        if style_sample:
            prompts.append(
                "The user provided a style sample. Match the tone, syntax, rhythm, "
                "and vocabulary frequency of that style sample."
            )

        prompts.append(
            "Your output must:\n"
            "- Sound natural and human-written\n"
            "- Preserve all factual information\n"
            "- Use varied sentence structures\n"
            "- Avoid repetitive phrasing\n"
            "- Maintain proper grammar and flow"
        )

        return "\n".join(prompts)

    def _build_user_prompt(self, text: str, style_sample: Optional[str]) -> str:
        """Build user prompt for LLM."""
        if style_sample:
            return (
                f"Here is the style sample to match:\n\n{style_sample}\n\n"
                f"Here is the text to rewrite:\n\n{text}\n\n"
                "Rewrite the text so it retains meaning but matches the style sample."
            )
        return f"Rewrite the following text to make it sound more natural and human-written:\n\n{text}"

    def _smooth_text(self, text: str) -> str:
        """Apply smoothing to remove artifacts from chunk reassembly."""
        # Remove extra whitespace
        import re

        text = re.sub(r"\s+", " ", text)
        text = re.sub(r"\s+([.!?])", r"\1", text)
        text = re.sub(r"([.!?])\s+([A-Z])", r"\1 \2", text)

        return text.strip()


