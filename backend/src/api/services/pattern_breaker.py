"""
Pattern Breaking and Micro-Imperfection Module for Originality.AI Detection Evasion

This module implements specific techniques learned from analyzing 93% human-scored text:
1. Word repetition (humans repeat adjectives naturally)
2. Emphatic redundancy injection
3. Casual intensifier insertion
4. Conversational break addition
5. Emotional language enhancement
6. Simple word enforcement (replace AI vocabulary)
7. Sentence length verification
8. Pattern disruption

Based on ORIGINALITY_AI_FACTORS.md analysis.
"""

import logging
import random
import re
from typing import Any

logger = logging.getLogger(__name__)

# ============================================================================
# AI Vocabulary Blocklist (Must Replace)
# ============================================================================

AI_WORD_REPLACEMENTS = {
    # ========================================================================
    # TOP 100 FLAGGED AI WORDS & PHRASES (Comprehensive List)
    # ========================================================================
    # Core AI buzzwords (1-20)
    r"\bdelve into\b": "explore",
    r"\bdelving into\b": "exploring",
    r"\bat its core\b": "basically",
    r"\butilise\b": "use",
    r"\butilize\b": "use",
    r"\butilised\b": "used",
    r"\butilized\b": "used",
    r"\butilising\b": "using",
    r"\butilizing\b": "using",
    r"\buncover\b": "find",
    r"\buncovering\b": "finding",
    r"\bharness\b": "use",
    r"\bharnessing\b": "using",
    r"\bpivotal\b": "important",
    r"\bpivotal role\b": "important role",
    r"\bjourney toward\b": "path to",
    r"\bjourney towards\b": "path to",
    r"\belevate\b": "improve",
    r"\belevating\b": "improving",
    r"\bunleash\b": "release",
    # More AI buzzwords (21-50)
    r"\bunlock\b": "open",
    r"\bunlocking\b": "opening",
    r"\bprofound\b": "deep",
    r"\bwith respect to\b": "about",
    r"\bnavigate\b": "deal with",
    r"\bnavigating\b": "dealing with",
    r"\bsophisticated\b": "complex",
    r"\bmyriad\b": "many",
    r"\bendeavour\b": "try",
    r"\bendeavor\b": "try",
    r"\bendeavouring\b": "trying",
    r"\bendeavoring\b": "trying",
    r"\bembark on\b": "start",
    r"\bembarking on\b": "starting",
    r"\bembrace\b": "accept",
    r"\bembracing\b": "accepting",
    r"\binsightful\b": "smart",
    r"\binvaluable\b": "very useful",
    r"\brelentless\b": "constant",
    r"\bbreakthrough\b": "big step",
    r"\btransformative\b": "changing",
    r"\bsynergies\b": "connections",
    r"\bsynergy\b": "connection",
    r"\binterplay\b": "interaction",
    r"\btapestry\b": "mix",
    r"\brealm\b": "area",
    r"\bcomprehensive\b": "complete",
    r"\bholistic\b": "complete",
    r"\bintricacies\b": "details",
    r"\bintricate\b": "complex",
    # Optimization & process words (51-70)
    r"\boptimise\b": "improve",
    r"\boptimize\b": "improve",
    r"\boptimising\b": "improving",
    r"\boptimizing\b": "improving",
    r"\bseamless\b": "smooth",
    r"\bseamlessly\b": "smoothly",
    r"\brobust\b": "strong",
    r"\baccelerate\b": "speed up",
    r"\baccelerating\b": "speeding up",
    r"\badept at\b": "good at",
    r"\bat large\b": "overall",
    r"\baligns? with\b": "matches",
    r"\baligning with\b": "matching",
    r"\baligned with\b": "matched",
    r"\bemblematic\b": "typical",
    r"\bparadigm shift\b": "big change",
    r"\bgroundbreaking\b": "new",
    r"\bcutting-edge\b": "new",
    r"\btailored\b": "custom",
    r"\bbespoke\b": "custom",
    # Leverage & amplification words (71-100)
    r"\bleverage\b": "use",
    r"\bleveraging\b": "using",
    r"\bleveraged\b": "used",
    r"\bamplify\b": "increase",
    r"\bamplifying\b": "increasing",
    r"\bamplified\b": "increased",
    r"\bresonate\b": "connect",
    r"\bresonating\b": "connecting",
    r"\bresonated\b": "connected",
    r"\bmultifaceted\b": "many-sided",
    r"\bdiscern\b": "see",
    r"\bdiscerned\b": "saw",
    r"\bdiscernible\b": "clear",
    r"\bintegrate\b": "combine",
    r"\bintegrating\b": "combining",
    r"\bintegrated\b": "combined",
    r"\belucidate\b": "explain",
    r"\belucidating\b": "explaining",
    r"\belucidated\b": "explained",
    r"\bshed light on\b": "explain",
    r"\bshedding light on\b": "explaining",
    r"\bamong others\b": "",
    r"\bto put it simply\b": "simply put",
    r"\bnotable\b": "important",
    r"\bconsistently\b": "always",
    r"\bconsistency\b": "sameness",
    r"\bdemonstrate\b": "show",
    r"\bdemonstrates\b": "shows",
    r"\bdemonstrating\b": "showing",
    r"\bdemonstrated\b": "showed",
    r"\billustrate\b": "show",
    r"\billustrates\b": "shows",
    r"\billustrating\b": "showing",
    r"\billustrated\b": "showed",
    r"\bunderscore\b": "highlight",
    r"\bunderscores\b": "highlights",
    r"\bunderscoring\b": "highlighting",
    r"\bunderscored\b": "highlighted",
    r"\bparamount\b": "very important",
    r"\bunderpin\b": "support",
    r"\bunderpins\b": "supports",
    r"\bunderpinned\b": "supported",
    r"\bunderpinning\b": "supporting",
    # Growth & development words
    r"\bfoster\b": "help",
    r"\bfosters\b": "helps",
    r"\bfostering\b": "helping",
    r"\bfostered\b": "helped",
    r"\bascend\b": "rise",
    r"\bascending\b": "rising",
    r"\bascendancy\b": "rise",
    r"\btrajectory\b": "path",
    r"\bmagnify\b": "increase",
    r"\bmagnifies\b": "increases",
    r"\bmagnifying\b": "increasing",
    r"\bmagnified\b": "increased",
    r"\bcultivate\b": "develop",
    r"\bcultivates\b": "develops",
    r"\bcultivating\b": "developing",
    r"\bcultivated\b": "developed",
    r"\bderive from\b": "come from",
    r"\bderives from\b": "comes from",
    r"\bderiving from\b": "coming from",
    r"\bderived from\b": "came from",
    r"\bconducive to\b": "good for",
    r"\bcatalyse\b": "start",
    r"\bcatalyze\b": "start",
    r"\bcatalysing\b": "starting",
    r"\bcatalyzing\b": "starting",
    # Academic & formal words
    r"\bcriteria\b": "requirements",
    r"\bcriterion\b": "requirement",
    r"\bindicative of\b": "shows",
    r"\bvantage point\b": "viewpoint",
    r"\bamidst\b": "among",
    r"\bplethora of\b": "many",
    r"\bramification\b": "result",
    r"\bramifications\b": "results",
    r"\bjuxtapose\b": "compare",
    r"\bjuxtaposed\b": "compared",
    r"\bjuxtaposing\b": "comparing",
    r"\bencompass\b": "include",
    r"\bencompasses\b": "includes",
    r"\bencompassing\b": "including",
    r"\bencompassed\b": "included",
    r"\benvision\b": "imagine",
    r"\benvisioned\b": "imagined",
    r"\benvisioning\b": "imagining",
    # Transition & connector words
    r"\baccordingly\b": "so",
    r"\bnotwithstanding\b": "despite",
    r"\bubiquitous\b": "everywhere",
    r"\bmitigate\b": "reduce",
    r"\bmitigates\b": "reduces",
    r"\bmitigating\b": "reducing",
    r"\bmitigated\b": "reduced",
    r"\bexpedite\b": "speed up",
    r"\bexpedites\b": "speeds up",
    r"\bexpediting\b": "speeding up",
    r"\bexpedited\b": "sped up",
    r"\bsymptomatic of\b": "shows",
    r"\binherent\b": "built-in",
    r"\binherently\b": "naturally",
    r"\bsuccessive\b": "following",
    r"\bsuccessively\b": "one after another",
    r"\bper se\b": "",
    r"\balbeit\b": "though",
    r"\baforementioned\b": "mentioned above",
    r"\bconsequently\b": "so",
    r"\bthus far\b": "so far",
    r"\bthereby\b": "by doing this",
    r"\bin the realm of\b": "in",
    r"\bstate-of-the-art\b": "latest",
    r"\bgains? traction\b": "becomes popular",
    r"\bgaining traction\b": "becoming popular",
    r"\bimplicate\b": "suggest",
    r"\bimplicates\b": "suggests",
    r"\bimplicating\b": "suggesting",
    r"\bimplicated\b": "suggested",
    r"\bcognizant\b": "aware",
    r"\bcognizance\b": "awareness",
    r"\bmodus operandi\b": "method",
    r"\bparadigm\b": "model",
    # Formal verbs → Simple verbs
    r"\bcommenced\b": "started",
    r"\bcommencing\b": "starting",
    r"\bpropelled\b": "pushed",
    r"\bpropelling\b": "pushing",
    r"\bwitnessed\b": "saw",
    r"\bwitnessing\b": "seeing",
    r"\bendured\b": "went through",
    r"\benduring\b": "going through",
    r"\bfacilitated\b": "helped",
    r"\bfacilitating\b": "helping",
    # Overused transitions → Casual transitions
    r"\bSubsequently,?\b": lambda: random.choice(["Then", "Later", "Next"]),
    r"\bMoreover,?\b": lambda: random.choice(["Also,", "Plus,", "And"]),
    r"\bFurthermore,?\b": lambda: random.choice(["Also,", "And", "What's more,"]),
    r"\bNevertheless,?\b": lambda: random.choice(["But", "Still,", "Even so,"]),
    r"\bConsequently,?\b": lambda: random.choice(["So", "As a result,", "Because of this,"]),
    r"\bIt's important to note that\b": lambda: random.choice(["", "Note that", "Remember that"]),
    r"\bgenerally speaking\b": lambda: random.choice(["", "usually", "often"]),
    r"\badditionally\b": "also",
    r"\bas a result\b": "so",
    # Generic phrases → Simple alternatives
    r"\ba journey of\b": "a path of",
    r"\ba testament to\b": "proof of",
    r"\ba multitude of\b": "many",
    r"\bin today's fast-paced world\b": "today",
    r"\bIn this article\b": "",
    r"\bThis study\b": "This",
    r"\bIn conclusion\b": "Finally",
    r"\bKey takeaway\b": "Key point",
    r"\bNext steps include\b": "Next, we should",
    # Formal hedging phrases (CRITICAL - detected as AI patterns)
    r"\bIt is considered that\b": lambda: random.choice(["", "It seems like", "It looks like"]),
    r"\bit is considered that\b": lambda: random.choice(["", "it seems like", "it looks like"]),
    r"\bit is believed that\b": lambda: random.choice(["", "it seems like", "people think"]),
    r"\bIt is believed that\b": lambda: random.choice(["", "It seems like", "People think"]),
    r"\bit appears that\b": lambda: random.choice(["", "it seems like"]),
    r"\bIt appears that\b": lambda: random.choice(["", "It seems like"]),
    # Formal structured phrases
    r"\bpursued a program of\b": lambda: random.choice(["started", "used", "began"]),
    r"\bengaged in\b": "got into",
    r"\bcharacterized by\b": lambda: random.choice(["marked by", "known for", "full of"]),
    r"\bIn response,?\b": lambda: random.choice(["Then", "Later", "Next"]),
    r"\bin response to\b": lambda: random.choice(["after", "when", "because"]),
    # Passive voice formal patterns
    r"\bwas characterized by\b": "was marked by",
    r"\bwere characterized by\b": "were marked by",
    r"\bis characterized by\b": "is marked by",
    r"\bare characterized by\b": "are marked by",
    # Formal connectors
    r"\bIn order to\b": "To",
    r"\bin order to\b": "to",
    r"\bIn an effort to\b": "To",
    r"\bin an effort to\b": "to",
    # Sequence words (formulaic patterns)
    r"\bFirstly\b": "First",
    r"\bSecondly\b": "Second",
    r"\bThirdly\b": "Third",
    r"\bLastly\b": "Finally",
    r"\bFirst,?\s+second,?\s+third,?\s+finally\b": "First, then, then, finally",
    # Additional formal words
    r"\bsubsequently\b": lambda: random.choice(["then", "after that", "later"]),
    r"\bprior to\b": "before",
    r"\bwith regard to\b": "about",
    r"\bin regard to\b": "about",
    r"\bpalpable\b": "clear",
    r"\bsubstantial\b": "large",
    r"\bdynamic\b": "changing",
    r"\bbeacon\b": "sign",
    # Formulaic sentence starters (CRITICAL - detected as AI patterns)
    # Note: Complex variations handled in _break_sentence_level_patterns()
    # Simple ones handled here:
    r"\bAt its heart,\s*this\b": "",  # Remove entirely - too formulaic
    # Note: Complex patterns with groups are handled in _break_sentence_level_patterns()
}

