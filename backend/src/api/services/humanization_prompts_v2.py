"""
IMPROVED Humanization Prompts - Strategic Subtlety Approach

Based on competitive analysis showing that subtle, selective transformation
outperforms aggressive over-processing.

Key philosophy: Preserve what's already natural, fix what sounds robotic.
Target: 90%+ original score on Originality.ai
"""

import logging

logger = logging.getLogger(__name__)

# ============================================================================
# Strategic Single-Pass Humanization (MAIN METHOD)
# ============================================================================

STRATEGIC_HUMANIZATION_PROMPT = {
    "system": """You are an expert text editor who makes AI-written content sound naturally human.

CORE PHILOSOPHY: Less is more. Be strategic, not aggressive.

YOUR PROCESS:

Step 1 - ANALYZE:
• Identify sentences that already sound natural → KEEP THEM
• Spot robotic patterns (perfect parallelism, AI buzzwords) → FIX THOSE
• Check transitions and flow → SMOOTH ONLY IF AWKWARD

Step 2 - SELECTIVE TRANSFORMATION:
• Change ONLY what sounds artificial
• Preserve 40-60% of original structure
• Make modifications subtle and natural

TRANSFORMATION GUIDELINES:

1. SENTENCE VARIETY (Organic, Not Forced):
   - Let natural variety emerge from content
   - Mix lengths: occasionally short (8-12 words), sometimes medium (15-20), rarely long (25+)
   - Don't force every sentence to be different
   - Some consistency is natural

2. WORD CHOICE (Simple Replacements):
   - Replace obvious AI words:
     * "delve/delving" → "explore/exploring" or "look into"
     * "leverage" → "use" or "take advantage of"
     * "robust" → "strong" or "effective"
     * "seamless" → "smooth" or just remove
     * "comprehensive" → "complete" or "thorough"
     * "utilize" → "use"
   - Keep everyday language simple
   - Academic text can stay somewhat formal

3. STRUCTURAL ADJUSTMENTS (Minimal):
   - Break up overly perfect parallel structures
   - Vary how similar ideas are presented
   - Add natural transitions where missing  
   - Use active voice primarily (but passive is OK sometimes)

4. NATURAL IMPERFECTIONS (Subtle):
   - Occasional slightly long sentence is fine
   - Some wordiness is human
   - Not every transition needs to be perfect
   - Minor redundancy can be natural

5. TONE MATCHING:
   - Academic → maintain formality
   - Professional → keep polished
   - Casual → allow informality
   - Match original intent

STRICTLY AVOID:

❌ Wholesale rewriting - transform selectively
❌ Invisible Unicode or special characters
❌ Forced discourse markers ("honestly", "basically", "to be fair")
❌ Artificial rhythm patterns
❌ Over-transformation - preserve natural parts
❌ Contrived variety - let it emerge naturally
❌ Grammar errors or nonsense
❌ Adding information not in source

QUALITY STANDARDS:

✅ Meaning: 100% preserved
✅ Facts: All accurate
✅ Tone: Consistent with original
✅ Naturalness: Reads human, not robotic
✅ Detection: 90%+ human score target

Remember: The goal is authentic human writing, not obviously processed text.""",
    "user_template": """Analyze this text and make strategic edits to sound naturally human.

INSTRUCTIONS:
1. Keep sentences that already sound natural
2. Fix only the robotic or overly AI-like parts
3. Make changes subtle and context-appropriate
4. Preserve ALL facts and meaning exactly

{additional_context}

Text:
{text}

Humanized version:""",
}

# ============================================================================
# Contextual Variations
# ============================================================================


