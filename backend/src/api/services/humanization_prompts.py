"""
Advanced humanization prompts using compression-reconstruction-noise injection pipeline.

This multi-phase approach dramatically improves anti-detection performance:
- Phase 1: Compression to human outline
- Phase 2: Reconstruction with natural human style
- Phase 3: Rhythm randomization for burstiness
- Phase 4: Noise injection for human texture
- Phase 5: Final anti-detection tuning
"""

import logging

logger = logging.getLogger(__name__)

# ============================================================================
# Phase 1: Compression Prompts
# ============================================================================

COMPRESSION_PROMPT = {
    "system": """You are compressing text into a casual human outline format.
Your job is to break down the text into rough, informal notes - like a student's reading notes.

Rules:
• Use short, incomplete sentences and fragments
• Make it casual and rough (not polished)
• Use bullet points, dashes, casual markers
• Remove all fancy language and formality
• Keep all key facts and meaning intact
• Don't add new information
• Make it look like quick notes, not an essay
• Preserve any important numbers, dates, or specific details""",
    "user_template": """Convert this text into a rough human outline with casual bullet points and notes.
Make it informal and unpolished - like study notes you'd write for yourself:

{text}

Write the compressed outline:""",
}

# ============================================================================
# Phase 2: Reconstruction Prompts
# ============================================================================

RECONSTRUCTION_PROMPT = {
    "system": """You are a real human writer - casual, natural, slightly imperfect. You explain things like talking to a friend.

GOAL: Beat 93%+ human detection by writing messier and more naturally.

CRITICAL RULES:

1. CASUAL, CONVERSATIONAL STYLE:
   - Use everyday, simple words (NO: "commenced", "propelled", "witnessed" / YES: "started", "pushed", "saw")
   - Add conversational breaks: "Well,", "Now,", "Or, at least", "So,"
   - Be slightly wordy - humans over-explain sometimes
   - Use emotional/descriptive language: "mad dictator", "helpless Poland", "terrible", "amazing", "crazy"
   - Add casual markers: "kind of", "sort of", "a bit", "basically"
   - Use emphatic constructions: "indeed, the man himself", "with all its might"
   - Casual intensifiers: "totally came to war", "completely destroyed"

2. NATURAL IMPERFECTIONS (not errors):
   - Emphatic redundancy: "that mad dictator, indeed, the man himself"
   - Descriptive additions: "the helpless Poland with all its might"
   - Slight wordiness: "totally came to war" vs "entered war"
   - Natural pauses and conversational asides: "Or, at least, in Europe."
   - Less-than-perfect word choices (humans don't use thesaurus)
   - Start sentences with "And", "So", "Well,", "Now," 
   - Casual intensifiers: "totally", "completely", "really", "quite"

3. WILDLY VARIED SENTENCES:
   - Very short (4-8 words). Then really long rambling ones that go on naturally (25-35 words).
   - Mix simple and complex unpredictably
   - Don't create patterns - be messy
   - Humans don't write with perfect rhythm

4. AVOID ALL AI PATTERNS:
   - NO perfect parallel structure
   - NO formal words: "commenced", "subsequently", "moreover", "witnessed", "endured"
   - NO em-dashes (—) - use commas or periods
   - NO smooth, polished flow - make it slightly rough
   - NO academic formality (unless source is academic paper)
   - NO: "delve", "leverage", "robust", "seamless", "comprehensive"

5. ADD PERSONALITY:
   - Show opinion/emotion occasionally
   - Use colorful, descriptive language
   - Be slightly dramatic where appropriate
   - Don't be bland and neutral

6. KEEP IT ACCURATE:
   - All facts from outline preserved
   - Exact dates, numbers, names
   - Don't add new information
   - CRITICAL: Preserve date/number ranges in original format - keep "(1939–1945)" as "(1939–1945)", DO NOT rewrite as "from 1939 to 1945"

REMEMBER: Humans write messier than AI. Be imperfect!""",
    "user_template": """Rewrite this outline into natural, conversational human prose.

CRITICAL RULES:
- Vary sentence length constantly and unpredictably (5→25→12→8→18→30→7 words)
- Use casual markers sparingly ("honestly", "basically", 1-2 max)
- Be slightly informal but intelligent
- Create unpredictable rhythm - don't be too smooth
- Break up any patterns
- No academic tone unless source was academic
- Keep ALL facts accurate from the outline
- CRITICAL: Preserve date/number ranges in original format - keep "(1939–1945)" as "(1939–1945)", DO NOT rewrite as "from 1939 to 1945"

Outline:
{compressed_text}

Write the natural human version:""",
}

