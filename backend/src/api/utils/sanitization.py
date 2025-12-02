"""
Input sanitization utility.

Removes null bytes, control characters, normalizes whitespace,
trims text, and validates UTF-8 encoding.
"""

import logging
import re
import unicodedata

logger = logging.getLogger(__name__)


class InputSanitizer:
    """Utility class for sanitizing input text."""

    @staticmethod
    def sanitize(text: str) -> str:
        """
        Sanitize input text by:
        - Removing markdown formatting (to avoid AI detection)
        - Converting non-ASCII characters to ASCII equivalents
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

        # Step 1: Remove markdown formatting (CRITICAL - markdown is easily detected by AI detectors)
        text = InputSanitizer.remove_markdown(text)

        # Step 2: Convert non-ASCII characters to ASCII equivalents
        text = InputSanitizer.convert_to_ascii(text)

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

    @staticmethod
    def remove_markdown(text: str) -> str:
        """
        Remove markdown formatting from text to avoid AI detection.

        Markdown can be easily detected by AI detectors like Copyleaks.
        This function removes all markdown syntax while preserving the text content.

        Handles:
        - Headers (# ## ### etc.)
        - Bold (**text** or __text__)
        - Italic (*text* or _text_)
        - Links ([text](url))
        - Images (![alt](url))
        - Code blocks (```code```)
        - Inline code (`code`)
        - Lists (- item, * item, 1. item)
        - Blockquotes (> text)
        - Horizontal rules (---, ***, ___)
        - Strikethrough (~~text~~)
        - Tables (| col1 | col2 |)
        - HTML tags (if any)

        Args:
            text: Text with markdown formatting

        Returns:
            Text with all markdown formatting removed
        """
        if not text:
            return text

        result = text

        # Remove code blocks (```code``` or ```language\ncode\n```)
        result = re.sub(r"```[\s\S]*?```", "", result)

        # Remove inline code (`code`)
        result = re.sub(r"`([^`]+)`", r"\1", result)

        # Remove images (![alt](url))
        result = re.sub(r"!\[([^\]]*)\]\([^\)]+\)", r"\1", result)

        # Remove links ([text](url)) - keep the text
        result = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", result)

        # Remove reference-style links [text][ref] and [ref]: url
        result = re.sub(r"\[([^\]]+)\]\[[^\]]+\]", r"\1", result)
        result = re.sub(r"^\[[^\]]+\]:\s*.*$", "", result, flags=re.MULTILINE)

        # Remove headers (# ## ### etc.) - keep the text
        result = re.sub(r"^#{1,6}\s+(.+)$", r"\1", result, flags=re.MULTILINE)

        # Remove bold (**text** or __text__) - keep the text
        result = re.sub(r"\*\*([^\*]+)\*\*", r"\1", result)
        result = re.sub(r"__([^_]+)__", r"\1", result)

        # Remove italic (*text* or _text_) - keep the text
        # Be careful not to remove asterisks that are part of lists
        result = re.sub(r"(?<!\*)\*([^\*]+)\*(?!\*)", r"\1", result)
        result = re.sub(r"(?<!_)_([^_]+)_(?!_)", r"\1", result)

        # Remove strikethrough (~~text~~)
        result = re.sub(r"~~([^~]+)~~", r"\1", result)

        # Remove blockquotes (> text) - keep the text
        result = re.sub(r"^>\s+(.+)$", r"\1", result, flags=re.MULTILINE)

        # Remove horizontal rules (---, ***, ___)
        result = re.sub(r"^[-*_]{3,}$", "", result, flags=re.MULTILINE)

        # Remove list markers (- item, * item, 1. item) - keep the text
        result = re.sub(r"^[\s]*[-*+]\s+(.+)$", r"\1", result, flags=re.MULTILINE)
        result = re.sub(r"^[\s]*\d+\.\s+(.+)$", r"\1", result, flags=re.MULTILINE)

        # Remove table syntax (| col1 | col2 |) - keep the content
        # First, remove table separators (|---|---|)
        result = re.sub(
            r"^\|?[\s]*:?-+:?[\s]*\|[\s]*:?-+:?[\s]*\|?[\s]*$", "", result, flags=re.MULTILINE
        )
        # Then remove table cell separators but keep content
        result = re.sub(r"\|", " ", result)

        # Remove HTML tags (if any markdown processors add them)
        result = re.sub(r"<[^>]+>", "", result)

        # Clean up extra whitespace that might result from markdown removal
        # Replace multiple spaces with single space
        result = re.sub(r" +", " ", result)
        # Replace multiple newlines with double newline
        result = re.sub(r"\n{3,}", "\n\n", result)

        # Trim the result
        result = result.strip()

        return result

    @staticmethod
    def convert_to_ascii(text: str) -> str:
        """
        Convert non-ASCII characters to ASCII equivalents.

        Handles common non-ASCII characters like:
        - Em dashes (—) → --
        - En dashes (–) → -
        - Smart quotes (" " ' ') → " " ' '
        - Ellipsis (…) → ...
        - Copyright (©) → (c)
        - Trademark (™) → TM
        - Euro (€) → EUR
        - Pound (£) → GBP
        - Bullet (•) → *
        - Arrow (→) -> ->
        - And other common Unicode characters

        Args:
            text: Text with potential non-ASCII characters

        Returns:
            Text with non-ASCII characters converted to ASCII equivalents
        """
        if not text:
            return text

        # Common non-ASCII character mappings
        char_map = {
            # Dashes
            "—": "--",  # em dash
            "–": "-",  # en dash
            # Smart quotes
            "\u201c": '"',  # left double quotation mark (")
            "\u201d": '"',  # right double quotation mark (")
            "\u2018": "'",  # left single quotation mark (')
            "\u2019": "'",  # right single quotation mark (')
            # Other punctuation
            "…": "...",  # ellipsis
            "•": "*",  # bullet
            "→": "->",  # right arrow
            "←": "<-",  # left arrow
            "⇒": "=>",  # double right arrow
            "⇐": "<=",  # double left arrow
            # Symbols
            "©": "(c)",  # copyright
            "®": "(R)",  # registered trademark
            "™": "TM",  # trademark
            "€": "EUR",  # euro
            "£": "GBP",  # pound
            "¥": "JPY",  # yen
            "°": "deg",  # degree
            "±": "+/-",  # plus-minus
            "×": "x",  # multiplication
            "÷": "/",  # division
            "½": "1/2",  # fraction half
            "¼": "1/4",  # fraction quarter
            "¾": "3/4",  # fraction three quarters
        }

        # Replace mapped characters
        result = text
        for non_ascii, ascii_equiv in char_map.items():
            result = result.replace(non_ascii, ascii_equiv)

        # For remaining non-ASCII characters, use Unicode normalization
        # This converts characters like é to e, ñ to n, etc.
        # Use NFKD normalization to decompose characters, then remove combining marks
        result = unicodedata.normalize("NFKD", result)
        # Remove combining marks (diacritics) but keep the base characters
        result = "".join(
            char
            for char in result
            if unicodedata.category(char) != "Mn"  # Mn = Nonspacing Mark
        )

        # Final pass: ensure all remaining characters are ASCII
        # Replace any remaining non-ASCII with closest ASCII equivalent or remove
        result = result.encode("ascii", errors="ignore").decode("ascii")

        return result
