"""
Embedding service for generating text embeddings.

Used for:
- Semantic similarity calculations
- Style similarity calculations
- Style profile extraction
"""

import logging

import numpy as np
from numpy import ndarray

from api.config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for generating and comparing text embeddings."""

    def __init__(self):
        """Initialize embedding service."""
        self.openai_enabled = bool(settings.OPENAI_API_KEY)
        self.openrouter_enabled = bool(settings.OPENROUTER_API_KEY)

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

        # OpenRouter client (fallback for embeddings)
        if self.openrouter_enabled and not self.openai_enabled:
            try:
                from openai import OpenAI

                self.openrouter_client = OpenAI(
                    base_url=settings.OPENROUTER_BASE_URL,
                    api_key=settings.OPENROUTER_API_KEY,
                    default_headers={
                        "HTTP-Referer": settings.OPENROUTER_REFERRER_URL,
                        "X-Title": "Humanize AI",
                    },
                )
                logger.info("OpenRouter embedding client initialized")
            except Exception as e:
                logger.error(f"Failed to initialize OpenRouter embedding client: {e}")
                self.openrouter_enabled = False

    def get_embedding(self, text: str, model: str | None = None) -> ndarray:
        """
        Get embedding vector for text.

        Args:
            text: Text to embed
            model: Embedding model name (optional, uses default if not provided)

        Returns:
            NumPy array of embedding vector

        Raises:
            RuntimeError: If no embedding provider is available
        """
        # Try OpenAI first (best for embeddings)
        if self.openai_enabled:
            try:
                return self._get_openai_embedding(text, model)
            except Exception as e:
                logger.warning(f"OpenAI embedding failed: {e}. Trying OpenRouter.")
                if self.openrouter_enabled:
                    pass  # Fall through to OpenRouter
                else:
                    raise

        # Try OpenRouter fallback
        if self.openrouter_enabled:
            try:
                return self._get_openrouter_embedding(text, model)
            except Exception as e:
                logger.error(f"OpenRouter embedding failed: {e}")
                raise RuntimeError("All embedding providers failed") from e

        raise RuntimeError("No embedding provider available. Please configure API keys.")

    def _get_openai_embedding(self, text: str, model: str | None) -> ndarray:
        """Get embedding using OpenAI."""
        model_name = model or settings.OPENAI_EMBEDDING_MODEL

        response = self.openai_client.embeddings.create(
            model=model_name, input=text.replace("\n", " ")
        )

        return np.array(response.data[0].embedding)

    def _get_openrouter_embedding(self, text: str, model: str | None) -> ndarray:
        """Get embedding using OpenRouter."""
        model_name = model or settings.OPENROUTER_MODEL_EMBEDDING

        response = self.openrouter_client.embeddings.create(
            model=model_name, input=text.replace("\n", " ")
        )

        return np.array(response.data[0].embedding)

    def cosine_similarity(self, embedding1: ndarray, embedding2: ndarray) -> float:
        """
        Calculate cosine similarity between two embeddings.

        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector

        Returns:
            Cosine similarity score (0.0 to 1.0)
        """
        # Normalize vectors
        norm1 = np.linalg.norm(embedding1)
        norm2 = np.linalg.norm(embedding2)

        if norm1 == 0 or norm2 == 0:
            return 0.0

        # Calculate cosine similarity
        dot_product = np.dot(embedding1, embedding2)
        similarity = dot_product / (norm1 * norm2)

        # Clamp to [-1, 1] in case of floating point errors
        return float(np.clip(similarity, -1.0, 1.0))

    def get_style_embedding(self, style_sample: str) -> ndarray:
        """
        Extract style embedding from a style sample.

        Args:
            style_sample: Sample text that represents the desired writing style

        Returns:
            Style embedding vector
        """
        return self.get_embedding(style_sample)
