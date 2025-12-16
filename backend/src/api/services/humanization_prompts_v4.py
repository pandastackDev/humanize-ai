"""
V4 Humanization Prompts - Optimized for Originality.AI

This module contains prompt functions optimized for Originality.AI detection.
Currently falls back to V2 prompts until V4 is fully implemented.
"""

try:
    from .humanization_prompts import get_reconstruction_prompt as _get_reconstruction_prompt
    from .humanization_prompts_v2 import (
        get_main_humanization_prompt as _get_v2_humanization_prompt,
    )
    from .humanization_prompts_v2 import (
        get_quick_fix_prompt as _get_v2_quick_fix_prompt,
    )

    _V2_AVAILABLE = True
except ImportError:
    _V2_AVAILABLE = False
    _get_v2_humanization_prompt = None  # type: ignore[assignment]
    _get_v2_quick_fix_prompt = None  # type: ignore[assignment]
    _get_reconstruction_prompt = None  # type: ignore[assignment]


def get_main_humanization_v4_prompt(
    tone: str | None = None,
    length_mode: str = "standard",
    readability_level: str | None = None,
) -> dict:
    """
    Get the main humanization prompt optimized for Originality.AI.

    Currently falls back to V2 prompts until V4 is fully implemented.

    Args:
        tone: Optional tone adjustment
        length_mode: Length adjustment mode
        readability_level: Optional readability level

    Returns:
        Prompt dictionary (currently V2 prompts)
    """
    if _V2_AVAILABLE and _get_v2_humanization_prompt is not None:
        return _get_v2_humanization_prompt(tone, length_mode, readability_level)
    # Fallback to basic structure if V2 not available
    return {
        "system": "You are an expert text editor who makes AI-written content sound naturally human.",
        "user_template": "Humanize this text while preserving meaning:\n\n{text}\n\nHumanized:",
    }


def get_quick_fix_v4_prompt() -> dict:
    """
    Get quick fix prompt for very short texts (V4, optimized for Originality.AI).

    Currently falls back to V2 prompts until V4 is fully implemented.

    Returns:
        Prompt dictionary (currently V2 prompts)
    """
    if _V2_AVAILABLE and _get_v2_quick_fix_prompt is not None:
        return _get_v2_quick_fix_prompt()
    # Fallback to basic structure if V2 not available
    return {
        "system": "You are humanizing short text by breaking AI patterns.",
        "user_template": "Humanize this text:\n\n{text}\n\nHumanized:",
    }


def get_reconstruction_v4_prompt() -> dict:
    """
    Get reconstruction phase prompt (V4, optimized for Originality.AI).

    Currently falls back to original reconstruction prompts until V4 is fully implemented.

    Returns:
        Prompt dictionary (currently original reconstruction prompts)
    """
    if _V2_AVAILABLE and _get_reconstruction_prompt is not None:
        return _get_reconstruction_prompt()
    # Fallback to basic structure if not available
    return {
        "system": "You are a real human writer - casual, natural, slightly imperfect.",
        "user_template": "Reconstruct this outline into natural human prose:\n\n{compressed_text}\n\nReconstructed:",
    }