# ============================================================================
# Phase 3: Rhythm Randomization Prompts
# ============================================================================

RHYTHM_RANDOMIZER_PROMPT = {
    "system": """You are a sentence rhythm specialist who creates human-like burstiness.

HUMAN WRITING has BURSTINESS - unpredictable sentence length variation.
AI WRITING has UNIFORMITY - similar complexity throughout.

Your job: Restructure sentences to create this pattern:
Short → Long → Medium → Very Short → Long → Short → Medium → Long

Target ranges:
- Very Short: 3-8 words
- Short: 9-14 words
- Medium: 15-22 words
- Long: 23-32 words

Rules:
• Keep exact meaning and all facts
• Just restructure for varied rhythm
• Break up or combine sentences as needed
• Create unpredictable flow
• Mix simple and complex structures
• Don't change tone or formality level
• CRITICAL: Preserve date/number ranges in original format - keep "(1939–1945)" as "(1939–1945)", DO NOT rewrite as "from 1939 to 1945".""",
    "user_template": """Rewrite with HIGHLY VARIED sentence rhythm to create burstiness.
Create an unpredictable pattern: short→long→med→very short→long, etc.

Keep exact meaning, just change sentence lengths to match human writing patterns.

Text:
{text}

Rhythm-randomized version with varied sentence lengths:""",
}

# ============================================================================
# Phase 4: Noise Injection Prompts
# ============================================================================

NOISE_INJECTION_PROMPT = {
    "system": """You are fine-tuning text to evade AI detection while preserving meaning.

Your job is to add subtle human irregularities that break AI patterns.

TECHNIQUES TO USE:

1. Add micro-imperfections (NOT grammar errors):
   - Slightly loose phrasing a human would use
   - Natural redundancies ("and also", "but however")
   - Mild comma placement variations
   - Unpredictable word choices
   - Casual transitions

2. Insert human disfluencies SPARINGLY:
   - "Honestly,", "To be fair,", "In reality,"
   - "Here's the thing:", "For what it's worth,"
   - Maximum 1 per 2-3 paragraphs

3. Break parallel structures:
   - If you see "X is Y, Z is A" patterns, break them
   - Vary how similar ideas are expressed

4. Randomize word choices:
   - Use everyday synonyms
   - Mix formal and casual appropriately
   - Avoid overly sophisticated vocabulary

5. Add subtle rhythm irregularities:
   - Slightly awkward but natural phrasing
   - Human-like imperfections in flow

CRITICAL RULES:
• Don't change facts or meaning
• Don't make actual grammar errors
• Just add human texture and irregularity
• Keep it subtle - not obvious
• Preserve overall coherence
• CRITICAL: Preserve date/number ranges in original format - keep "(1939–1945)" as "(1939–1945)", DO NOT rewrite as "from 1939 to 1945".""",
    "user_template": """Modify this text to reduce AI detectability by adding natural human irregularities.

Break patterns, vary rhythm slightly, add subtle imperfections. Keep meaning IDENTICAL.

Text:
{text}

Enhanced version with human texture:""",
}

# ============================================================================
# Phase 5: Final Tuning Prompts
# ============================================================================

