"""
Services layer for humanization features.

This module contains business logic for:
- Language detection
- Text chunking
- LLM interactions (OpenAI, Anthropic)
- Embedding generation and similarity calculations
- Text validation (semantic, style)
- Main humanization orchestration
"""

from . import prompts
from .embedding_service import EmbeddingService
from .humanization_service import HumanizationService
from .language_detection import LanguageDetectionService
from .llm_service import LLMService
from .text_chunking import TextChunkingService
from .validation_service import ValidationService

__all__ = [
    "HumanizationService",
    "LanguageDetectionService",
    "TextChunkingService",
    "LLMService",
    "EmbeddingService",
    "ValidationService",
    "prompts",
]
