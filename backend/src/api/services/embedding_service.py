"""
Embedding service for generating text embeddings.

Used for:
- Semantic similarity calculations
- Style similarity calculations
- Style profile extraction
"""

import logging
import math

from api.config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for generating and comparing text embeddings."""

    def __init__(self):
        """Initialize embedding service."""
        self.openai_enabled = bool(settings.OPENAI_API_KEY)

        # Initialize clients
        self._init_clients()

    def _init_clients(self) -> None:
        """Initialize embedding provider clients."""
        # OpenAI client (primary for embeddings)
        if self.openai_enabled:
            try:
                from openai import OpenAI

                self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
                logger.info("OpenAI embedding client initialized")
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI embedding client: {e}")
                self.openai_enabled = False

    def get_embedding(self, text: str, model: str | None = None) -> list[float]:
        """
        Get embedding vector for text.

        Args:
            text: Text to embed
            model: Embedding model name (optional, uses default if not provided)

        Returns:
            List of floats representing the embedding vector

        Raises:
            RuntimeError: If no embedding provider is available
        """
        # Use OpenAI for embeddings
        if self.openai_enabled:
            try:
                return self._get_openai_embedding(text, model)
            except Exception as e:
                logger.error(f"OpenAI embedding failed: {e}")
                raise RuntimeError("Embedding provider failed") from e

        raise RuntimeError("No embedding provider available. Please configure OpenAI API key.")

    def get_embeddings_batch(self, texts: list[str], model: str | None = None) -> list[list[float]]:
        """
        Get embeddings for multiple texts in parallel (faster than sequential calls).

        Args:
            texts: List of texts to embed
            model: Embedding model name (optional, uses default if not provided)

        Returns:
            List of embedding vectors (each is a list of floats)

        Raises:
            RuntimeError: If no embedding provider is available
        """
        if not texts:
            return []

        # Use OpenAI for embeddings
        if self.openai_enabled:
            try:
                return self._get_openai_embeddings_batch(texts, model)
            except Exception as e:
                logger.error(f"OpenAI batch embedding failed: {e}")
                raise RuntimeError("Embedding provider failed") from e

        raise RuntimeError("No embedding provider available. Please configure OpenAI API key.")

    def _get_openai_embedding(self, text: str, model: str | None) -> list[float]:
        """Get embedding using OpenAI."""
        model_name = model or settings.OPENAI_EMBEDDING_MODEL

        response = self.openai_client.embeddings.create(
            model=model_name, input=text.replace("\n", " ")
        )

        # OpenAI returns a list of floats directly, no conversion needed
        return list(response.data[0].embedding)

    def _get_openai_embeddings_batch(
        self, texts: list[str], model: str | None
    ) -> list[list[float]]:
        """Get embeddings for multiple texts using OpenAI batch API."""
        model_name = model or settings.OPENAI_EMBEDDING_MODEL

        # Clean texts
        cleaned_texts = [text.replace("\n", " ") for text in texts]

        # OpenAI embeddings.create supports batch input
        response = self.openai_client.embeddings.create(model=model_name, input=cleaned_texts)

        # Return list of lists (each embedding is a list of floats)
        return [list(item.embedding) for item in response.data]

    def cosine_similarity(self, embedding1: list[float], embedding2: list[float]) -> float:
        """
        Calculate cosine similarity between two embeddings.

        Args:
            embedding1: First embedding vector (list of floats)
            embedding2: Second embedding vector (list of floats)

        Returns:
            Cosine similarity score (0.0 to 1.0)
        """
        # Calculate vector norms (Euclidean norm) using built-in math
        norm1 = math.sqrt(sum(x * x for x in embedding1))
        norm2 = math.sqrt(sum(x * x for x in embedding2))

        if norm1 == 0 or norm2 == 0:
            return 0.0

        # Calculate dot product using built-in zip and sum
        dot_product = sum(a * b for a, b in zip(embedding1, embedding2))

        # Calculate cosine similarity
        similarity = dot_product / (norm1 * norm2)

        # Clamp to [-1, 1] using built-in min/max
        return float(max(-1.0, min(1.0, similarity)))

    def get_style_embedding(self, style_sample: str) -> list[float]:
        """
        Extract style embedding from a style sample.

        Args:
            style_sample: Sample text that represents the desired writing style

        Returns:
            Style embedding vector (list of floats)
        """
        return self.get_embedding(style_sample)
