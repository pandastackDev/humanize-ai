"""
Validation service for quality checks.

Validates:
- Semantic similarity (meaning preservation)
- Style similarity (tone/style match)
- Naturalness metrics
"""

import logging

from api.config import settings

from .embedding_service import EmbeddingService

logger = logging.getLogger(__name__)


class ValidationService:
    """Service for validating humanized text quality."""

    def __init__(self, embedding_service: EmbeddingService):
        """
        Initialize validation service.

        Args:
            embedding_service: Embedding service instance
        """
        self.embedding_service = embedding_service

    def validate_semantic_similarity(
        self, original_text: str, humanized_text: str
    ) -> tuple[bool, float]:
        """
        Validate that semantic meaning is preserved.

        Uses parallel batch embedding API calls for faster processing.

        Args:
            original_text: Original text
            humanized_text: Humanized text

        Returns:
            Tuple of (is_valid, similarity_score)
        """
        try:
            # Use batch API to get both embeddings in parallel (much faster)
            embeddings = self.embedding_service.get_embeddings_batch(
                [original_text, humanized_text]
            )
            original_embedding = embeddings[0]
            humanized_embedding = embeddings[1]

            similarity = self.embedding_service.cosine_similarity(
                original_embedding, humanized_embedding
            )

            is_valid = similarity >= settings.SEMANTIC_SIMILARITY_THRESHOLD

            return is_valid, similarity
        except Exception as e:
            logger.error(f"Semantic similarity validation failed: {e}")
            # On error, assume valid (fail open) but log the issue
            return True, 0.0

    def validate_style_similarity(self, style_embedding, humanized_text: str) -> tuple[bool, float]:
        """
        Validate that style matches the style sample.

        Args:
            style_embedding: Embedding vector from style sample
            humanized_text: Humanized text to validate

        Returns:
            Tuple of (is_valid, similarity_score)
        """
        try:
            humanized_embedding = self.embedding_service.get_embedding(humanized_text)

            similarity = self.embedding_service.cosine_similarity(
                style_embedding, humanized_embedding
            )

            is_valid = similarity >= settings.STYLE_SIMILARITY_THRESHOLD

            return is_valid, similarity
        except Exception as e:
            logger.error(f"Style similarity validation failed: {e}")
            # On error, assume valid (fail open) but log the issue
            return True, 0.0

    def calculate_naturalness_metrics(self, text: str) -> dict:
        """
        Calculate naturalness metrics for text.

        Args:
            text: Text to analyze

        Returns:
            Dictionary with metrics:
            - sentence_length_variance: Variance in sentence lengths
            - avg_sentence_length: Average sentence length
            - lexical_diversity: Unique words / total words
        """
        import re

        # Split into sentences
        sentences = re.split(r"[.!?]+", text)
        sentences = [s.strip() for s in sentences if s.strip()]

        if not sentences:
            return {
                "sentence_length_variance": 0.0,
                "avg_sentence_length": 0.0,
                "lexical_diversity": 0.0,
            }

        # Calculate sentence lengths
        sentence_lengths = [len(s.split()) for s in sentences]
        avg_length = sum(sentence_lengths) / len(sentence_lengths)
        variance = (
            sum((x - avg_length) ** 2 for x in sentence_lengths) / len(sentence_lengths)
            if len(sentence_lengths) > 1
            else 0.0
        )

        # Calculate lexical diversity
        words = text.lower().split()
        unique_words = len(set(words))
        total_words = len(words)
        lexical_diversity = unique_words / total_words if total_words > 0 else 0.0

        return {
            "sentence_length_variance": variance,
            "avg_sentence_length": avg_length,
            "lexical_diversity": lexical_diversity,
        }