# ============================================================================
# Casual Intensifiers (Human markers)
# ============================================================================

CASUAL_INTENSIFIERS = [
    "really",  # Preferred - less casual
    "quite",
    "very",
    "pretty",
    "actually",
    "basically",
    "completely",
    "absolutely",
    # Removed "totally" and "literally" - too casual, easily detected by AI detectors
]

# ============================================================================
# Conversational Breaks (Human discourse markers)
# ============================================================================

CONVERSATIONAL_BREAKS = [
    "Now,",  # Preferred - less casual
    "In fact,",  # Mid-sentence breaks only
    "To be fair,",  # Mid-sentence breaks only
    # Removed "Well," and "So," - too casual, detectors flag these immediately
    # Removed "Or, at least," - too formulaic
    # Removed "Honestly," - too casual
    # Removed "Here's the thing:" - too casual
    # Removed "For what it's worth," - too casual
]

# ============================================================================
# Emotional Descriptors (Add personality)
# ============================================================================

EMOTIONAL_ENHANCEMENTS = {
    # Neutral → Emotional (context-dependent, but SUBTLE - avoid overly casual patterns)
    "leader": [
        "ruthless dictator",
        "the man himself",
        "notorious leader",
    ],  # Removed "mad dictator" - too casual
    "country": [
        "vulnerable {country}",
        "the {country} itself",
    ],  # Removed "helpless {country}" - too dramatic
    "war": ["devastating war", "terrible conflict", "horrific war"],
    "battle": ["fierce battle", "bloody clash", "terrible fighting"],
    "victory": ["amazing victory", "stunning triumph"],
    "defeat": ["crushing defeat", "terrible loss"],
    "event": [
        "dramatic event",
        "tragic incident",
    ],  # Changed "shocking" to "tragic" - less sensational
}

# ============================================================================
# Emphatic Redundancy Templates
# ============================================================================

EMPHATIC_TEMPLATES = [
    "{noun}, indeed, the {noun} itself",
    "the {adjective} {noun} with all its {related_noun}",
    "{verb} to the very last {noun}",
    "{adjective}, very {adjective} {noun}",
]


# ============================================================================
# Main Pattern Breaker Class
# ============================================================================


