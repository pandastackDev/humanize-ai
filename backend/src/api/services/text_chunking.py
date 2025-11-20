"""
Text chunking service.

Intelligently splits text into chunks for LLM processing while preserving
sentence boundaries and context.
"""

import logging
import re

import tiktoken

from api.config import settings

logger = logging.getLogger(__name__)


class TextChunkingService:
    """Service for chunking text into manageable pieces for LLM processing."""

    def __init__(self):
        """Initialize text chunking service."""
        # Use cl100k_base encoding (used by GPT-4, GPT-3.5-turbo)
        try:
            self.encoding = tiktoken.get_encoding("cl100k_base")
        except Exception as e:
            logger.error(f"Failed to load tiktoken encoding: {e}")
            self.encoding = None

    def count_tokens(self, text: str) -> int:
        """
        Count the number of tokens in text.

        Args:
            text: Text to count tokens for

        Returns:
            Number of tokens
        """
        if not self.encoding:
            # Fallback: rough estimate (1 token ≈ 4 characters)
            return len(text) // 4

        try:
            return len(self.encoding.encode(text))
        except Exception as e:
            logger.warning(f"Token counting failed: {e}. Using fallback.")
            return len(text) // 4

    def chunk_text(
        self,
        text: str,
        max_tokens: int | None = None,
        min_tokens: int | None = None,
        overlap: int | None = None,
    ) -> list[dict]:
        """
        Chunk text into smaller pieces while preserving sentence boundaries.

        Args:
            text: Text to chunk
            max_tokens: Maximum tokens per chunk (defaults to MAX_CHUNK_TOKENS from config)
            min_tokens: Minimum tokens per chunk (defaults to MIN_CHUNK_TOKENS from config)
            overlap: Number of tokens to overlap between chunks for context preservation

        Returns:
            List of chunk dictionaries with keys:
            - 'text': The chunk text
            - 'start_index': Start index in original text
            - 'end_index': End index in original text
            - 'token_count': Number of tokens in chunk
        """
        max_tokens = max_tokens or settings.MAX_CHUNK_TOKENS
        min_tokens = min_tokens or settings.MIN_CHUNK_TOKENS
        overlap = overlap if overlap is not None else settings.CHUNK_OVERLAP_TOKENS

        if not text or len(text.strip()) == 0:
            return []

        # If text fits in one chunk, return as-is
        token_count = self.count_tokens(text)
        if token_count <= max_tokens:
            return [
                {
                    "text": text,
                    "start_index": 0,
                    "end_index": len(text),
                    "token_count": token_count,
                }
            ]

        # Split text into sentences
        # This regex handles common sentence endings (. ! ?) but not abbreviations
        sentences = re.split(r"(?<=[.!?])\s+", text.strip())
        sentences = [s for s in sentences if s.strip()]

        chunks = []
        current_chunk = []
        current_token_count = 0
        start_index = 0

        for sentence in sentences:
            sentence_tokens = self.count_tokens(sentence)

            # If single sentence exceeds max_tokens, split it further
            if sentence_tokens > max_tokens:
                # Save current chunk if any
                if current_chunk:
                    chunk_text = " ".join(current_chunk)
                    chunks.append(
                        {
                            "text": chunk_text,
                            "start_index": start_index,
                            "end_index": start_index + len(chunk_text),
                            "token_count": current_token_count,
                        }
                    )
                    current_chunk = []
                    current_token_count = 0

                # Split large sentence by words
                words = sentence.split()
                word_chunk = []
                word_tokens = 0

                for word in words:
                    word_token_count = self.count_tokens(word + " ")
                    if word_tokens + word_token_count > max_tokens and word_chunk:
                        chunks.append(
                            {
                                "text": " ".join(word_chunk),
                                "start_index": start_index,
                                "end_index": start_index + len(" ".join(word_chunk)),
                                "token_count": word_tokens,
                            }
                        )
                        start_index += len(" ".join(word_chunk)) + 1
                        word_chunk = [word]
                        word_tokens = word_token_count
                    else:
                        word_chunk.append(word)
                        word_tokens += word_token_count

                if word_chunk:
                    current_chunk = word_chunk
                    current_token_count = word_tokens
                continue

            # Check if adding this sentence would exceed max_tokens
            if current_token_count + sentence_tokens > max_tokens:
                # Save current chunk
                if current_chunk:
                    chunk_text = " ".join(current_chunk)
                    chunks.append(
                        {
                            "text": chunk_text,
                            "start_index": start_index,
                            "end_index": start_index + len(chunk_text),
                            "token_count": current_token_count,
                        }
                    )
                    # Start new chunk with overlap from previous chunk
                    overlap_sentences = self._get_overlap_sentences(current_chunk, overlap)
                    current_chunk = overlap_sentences + [sentence]
                    current_token_count = self.count_tokens(" ".join(current_chunk))
                    start_index = chunks[-1]["end_index"] + 1 if chunks else 0
                else:
                    current_chunk = [sentence]
                    current_token_count = sentence_tokens
            else:
                if not current_chunk:
                    start_index = text.find(sentence)
                current_chunk.append(sentence)
                current_token_count += sentence_tokens

        # Add remaining chunk
        if current_chunk:
            chunk_text = " ".join(current_chunk)
            chunks.append(
                {
                    "text": chunk_text,
                    "start_index": start_index,
                    "end_index": start_index + len(chunk_text),
                    "token_count": current_token_count,
                }
            )

        # Filter out chunks that are too small (unless it's the only chunk)
        if len(chunks) > 1:
            chunks = [c for c in chunks if c["token_count"] >= min_tokens or len(chunks) == 1]

        return chunks

    def _get_overlap_sentences(self, sentences: list[str], overlap_tokens: int) -> list[str]:
        """Get sentences from the end of a chunk for overlap."""
        if not sentences:
            return []

        overlap_sentences = []
        token_count = 0

        # Add sentences from the end until we reach overlap_tokens
        for sentence in reversed(sentences):
            sentence_tokens = self.count_tokens(sentence)
            if token_count + sentence_tokens <= overlap_tokens:
                overlap_sentences.insert(0, sentence)
                token_count += sentence_tokens
            else:
                break

        return overlap_sentences
