"""
Format preservation utilities for maintaining text structure during humanization.

Preserves:
- Line breaks and paragraph boundaries
- Blank lines between paragraphs
- List structures (bullets, numbers)
- Indentation patterns
"""

import logging
import re
from typing import TypedDict

logger = logging.getLogger(__name__)


class FormatMetadata(TypedDict):
    """Metadata about text formatting."""

    paragraph_breaks: list[int]  # Character positions where paragraphs end
    blank_lines: list[int]  # Character positions of blank lines
    has_lists: bool  # Whether text contains list items
    total_paragraphs: int  # Number of paragraphs


def extract_format_metadata(text: str) -> FormatMetadata:
    """
    Extract formatting metadata from text to preserve structure.

    Args:
        text: Original text

    Returns:
        FormatMetadata with structure information
    """
    # Find paragraph breaks (double newlines or more)
    paragraph_breaks = []
    blank_lines = []

    # Split by lines to analyze structure
    lines = text.split("\n")
    current_pos = 0

    for i, line in enumerate(lines):
        # Track blank lines
        if not line.strip():
            blank_lines.append(current_pos)

        # Track paragraph boundaries (blank line followed by content)
        if i > 0 and not lines[i - 1].strip() and line.strip():
            paragraph_breaks.append(current_pos)

        current_pos += len(line) + 1  # +1 for newline

    # Check for list structures
    has_lists = bool(re.search(r"^\s*[-*•]\s", text, re.MULTILINE)) or bool(
        re.search(r"^\s*\d+[.)]\s", text, re.MULTILINE)
    )

    # Count paragraphs (non-empty text blocks separated by blank lines)
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    total_paragraphs = len(paragraphs)

    return {
        "paragraph_breaks": paragraph_breaks,
        "blank_lines": blank_lines,
        "has_lists": has_lists,
        "total_paragraphs": total_paragraphs,
    }


def split_preserving_structure(text: str) -> list[dict]:
    """
    Split text into paragraphs while preserving their structure.

    Args:
        text: Input text

    Returns:
        List of dicts with 'content' and 'trailing_newlines' keys
    """
    # Split by double newlines but keep info about spacing
    parts = re.split(r"(\n\s*\n+)", text)

    result = []
    for i, part in enumerate(parts):
        if i % 2 == 0:  # Content
            if part.strip():
                # Count trailing newlines from next part
                trailing = 0
                if i + 1 < len(parts):
                    trailing = parts[i + 1].count("\n")
                result.append(
                    {
                        "content": part.strip(),
                        "trailing_newlines": trailing,
                    }
                )

    return result


def reassemble_with_structure(paragraphs: list[str], original_structure: list[dict]) -> str:
    """
    Reassemble humanized paragraphs with original structure preserved.

    Args:
        paragraphs: List of humanized paragraph texts
        original_structure: Original structure from split_preserving_structure

    Returns:
        Text with original line break structure restored
    """
    if len(paragraphs) != len(original_structure):
        logger.warning(
            f"Paragraph count mismatch: {len(paragraphs)} humanized vs "
            f"{len(original_structure)} original. Using simple join."
        )
        # Fallback: join with double newlines
        return "\n\n".join(paragraphs)

    # Reassemble with original spacing
    result_parts = []
    for para, struct in zip(paragraphs, original_structure):
        result_parts.append(para.strip())
        # Add the original number of newlines
        if struct["trailing_newlines"] > 0:
            result_parts.append("\n" * struct["trailing_newlines"])

    return "".join(result_parts)


def preserve_paragraph_structure(text: str, humanized: str, original_format: FormatMetadata) -> str:
    """
    Ensure humanized text maintains original paragraph structure.

    This is a safety function that tries to match paragraph counts
    even if the humanization process changed them.

    Args:
        text: Original text
        humanized: Humanized text
        original_format: Metadata about original formatting

    Returns:
        Humanized text with paragraph structure adjusted if needed
    """
    # Extract paragraphs from both
    orig_paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    humanized_paragraphs = [p.strip() for p in re.split(r"\n\s*\n", humanized) if p.strip()]

    # If paragraph counts match, we're good
    if len(orig_paragraphs) == len(humanized_paragraphs):
        # Just ensure we have double newlines between paragraphs
        return "\n\n".join(humanized_paragraphs)

    # If humanized has fewer paragraphs, try to split the merged ones
    if len(humanized_paragraphs) < len(orig_paragraphs):
        logger.info(
            f"Humanized text has fewer paragraphs ({len(humanized_paragraphs)}) "
            f"than original ({len(orig_paragraphs)}). Attempting to restore structure."
        )
        # This is tricky - LLM may have combined paragraphs
        # Best we can do is use the humanized as-is with proper spacing
        return "\n\n".join(humanized_paragraphs)

    # If humanized has more paragraphs, keep them (LLM added structure)
    logger.info(
        f"Humanized text has more paragraphs ({len(humanized_paragraphs)}) "
        f"than original ({len(orig_paragraphs)}). Keeping new structure."
    )
    return "\n\n".join(humanized_paragraphs)


def normalize_line_breaks(text: str) -> str:
    """
    Normalize line breaks while preserving intentional paragraph breaks.

    - Converts \r\n to \n
    - Preserves double+ newlines (paragraph breaks)
    - Removes trailing whitespace from lines

    Args:
        text: Text to normalize

    Returns:
        Text with normalized line breaks
    """
    # Convert Windows line endings
    text = text.replace("\r\n", "\n")
    text = text.replace("\r", "\n")

    # Remove trailing whitespace from each line but preserve blank lines
    lines = text.split("\n")
    lines = [line.rstrip() for line in lines]
    text = "\n".join(lines)

    # Normalize multiple newlines (keep at most 2 for paragraph separation)
    # But preserve intentional blank lines
    text = re.sub(r"\n{4,}", "\n\n\n", text)  # Max 3 newlines (2 blank lines)

    return text


def should_preserve_line_breaks(text: str) -> bool:
    """
    Determine if text has intentional line breaks that should be preserved.

    Returns True if text has:
    - Multiple paragraphs (double newlines)
    - List structures
    - Code-like formatting

    Args:
        text: Text to analyze

    Returns:
        True if line breaks should be preserved
    """
    # Check for paragraph breaks
    has_paragraph_breaks = "\n\n" in text or "\n \n" in text

    # Check for lists
    has_lists = bool(re.search(r"^\s*[-*•]\s", text, re.MULTILINE)) or bool(
        re.search(r"^\s*\d+[.)]\s", text, re.MULTILINE)
    )

    # Check for code-like indentation
    has_indentation = bool(re.search(r"^\s{4,}", text, re.MULTILINE))

    # Check for short lines (might be poetry or formatted text)
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    avg_line_length = sum(len(line) for line in lines) / len(lines) if lines else 0
    has_short_lines = avg_line_length < 40 and len(lines) > 3

    return has_paragraph_breaks or has_lists or has_indentation or has_short_lines