class PatternBreaker:
    """Breaks AI patterns and injects controlled human imperfections."""

    def __init__(self):
        """Initialize pattern breaker."""
        pass

    def enhance_text(self, text: str, aggressiveness: float = 0.7) -> str:
        """
        Apply all pattern-breaking and enhancement techniques.

        Args:
            text: Input text to enhance
            aggressiveness: 0.0-1.0, how aggressively to modify (0.7 = balanced)

        Returns:
            Enhanced text with human imperfections
        """
        logger.info(f"Applying pattern breaking with aggressiveness={aggressiveness}")

        # Phase 1: Replace AI vocabulary (ALWAYS do this)
        text = self._enforce_simple_words(text)

        # Phase 1.5: Clean AI artifacts (markdown, special tokens, invisible chars)
        text = self._clean_ai_artifacts(text)

        # Phase 1.6: Fix word merging artifacts (e.g., "intensefierce" → "intense fierce")
        text = self._fix_word_merging(text)

        # Phase 2: Enforce word repetition (CRITICAL - breaks perfect synonym variation)
        if random.random() < aggressiveness * 0.8:
            text = self._enforce_word_repetition(text, aggressiveness)

        # Phase 3: Add casual intensifiers (probabilistic) - FURTHER REDUCED
        if random.random() < aggressiveness * 0.6:  # Further reduced probability
            text = self._add_casual_intensifiers(text, frequency=0.008)  # 0.8% of words (was 1%)

        # Phase 4: Add conversational breaks (probabilistic) - FURTHER REDUCED
        # Very low frequency to avoid creating patterns
        if random.random() < aggressiveness * 0.6:  # Lower probability
            text = self._add_conversational_breaks(
                text, frequency=0.12
            )  # 1 per 8-9 sentences (was 0.20)

        # Phase 5: Inject emphatic redundancy (selective)
        if random.random() < aggressiveness * 0.6:
            text = self._inject_emphatic_redundancy(text, frequency=0.15)  # 1 per 6-7 sentences

        # Phase 6: Check and fix repetitive patterns (e.g., "Well, ... totally..." pattern)
        text = self._break_repetitive_patterns(text)

        # Phase 6.5: Break sentence-level formulaic patterns (NEW - CRITICAL)
        text = self._break_sentence_level_patterns(text)

        # Phase 6.6: Break structural patterns (participial phrases, formulaic templates)
        text = self._break_structural_patterns(text)

        # Phase 6.7: Ensure punctuation variety
        text = self._ensure_punctuation_variety(text)

        # Phase 6.8: Ensure contractions are used
        text = self._ensure_contractions(text)

        # Phase 6.9: Convert passive to active voice (where appropriate)
        if random.random() < aggressiveness * 0.7:
            text = self._prefer_active_voice(text)

        # Phase 6.10: Add rhetorical questions (DISABLED - flagged by detectors)
        # DISABLED: Rhetorical questions are easily detected as AI patterns by Originality.ai
        # if random.random() < aggressiveness * 0.3:  # Very low probability
        #     text = self._add_rhetorical_questions(text, frequency=0.02)  # 2% of sentences

        # Phase 6.11: Add direct address ("you might notice")
        if random.random() < aggressiveness * 0.5:
            text = self._add_direct_address(text, frequency=0.03)  # 3% of sentences

        # Phase 6.12: Ensure paragraph readability
        text = self._ensure_paragraph_readability(text)

        # Phase 7: Verify sentence variety (ALWAYS check)
        if not self._has_sufficient_variety(text):
            logger.warning("Text lacks sentence variety - may be flagged as AI")

        return text

    def _enforce_simple_words(self, text: str) -> str:
        """
        Replace AI vocabulary with simple everyday words.

        This is the MOST IMPORTANT transformation - AI words are a dead giveaway.
        """
        logger.info("Enforcing simple word replacements")
        replacements_made = 0

        for pattern, replacement in AI_WORD_REPLACEMENTS.items():
            # Handle both string and callable replacements
            if callable(replacement):
                # Callable replacement (for randomized choices)
                matches = list(re.finditer(pattern, text, re.IGNORECASE))
                for match in reversed(matches):  # Reverse to maintain indices
                    new_word = replacement()
                    # Preserve original capitalization
                    if match.group(0)[0].isupper():
                        new_word = new_word.capitalize()
                    text = text[: match.start()] + new_word + text[match.end() :]
                    replacements_made += 1
            else:
                # String replacement
                matches = list(re.finditer(pattern, text, re.IGNORECASE))
                for match in matches:
                    # Preserve original capitalization
                    if match.group(0)[0].isupper():
                        new_word = replacement.capitalize()
                    else:
                        new_word = replacement
                    text = text[: match.start()] + new_word + text[match.end() :]
                    replacements_made += 1

        if replacements_made > 0:
            logger.info(
                f"Replaced {replacements_made} AI vocabulary words with simple alternatives"
            )

        return text

    def _add_casual_intensifiers(self, text: str, frequency: float = 0.015) -> str:
        """
        Add casual intensifiers like "really", "quite", "actually" before verbs/adjectives.
        NOTE: Does NOT use "totally" or "literally" - these are too casual and easily detected.

        Args:
            text: Input text
            frequency: Probability of adding intensifier (0.015 = 1.5% of eligible positions)

        Returns:
            Text with casual intensifiers added
        """
        # Preserve paragraph structure by processing paragraphs separately
        paragraphs = text.split("\n\n")
        result_paragraphs = []
        intensifiers_added = 0

        for paragraph in paragraphs:
            if not paragraph.strip():
                result_paragraphs.append(paragraph)
                continue

            # Split paragraph into sentences to avoid disrupting sentence starts
            sentences = re.split(r"([.!?]\s+)", paragraph)
            result_sentences = []

            for i, sentence in enumerate(sentences):
                if not sentence.strip() or sentence in [". ", "! ", "? "]:
                    result_sentences.append(sentence)
                    continue

                # Find eligible positions (before verbs and adjectives)
                # Look for patterns like "was [adjective]", "[subject] [verb]ed"
                patterns = [
                    (r"\b(was|were|is|are|been)\s+(\w+)", 1),  # was [adjective]
                    (r"\b(has|have|had)\s+(\w+)", 1),  # has [verb]
                    (r"\b([A-Z]\w*)\s+(went|came|got|made|took)\b", 1),  # Subject verb
                ]

                modified_sentence = sentence
                for pattern, group_idx in patterns:
                    if random.random() < frequency:
                        match = re.search(pattern, modified_sentence)
                        if match:
                            intensifier = random.choice(CASUAL_INTENSIFIERS)
                            pos = match.start(group_idx + 1)
                            modified_sentence = (
                                modified_sentence[:pos]
                                + intensifier
                                + " "
                                + modified_sentence[pos:]
                            )
                            intensifiers_added += 1
                            break  # Only add one per sentence max

                result_sentences.append(modified_sentence)

            result_paragraphs.append("".join(result_sentences))

        if intensifiers_added > 0:
            logger.info(f"Added {intensifiers_added} casual intensifiers")

        return "\n\n".join(result_paragraphs)

    def _enforce_word_repetition(self, text: str, aggressiveness: float = 0.6) -> str:
        """
        Force repetition of descriptive adjectives to avoid perfect synonym variation.

        Humans naturally repeat words 2-3 times; AI varies every synonym.
        This breaks the "perfection" pattern that detectors flag.

        Based on 93% human sample: "angry aggressive dictators", "leftover angry issues"

        Args:
            text: Input text
            aggressiveness: How aggressively to enforce repetition (0.6 = balanced)

        Returns:
            Text with enforced word repetition
        """
        # Preserve paragraph structure
        paragraphs = text.split("\n\n")
        result_paragraphs = []
        repetitions_added = 0

        for paragraph in paragraphs:
            if not paragraph.strip():
                result_paragraphs.append(paragraph)
                continue

            # Common descriptive adjectives that should repeat (not vary)
            descriptive_patterns = [
                (r"\b(aggressive|hostile|belligerent)\b", "aggressive"),
                (r"\b(terrible|horrible|devastating)\b", "terrible"),
                (r"\b(angry|hostile|furious)\b", "angry"),
                (r"\b(fierce|intense|brutal)\b", "fierce"),
            ]

            modified_paragraph = paragraph
            words_lower = paragraph.lower()

            # Find first occurrence of each pattern
            for pattern, replacement_word in descriptive_patterns:
                matches = list(re.finditer(pattern, words_lower))
                if len(matches) == 1 and random.random() < aggressiveness * 0.5:
                    # Only one occurrence - add repetition nearby
                    # Find the actual word (preserve case)
                    actual_match = re.search(pattern, modified_paragraph, re.IGNORECASE)
                    if actual_match:
                        # Add repetition: create pattern like "angry aggressive" or "angry issues"
                        # Find nearby adjective or noun to add before/after
                        pos = actual_match.end()
                        # Look for next adjective or noun within 30 chars
                        next_word_match = re.search(r"\s+(\w+)", modified_paragraph[pos : pos + 30])
                        if next_word_match and random.random() < 0.5:
                            # Add before next word (e.g., "angry aggressive dictators")
                            insert_pos = pos + next_word_match.start()
                            # Preserve capitalization of replacement
                            insert_word = (
                                replacement_word
                                if not actual_match.group(0)[0].isupper()
                                else replacement_word.capitalize()
                            )
                            modified_paragraph = (
                                modified_paragraph[:insert_pos]
                                + insert_word
                                + " "
                                + modified_paragraph[insert_pos:]
                            )
                            repetitions_added += 1
                            break  # One per paragraph

            result_paragraphs.append(modified_paragraph)

        if repetitions_added > 0:
            logger.info(
                f"Enforced {repetitions_added} word repetitions (natural variation avoidance)"
            )

        return "\n\n".join(result_paragraphs)

    def _add_conversational_breaks(self, text: str, frequency: float = 0.20) -> str:
        """
        Add conversational breaks at sentence boundaries.

        CRITICAL: Avoid creating patterns! Don't start every paragraph with same break.

        Args:
            text: Input text
            frequency: Probability per sentence (0.20 = 1 in 5 sentences)

        Returns:
            Text with conversational breaks added
        """
        # Preserve paragraph structure by processing paragraphs separately
        paragraphs = text.split("\n\n")
        result_paragraphs = []
        breaks_added = 0
        last_break_used = None  # Track to avoid repetition

        for paragraph in paragraphs:
            if not paragraph.strip():
                result_paragraphs.append(paragraph)
                continue

            sentences = re.split(r"(?<=[.!?])\s+", paragraph)
            result = []

            # Check if first sentence already starts with a conversational break
            first_sentence_lower = sentences[0].lower() if sentences else ""
            starts_with_break = any(
                first_sentence_lower.startswith(marker.lower().rstrip(","))
                for marker in CONVERSATIONAL_BREAKS
            )

            for i, sentence in enumerate(sentences):
                # CRITICAL: Don't add to first sentence of paragraph at all (rare exception)
                # Don't add if too short or already has break
                sentence_lower = sentence.lower()
                has_break = any(
                    sentence_lower.startswith(marker.lower().rstrip(","))
                    for marker in CONVERSATIONAL_BREAKS
                )

                # Skip if: first sentence of paragraph (almost never add), too short, or already has break
                # Only add to first sentence in very rare cases (5% chance)
                is_first_sentence = i == 0
                if (
                    (is_first_sentence and (starts_with_break or random.random() > 0.05))
                    or len(sentence.split()) < 8
                    or has_break
                ):
                    result.append(sentence)
                    continue

                # Only add with probability, and avoid repeating same break
                if random.random() < frequency:
                    # Pick a different break than last one (if available)
                    available_breaks = [b for b in CONVERSATIONAL_BREAKS if b != last_break_used]
                    if not available_breaks:
                        available_breaks = CONVERSATIONAL_BREAKS

                    break_marker = random.choice(available_breaks)

                    # Additional check: don't add if previous sentence also has a break (too many!)
                    if i > 0:
                        prev_sentence = result[-1] if result else ""
                        prev_has_break = any(
                            prev_sentence.lower().startswith(marker.lower().rstrip(","))
                            for marker in CONVERSATIONAL_BREAKS
                        )
                        if prev_has_break:
                            result.append(sentence)  # Skip to avoid too many breaks
                            continue

                    sentence = break_marker + " " + sentence
                    breaks_added += 1
                    last_break_used = break_marker

                result.append(sentence)

            result_paragraphs.append(" ".join(result))

        if breaks_added > 0:
            logger.info(f"Added {breaks_added} conversational breaks")

        return "\n\n".join(result_paragraphs)

    def _inject_emphatic_redundancy(self, text: str, frequency: float = 0.15) -> str:
        """
        Inject emphatic redundancy patterns like "indeed, the X itself".

        Args:
            text: Input text
            frequency: Probability per sentence (0.15 = 1 in 6-7 sentences)

        Returns:
            Text with emphatic redundancy injected
        """
        # Preserve paragraph structure by processing paragraphs separately
        paragraphs = text.split("\n\n")
        result_paragraphs = []
        injections_made = 0

        for paragraph in paragraphs:
            if not paragraph.strip():
                result_paragraphs.append(paragraph)
                continue

            # Look for noun phrases we can emphasize
            # Pattern: "the [adjective] [noun]" → "the [adjective] [noun], indeed, the [noun] itself"
            sentences = re.split(r"(?<=[.!?])\s+", paragraph)
            result = []

            for sentence in sentences:
                if random.random() < frequency and len(sentence.split()) > 10:
                    # Look for pattern: "the [adjective] [noun]"
                    match = re.search(r"\bthe\s+(\w+)\s+([A-Z]\w+)\b", sentence)
                    if match and injections_made < 2:  # Limit to 2 per text max
                        noun = match.group(2)

                        # Add emphatic redundancy after the noun
                        original = match.group(0)
                        emphatic = f"{original}, indeed, the {noun} itself,"
                        sentence = sentence.replace(original, emphatic, 1)
                        injections_made += 1

                result.append(sentence)

            result_paragraphs.append(" ".join(result))

        if injections_made > 0:
            logger.info(f"Injected {injections_made} emphatic redundancies")

        return "\n\n".join(result_paragraphs)

    def _clean_ai_artifacts(self, text: str) -> str:
        """
        Remove AI-specific artifacts: markdown, special tokens, invisible chars, etc.

        Cleans:
        - Markdown code fences, headings, bullets
        - Special training tokens (system markers, instruction tags)
        - Fancy quotes/dashes (normalize to simple ASCII)
        - Invisible whitespace characters
        - Overly clean punctuation patterns

        Args:
            text: Input text

        Returns:
            Text with AI artifacts removed/normalized
        """
        artifacts_removed = 0

        # 1. Remove common special tokens / scaffolding markers
        special_angle_tokens = [
            "<s>",
            "</s>",
            "<unk>",
            "<pad>",
            "<|start_of_text|>",
            "<|end_of_text|>",
            "<|im_start|>",
            "<|im_end|>",
        ]
        for tok in special_angle_tokens:
            if tok in text:
                text = text.replace(tok, "")
                artifacts_removed += 1

        # [INST], [/INST], [SYSTEM], etc.
        if re.search(r"\[(INST|/INST|SYSTEM|ASSISTANT|USER|assistant|user|system)\]", text):
            matches = len(
                re.findall(r"\[(INST|/INST|SYSTEM|ASSISTANT|USER|assistant|user|system)\]", text)
            )
            text = re.sub(
                r"\[(INST|/INST|SYSTEM|ASSISTANT|USER|assistant|user|system)\]\s*",
                "",
                text,
            )
            artifacts_removed += matches

        # Role markers at line start: "SYSTEM:", "ASSISTANT:", "USER:"
        if re.search(r"^(SYSTEM|ASSISTANT|USER|System|Assistant|User)\s*:\s*", text, re.MULTILINE):
            matches = len(
                re.findall(
                    r"^(SYSTEM|ASSISTANT|USER|System|Assistant|User)\s*:\s*", text, re.MULTILINE
                )
            )
            text = re.sub(
                r"^(SYSTEM|ASSISTANT|USER|System|Assistant|User)\s*:\s*",
                "",
                text,
                flags=re.MULTILINE,
            )
            artifacts_removed += matches

        # Remove instruction/response markers
        instruction_markers = [
            r"###\s*Instruction\s*:",
            r"###\s*Response\s*:",
            r"###\s*Answer\s*:",
            r"\[BEGIN OUTPUT\]",
            r"\[END OUTPUT\]",
            r"</analysis>",
            r"</final>",
        ]
        for marker in instruction_markers:
            if re.search(marker, text, re.IGNORECASE):
                matches = len(re.findall(marker, text, re.IGNORECASE))
                text = re.sub(marker, "", text, flags=re.IGNORECASE)
                artifacts_removed += matches

        # 2. Strip Markdown code fences but keep the content
        if re.search(r"```[a-zA-Z0-9_+-]*\n.*?```", text, re.DOTALL):
            matches = len(re.findall(r"```[a-zA-Z0-9_+-]*\n.*?```", text, re.DOTALL))
            text = re.sub(
                r"```[a-zA-Z0-9_+-]*\n(.*?)```",
                r"\1",
                text,
                flags=re.DOTALL,
            )
            artifacts_removed += matches

        # Lone ``` on separate lines
        if re.search(r"^```$", text, re.MULTILINE):
            matches = len(re.findall(r"^```$", text, re.MULTILINE))
            text = re.sub(r"^```$", "", text, flags=re.MULTILINE)
            artifacts_removed += matches

        # 3. Strip Markdown headings, keep the text
        if re.search(r"^#{1,6}\s+", text, re.MULTILINE):
            matches = len(re.findall(r"^#{1,6}\s+", text, re.MULTILINE))
            text = re.sub(r"^#{1,6}\s+", "", text, flags=re.MULTILINE)
            artifacts_removed += matches

        # 4. Convert Markdown bullets to simple bullets (preserve content)
        if re.search(r"^[ \t]*[-*]\s+", text, re.MULTILINE):
            matches = len(re.findall(r"^[ \t]*[-*]\s+", text, re.MULTILINE))

            def _convert_bullet(match: re.Match) -> str:
                content = match.group(1)
                return f"• {content}"

            text = re.sub(
                r"^[ \t]*[-*]\s+(.*)$",
                _convert_bullet,
                text,
                flags=re.MULTILINE,
            )
            artifacts_removed += matches

        # Remove horizontal-rule lines like '---' or '***'
        if re.search(r"^[ \t]*([-*]){3,}[ \t]*$", text, re.MULTILINE):
            matches = len(re.findall(r"^[ \t]*([-*]){3,}[ \t]*$", text, re.MULTILINE))
            text = re.sub(
                r"^[ \t]*([-*]){3,}[ \t]*$",
                "",
                text,
                flags=re.MULTILINE,
            )
            artifacts_removed += matches

        # 5. Normalize quotes, dashes, arrows, ellipsis to simple ASCII
        # Separate single-character mappings (for translate) from multi-character replacements
        # IMPORTANT: str.maketrans() requires BOTH keys AND values to be single characters

        # Preserve en-dashes in ranges (e.g., 1939–1945, (1939–1945))
        # Use a placeholder to protect range en-dashes before translation
        en_dash_placeholder_prefix = "\ue000"  # Private Use Area character as prefix
        en_dash_placeholder_suffix = "\ue001"  # Private Use Area character as suffix

        # Store protected ranges with their placeholders
        protected_ranges = {}
        range_counter = 0

        # Pattern to match ranges: (1939–1945) or 1939–1945
        def protect_range(match):
            nonlocal range_counter
            full_match = match.group(0)
            # Create unique placeholder
            placeholder = (
                f"{en_dash_placeholder_prefix}RANGE{range_counter}{en_dash_placeholder_suffix}"
            )
            protected_ranges[placeholder] = full_match
            range_counter += 1
            return placeholder

        # Match ranges: either (1939–1945) with parentheses or 1939–1945 without
        # Pattern 1: Numbers in parentheses with en-dash
        text = re.sub(r"\((\d+)\u2013(\d+)\)", protect_range, text)
        # Pattern 2: Numbers with en-dash (not in parentheses, to avoid double-matching)
        # Use word boundary to ensure we're matching standalone number ranges
        text = re.sub(r"(?<!\()(\d+)\u2013(\d+)(?!\))", protect_range, text)

        single_char_map = {}
        # Quotes (single char -> single char)
        single_char_map["\u201c"] = '"'  # LEFT DOUBLE QUOTATION MARK
        single_char_map["\u201d"] = '"'  # RIGHT DOUBLE QUOTATION MARK
        single_char_map["\u201e"] = '"'  # DOUBLE LOW-9 QUOTATION MARK
        single_char_map["\u00ab"] = '"'  # LEFT-POINTING DOUBLE ANGLE QUOTATION MARK
        single_char_map["\u00bb"] = '"'  # RIGHT-POINTING DOUBLE ANGLE QUOTATION MARK
        single_char_map["\u2018"] = "'"  # LEFT SINGLE QUOTATION MARK
        single_char_map["\u2019"] = "'"  # RIGHT SINGLE QUOTATION MARK
        single_char_map["\u201a"] = "'"  # SINGLE LOW-9 QUOTATION MARK
        # Dashes (single char -> single char)
        # Note: En-dash (\u2013) is NOT in the map - we'll handle it separately after restoring ranges
        single_char_map["\u2014"] = "-"  # EM DASH
        single_char_map["\u2212"] = "-"  # MINUS SIGN

        # Validate all mappings are single character before using maketrans
        try:
            for k, v in single_char_map.items():
                if len(k) != 1:
                    raise ValueError(f"Key {repr(k)} is not a single character (length={len(k)})")
                if len(v) != 1:
                    raise ValueError(f"Value {repr(v)} is not a single character (length={len(v)})")

            # Apply single-character translations
            if single_char_map:
                text = text.translate(str.maketrans(single_char_map))
        except (ValueError, TypeError) as e:
            logger.error(f"Error in character translation: {e}. Skipping translation step.")

        # Convert remaining en-dashes (not in ranges) to regular hyphens
        text = text.replace("\u2013", "-")

        # Restore protected ranges with their original en-dashes
        for placeholder, original_range in protected_ranges.items():
            text = text.replace(placeholder, original_range)

        # Handle multi-character replacements separately (cannot use maketrans)
        multi_char_replacements = {
            "\u2026": "...",  # HORIZONTAL ELLIPSIS -> "..."
            "\u2192": "->",  # RIGHTWARDS ARROW -> "->"
            "\u2190": "<-",  # LEFTWARDS ARROW -> "<-"
            "\u21d2": "=>",  # RIGHTWARDS DOUBLE ARROW -> "=>"
            "\u21d0": "<=",  # LEFTWARDS DOUBLE ARROW -> "<="
        }
        for old_char, new_str in multi_char_replacements.items():
            text = text.replace(old_char, new_str)

        # 6. Remove zero-width and odd whitespace, normalize spaces
        # Comprehensive list of invisible Unicode characters
        invisible_chars = [
            "\u200b",  # zero width space
            "\u200c",  # zero width non-joiner
            "\u200d",  # zero width joiner
            "\ufeff",  # BOM
            "\u200e",  # left-to-right mark
            "\u200f",  # right-to-left mark
            "\u202a",  # left-to-right embedding
            "\u202b",  # right-to-left embedding
            "\u202c",  # pop directional formatting
            "\u202d",  # left-to-right override
            "\u202e",  # right-to-left override
            "\u2060",  # word joiner
            "\u2061",  # function application
            "\u2062",  # invisible times
            "\u2063",  # invisible separator
            "\u2064",  # invisible plus
            "\u2066",  # left-to-right isolate
            "\u2067",  # right-to-left isolate
            "\u2068",  # first strong isolate
            "\u2069",  # pop directional isolate
            "\u206a",  # inhibit symmetric swapping
            "\u206b",  # activate symmetric swapping
            "\u206c",  # inhibit arabic form shaping
            "\u206d",  # activate arabic form shaping
            "\u206e",  # national digit shapes
            "\u206f",  # nominal digit shapes
        ]
        for ch in invisible_chars:
            if ch in text:
                text = text.replace(ch, "")
                artifacts_removed += 1

        # Convert NBSP to normal space
        if "\u00a0" in text:
            text = text.replace("\u00a0", " ")

        # Collapse runs of spaces/tabs (but not newlines)
        if re.search(r"[ \t]{2,}", text):
            text = re.sub(r"[ \t]{2,}", " ", text)

        # Strip trailing spaces on each line
        text = re.sub(r"[ \t]+$", "", text, flags=re.MULTILINE)

        # Remove leading/trailing blank lines
        text = text.strip("\n ")

        # Collapse multiple blank lines to at most two
        if re.search(r"\n{3,}", text):
            text = re.sub(r"\n{3,}", "\n\n", text)

        # 7. Remove pipe tables (markdown tables)
        if re.search(r"\|.*\|", text):
            # Remove table rows (lines with pipes)
            lines = text.split("\n")
            cleaned_lines = []
            for line in lines:
                if re.match(r"^\s*\|.*\|\s*$", line) and re.search(r"\|", line, re.IGNORECASE):
                    # Skip table rows (but keep if it's not a full table row)
                    if line.count("|") >= 2:
                        artifacts_removed += 1
                        continue
                cleaned_lines.append(line)
            text = "\n".join(cleaned_lines)

        if artifacts_removed > 0:
            logger.info(
                f"Removed {artifacts_removed} AI artifacts (markdown, tokens, invisible chars)"
            )

        return text

    def _fix_word_merging(self, text: str) -> str:
        """
        Fix word merging artifacts like "intensefierce" → "intense fierce".

        These can occur during processing and look like errors.

        Args:
            text: Input text

        Returns:
            Text with merged words separated
        """
        # Common word merging patterns (detect compound words that should be separate)
        merged_patterns = [
            (r"\bintensefierce\b", "intense fierce"),
            (r"\bveryfierce\b", "very fierce"),
            (r"\breallyaggressive\b", "really aggressive"),
            # Add more as detected
        ]

        fixed_text = text
        fixes_made = 0

        for pattern, replacement in merged_patterns:
            matches = list(re.finditer(pattern, fixed_text, re.IGNORECASE))
            for match in matches:
                fixed_text = fixed_text[: match.start()] + replacement + fixed_text[match.end() :]
                fixes_made += 1

        if fixes_made > 0:
            logger.info(f"Fixed {fixes_made} word merging artifacts")

        return fixed_text

    def _break_repetitive_patterns(self, text: str) -> str:
        """
        Detect and break repetitive patterns that create new AI-like patterns.

        Example: "Well, ... totally..." repeated too many times becomes a pattern.

        Args:
            text: Input text

        Returns:
            Text with repetitive patterns broken
        """
        # Check for excessive "Well," at paragraph starts
        paragraphs = text.split("\n\n")
        result_paragraphs = []
        pattern_breaks = 0

        well_count = 0
        for paragraph in paragraphs:
            if not paragraph.strip():
                result_paragraphs.append(paragraph)
                continue

            modified_paragraph = paragraph

            # Check if starts with "Well,"
            if paragraph.strip().startswith("Well,"):
                well_count += 1
                # If too many consecutive "Well," starts, replace some
                if well_count > 2:  # More than 2 consecutive
                    # Replace with different break or remove
                    if random.random() < 0.5:
                        # Remove "Well," from this paragraph
                        modified_paragraph = paragraph.replace("Well,", "", 1).strip()
                        # Re-add first word with proper capitalization if needed
                        if modified_paragraph and modified_paragraph[0].islower():
                            modified_paragraph = (
                                modified_paragraph[0].upper() + modified_paragraph[1:]
                            )
                        pattern_breaks += 1
                        well_count = 0  # Reset after fixing
                    elif len(CONVERSATIONAL_BREAKS) > 1:
                        # Replace with different break
                        other_breaks = [
                            b for b in CONVERSATIONAL_BREAKS if not b.startswith("Well")
                        ]
                        if other_breaks:
                            modified_paragraph = paragraph.replace(
                                "Well,", random.choice(other_breaks), 1
                            )
                            pattern_breaks += 1
                            well_count = 0  # Reset counter
                # else: First or second "Well," is OK - keep as is
            else:
                # Different start - reset counter
                well_count = 0

            result_paragraphs.append(modified_paragraph)

        # Also check for "totally" and "literally" overuse - REMOVE ALL instances
        text_result = "\n\n".join(result_paragraphs)

        # Remove ALL instances of "literally" - it's too casual and easily detected
        literally_count = len(list(re.finditer(r"\bliterally\b", text_result, re.IGNORECASE)))
        if literally_count > 0:
            # Remove all instances of "literally"
            text_result = re.sub(r"\s*\bliterally\s+", " ", text_result, flags=re.IGNORECASE)
            text_result = re.sub(r"\s+\bliterally\b", "", text_result, flags=re.IGNORECASE)
            # Clean up any double spaces created
            text_result = re.sub(r"  +", " ", text_result)
            pattern_breaks += literally_count

        # Remove ALL instances of "totally" - it's too casual and easily detected
        totally_matches = list(re.finditer(r"\btotally\b", text_result, re.IGNORECASE))
        if totally_matches:
            # Remove all instances of "totally"
            text_result = re.sub(r"\s*\btotally\s+", " ", text_result, flags=re.IGNORECASE)
            text_result = re.sub(r"\s+\btotally\b", "", text_result, flags=re.IGNORECASE)
            # Clean up any double spaces created
            text_result = re.sub(r"  +", " ", text_result)
            pattern_breaks += len(totally_matches)

        if pattern_breaks > 0:
            logger.info(f"Broke {pattern_breaks} repetitive patterns")

        return text_result

    def _break_sentence_level_patterns(self, text: str) -> str:
        """
        Break sentence-level formulaic patterns that Originality.AI detects.

        Detects patterns like:
        - "It started in [location]" → Vary structure
        - "At its heart, this" → Remove or vary
        - "This [adj] move dragged" → Restructure
        - "Then, on [date]" → Vary transition
        - "So, [topic] was totally [verb]" → Break formulaic pattern

        Args:
            text: Input text

        Returns:
            Text with sentence-level patterns broken
        """
        # Preserve paragraph structure
        paragraphs = text.split("\n\n")
        result_paragraphs = []
        patterns_broken = 0

        for paragraph in paragraphs:
            if not paragraph.strip():
                result_paragraphs.append(paragraph)
                continue

            # Split into sentences
            sentences = re.split(r"(?<=[.!?])\s+", paragraph)
            modified_sentences = []

            for sentence in sentences:
                if not sentence.strip():
                    modified_sentences.append(sentence)
                    continue

                original_sentence = sentence
                modified = sentence

                # Pattern 1: "It started in [location]"
                if re.search(r"\bIt started in\b", modified):
                    # Vary the structure - AVOID "That's where it all started" (formulaic!)
                    match = re.search(r"\bIt started in\s+([A-Z]\w+)", modified)
                    if match:
                        location = match.group(1)
                        variations = [
                            f"{location} was where it started",
                            f"The war began in {location}",
                            f"In {location} is where it began",
                            f"{location} was the starting point",
                            f"The conflict originated in {location}",
                        ]
                        replacement = random.choice(variations)
                        modified = modified.replace(match.group(0), replacement, 1)
                        patterns_broken += 1

                # Pattern 1b: "[Location]. That's where it all started" - REMOVE this formulaic pattern
                match = re.search(r"([A-Z]\w+)\.\s*That's where it all started", modified)
                if match:
                    location = match.group(1)
                    variations = [
                        f"{location} was where it began",
                        f"{location} was the starting point",
                        f"The war began in {location}",
                        f"{location} was where the conflict started",
                    ]
                    replacement = random.choice(variations)
                    modified = modified.replace(match.group(0), replacement, 1)
                    patterns_broken += 1

                # Pattern 2: "At its heart, this"
                if re.search(r"\bAt its heart,\s*this\b", modified):
                    # Remove entirely or replace with simpler phrase
                    if random.random() < 0.7:
                        # Remove (70% chance)
                        modified = re.sub(r"\bAt its heart,\s*this\b", "This", modified)
                    else:
                        # Replace with simpler phrase
                        modified = re.sub(
                            r"\bAt its heart,\s*this\b", "Essentially, this", modified
                        )
                    patterns_broken += 1

                # Pattern 3: "This [adj] move dragged/led/brought/pulled"
                match = re.search(
                    r"\bThis (\w+) (move|action|event|step) (dragged|led|brought|pulled|took|sent)\b",
                    modified,
                )
                if match:
                    adj = match.group(1)
                    noun = match.group(2)
                    verb = match.group(3)
                    # Restructure to avoid formulaic pattern
                    variations = [
                        f"That {adj} {noun} {verb}",
                        f"The {adj} {noun} {verb}",
                        f"This {noun} {verb}",  # Remove adjective sometimes
                        f"{adj.capitalize()} {noun}, this {noun} {verb}",  # Different structure
                    ]
                    replacement = random.choice(variations)
                    modified = modified.replace(match.group(0), replacement, 1)
                    patterns_broken += 1

                # Pattern 3b: "This bold move/attack dragged/opened" - REMOVE "bold" entirely
                match = re.search(r"\bThis bold (move|attack|action)\s+(\w+)\s+", modified)
                if match:
                    noun = match.group(1)
                    verb = match.group(2)
                    # Remove "bold" entirely - it's a formulaic pattern
                    variations = [
                        f"This {noun} {verb}",
                        f"That {noun} {verb}",
                        f"The {noun} {verb}",
                        f"This {noun} helped {verb}",
                    ]
                    replacement = random.choice(variations)
                    modified = modified.replace(match.group(0), replacement + " ", 1)
                    patterns_broken += 1

                # Pattern 3c: "This bold attack dragged" - specific pattern
                if re.search(r"\bThis bold attack dragged\b", modified):
                    variations = [
                        "That attack led",
                        "This attack brought",
                        "The attack resulted in",
                        "This action led",
                    ]
                    replacement = random.choice(variations)
                    modified = re.sub(r"\bThis bold attack dragged\b", replacement, modified, 1)
                    patterns_broken += 1

                # Pattern 3d: "This bold move opened up" - specific pattern
                if re.search(r"\bThis bold move opened up\b", modified):
                    variations = [
                        "This action created",
                        "That move established",
                        "This led to",
                        "The action opened",
                    ]
                    replacement = random.choice(variations)
                    modified = re.sub(r"\bThis bold move opened up\b", replacement, modified, 1)
                    patterns_broken += 1

                # Pattern 4: "Then, on [date]" or "Then on [date]" - MORE AGGRESSIVE
                match = re.search(r"\bThen,?\s+on\s+([A-Z][^.]{0,50})", modified)
                if match:
                    date_part = match.group(1)
                    # Vary transition or remove it (prefer removal)
                    if random.random() < 0.7:  # 70% remove "Then"
                        variations = [
                            f"On {date_part}",  # Remove "Then"
                            f"{date_part}",  # No transition
                        ]
                    else:
                        variations = [
                            f"Later, on {date_part}",
                            f"Finally, on {date_part}",
                        ]
                    replacement = random.choice(variations)
                    modified = modified.replace(match.group(0), replacement, 1)
                    patterns_broken += 1

                # Pattern 4b: "Then came [event]" - formulaic pattern
                match = re.search(r"\bThen came\s+([A-Z][^.]{0,50})", modified)
                if match:
                    event_part = match.group(1)
                    # Remove "Then" and restructure
                    variations = [
                        f"{event_part}",
                        f"Later came {event_part}",
                        f"Next came {event_part}",
                        f"This was followed by {event_part.lower()}",
                    ]
                    replacement = random.choice(variations)
                    modified = modified.replace(match.group(0), replacement, 1)
                    patterns_broken += 1

                # Pattern 4c: "Meanwhile, over in [location]" - formulaic pattern
                match = re.search(r"\bMeanwhile, over in\s+([A-Z]\w+)", modified)
                if match:
                    location = match.group(1)
                    # Remove "over in" - it's formulaic
                    variations = [
                        f"Meanwhile, in {location}",
                        f"In {location}",
                        f"{location}, meanwhile,",
                        f"At the same time, in {location}",
                    ]
                    replacement = random.choice(variations)
                    modified = modified.replace(match.group(0), replacement, 1)
                    patterns_broken += 1

                # Pattern 4b: "And then there was" - Formulaic pattern
                if re.search(r"\bAnd then there was\b", modified):
                    # Vary or simplify
                    variations = [
                        "Then came",
                        "There was",
                        "This was",
                        "",  # Sometimes remove entirely and restructure
                    ]
                    replacement = random.choice(variations)
                    if replacement:
                        modified = modified.replace("And then there was", replacement, 1)
                    else:
                        # Remove and capitalize next word
                        modified = re.sub(r"\bAnd then there was\s+", "", modified)
                        if modified and modified[0].islower():
                            modified = modified[0].upper() + modified[1:]
                    patterns_broken += 1

                # Pattern 5: "So, [topic] was totally [verb]" or similar formulaic patterns
                match = re.search(r"\bSo,\s+([A-Z][^.]{10,})\s+was totally\s+(\w+)", modified)
                if match:
                    # Restructure to break pattern
                    if random.random() < 0.5:
                        # Option 1: Remove "So," entirely
                        modified = re.sub(r"\bSo,\s+", "", modified)
                    else:
                        # Option 2: Replace "So," with different transition
                        modified = re.sub(
                            r"\bSo,\s+", random.choice(["", "And ", "Later, "]), modified
                        )
                    patterns_broken += 1

                # Pattern 6: Repetitive "This [adj] [noun]" at sentence start
                if re.match(r"\bThis \w+ \w+", modified):
                    # Sometimes vary to "That" or "The"
                    if random.random() < 0.3:  # 30% chance to vary
                        modified = re.sub(
                            r"\bThis ", random.choice(["That ", "The "]), modified, count=1
                        )
                        patterns_broken += 1

                # Pattern 7: "Over in [location]" / "Out in [location]" - Repetitive preposition patterns
                match = re.search(r"\b(Over|Out)\s+in\s+([A-Z]\w+)", modified)
                if match:
                    location = match.group(2)
                    # Vary the prepositional phrase
                    variations = [
                        f"In {location}",  # Simplest
                        f"{location} saw",  # Different structure
                        f"In {location},",  # Different phrasing
                        f"{location} experienced",  # Different verb
                    ]
                    replacement = random.choice(variations)
                    modified = modified.replace(match.group(0), replacement, 1)
                    patterns_broken += 1

                # Pattern 8: "Then, out of nowhere" - Formulaic pattern
                if re.search(r"\bThen,?\s+out of nowhere\b", modified):
                    # Remove or vary
                    if random.random() < 0.6:
                        modified = re.sub(r"\bThen,?\s+out of nowhere,?\s*", "", modified)
                    else:
                        modified = re.sub(
                            r"\bThen,?\s+out of nowhere\b",
                            random.choice(["Suddenly,", "Unexpectedly,", "Then,"]),
                            modified,
                        )
                    patterns_broken += 1

                # Pattern 9: "They were totally [verb/preposition]" - "totally" after "were/was"
                match = re.search(
                    r"\b(They|It|This|That|We|You|The) (were|was) totally\s+", modified
                )
                if match:
                    # Remove "totally" or replace with other intensifier
                    if random.random() < 0.8:  # 80% chance to remove "totally"
                        # Remove "totally" (preserve space after)
                        modified = re.sub(r"\s+totally\s+", " ", modified)
                    else:
                        # Replace with different intensifier (rare)
                        replacement = random.choice(["really ", "quite ", ""])
                        if replacement:
                            modified = re.sub(r"\s+totally\s+", f" {replacement}", modified)
                        else:
                            modified = re.sub(r"\s+totally\s+", " ", modified)
                    patterns_broken += 1

                # Pattern 10: "To wrap things up" - Formulaic phrase
                if re.search(r"\bTo wrap things up\b", modified):
                    # Replace with variations
                    variations = [
                        "To end things quickly",
                        "To finish faster",
                        "To speed things up",
                        "Quickly,",  # Sometimes just use adverb
                    ]
                    replacement = random.choice(variations)
                    modified = modified.replace("To wrap things up", replacement, 1)
                    patterns_broken += 1

                # Pattern 11: Clustered conversational markers "yeah, the good guys, they were totally"
                # Detect multiple conversational elements in one sentence
                conversational_elements = [
                    "yeah",
                    "oh",
                    "well",
                    "so",
                    "now",
                    "the good guys",
                    "the bad guys",
                ]
                element_count = sum(
                    1
                    for elem in conversational_elements
                    if re.search(r"\b" + re.escape(elem) + r"\b", modified, re.IGNORECASE)
                )
                if element_count >= 3:  # Too many conversational markers clustered
                    # Remove "yeah" if present (most artificial)
                    if re.search(r"\byeah,\s*", modified, re.IGNORECASE):
                        modified = re.sub(r"\byeah,\s*", "", modified, flags=re.IGNORECASE)
                        patterns_broken += 1
                    # Remove redundant "they were" if "the good guys" is present
                    if re.search(r"\bthe good guys,\s*they were\s+", modified, re.IGNORECASE):
                        modified = re.sub(
                            r"\bthe good guys,\s*they were\s+",
                            "the good guys were ",
                            modified,
                            flags=re.IGNORECASE,
                        )
                        patterns_broken += 1
                    # Remove redundant "they were" if "the bad guys" is present
                    if re.search(r"\bthe bad guys,\s*they were\s+", modified, re.IGNORECASE):
                        modified = re.sub(
                            r"\bthe bad guys,\s*they were\s+",
                            "the bad guys were ",
                            modified,
                            flags=re.IGNORECASE,
                        )
                        patterns_broken += 1

                # Pattern 12: "really saw some" - Formulaic pattern
                if re.search(r"\breally saw (some|many|a lot of)\s+", modified):
                    # Simplify
                    modified = re.sub(
                        r"\breally saw (some|many|a lot of)\s+",
                        lambda m: f"saw {m.group(1)} ",
                        modified,
                    )
                    patterns_broken += 1

                modified_sentences.append(modified if modified != original_sentence else sentence)

            result_paragraphs.append(" ".join(modified_sentences))

        if patterns_broken > 0:
            logger.info(f"Broke {patterns_broken} sentence-level formulaic patterns")

        return "\n\n".join(result_paragraphs)

    def _break_structural_patterns(self, text: str) -> str:
        """
        Break structural patterns that AI detectors flag:
        - Participial lead-ins ("By leveraging...", "The system analyzes..., revealing...")
        - Formulaic templates ("From X to Y")
        - Overused transitions in sequence ("Firstly... Secondly... Finally...")

        Args:
            text: Input text

        Returns:
            Text with structural patterns broken
        """
        paragraphs = text.split("\n\n")
        result_paragraphs = []
        patterns_broken = 0

        for paragraph in paragraphs:
            if not paragraph.strip():
                result_paragraphs.append(paragraph)
                continue

            sentences = re.split(r"(?<=[.!?])\s+", paragraph)
            modified_sentences = []

            for sentence in sentences:
                if not sentence.strip():
                    modified_sentences.append(sentence)
                    continue

                modified = sentence

                # Pattern: Participial lead-ins "By leveraging/analyzing/using..., we can..."
                match = re.search(
                    r"\bBy (leveraging|analyzing|using|exploring|examining|studying|investigating),?\s+(we|they|it|this|you)\s+",
                    modified,
                    re.IGNORECASE,
                )
                if match:
                    action = match.group(1)
                    subject = match.group(2)
                    # Restructure to avoid participial phrase
                    if random.random() < 0.7:
                        # Convert to simple structure
                        modified = re.sub(
                            r"\bBy " + action + r",?\s+" + subject + r"\s+",
                            f"When {subject} {action}s, ",
                            modified,
                            flags=re.IGNORECASE,
                        )
                    else:
                        # Remove participial phrase entirely
                        modified = re.sub(
                            r"\bBy " + action + r",?\s+", "", modified, flags=re.IGNORECASE
                        )
                        # Capitalize next word if needed
                        modified = re.sub(r"^\s*([a-z])", lambda m: m.group(1).upper(), modified)
                    patterns_broken += 1

                # Pattern: "The [noun] [verb]s..., revealing/showing/demonstrating..."
                match = re.search(
                    r"\b(The|This|That) (\w+) (\w+)s?,?\s+(revealing|showing|demonstrating|indicating|suggesting)\s+",
                    modified,
                    re.IGNORECASE,
                )
                if match:
                    # Break participial clause
                    if random.random() < 0.6:
                        # Split into two sentences
                        modified = re.sub(
                            r",\s+(revealing|showing|demonstrating|indicating|suggesting)\s+",
                            ". This shows ",
                            modified,
                            flags=re.IGNORECASE,
                        )
                    else:
                        # Simplify structure
                        modified = re.sub(
                            r",\s+(revealing|showing|demonstrating|indicating|suggesting)\s+",
                            ", which shows ",
                            modified,
                            flags=re.IGNORECASE,
                        )
                    patterns_broken += 1

                # Pattern: "From X to Y" formulaic template (if repeated)
                # This will be checked at paragraph level

                # Pattern: Sequence words "Firstly... Secondly... Finally..."
                if re.search(r"\b(Firstly|Secondly|Thirdly|Finally),?\s+", modified, re.IGNORECASE):
                    # Check if this is part of a sequence (we'll handle in paragraph context)
                    if "Firstly" in modified or "Secondly" in modified or "Thirdly" in modified:
                        # Replace sequence words with simpler alternatives
                        modified = re.sub(
                            r"\bFirstly,?\s+", "First, ", modified, flags=re.IGNORECASE
                        )
                        modified = re.sub(
                            r"\bSecondly,?\s+", "Then, ", modified, flags=re.IGNORECASE
                        )
                        modified = re.sub(
                            r"\bThirdly,?\s+", "Next, ", modified, flags=re.IGNORECASE
                        )
                        modified = re.sub(
                            r"\bLastly,?\s+", "Finally, ", modified, flags=re.IGNORECASE
                        )
                        patterns_broken += 1

                modified_sentences.append(modified)

            result_paragraphs.append(" ".join(modified_sentences))

        if patterns_broken > 0:
            logger.info(f"Broke {patterns_broken} structural patterns")

        return "\n\n".join(result_paragraphs)

    def _ensure_punctuation_variety(self, text: str) -> str:
        """
        Ensure punctuation variety (humans use more than just periods).

        Occasionally:
        - Add exclamations (rare)
        - Add question marks (if rhetorical questions exist)
        - Add em-dashes or parentheses (sparingly)

        Args:
            text: Input text

        Returns:
            Text with punctuation variety
        """
        # Count punctuation types
        periods = len(re.findall(r"\.", text))
        exclamations = len(re.findall(r"!", text))
        questions = len(re.findall(r"\?", text))

        total_sentences = periods + exclamations + questions

        # If all periods (very uniform), add some variety (sparingly)
        if total_sentences > 10 and periods / total_sentences > 0.95:
            # Very rarely add exclamation or question
            sentences = re.split(r"(?<=[.!?])\s+", text)
            modified_sentences = []
            added_variety = 0

            for i, sentence in enumerate(sentences):
                if not sentence.strip():
                    modified_sentences.append(sentence)
                    continue

                modified = sentence
                # Only add variety to sentences that could support it (not very formal)
                if random.random() < 0.05 and i > 0:  # 5% chance, not first sentence
                    if sentence.endswith("."):
                        # Occasionally change to exclamation for emphasis
                        if random.random() < 0.5:
                            modified = sentence[:-1] + "!"
                            added_variety += 1

                modified_sentences.append(modified)

            if added_variety > 0:
                logger.info(f"Added {added_variety} punctuation variations")
                return " ".join(modified_sentences)

        return text

    def _ensure_contractions(self, text: str) -> str:
        """
        Ensure contractions are used where appropriate (humans use them).

        Replace formal "do not" with "don't", etc.

        Args:
            text: Input text

        Returns:
            Text with contractions added where appropriate
        """
        contractions_map = {
            r"\bdo not\b": "don't",
            r"\bdoes not\b": "doesn't",
            r"\bdid not\b": "didn't",
            r"\bwill not\b": "won't",
            r"\bwould not\b": "wouldn't",
            r"\bcould not\b": "couldn't",
            r"\bshould not\b": "shouldn't",
            r"\bcannot\b": "can't",
            r"\bis not\b": "isn't",
            r"\bare not\b": "aren't",
            r"\bwas not\b": "wasn't",
            r"\bwere not\b": "weren't",
            r"\bhas not\b": "hasn't",
            r"\bhave not\b": "haven't",
            r"\bhad not\b": "hadn't",
            r"\bit is\b": "it's",
            r"\bthat is\b": "that's",
            r"\bthere is\b": "there's",
            r"\bthere are\b": "there're",
            r"\byou are\b": "you're",
            r"\bwe are\b": "we're",
            r"\bthey are\b": "they're",
            r"\bI am\b": "I'm",
            r"\byou will\b": "you'll",
            r"\bwe will\b": "we'll",
            r"\bthey will\b": "they'll",
            r"\bI will\b": "I'll",
            r"\bit will\b": "it'll",
            r"\bthat will\b": "that'll",
            r"\byou have\b": "you've",
            r"\bwe have\b": "we've",
            r"\bthey have\b": "they've",
            r"\bI have\b": "I've",
        }

        contractions_added = 0

        for pattern, contraction in contractions_map.items():
            matches = list(re.finditer(pattern, text, re.IGNORECASE))
            if not matches:
                continue

            # Apply to 30-50% of matches (not all, for natural variation)
            num_to_replace = max(1, int(len(matches) * random.uniform(0.3, 0.5)))
            selected_matches = random.sample(matches, k=min(num_to_replace, len(matches)))

            # Process in reverse order to maintain indices
            for match in reversed(selected_matches):
                # Preserve capitalization
                if match.group(0)[0].isupper():
                    new_contraction = contraction.capitalize()
                else:
                    new_contraction = contraction

                text = text[: match.start()] + new_contraction + text[match.end() :]
                contractions_added += 1

        if contractions_added > 0:
            logger.info(f"Added {contractions_added} contractions")

        return text

    def _prefer_active_voice(self, text: str) -> str:
        """
        Convert passive voice to active voice where appropriate (humans prefer active).

        Examples:
        - "The task was completed by the team" → "The team completed the task"
        - "It is believed that" → "People believe" or remove

        Args:
            text: Input text

        Returns:
            Text with passive voice converted to active where appropriate
        """
        paragraphs = text.split("\n\n")
        result_paragraphs = []
        conversions_made = 0

        for paragraph in paragraphs:
            if not paragraph.strip():
                result_paragraphs.append(paragraph)
                continue

            sentences = re.split(r"(?<=[.!?])\s+", paragraph)
            modified_sentences = []

            for sentence in sentences:
                if not sentence.strip():
                    modified_sentences.append(sentence)
                    continue

                modified = sentence

                # Pattern: "was/were/is/are [past participle] by [agent]"
                match = re.search(
                    r"\b(was|were|is|are)\s+(\w+ed|\w+en|\w+ing)\s+by\s+([^,.!?]+)",
                    modified,
                    re.IGNORECASE,
                )
                if match and random.random() < 0.5:  # 50% conversion rate
                    verb_form = match.group(2)
                    agent = match.group(3).strip()

                    # Convert to active voice
                    # Simple conversion: "The X was done by Y" → "Y did X"
                    subject_match = re.search(
                        r"^([A-Z][^.!?]*?)\s+was|were|is|are", sentence, re.IGNORECASE
                    )
                    if subject_match:
                        subject = subject_match.group(1).strip()
                        # Reconstruct in active voice
                        if agent.lower() not in ["it", "this", "that", "there"]:
                            # Convert to: "Agent verb subject"
                            modified = re.sub(
                                r"^([^.!?]*?)\s+(was|were|is|are)\s+(\w+ed|\w+en|\w+ing)\s+by\s+"
                                + re.escape(agent),
                                f"{agent.capitalize()} {verb_form} {subject}",
                                modified,
                                flags=re.IGNORECASE,
                            )
                            conversions_made += 1

                # Pattern: "It is/was [past participle] that"
                if re.search(
                    r"\bIt (is|was) (believed|said|thought|known|found)\s+that\b",
                    modified,
                    re.IGNORECASE,
                ):
                    if random.random() < 0.6:  # 60% conversion rate
                        modified = re.sub(
                            r"\bIt (is|was) (believed|said|thought|known|found)\s+that\b",
                            lambda m: "People "
                            + ("believe" if m.group(2) == "believed" else m.group(2).rstrip("d"))
                            + " that",
                            modified,
                            flags=re.IGNORECASE,
                        )
                        conversions_made += 1

                modified_sentences.append(modified)

            result_paragraphs.append(" ".join(modified_sentences))

        if conversions_made > 0:
            logger.info(f"Converted {conversions_made} passive voice constructions to active")

        return "\n\n".join(result_paragraphs)

    def _add_rhetorical_questions(self, text: str, frequency: float = 0.02) -> str:
        """
        Add rhetorical questions sparingly (humans use them).

        Examples:
        - "But what does this mean?" (after explaining)
        - "How does this work?" (as a transition)

        Args:
            text: Input text
            frequency: Probability per sentence (0.02 = 2% of sentences)

        Returns:
            Text with occasional rhetorical questions
        """
        paragraphs = text.split("\n\n")
        result_paragraphs = []
        questions_added = 0

        rhetorical_questions = [
            "But what does this mean?",
            "How does this work?",
            "What's the real issue here?",
            "Why does this matter?",
            "What happens next?",
        ]

        for paragraph in paragraphs:
            if not paragraph.strip():
                result_paragraphs.append(paragraph)
                continue

            sentences = re.split(r"(?<=[.!?])\s+", paragraph)
            modified_sentences = []

            for i, sentence in enumerate(sentences):
                if not sentence.strip():
                    modified_sentences.append(sentence)
                    continue

                modified = sentence

                # Only add to sentences that aren't already questions
                if not sentence.strip().endswith("?") and random.random() < frequency:
                    # Add rhetorical question after some sentences
                    if i > 0 and len(sentence.split()) > 10:  # Not first sentence, longer sentences
                        question = random.choice(rhetorical_questions)
                        modified = sentence + " " + question
                        questions_added += 1

                modified_sentences.append(modified)

            result_paragraphs.append(" ".join(modified_sentences))

        if questions_added > 0:
            logger.info(f"Added {questions_added} rhetorical questions")

        return "\n\n".join(result_paragraphs)

    def _add_direct_address(self, text: str, frequency: float = 0.03) -> str:
        """
        Add direct address ("you might notice", "you'll see") sparingly.

        Humans address readers directly in conversational writing.

        Args:
            text: Input text
            frequency: Probability per sentence (0.03 = 3% of sentences)

        Returns:
            Text with occasional direct address
        """
        paragraphs = text.split("\n\n")
        result_paragraphs = []
        addresses_added = 0

        direct_addresses = [
            "you might notice",
            "you'll see",
            "you'll find",
            "you might see",
            "you'll notice",
            "you can see",
        ]

        for paragraph in paragraphs:
            if not paragraph.strip():
                result_paragraphs.append(paragraph)
                continue

            sentences = re.split(r"(?<=[.!?])\s+", paragraph)
            modified_sentences = []

            for i, sentence in enumerate(sentences):
                if not sentence.strip():
                    modified_sentences.append(sentence)
                    continue

                modified = sentence
                sentence_lower = sentence.lower()

                # Only add if "you" not already present and sentence is appropriate
                if "you" not in sentence_lower and random.random() < frequency:
                    if i > 0 and len(sentence.split()) > 8:  # Not first, longer sentences
                        address = random.choice(direct_addresses)
                        # Add at beginning of sentence with comma
                        modified = (
                            address.capitalize() + ", " + sentence[0].lower() + sentence[1:]
                            if len(sentence) > 0
                            else sentence
                        )
                        addresses_added += 1

                modified_sentences.append(modified)

            result_paragraphs.append(" ".join(modified_sentences))

        if addresses_added > 0:
            logger.info(f"Added {addresses_added} direct address phrases")

        return "\n\n".join(result_paragraphs)

    def _ensure_paragraph_readability(self, text: str) -> str:
        """
        Ensure paragraphs are readable - break up dense blocks.

        - Ensure paragraphs aren't too long (max ~150 words)
        - Break up dense blocks of text
        - Maintain natural flow

        Args:
            text: Input text

        Returns:
            Text with improved paragraph readability
        """
        paragraphs = text.split("\n\n")
        result_paragraphs = []
        paragraphs_split = 0

        for paragraph in paragraphs:
            if not paragraph.strip():
                result_paragraphs.append(paragraph)
                continue

            word_count = len(paragraph.split())

            # If paragraph is too long (>150 words), split it
            if word_count > 150:
                # Split at sentence boundaries
                sentences = re.split(r"(?<=[.!?])\s+", paragraph)

                # Split into chunks of ~100 words
                current_chunk = []
                current_word_count = 0

                for sentence in sentences:
                    sentence_words = len(sentence.split())

                    if current_word_count + sentence_words > 100 and current_chunk:
                        # Save current chunk as new paragraph
                        result_paragraphs.append(" ".join(current_chunk))
                        current_chunk = [sentence]
                        current_word_count = sentence_words
                        paragraphs_split += 1
                    else:
                        current_chunk.append(sentence)
                        current_word_count += sentence_words

                # Add remaining chunk
                if current_chunk:
                    result_paragraphs.append(" ".join(current_chunk))
            else:
                result_paragraphs.append(paragraph)

        if paragraphs_split > 0:
            logger.info(f"Split {paragraphs_split} long paragraphs for readability")

        return "\n\n".join(result_paragraphs)

    def _has_sufficient_variety(self, text: str) -> bool:
        """
        Check if text has sufficient sentence length variety (human pattern).

        Returns True if variety is sufficient, False if too uniform (AI-like).
        """
        sentences = re.split(r"[.!?]+", text)
        sentences = [s.strip() for s in sentences if s.strip()]

        if len(sentences) < 3:
            return True  # Too short to judge

        word_counts = [len(s.split()) for s in sentences]

        # Calculate variance
        mean_length = sum(word_counts) / len(word_counts)
        variance = sum((x - mean_length) ** 2 for x in word_counts) / len(word_counts)
        std_dev = variance**0.5

        # Human writing should have std_dev > 5 words for decent variety
        has_variety = std_dev > 5.0

        # Check for very short and very long sentences
        has_short = any(wc < 10 for wc in word_counts)
        has_long = any(wc > 25 for wc in word_counts)

        if not has_variety:
            logger.warning(f"Low sentence variety detected (std_dev={std_dev:.1f}, target >5)")
        if not (has_short and has_long):
            logger.warning("Missing very short (<10) or very long (>25) sentences")

        return has_variety and has_short and has_long

    def get_statistics(self, text: str) -> dict[str, Any]:
        """
        Get statistics about the text for quality assurance.

        Returns:
            Dictionary with text statistics
        """
        sentences = re.split(r"[.!?]+", text)
        sentences = [s.strip() for s in sentences if s.strip()]
        word_counts = [len(s.split()) for s in sentences]

        stats = {
            "sentence_count": len(sentences),
            "word_count": sum(word_counts),
            "avg_sentence_length": sum(word_counts) / len(word_counts) if word_counts else 0,
            "min_sentence_length": min(word_counts) if word_counts else 0,
            "max_sentence_length": max(word_counts) if word_counts else 0,
            "std_dev_sentence_length": (
                sum((x - sum(word_counts) / len(word_counts)) ** 2 for x in word_counts)
                / len(word_counts)
            )
            ** 0.5
            if word_counts
            else 0,
        }

        # Check for AI vocabulary
        ai_words_found = []
        for pattern in AI_WORD_REPLACEMENTS.keys():
            if re.search(pattern, text, re.IGNORECASE):
                ai_words_found.append(pattern)
        stats["ai_words_detected"] = len(ai_words_found)

        # Check for casual markers
        casual_markers = sum(1 for marker in CASUAL_INTENSIFIERS if marker in text.lower())
        stats["casual_intensifiers"] = casual_markers

        conversational = sum(1 for marker in CONVERSATIONAL_BREAKS if marker in text)
        stats["conversational_breaks"] = conversational

        return stats


# ============================================================================
# Standalone Functions for Easy Integration
# ============================================================================


def break_patterns(text: str, aggressiveness: float = 0.7) -> str:
    """
    Apply pattern breaking and controlled imperfections to text.

    Args:
        text: Input text
        aggressiveness: 0.0-1.0, how aggressive to be with modifications

    Returns:
        Enhanced text
    """
    breaker = PatternBreaker()
    return breaker.enhance_text(text, aggressiveness)


def enforce_simple_words(text: str) -> str:
    """
    Replace AI vocabulary with simple everyday words.

    This is the single most important transformation.
    """
    breaker = PatternBreaker()
    return breaker._enforce_simple_words(text)


def get_text_quality_stats(text: str) -> dict[str, Any]:
    """Get quality statistics for text."""
    breaker = PatternBreaker()
    return breaker.get_statistics(text)
