"""
Input sanitization utility.

Removes null bytes, control characters, normalizes whitespace,
trims text, and validates UTF-8 encoding.
"""

import logging
import re

logger = logging.getLogger(__name__)


class InputSanitizer:
    """Utility class for sanitizing input text."""

    @staticmethod
    def sanitize(text: str) -> str:
        """
        Sanitize input text by:
        - Removing null bytes and control characters
        - Normalizing whitespace
        - Trimming text
        - Validating UTF-8 encoding

        Args:
            text: Raw input text to sanitize

        Returns:
            Sanitized text

        Raises:
            ValueError: If text cannot be decoded as UTF-8
        """
        if not isinstance(text, str):
            # If bytes, decode to string
            try:
                text = text.decode("utf-8")
            except (UnicodeDecodeError, AttributeError) as e:
                logger.error(f"Failed to decode text as UTF-8: {e}")
                raise ValueError("Text must be valid UTF-8 encoded") from e

        # Validate and normalize UTF-8
        try:
            # Ensure text is valid UTF-8 by encoding and decoding
            text = text.encode("utf-8", errors="ignore").decode("utf-8")
        except UnicodeError as e:
            logger.error(f"UTF-8 validation failed: {e}")
            raise ValueError("Text contains invalid UTF-8 sequences") from e

        # Remove null bytes
        text = text.replace("\x00", "")

        # Remove other control characters except newlines, tabs, and carriage returns
        # Keep: \n (0x0A), \t (0x09), \r (0x0D)
        # Remove: all other control characters (0x00-0x08, 0x0B-0x0C, 0x0E-0x1F, 0x7F)
        # BUT preserve special Unicode symbols like ➜ (U+25C0) and other formatting symbols
        # Only remove actual control characters, not formatting symbols
        text = re.sub(r"[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]", "", text)

        # Normalize whitespace
        # Replace multiple spaces with single space
        text = re.sub(r" +", " ", text)
        # Replace multiple newlines (3+) with double newline
        text = re.sub(r"\n{3,}", "\n\n", text)
        # Replace tabs with single space
        text = text.replace("\t", " ")
        # Normalize carriage return + newline to just newline
        text = text.replace("\r\n", "\n").replace("\r", "\n")

        # Trim text
        text = text.strip()

        return text

    @staticmethod
    def sanitize_optional(text: str | None) -> str | None:
        """
        Sanitize optional text input.

        Args:
            text: Optional text to sanitize

        Returns:
            Sanitized text or None if input was None/empty
        """
        if not text or not text.strip():
            return None
        return InputSanitizer.sanitize(text)