def get_strategic_humanization_prompt(
    tone: str | None = None,
    length_mode: str = "standard",
    readability_level: str | None = None,
) -> dict:
    """
    Get strategic humanization prompt with context-specific instructions.

    Args:
        tone: Writing tone (academic, professional, casual, friendly)
        length_mode: standard, shorten, or expand
        readability_level: high_school, college, university, expert

    Returns:
        Prompt dictionary with system and user_template
    """
    # Build additional context based on parameters
    context_parts = []

    # Tone adjustments
    if tone:
        tone_guidance = {
            "academic": "Maintain academic formality and precision. Keep technical terms.",
            "professional": "Keep professional tone. Be clear and authoritative.",
            "casual": "Allow informal language. Use contractions naturally.",
            "friendly": "Keep warm, approachable tone. Be conversational.",
            "persuasive": "Maintain persuasive elements. Keep rhetorical strength.",
            "informative": "Preserve clarity and directness. Keep explanatory style.",
        }
        if tone.lower() in tone_guidance:
            context_parts.append(f"Tone: {tone_guidance[tone.lower()]}")

    # Length adjustments
    if length_mode == "shorten":
        context_parts.append(
            "Length: Make slightly more concise (aim for 70-85% of original length). "
            "Remove redundancy but keep key points."
        )
    elif length_mode == "expand":
        context_parts.append(
            "Length: Add natural elaboration (aim for 120-140% of original). "
            "Expand with relevant details, not filler."
        )
    else:  # standard
        context_parts.append(
            "Length: Maintain similar length (90-110% of original). Preserve information density."
        )

    # Readability adjustments
    if readability_level:
        readability_guidance = {
            "high_school": "Use simpler vocabulary. Break complex ideas into clearer explanations.",
            "college": "Balance accessibility with sophistication. Standard academic level.",
            "university": "Can use advanced vocabulary. Maintain academic rigor.",
            "expert": "Technical precision is fine. Assume subject knowledge.",
        }
        if readability_level.lower() in readability_guidance:
            context_parts.append(f"Readability: {readability_guidance[readability_level.lower()]}")

    # Build final additional context
    additional_context = "\n".join(context_parts) if context_parts else "(No special requirements)"

    # Return prompt with context
    prompt = STRATEGIC_HUMANIZATION_PROMPT.copy()
    prompt["user_template"] = prompt["user_template"].replace(
        "{additional_context}", additional_context
    )

    return prompt


# ============================================================================
# Quick Humanization for Very Short Texts (<150 words)
# ============================================================================

QUICK_FIX_PROMPT = {
    "system": """You are quickly humanizing short text with minimal changes.

Focus on these quick fixes:
1. Replace obvious AI words (delve→explore, leverage→use, robust→strong)
2. Break any perfect parallel structures
3. Vary one or two sentence lengths if all identical
4. Ensure natural transitions
5. Keep everything else as-is

Be MINIMAL. Only fix what's obviously robotic.
Preserve 70%+ of original phrasing.""",
    "user_template": """Quick humanization - minimal changes only.

Fix obvious AI patterns, keep the rest natural.

Text:
{text}

Humanized:""",
}


# ============================================================================
# Boundary Smoothing (for chunked long texts)
# ============================================================================

BOUNDARY_SMOOTHING_PROMPT = {
    "system": """You smooth transitions between text chunks to eliminate awkward boundaries.

Rules:
• Keep all content from both segments
• Fix abrupt transitions naturally
• Don't add significant new information
• Maintain consistent style
• Make it feel like continuous writing""",
    "user_template": """Connect these segments naturally:

Previous ending:
{prev_text}

Next beginning:
{next_text}

Connected version:""",
}


# ============================================================================
# Helper Functions
# ============================================================================


def get_main_humanization_prompt(
    tone: str | None = None,
    length_mode: str = "standard",
    readability_level: str | None = None,
) -> dict:
    """
    Get the main humanization prompt with contextual adjustments.

    This is the primary method for humanizing text.
    """
    return get_strategic_humanization_prompt(tone, length_mode, readability_level)


def get_quick_fix_prompt() -> dict:
    """Get quick fix prompt for very short texts."""
    return QUICK_FIX_PROMPT


def get_boundary_smoothing_prompt() -> dict:
    """Get boundary smoothing prompt for chunk connections."""
    return BOUNDARY_SMOOTHING_PROMPT


# ============================================================================
# Detect AI Patterns (Helper)
# ============================================================================


def detect_ai_patterns(text: str) -> list[str]:
    """
    Identify common AI writing patterns in text.

    Returns list of detected issues to fix.
    """
    issues = []

    # Common AI words
    ai_words = [
        "delve",
        "delving",
        "leverage",
        "leveraging",
        "robust",
        "seamless",
        "seamlessly",
        "comprehensive",
        "utilize",
        "utilizing",
        "facilitate",
        "elucidate",
        "underscore",
        "paramount",
    ]

    text_lower = text.lower()
    for word in ai_words:
        if word in text_lower:
            issues.append(f"AI word detected: '{word}'")

    # Check for perfect parallel structure
    sentences = text.split(". ")
    if len(sentences) >= 3:
        lengths = [len(s.split()) for s in sentences]
        if len(set(lengths[:3])) == 1:  # First 3 sentences same length
            issues.append("Perfect parallel structure detected")

    # Check for repetitive starts
    starts = [s.split()[0] if s.split() else "" for s in sentences[:5]]
    if len(starts) != len(set(starts)):
        issues.append("Repetitive sentence starts detected")

    return issues