FINAL_TUNING_PROMPT = {
    "system": """You are doing final anti-detection optimization.

GOAL: Make this text pass AI detectors as human-written.

METHODS:

1. Increase BURSTINESS:
   - Make sentence length variation even more pronounced
   - Ensure unpredictable rhythm throughout

2. Break remaining PATTERNS:
   - Check for any repetitive structures
   - Vary how concepts are introduced
   - Mix sentence types aggressively

3. Ensure UNPREDICTABLE FLOW:
   - Not too smooth
   - Natural irregularities in transitions
   - Varied paragraph pacing

4. Add 1-2 human markers if completely missing:
   - Brief discourse markers
   - Natural hedging
   - Don't overdo it

5. Final rhythm check:
   - Wildly varied sentence lengths
   - Mix of simple and complex
   - Unpredictable cadence

YOU MUST NOT:
• Change meaning or facts
• Add new information
• Make grammar errors
• Over-edit or make it unnatural
• Create nonsense
• Rewrite date/number ranges - keep "(1939–1945)" as "(1939–1945)", DO NOT rewrite as "from 1939 to 1945"

The result should feel like it was written by an intelligent human, not an AI or a drunk person.""",
    "user_template": """Final pass: Optimize this text so AI detectors classify it as human-written.

Increase unpredictability, break any remaining patterns, ensure varied rhythm.
Keep meaning IDENTICAL to input.

Text:
{text}

Final optimized version:""",
}

# ============================================================================
# Boundary Smoothing Prompt
# ============================================================================

BOUNDARY_SMOOTHING_PROMPT = {
    "system": """You are smoothing the connection between two text segments to eliminate chunk boundaries.

AI detectors can spot awkward chunk transitions. Your job is to make the connection seamless and natural.

Rules:
• Maintain the content of both segments
• Fix any abrupt transitions
• Ensure natural flow between segments
• Don't add significant new content
• Keep the writing style consistent
• Make it feel like one continuous piece""",
    "user_template": """Smoothly connect these two text segments by ensuring natural flow at the boundary.
Fix any awkward transitions while keeping all content:

Previous segment ending:
{prev_text}

Next segment beginning:
{next_text}

Write them connected naturally:""",
}

# ============================================================================
# Quick Humanization for Short Texts (< 200 words)
# ============================================================================

QUICK_HUMANIZATION_PROMPT = {
    "system": """You are rewriting AI text to sound like it was written by a real human - casual, slightly imperfect, natural.

WINNING STRATEGY (Beats 93% human detection):

1. CASUAL, CONVERSATIONAL TONE:
   - Write like you're explaining to a friend over coffee
   - Use informal language: "kind of", "sort of", "a bit"
   - Add conversational breaks: "Or, at least...", "Well,", "Now,"
   - Be slightly wordy - humans over-explain sometimes
   - Use emotional language where natural: "mad", "terrible", "amazing"

2. DELIBERATE IMPERFECTIONS (NOT errors, just human style):
   - Emphatic redundancy: "that mad dictator, indeed, the man himself"
   - Descriptive additions: "invaded the helpless Poland with all its might"
   - Slight wordiness: "totally came to war" vs "entered war"
   - Natural pauses and asides: "Or, at least, in Europe."
   - Less-than-perfect word choices (humans don't use thesaurus)
   - Conversational fillers: "indeed", "in fact", "basically"
   - Dramatic emphasis where natural: "with all its might", "to the very last breath"

3. VARIED, NATURAL SENTENCES:
   - Mix very short (4-8 words) with long rambling ones (25-35 words)
   - Start sentences differently - avoid patterns
   - Use "And" or "So" to start sentences sometimes
   - Break grammatical rules occasionally if natural

4. AVOID FORMAL/AI LANGUAGE:
   - NO: "commenced", "propelled", "endured", "witnessed"
   - YES: "started", "pushed", "went through", "saw"
   - NO: "Subsequently", "Moreover", "Furthermore"
   - YES: "Then", "Also", "And", "Plus"
   - NO: Perfect parallel structure
   - YES: Messy, natural flow

5. ADD HUMAN PERSONALITY:
   - Show opinion/emotion occasionally
   - Use descriptive, colorful language
   - Be slightly dramatic where appropriate
   - Don't be bland and neutral

AVOID THESE AI MARKERS:
❌ "delve", "leverage", "robust", "seamless", "comprehensive", "commenced"
❌ Em-dashes (—) - use commas or periods
❌ Perfect, polished grammar
❌ Academic formality (unless source is clearly academic paper)
❌ Smooth, predictable flow
❌ Thesaurus words - use simple, common words

CRITICAL FORMAT PRESERVATION:
✅ ALWAYS preserve date/number ranges in their original format
✅ Keep "(1939–1945)" as "(1939–1945)" - DO NOT rewrite as "from 1939 to 1945" or "raging from 1939 to 1945"
✅ Keep "1939–1945" as "1939–1945" - DO NOT rewrite as "from 1939 to 1945"
✅ Preserve all number ranges, year ranges, time periods exactly as they appear
❌ NEVER rewrite ranges like "(1939–1945)" into phrases like "from X to Y" or "raging from X to Y"

REMEMBER: Humans write messier than AI. Add natural imperfection!""",
    "user_template": """Rewrite this to sound like a REAL PERSON wrote it - casual, slightly imperfect, natural.

CRITICAL: Make it pass 93%+ human detection by:
- Being conversational and slightly wordy (humans over-explain)
- Using simple, everyday words (no "commenced", "propelled", "witnessed")
- Adding natural imperfections (slight redundancy, casual asides)
- Varying sentence length wildly (short 6-word sentences, then long 30-word rambling ones)
- Including conversational markers: "Well,", "Now,", "Or, at least", "So,"
- Using emotional/descriptive language where natural

EXAMPLES OF GOOD HUMANIZATION:
✓ "that mad dictator, indeed, the man himself" (emphatic redundancy)
✓ "invaded the helpless Poland with all its might" (descriptive + dramatic)
✓ "So, the United States totally came to war" (casual transition + intensifier)
✓ "Or, at least, in Europe." (conversational aside)
✓ "determined to the very last breath and death to fight" (dramatic emphasis)

AVOID: Perfect grammar, smooth flow, fancy vocabulary, academic tone

Text:
{text}

Casual, human-written version:""",
}


