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

import asyncio
import logging
import re
import time
from typing import Optional, List, Tuple

from api.config import settings

from .embedding_service import EmbeddingService
from .language_detection import LanguageDetectionService
from .llm_service import LLMService
from .text_chunking import TextChunkingService
from .validation_service import ValidationService
from .prompts import get_prompt_template, build_user_prompt

logger = logging.getLogger(__name__)


class HumanizationService:
    """Main service for humanizing text following the complete pipeline."""

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
        start_time = time.time()

        # Step 3: Language Detection
        if language:
            detected_language = language.lower().split("-")[0]  # Handle variants like "en-US"
            language_confidence = 1.0
            logger.info(f"Using provided language: {detected_language}")
        else:
            detected_language, language_confidence = (
                self.language_service.detect_language(input_text)
            )
            logger.info(
                f"Detected language: {detected_language} (confidence: {language_confidence:.2f})"
            )

        # Step 4: Style Conditioning
        style_embedding = None
        style_context = None
        if style_sample and len(style_sample.strip().split()) >= 150:
            try:
                style_embedding = self.embedding_service.get_style_embedding(style_sample)
                style_context = {
                    "type": "embedding",
                    "embedding": style_embedding,
                    "sample_length": len(style_sample.split()),
                }
                logger.info(f"Style embedding generated from {len(style_sample.split())} word sample")
            except Exception as e:
                logger.warning(f"Failed to extract style embedding: {e}")
                style_context = None
        else:
            style_context = {
                "type": "preset",
                "template": tone or "general",
            }
            logger.info(f"Using preset style template: {tone or 'general'}")

        # Step 5: Text Chunking
        chunks = self.chunking_service.chunk_text(input_text)
        logger.info(f"Text split into {len(chunks)} chunks")

        if not chunks:
            raise ValueError("Text chunking failed - no chunks generated")
        
        # Store original text structure for reassembly
        # Detect if input has bullet points or special formatting
        has_bullets = bool(re.search(r"➜|•|[*\-]\s+", input_text))
        original_lines = input_text.split("\n") if has_bullets else None

        # Step 6: Get Language Prompt Template
        prompt_template = get_prompt_template(detected_language)
        logger.info(f"Using prompt template for language: {detected_language}")

        # Step 7: Parallel Chunk Rewriting
        humanized_chunks, model_used = self._rewrite_chunks_parallel(
            chunks=chunks,
            prompt_template=prompt_template,
            tone=tone,
            length_mode=length_mode,
            readability_level=readability_level,
            style_sample=style_sample,
            language=detected_language,
        )

        # Step 8: Reassembly & Smoothing
        humanized_text = self._reassemble_and_smooth(humanized_chunks, detected_language, input_text)

        # Step 9: Validation
        validation_results = self._validate_output(
            original_text=input_text,
            humanized_text=humanized_text,
            style_embedding=style_embedding,
        )

        processing_time = (time.time() - start_time) * 1000  # Convert to ms

        logger.info(
            f"Humanization complete. "
            f"Semantic similarity: {validation_results['semantic_similarity']:.3f} "
            f"(passed: {validation_results['semantic_passed']}), "
            f"Processing time: {processing_time:.0f}ms"
        )

        return {
            "humanized_text": humanized_text,
            "language": detected_language,
            "metrics": {
                "semantic_similarity": round(validation_results["semantic_similarity"], 3),
                "style_similarity": round(validation_results["style_similarity"], 3)
                if validation_results["style_similarity"] is not None
                else None,
                "word_count": len(humanized_text.split()),
                "character_count": len(humanized_text),
                "processing_time_ms": round(processing_time, 2),
                "original_word_count": len(input_text.split()),
                "chunks_used": len(chunks),
            },
            "metadata": {
                "detected_language": detected_language,
                "language_confidence": round(language_confidence, 3),
                "chunk_count": len(chunks),
                "model_used": model_used,
                "semantic_passed": validation_results["semantic_passed"],
                "style_passed": validation_results.get("style_passed", None),
            },
        }

    def _rewrite_chunks_parallel(
        self,
        chunks: List[dict],
        prompt_template: dict,
        tone: Optional[str],
        length_mode: str,
        readability_level: Optional[str],
        style_sample: Optional[str],
        language: str,
    ) -> Tuple[List[str], str]:
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
                    max_output_tokens = max(int(base_tokens * 1.3), base_tokens + 200)  # Minimum 200 token buffer
                elif length_mode == "shorten":
                    # Even when shortening, allow enough to complete sentences
                    max_output_tokens = max(int(base_tokens * 0.9), base_tokens - 100)  # At least 90% of original
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
                    if self.llm_service.openrouter_enabled:
                        model_used = settings.OPENROUTER_MODEL_GPT4
                    elif self.llm_service.openai_enabled:
                        model_used = settings.OPENAI_LLM_MODEL
                    elif self.llm_service.anthropic_enabled:
                        model_used = settings.ANTHROPIC_LLM_MODEL
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
                            logger.warning(f"Chunk {i + 1} may be incomplete - doesn't end with punctuation: {cleaned_chunk[-50:]}")
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

    def _reassemble_and_smooth(self, chunks: List[str], language: str, original_text: str) -> str:
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
        original_lines = original_text.split("\n")
        
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
            text_part = para[len(bullet_part):] if bullet_part else para
            
            # Smooth the text part only
            text_part = re.sub(r"\s+", " ", text_part)  # Multiple spaces to single
            text_part = re.sub(r"\s+([.!?])", r"\1", text_part)  # Remove space before punctuation
            text_part = re.sub(r"([.!?])\s+([A-Z])", r"\1 \2", text_part)  # Ensure space after sentence
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

    def _build_system_prompt(
        self,
        base_system_prompt: str,
        tone: Optional[str] = None,
        length_mode: str = "standard",
        readability_level: Optional[str] = None,
        style_sample: Optional[str] = None,
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

        # Voice preservation (CRITICAL)
        instructions.append("CRITICAL: Preserve the sentence voice (active vs passive) from the original text. If a sentence is active voice, rewrite it as active voice. If it's passive voice, rewrite it as passive voice. Do not change active to passive or vice versa.")

        # Length mode instructions
        if length_mode == "shorten":
            instructions.append("Make the text significantly more concise while preserving all key information. Aim for 60-80% of the original length. Ensure all sentences are complete and fully written.")
        elif length_mode == "expand":
            instructions.append("Add depth and nuance to the text while maintaining its core meaning. Aim for 120-150% of the original length. Ensure all sentences are complete and fully written.")
        else:
            instructions.append("Preserve the approximate length of the original text - maintain within 90-110% of the original character count. Do not add unnecessary words or expand sentences unnecessarily.")
            instructions.append("Keep sentences concise and direct - aim for similar word count per sentence as the original.")

        # Readability instructions
        if readability_level:
            instructions.append(f"Adjust the readability level to {readability_level} while maintaining clarity.")

        # Style sample instructions
        if style_sample:
            instructions.append("Match the tone, syntax, rhythm, and vocabulary frequency of the provided style sample.")

        # Build complete system prompt
        if instructions:
            instruction_text = "\n\nAdditional instructions:\n" + "\n".join(f"- {inst}" for inst in instructions)
            return base_system_prompt + instruction_text
        
        return base_system_prompt

    def _validate_output(
        self,
        original_text: str,
        humanized_text: str,
        style_embedding: Optional,
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
            self.validation_service.validate_semantic_similarity(
                original_text, humanized_text
            )
        )

        # 9b. Style Adherence Check (if style_sample provided)
        style_similarity = None
        is_style_valid = None
        if style_embedding is not None:
            is_style_valid, style_similarity = (
                self.validation_service.validate_style_similarity(
                    style_embedding, humanized_text
                )
            )
            logger.info(
                f"Style similarity: {style_similarity:.3f} (passed: {is_style_valid})"
            )

        return {
            "semantic_similarity": semantic_similarity,
            "style_similarity": style_similarity,
            "semantic_passed": is_semantically_valid,
            "style_passed": is_style_valid,
        }