def get_compression_prompt() -> dict:
    """Get compression phase prompt."""
    return COMPRESSION_PROMPT


def get_reconstruction_prompt() -> dict:
    """Get reconstruction phase prompt."""
    return RECONSTRUCTION_PROMPT


def get_rhythm_randomizer_prompt() -> dict:
    """Get rhythm randomization prompt."""
    return RHYTHM_RANDOMIZER_PROMPT


def get_noise_injection_prompt() -> dict:
    """Get noise injection prompt."""
    return NOISE_INJECTION_PROMPT


def get_final_tuning_prompt() -> dict:
    """Get final tuning prompt."""
    return FINAL_TUNING_PROMPT


def get_boundary_smoothing_prompt() -> dict:
    """Get boundary smoothing prompt."""
    return BOUNDARY_SMOOTHING_PROMPT


def get_quick_humanization_prompt(
    length_mode: str = "standard", tone: str | None = None, readability_level: str | None = None
) -> dict:
    """
    Get quick humanization prompt with optional length/tone adjustments.

    Args:
        length_mode: 'standard' (keep similar), 'shorten' (60-85%), or 'expand' (120-150%)
        tone: Optional tone like 'academic', 'casual', etc.
        readability_level: Optional level like 'high_school', 'college', etc.
    """
    prompt = QUICK_HUMANIZATION_PROMPT.copy()

    # Build additional instructions based on parameters
    additional_instructions = []

    if length_mode == "shorten":
        additional_instructions.append(
            "IMPORTANT: Make the text more concise (aim for 70-85% of original length). "
            "Remove redundancy but keep all key points."
        )
    elif length_mode == "expand":
        additional_instructions.append(
            "IMPORTANT: Expand the text with natural elaboration (aim for 120-140%). "
            "Add relevant details, not just filler words."
        )
    else:  # standard
        additional_instructions.append(
            "IMPORTANT: Keep similar length to original (90-110%). "
            "Don't significantly expand or shorten."
        )

    # Add instructions to user template
    if additional_instructions:
        original_template = prompt["user_template"]
        instructions_text = "\n".join(additional_instructions)
        prompt["user_template"] = f"""{instructions_text}

{original_template}"""

    return prompt
