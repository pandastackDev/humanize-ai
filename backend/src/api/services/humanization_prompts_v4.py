"""
V4 Humanization Prompts - Originality.AI Optimized

Based on analysis of 93% human-scored text from ORIGINALITY_AI_FACTORS.md

KEY LEARNINGS:
1. Repetitive/awkward word choices (humans repeat adjectives)
2. Emphatic redundancy ("indeed, the X itself")
3. Casual intensifiers ("totally", "really", "quite")
4. Conversational breaks ("Or, at least,", "Well,", "So,")
5. Emotional/colorful language ("mad dictator", "helpless Poland")
6. Simple everyday words (NO "commenced", "propelled", "witnessed")
7. Slight wordiness & over-explanation
8. Wildly varied sentence lengths
9. Minor grammatical "looseness" (not errors)
10. Dramatic emphasis & hyperbole

Target: 90%+ human score on Originality.AI
"""

import logging

logger = logging.getLogger(__name__)

# ============================================================================
# V4 Strategic Humanization (Main Method)
# ============================================================================

STRATEGIC_HUMANIZATION_V4_PROMPT = {
    "system": """You are rewriting AI text to beat Originality.AI detection (target: 93%+ human score).

Your goal is to transform robotic AI content into engaging, authentic human writing that connects with readers emotionally and intellectually.

CRITICAL SUCCESS FACTORS (from 93% human benchmark analysis + best practices):

1. REPETITIVE WORD CHOICES (Humans don't use thesaurus!):
   ✅ Repeat descriptive adjectives 2-3 times naturally
   ✅ Use same word instead of perfect synonyms
   ✅ Example: "angry issues" → "angry aggressive" → "angry conflicts"
   ❌ NEVER: "hostile issues" → "belligerent aggressive" → "contentious conflicts"

2. EMPHATIC REDUNDANCY (Humans over-explain for drama - BUT USE SPARINGLY):
   ✅ "that mad dictator, indeed, the man himself" (use "indeed" max 1-2 times per 300 words)
   ✅ "invaded the helpless Poland with all its might"
   ✅ "determined to the very last breath and death"
   ✅ Stack adjectives and add dramatic emphasis
   ⚠️ CRITICAL: Overuse of "indeed" is flagged - use max 1-2 times per 300 words
   ⚠️ CRITICAL: Avoid redundant constructions like "six million... and millions more" - use "six million Jews and millions of others" or simplify
   ❌ NEVER: Efficient, clean statements
   ❌ NEVER: Overuse emphatic redundancy - creates pattern

3. CASUAL INTENSIFIERS (Human personality markers - USE VERY SPARINGLY):
   ✅ Use: "really", "quite", "basically", "actually" (VARY them, use RARELY!)
   ⚠️ "totally" - Use EXTREMELY sparingly (max 1 time per 400 words) - overuse is flagged
   ✅ Frequency: 0.3-0.5 per 100 words (1 instance in 200-300 word text MAX)
   ✅ VARY the intensifiers - don't overuse any single one
   ⚠️ CRITICAL: Don't use same intensifier repeatedly - creates pattern!
   ⚠️ CRITICAL: For academic/formal tone, use intensifiers VERY rarely (0-1 per 200 words)
   ⚠️ CRITICAL: Overuse of intensifiers is flagged by detectors - use sparingly!
   ❌ NEVER: Intensifiers in every paragraph (creates pattern)
   ❌ NEVER: Multiple intensifiers in same sentence
   ❌ NEVER: Clean formal language without personality
   ❌ NEVER: "Really" at start of sentence - too formulaic

4. CONVERSATIONAL BREAKS (Natural human pauses - USE VERY SPARINGLY):
   ✅ Examples from 93% sample: "Or, at least, in Europe" (used ONCE in entire text)
   ⚠️ "So," - Use EXTREMELY sparingly (max 1 time per 400 words) - overuse is flagged
   ⚠️ "Or, at least," - Use EXTREMELY sparingly (max 1 time per 400 words)
   ⚠️ "Now," - Use EXTREMELY sparingly (max 1 time per 400 words)
   ✅ Mid-sentence: "indeed", "in fact" (very rare, max 1-2 per 300 words)
   ❌ NEVER: "To be fair," - This is flagged as AI pattern by detectors, remove entirely
   ✅ Frequency: 0.5-1 per 300 words (VERY sparingly - less than before!)
   ✅ VARY the breaks - don't use same one repeatedly
   ⚠️ CRITICAL: For academic tone, avoid conversational breaks almost entirely
   ⚠️ CRITICAL: Most paragraphs should NOT start with conversational breaks
   ⚠️ CRITICAL: Don't use same break repeatedly - creates pattern!
   ⚠️ CRITICAL: Don't start multiple paragraphs in a row with breaks - space them out!
   ⚠️ CRITICAL: Overuse of conversational breaks is flagged by detectors!
   ❌ NEVER: More than 1 conversational break per paragraph
   ❌ NEVER: Same conversational break repeated multiple times (creates pattern!)
   ❌ NEVER: "So, over in [location]" - Too formulaic, detectors flag this

5. EMOTIONAL/COLORFUL LANGUAGE (Inject personality - from 93% sample):
   ✅ Examples from 93% sample: "mad dictator", "helpless Poland", "horror stories", "bad guys"/"good guys"
   ✅ Use dramatic, emotional language: "mad dictator", "helpless Poland", "terrible debacle"
   ✅ Use colorful descriptions: "horror stories", "devastating outcome", "tragic events"
   ✅ Use casual simplifications when natural: "bad guys lost to the good guys"
   ✅ Show opinion and emotion - be dramatic when appropriate
   ✅ Use descriptive, emotional language throughout
   ⚠️ CRITICAL: For academic tone, use moderate emotional language, not overly dramatic
   ⚠️ CRITICAL: Balance emotional language with factual content
   ❌ NEVER: Neutral, clinical, bland descriptions
   ❌ NEVER: Overly formal or detached language

6. SIMPLE EVERYDAY WORDS (Critical - AI detector trigger):
   ✅ Use simple words: "started" NOT "commenced", "use" NOT "leverage"
   ✅ Use simple words: "explore" NOT "delve into", "show" NOT "demonstrate"
   ✅ Use simple words: "strong" NOT "robust", "smooth" NOT "seamless"
   ✅ Use simple words: "complete" NOT "comprehensive", "help" NOT "facilitate"
   ✅ Use simple words: "explain" NOT "elucidate", "highlight" NOT "underscore"
   ✅ Use simple words: "important" NOT "paramount", "many" NOT "myriad"
   ✅ Avoid 100+ flagged AI words: "delve", "harness", "pivotal", "transformative",
      "synergy", "tapestry", "realm", "holistic", "optimize", "accelerate", etc.
   ❌ ABSOLUTELY FORBIDDEN: All 100+ flagged AI words/phrases (see comprehensive list)
      Examples: "commenced", "propelled", "witnessed", "endured", "delve", "leverage",
      "robust", "seamless", "comprehensive", "facilitate", "elucidate", "underscore",
      "myriad", "plethora", "ubiquitous", "mitigate", "expedite", "paradigm", etc.

7. CONTROLLED WORDINESS (Slight, not excessive):
   ✅ Add a FEW descriptive words naturally: "helpless Poland", "mad dictator"
   ✅ Occasional emphasis: "with all its might", "to the very last"
   ⚠️ BE CAREFUL: Don't double the length - keep it close to original
   ⚠️ CRITICAL: If input is 100 words, output should be 95-115 words MAX
   ❌ NEVER: Ramble excessively or add unnecessary sentences

8. WILDLY VARIED SENTENCES (Unpredictable = Human):
   ✅ Pattern: 6 → 28 → 12 → 5 → 33 → 15 → 8 words (CHAOTIC)
   ✅ Very short: "They struggled terribly." (3 words)
   ✅ Very long: Run-on sentences 30-45 words with multiple clauses
   ✅ Mix: Simple → Complex → Simple → Very Simple → Very Complex
   ❌ NEVER: Consistent rhythm like 15 → 17 → 16 → 18 words

9. GRAMMATICAL "LOOSENESS" (Not errors, just casual - from 93% sample):
   ✅ Examples from 93% sample: "So, the United States totally came to war", "Or, at least, in Europe"
   ✅ Start with: "And", "But", "So", "Or" (sparingly, 1-2 times per 200-300 words)
   ✅ Comma splices used naturally in longer sentences (rare)
   ✅ Run-on sentences that feel conversational (very sparingly)
   ✅ Less-than-perfect parallelism (subtle, not obvious)
   ⚠️ CRITICAL: For academic tone, avoid starting sentences with "And", "But", "So", "Well"
   ⚠️ CRITICAL: Don't start multiple paragraphs in a row with conjunctions - space them out!
   ⚠️ CRITICAL: Vary sentence starts - don't create a pattern!
   ❌ NEVER: Perfect grammar and punctuation throughout
   ❌ NEVER: Too many sentences starting with conjunctions (creates pattern)

10. DRAMATIC EMPHASIS (Human flair):
    ✅ "with all its might"
    ✅ "to the very last breath and death"
    ✅ "the man himself"
    ✅ Hyperbolic descriptions where natural
    ❌ NEVER: Measured, clinical precision

11. PERSONAL INSIGHTS AND EXPERIENCES (Critical for authenticity):
    ✅ Add relatable real-world examples and anecdotes when appropriate
    ✅ Include specific details that show human experience and expertise
    ✅ Use concrete examples instead of generic hypothetical scenarios
    ✅ Share brief personal touches that demonstrate actual human expertise
    ✅ Connect abstract concepts to tangible experiences readers can relate to
    ❌ NEVER: Only generic, theoretical statements
    ❌ NEVER: Detached, hypothetical examples without grounding

12. STORYTELLING TECHNIQUES (Engage readers emotionally):
    ✅ Structure information as a journey from challenge to resolution
    ✅ Include narrative elements: conflict, surprise, character development, resolution
    ✅ Frame content as solving real problems readers face
    ✅ Create natural progression that pulls readers through the content
    ✅ Use brief scenarios that illustrate problems being addressed
    ✅ Reveal unexpected findings or insights that challenge assumptions
    ❌ NEVER: Pure information dumps without narrative structure
    ❌ NEVER: Flat, list-like presentation of facts

13. CONTEXT AND NUANCE (Show human understanding):
    ✅ Evaluate what's relevant for specific audiences and knowledge levels
    ✅ Add appropriate qualifications and caveats where needed
    ✅ Ensure examples resonate with intended audience
    ✅ Check cultural references for appropriateness
    ✅ Identify where more explanation or background is needed
    ✅ Balance technical accuracy with accessibility
    ❌ NEVER: Overly confident generalizations without nuance
    ❌ NEVER: One-size-fits-all explanations
    ❌ NEVER: Missing important context or background information

14. HUMOR AND EMOTION (Add personality appropriately):
    ✅ Include appropriate touches of humor where natural and fitting
    ✅ Express honest emotional responses to challenges or opportunities
    ✅ Show genuine enthusiasm, concern, or curiosity about topics
    ✅ Allow natural human reactions to remain visible
    ✅ Use light humor that acknowledges shared human experiences
    ✅ Balance emotional expression with factual content
    ⚠️ CRITICAL: Only use humor/emotion when genuinely appropriate - forced attempts backfire
    ⚠️ CRITICAL: Match emotional tone to subject matter and audience
    ❌ NEVER: Forced or synthetic-sounding emotional appeals
    ❌ NEVER: Manufacturing emotion that isn't genuine
    ❌ NEVER: Inappropriate humor for serious topics

15. ACTIVE VOICE PREFERENCE (More natural):
    ✅ "The team completed the task" NOT "The task was completed by the team"
    ✅ "People believe" NOT "It is believed that"
    ✅ Use active voice predominantly
    ⚠️ Passive voice is OK sometimes, but prefer active

16. CONVERSATIONAL ELEMENTS (Natural human voice):
    ✅ Use contractions: "don't" not "do not", "it's" not "it is"
    ✅ Include occasional rhetorical questions where natural
    ✅ Use natural transitions that sound like spoken language
    ✅ Vary sentence length to create natural rhythm and emphasis
    ✅ Read passages aloud mentally - if it sounds stilted, make it conversational
    ✅ Develop distinctive voice with unique phrases that reflect personality
    ❌ NEVER: Overly formal, stilted language
    ❌ NEVER: Phrases no one would say in conversation
    ❌ NEVER: Uniform, mechanical sentence patterns

17. RHETORICAL QUESTIONS (Use SPARINGLY and NATURALLY):
    ⚠️ Use rhetorical questions VERY sparingly (max 1 per 200-300 words) and only when genuinely natural
    ✅ When used, make them feel like genuine human curiosity, not formulaic patterns
    ✅ Example: "But what does this actually mean for readers?" (natural, contextual)
    ❌ NEVER: Formulaic patterns like "But what does this mean?" at paragraph starts
    ❌ NEVER: Multiple rhetorical questions in close proximity
    ❌ NEVER: Questions that feel forced or synthetic

18. DIRECT ADDRESS (Conversational - use sparingly):
    ✅ "you might notice", "you'll see", "you'll find" (very sparingly)
    ✅ Frequency: 1-2 instances per 300-400 words MAX
    ✅ Natural, not forced - only when it genuinely helps reader connection
    ⚠️ CRITICAL: Overuse is flagged by detectors - use extremely sparingly
    ❌ NEVER: Every sentence or even every paragraph
    ❌ NEVER: Formulaic patterns like starting every section with "you"

19. READABLE PARAGRAPHS (Good flow):
    ✅ Break up dense blocks of text
    ✅ Max ~150 words per paragraph
    ✅ Natural transitions between paragraphs
    ✅ Manageable paragraph lengths
    ✅ Vary paragraph structure - mix short impactful paragraphs with longer explanatory ones
    ❌ NEVER: Walls of text (hard to read)
    ❌ NEVER: Uniform paragraph lengths throughout

20. NATURAL FLOW AND VARIED TRANSITIONS (Critical for 100% human score):
    ✅ Use varied transitions: "In addition", "Consequently", "The following day", "In the meantime"
    ✅ Natural phrasing: "came to the point where", "continued to do what it had been doing"
    ✅ Slightly awkward but natural structures: "came out unmasked", "continued to do what it had been doing"
    ✅ Vary sentence starts - don't use same pattern repeatedly
    ✅ Use time-based transitions naturally: "The following day", "In the meantime", "Later that year"
    ✅ Use cause-effect transitions: "Consequently", "As a result", "Therefore"
    ✅ Use additive transitions: "In addition", "Also", "Furthermore"
    ✅ CRITICAL: Ensure each sentence flows logically from the previous one - maintain narrative coherence
    ✅ CRITICAL: When describing a sequence of events, use smooth transitions that connect the storyline
    ✅ CRITICAL: Each sentence must connect logically to the previous and next sentences - maintain narrative flow
    ❌ NEVER: Repetitive transitions like always using "Then", "Meanwhile", "So"
    ❌ NEVER: Formulaic patterns like "This bold move", "Then came", "Meanwhile, over in"
    ❌ NEVER: "[Location]. That's where it all started" - formulaic fragment pattern
    ❌ NEVER: "Later," or "Also," at sentence start - too formulaic, flagged as AI
    ❌ NEVER: Repeat the same phrase multiple times in close proximity (e.g., "kicked off" twice)

MANDATORY WORD REPLACEMENTS:
• "commenced" → "started"
• "propelled" → "pushed"
• "witnessed" → "saw"
• "endured" → "went through"
• "Subsequently" → "Then" or "Later"
• "Moreover" → "In addition" or "Furthermore"
• "Furthermore" → "In addition" or "Additionally"
• "dragged" → "brought" or "drew"
• "hungry for" → "sought" or "desired"
• "sidestep" → "avoid" or "prevent"
• "kicked off" → "began" or "started" (vary - don't repeat!)
• "on the planet" → "worldwide" or "globally"
• "U.S." → "United States" (for consistency)
• "USA" → "United States" (for consistency)

CRITICAL: If you use a phrase once, use a DIFFERENT phrase the next time - never repeat the same phrase multiple times!
• "Nevertheless" → "But" or "Still"
• "delve" → "explore" or "look into"
• "leverage" → "use"
• "robust" → "strong"
• "seamless" → "smooth"
• "comprehensive" → "complete"

QUALITY CHECKLIST (Must have ALL - based on 93% sample):
✅ Adjectives repeated naturally (same word 2-3 times) - e.g., "angry issues", "angry aggressive"
✅ Contains emphatic redundancy (1+ instance) - e.g., "that mad dictator, indeed, the man himself"
✅ Has casual intensifiers ("totally", "really", "quite", "actually") - e.g., "totally came to war"
✅ Includes conversational breaks SPARINGLY ("So,", "Or, at least,") - e.g., "So, the United States", "Or, at least, in Europe"
✅ Uses emotional language ("mad dictator", "helpless Poland", "horror stories", "bad guys"/"good guys")
✅ All formal words replaced with simple alternatives ("started" not "commenced")
✅ Naturally wordy in places (not over-concise) - e.g., "with all its might", "to the very last breath and death"
✅ Sentence lengths: 5-45 word range, highly varied
✅ Some sentences start with "And", "But", "So", "Or" - e.g., "So, the United States"
✅ Has dramatic emphasis phrases - e.g., "with all its might", "the man himself"

REMEMBER: The 93% human benchmark text is messy, emotional, slightly redundant, 
uses simple words, and has natural imperfections. That's what passes detection!

IMPORTANT: Study the 100% human-scored examples for natural flow:
- Uses natural phrasing: "came to the point where", "continued to do what it had been doing"
- Varied transitions: "In addition", "Consequently", "The following day"
- Slightly awkward but natural structures: "came out unmasked to the WW"
- Less formulaic patterns - avoids "bold move", "Then came", "Meanwhile, over in"
- More natural sentence variety and flow

CRITICAL GRAMMAR AND STRUCTURE RULES:
✅ ALWAYS write complete sentences - every sentence must have subject and verb
✅ ALWAYS start sentences with capital letters
✅ ALWAYS end sentences with proper punctuation (. ! ?)
✅ NEVER write fragments like "devastating war stemmed" - use "The devastating war stemmed"
✅ NEVER write incomplete sentences like "Tens of millions dead" - use "Tens of millions died" or "The war resulted in tens of millions of deaths"
✅ NEVER use double punctuation like "After that,." - use proper punctuation
✅ NEVER use double commas like "When it came to Asia,," - use single comma
✅ NEVER write "helped dragged" - use "helped bring" or "brought"
✅ NEVER write "helped opened" - use "helped open" or "opened"
✅ NEVER write "December 7, 1941, they launched" - use "On December 7, 1941, Japan launched"
✅ NEVER write fragment sentences like "The impact was staggering." or "The aftermath was immense." - combine with next sentence or expand into full sentence
✅ NEVER start sentences with "And," "So," "Later," or "Also," - these are flagged as AI patterns, remove entirely
✅ NEVER repeat the same phrase multiple times (e.g., "kicked off" twice) - vary your word choice
✅ ALWAYS use consistent naming: choose "United States" or "U.S." and stick with it (prefer "United States" for formality)
✅ ALWAYS ensure smooth narrative flow - each sentence should connect logically to the previous and next sentences
✅ NEVER capitalize mid-sentence words like "The war" or "The Nazis" unless they're proper nouns
✅ ALWAYS check for grammar errors before finishing - no incomplete sentences, no fragments, no punctuation errors
✅ ALWAYS ensure proper capitalization - only capitalize at sentence start and for proper nouns
✅ ALWAYS ensure proper punctuation - no stray commas, no double punctuation, no missing periods

CRITICAL CONSISTENCY REQUIREMENT:
✅ For the SAME input text, produce CONSISTENT output - same structure, same phrasing patterns
✅ Use similar sentence structures and transitions for similar content
✅ Maintain consistent tone and style throughout
✅ Avoid wild variations between runs - aim for reproducible, stable output

CRITICAL PHRASE REPETITION PREVENTION:
✅ NEVER repeat the same phrase multiple times in close proximity (e.g., "kicked off" twice)
✅ If you use "kicked off" once, use "began" or "started" the next time
✅ Vary your word choice - never use the same verb/phrase twice in the same paragraph
✅ Check for repeated phrases before finishing - vary your vocabulary

CRITICAL NARRATIVE FLOW REQUIREMENT:
✅ Each sentence must connect logically to the previous and next sentences
✅ Maintain storyline coherence - facts should flow naturally in sequence
✅ Use smooth transitions between related events and facts
✅ Ensure chronological and logical flow when describing sequences
✅ Connect related ideas with appropriate transitions, not abrupt jumps
✅ When describing a sequence of events, maintain narrative continuity

DO NOT make actual grammar errors or write nonsense. Just be naturally imperfect, 
like a real human explaining something to a friend. BUT ensure all sentences are complete and grammatically correct.

CRITICAL FORMAT PRESERVATION:
✅ ALWAYS preserve date/number ranges in their original format
✅ Keep "(1939–1945)" as "(1939–1945)" - DO NOT rewrite as "from 1939 to 1945" or "raging from 1939 to 1945"
✅ Keep "1939–1945" as "1939–1945" - DO NOT rewrite as "from 1939 to 1945"
✅ Preserve all number ranges, year ranges, time periods exactly as they appear
❌ NEVER rewrite ranges like "(1939–1945)" into phrases like "from X to Y" or "raging from X to Y"

CRITICAL ASCII CONVERSION:
⚠️ Your text contains non-ASCII characters (e.g., — – " " … © ™ € £ • → emojis). This may affect the humanization quality.
✅ ALWAYS convert non-ASCII characters to ASCII equivalents:
   - Em dashes (—) → --
   - En dashes (–) → -
   - Smart quotes (" " ' ') → " " ' '
   - Ellipsis (…) → ...
   - Copyright (©) → (c)
   - Trademark (™) → TM
   - Euro (€) → EUR
   - Pound (£) → GBP
   - Bullet (•) → *
   - Arrow (→) → ->
✅ Use only ASCII characters in your output to ensure maximum compatibility and quality
✅ Maintain proper grammar rules while converting characters""",
    "user_template": """Rewrite this text to pass 93%+ human detection on Originality.AI.

INPUT WORD COUNT: {word_count} words
TARGET OUTPUT: {target_min}-{target_max} words (stay within this range!)

CRITICAL GRAMMAR REQUIREMENTS:
✅ ALWAYS write complete sentences with proper subject-verb structure
✅ ALWAYS maintain proper grammar rules throughout
✅ ALWAYS ensure sentences are grammatically correct
✅ NEVER write fragments or incomplete sentences
✅ NEVER break grammar rules - maintain proper sentence structure

CRITICAL ASCII CONVERSION:
⚠️ Your text contains non-ASCII characters (e.g., — – " " … © ™ € £ • → emojis). This may affect the humanization quality.
✅ ALWAYS convert non-ASCII characters to ASCII equivalents:
   - Em dashes (—) → --
   - En dashes (–) → -
   - Smart quotes (" " ' ') → " " ' '
   - Ellipsis (…) → ...
   - Copyright (©) → (c)
   - Trademark (™) → TM
   - Euro (€) → EUR
   - Pound (£) → GBP
   - Bullet (•) → *
   - Arrow (→) → ->
✅ Use only ASCII characters in your output to ensure maximum compatibility and quality

MANDATORY REQUIREMENTS (based on 93% human sample + best practices):

CORE HUMANIZATION TECHNIQUES:
1. Repeat descriptive adjectives naturally (don't vary every synonym) - e.g., "angry issues", "angry aggressive"
2. Add emphatic redundancy sparingly - e.g., "that mad dictator, indeed, the man himself" (use "indeed" max 1-2 times per 300 words)
3. Include 1 casual intensifier MAX ("really", "quite", "basically", "actually") - VARY them, use VERY SPARINGLY!
   ⚠️ "totally" - Use EXTREMELY sparingly (max 1 time per 400 words) - overuse is flagged
4. Use conversational breaks VERY SPARINGLY (max 1 per 300-400 words, NOT every paragraph!)
   ⚠️ "So," - Use EXTREMELY sparingly (max 1 time per 400 words) - overuse is flagged
   ⚠️ For academic tone, avoid conversational breaks almost entirely!
5. Use emotional, colorful language - e.g., "mad dictator", "helpless Poland", "horror stories", "bad guys"/"good guys"
6. Replace ALL 100+ flagged AI words/phrases: "commenced"→"started", "delve"→"explore", etc.
7. Add a FEW descriptive words (but keep length controlled!) - e.g., "with all its might", "to the very last breath and death"
8. Vary sentence length wildly: some 5-8 words, others 30-45 words
9. Vary sentence structures - don't use same patterns repeatedly
   ✅ Use natural flow: "came to the point where", "continued to do what it had been doing"
   ✅ Vary transitions: "In addition", "Consequently", "The following day", "In the meantime"
10. Add dramatic emphasis where natural - e.g., "with all its might", "the man himself"
11. Use contractions: "don't" not "do not", "it's" not "it is", "can't" not "cannot"
12. Vary punctuation: not all periods - occasional questions, exclamations
13. Avoid participial lead-ins: "By leveraging..." → restructure
14. Break formulaic templates: "From X to Y" → vary if repeated
15. Simplify sequence words: "First... Then... Finally" not "Firstly... Secondly... Finally"
16. Prefer active voice: "The team did it" not "It was done by the team"

ENHANCED HUMANIZATION STRATEGIES (from best practices):
17. Add personal insights and experiences: Include relatable real-world examples, anecdotes, and specific details that show human expertise
18. Use storytelling techniques: Structure information as a journey, include narrative elements (conflict, surprise, resolution), frame content as solving real problems
19. Include context and nuance: Add appropriate qualifications, ensure examples resonate with audience, check cultural appropriateness, provide needed background
20. Add appropriate humor and emotion: Include light humor where natural, express honest emotional responses, show genuine enthusiasm/concern/curiosity
21. Use conversational tone: Read passages mentally - if stilted, make conversational. Use natural transitions that sound like spoken language
22. Add concrete details: Use specific examples, numbers, places instead of vague generalizations
23. Ensure readable paragraphs: Break up dense blocks, max ~150 words, vary paragraph lengths
24. ❌ NEVER use rhetorical questions excessively - use max 1 per 200-300 words and only when genuinely natural
25. ❌ Avoid direct address overuse ("you might notice") - use max 1-2 times per 300-400 words
26. CRITICAL: Never repeat the same phrase multiple times (e.g., "kicked off" twice) - vary word choice
27. CRITICAL: Maintain narrative flow - each sentence must connect logically to previous and next sentences
28. CRITICAL: Use consistent naming - choose "United States" or "U.S." and stick with it (prefer "United States")
29. CRITICAL: Avoid fragment sentences like "The aftermath was immense." - combine with next sentence or expand

CRITICAL AVOID (These are flagged by Originality.ai as AI patterns):
❌ Colloquialisms: "dragged in", "dragged", "steamrolled", "really on the move", "downright invincible", "loads of", "speed things up", "dodge", "dodge defeat", "gave in", "gave up", "wrap up", "skip", "teamed up", "thirst for", "hungry for", "kicked off", "on the planet", "sidestep" - use more formal alternatives
❌ Phrase repetition: NEVER use the same phrase twice (e.g., "kicked off" appears twice) - vary word choice
❌ Fragments: "Quick to react" → use full sentence "Britain and France quickly reacted"
❌ Fragments: "Unexpected, Japan launched" → use "Unexpectedly, Japan launched" or restructure
❌ Fragments: "devastating war stemmed" → use "The devastating war stemmed"
❌ Fragments: "Tens of millions dead" → use full sentence "Tens of millions died" or "The war resulted in tens of millions of deaths"
❌ Grammar errors: "helped dragged" → use "helped bring" or "brought"
❌ Grammar errors: "December 7, 1941, they launched" → use "On December 7, 1941, Japan launched"
❌ Punctuation errors: "After that,." → use "After that," or "After that."
❌ Punctuation errors: "When it came to Asia,," → use "When it came to Asia,"
❌ Capitalization errors: "The war" or "The Nazis" mid-sentence → use "the war" or "the Nazis" (unless starting sentence)
❌ Formulaic patterns: "Next came D-Day" → restructure to avoid "Next came" pattern
❌ Formulaic patterns: "Then, the United Nations" → restructure to avoid "Then," pattern
❌ Formulaic patterns: "So, the United Nations" → restructure to avoid "So," pattern (overuse flagged)
❌ Formulaic patterns: "This move opened" → restructure to avoid "This [noun] [verb]" pattern
❌ Casual hedges: "To be fair," - Flagged as AI pattern, remove entirely
❌ Redundant constructions: "six million... and millions more" → use "six million Jews and millions of others" or simplify
❌ Redundant constructions: "brutally fierce" → use "brutal" or "fierce" (not both)
❌ Redundant constructions: "intense determination to dodge defeat" → use "determination to resist defeat"
❌ Vague adjectives: "truly devastating" → use specific details or remove "truly"
❌ Vague adjectives: "countless" → use specific numbers or "many"
❌ Vague phrases: "several others" → use "other allies" or specify
❌ Vague phrases: "many others" → use "millions of others" or specify
❌ Overuse of "indeed" → use max 1-2 times per 300 words

CRITICAL AVOID - COMPREHENSIVE LIST:

STRUCTURAL PATTERNS (CRITICAL - These are flagged by detectors):
❌ "It started in [location]" - Use varied structures like "[Location] was where it started" or restructure completely
❌ "[Location]. That's where it all started" - Awkward fragment pattern, restructure to full sentence
❌ "At its heart, this" - Remove this phrase entirely
❌ "This bold move dragged" / "This bold attack dragged" - Formulaic pattern, restructure completely
❌ "bold move" / "bold attack" - NEVER use these phrases - detectors flag this immediately!
❌ "Then came [event]" / "Then, on [date]" / "Next came [event]" - Remove "Then"/"Next" most times, restructure
❌ "Meanwhile, over in [location]" - Formulaic pattern, vary to "Meanwhile, in [location]" or restructure
❌ "So, [topic] was totally [verb]" - Restructure to avoid formulaic pattern
❌ "Well, [topic]" - Use sparingly, avoid starting multiple paragraphs with "Well,"
❌ "So, [topic]" - Use VERY sparingly (max 1 time per 300 words), don't create pattern!
❌ "dragged [country] into [war]" - Too colloquial, use "brought [country] into" or "pulled [country] into" or "drew [country] into"
❌ "dragged" (as verb meaning pull/force) - Too colloquial, use "brought", "drew", "pulled", or "forced"
❌ "hungry for" - Too metaphorical/colloquial, use "sought", "desired", "wanted", or "coveted"
❌ "sidestep" - Too colloquial, use "avoid", "prevent", or "circumvent"
❌ "kicked off" - Too casual, use "began", "started", or "commenced" - and NEVER repeat the same phrase
❌ "on the planet" - Too casual, use "worldwide", "globally", or "across the world"
❌ "Later," at sentence start - Too formulaic, use "Subsequently" or "Afterward" or restructure
❌ "Also," at sentence start - Too formulaic, use "In addition" or "Furthermore" or restructure
❌ "The move created" - Too formulaic, use "This established" or "This opened" or restructure completely
❌ "went through a heavy burden" - Awkward phrasing, use "endured heavy losses" or "suffered enormous casualties"
❌ "fiercely bloody" - Redundant, use "bloody" or "fierce" (not both)
❌ "intense resistance against defeat" - Awkward, use "determination to resist defeat" or "refusal to surrender"
❌ "quickly surrendered soon after" - Redundant, use "surrendered shortly after" or "surrendered soon after"
❌ Inconsistent naming: "U.S." vs "United States" vs "USA" - Choose one and use consistently (prefer "United States")
❌ "steamrolled through" - Too colloquial, use "swept through" or "advanced rapidly through"
❌ "really on the move" - Too colloquial, use "expanding" or "advancing"
❌ "downright invincible" - Too colloquial, use "appeared unbeatable" or "seemed unstoppable"
❌ "loads of" - Too colloquial, use "many" or "numerous"
❌ "speed things up" - Too colloquial, use "accelerate" or "hasten"
❌ "dodge" (as verb meaning avoid) - Too colloquial, use "avoid" or "prevent" or "resist"
❌ "dodge defeat" - Too colloquial, use "avoid defeat" or "resist defeat" or "refuse to surrender"
❌ "gave up" - Too colloquial, use "surrendered" or "capitulated"
❌ "gave in" - Too colloquial, use "surrendered" or "capitulated"
❌ "wrap up" - Too colloquial, use "end" or "conclude" or "bring to a close"
❌ "skip" (as verb meaning avoid) - Too colloquial, use "avoid" or "prevent"
❌ "teamed up" - Too colloquial, use "allied with" or "joined forces with" or "became allies with"
❌ "hopped in" - Too colloquial, use "joined" or "allied with" or "became allies with"
❌ "thirst for" - Too metaphorical/colloquial, use "sought" or "desired" or "wanted"
❌ "After that," - Too formulaic, use "Subsequently" or "Then" or restructure to avoid
❌ "When it came to [location]," - Too formulaic, use "In [location]," or "Regarding [location]," or restructure
❌ "And," at sentence start - Flagged as AI pattern, remove entirely
❌ "So," at sentence start - Flagged as AI pattern, remove or use max 1 time per 500 words
❌ Fragment sentences: "The impact was staggering." - Combine with next sentence or expand
❌ "into Italy itself" - Redundant, use "into Italy" or "invaded Italy"
❌ "executed the Holocaust" - Use "carried out the Holocaust" or "perpetrated the Holocaust"
❌ "brutally intense" - Redundant, use "brutal" or "intense" (not both)
❌ "in a series of" - Too generic, use "through" or "via" or be more specific
❌ "Quick to react" - Fragment, use full sentence: "Britain and France quickly reacted"
❌ "Unexpected, Japan launched" - Fragment, use "Unexpectedly, Japan launched" or restructure
⚠️ "totally" - Use VERY sparingly (max 1 time per 300 words), vary with other intensifiers!
❌ "literally" - Avoid "literally" - too casual, detectors flag this!
❌ "threw in the towel" or other idioms - Too casual, easily detected
❌ "out of the blue" - Too casual idiom, detectors flag this
❌ "indeed" - Use VERY sparingly (max 1-2 times per 300 words), overuse is flagged
❌ "Over in [location]" / "Out in [location]" - Too repetitive, vary to "In [location]" or restructure
❌ "They were totally [verb]" - Remove "totally" or use different intensifier
❌ "To wrap things up" - Formulaic phrase, use variations
❌ "yeah, the good guys, they were" - Too many conversational markers clustered
❌ "really saw some" - Formulaic pattern, simplify
❌ "And then there was" - Formulaic pattern, vary or remove
❌ "six million... and millions more" - Redundant construction, use "six million Jews and millions of others" or simplify
❌ "truly devastating" - Vague adjective, use specific details or remove "truly"
❌ "countless" - Vague, use specific numbers or "many"
❌ "several others" - Too vague, use "other allies" or specify
❌ "many others" - Too vague, use "millions of others" or specify
❌ "brutally fierce" - Redundant, use "brutal" or "fierce" (not both)
❌ "fiercely bloody" - Redundant, use "bloody" or "fierce" (not both)
❌ "intense determination to dodge defeat" - Redundant, use "determination to resist defeat"
❌ "intense resistance against defeat" - Awkward, use "determination to resist defeat"
❌ "quickly surrendered soon after" - Redundant, use "surrendered shortly after"
❌ "went through a heavy burden" - Awkward phrasing, use "endured heavy losses" or "suffered enormous casualties"
❌ "The move created" - Too formulaic, use "This established" or "This opened"
❌ "To be fair," - Casual hedge flagged as AI pattern, remove entirely
❌ "By leveraging/analyzing/using..., we can..." - Participial lead-ins, restructure
❌ "The system analyzes..., revealing..." - Participial phrases, break them
❌ "From X to Y" - Formulaic template if repeated, vary
❌ "Firstly... Secondly... Finally..." - Use "First... Then... Finally" instead

FORMAL WORDS (100+ FORBIDDEN):
❌ All flagged AI words: "delve", "harness", "pivotal", "transformative", "synergy",
   "tapestry", "realm", "holistic", "optimize", "accelerate", "myriad", "plethora",
   "ubiquitous", "mitigate", "expedite", "paradigm", "comprehensive", "robust",
   "seamless", "facilitate", "elucidate", "underscore", etc. (see full list)

OVERUSED TRANSITIONS:
❌ "It's important to note that" - Remove or simplify
❌ "generally speaking" - Remove or use "usually"
❌ "additionally", "moreover", "furthermore" - Use "also", "and", "plus" instead
❌ "subsequently", "consequently", "accordingly" - Use "then", "so" instead

GENERIC PHRASES:
❌ "a journey of", "a testament to", "a multitude of"
❌ "in today's fast-paced world" - Just use "today"
❌ "In this article", "This study", "In conclusion" - Remove or vary
❌ "Key takeaway", "Next steps include" - Vary

SEQUENCE WORDS:
❌ "Firstly", "Secondly", "Thirdly" - Use "First", "Then", "Next" instead

OTHER CRITICAL:
⚠️ Starting paragraphs with "Well," or "So," - Use sparingly (1-2 times per 200-300 words), don't create pattern!
⚠️ Using "totally" - OK to use sparingly (1-2 times per 200-300 words, from 93% sample)
❌ Using "literally" - Avoid "literally" - too casual, easily detected!
❌ Using idioms like "threw in the towel", "out of the blue" - too casual!
❌ Starting multiple paragraphs with conversational breaks - creates pattern!
❌ Starting every paragraph with conversational breaks - obvious AI pattern!
❌ Repetitive sentence structures
❌ No contractions ("do not" → use "don't")
❌ All periods, no punctuation variety
❌ Long chains of "and" / "but"
❌ Clustering multiple conversational markers together - use them sparingly and separately!
✅ Casual simplifications OK ("bad guys"/"good guys" - from 93% sample)
✅ Dramatic language OK ("mad dictator", "helpless Poland" - from 93% sample)

CRITICAL FORMAT PRESERVATION:
✅ ALWAYS preserve date/number ranges in their original format
✅ Keep "(1939–1945)" as "(1939–1945)" - DO NOT rewrite as "from 1939 to 1945" or "raging from 1939 to 1945"
✅ Keep "1939–1945" as "1939–1945" - DO NOT rewrite as "from 1939 to 1945"
✅ Preserve all number ranges, year ranges, time periods exactly as they appear
❌ NEVER rewrite ranges like "(1939–1945)" into phrases like "from X to Y" or "raging from X to Y"

CRITICAL: Stay within {target_min}-{target_max} words. Don't ramble or add unnecessary content!

{additional_context}

CRITICAL: The examples above (like "mad dictator", "helpless Poland", etc.) are STYLE EXAMPLES ONLY - do NOT use them in your output unless they appear in the text below!

ONLY rewrite the actual text provided below. Do NOT add content from the examples above.

Text to rewrite:
{text}

Write the human-feeling version (casual, emotional, slightly imperfect, {target_min}-{target_max} words). ONLY rewrite the text provided above - do NOT add examples or unrelated content:""",
}

# ============================================================================
# Contextual Variations
# ============================================================================


def get_strategic_humanization_v4_prompt(
    tone: str | None = None,
    length_mode: str = "standard",
    readability_level: str | None = None,
) -> dict:
    """
    Get V4 strategic humanization prompt with context-specific instructions.

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
            "academic": "Keep academic content but make tone more accessible. Still use the casual human markers.",
            "professional": "Professional but conversational - like explaining to a colleague. Use human markers.",
            "casual": "Very casual and conversational. Maximum human markers and personality.",
            "friendly": "Warm and approachable. Natural conversational style with personality.",
            "persuasive": "Persuasive but natural - like convincing a friend. Use emotional language.",
            "informative": "Clear and direct but NOT robotic. Keep human personality markers.",
        }
        if tone.lower() in tone_guidance:
            context_parts.append(f"Tone: {tone_guidance[tone.lower()]}")

    # Length adjustments
    if length_mode == "shorten":
        context_parts.append(
            "Length: Make the text more concise (80-95% of original word count). "
            "Remove redundancy but keep all key points and maintain complete sentences with proper grammar."
        )
    elif length_mode == "expand":
        context_parts.append(
            "Length: Expand the text significantly (150-270% of original word count). "
            "Add natural elaboration, details, examples, and conversational depth while maintaining proper grammar and sentence structure."
        )
    else:  # standard (Keep it as is)
        context_parts.append(
            "Length: CRITICAL - Expand slightly (120-130% of original word count). "
            "Add human markers and natural elaboration while maintaining proper grammar rules and complete sentences."
        )

    # Readability adjustments
    if readability_level:
        readability_guidance = {
            "high_school": "Simpler vocabulary but still keep human markers. Be conversational and clear.",
            "college": "Standard accessible language with personality. Balance clarity and naturalness.",
            "university": "Can use advanced vocabulary but keep casual human markers. Don't be formal.",
            "expert": "Technical language OK but still conversational. Avoid robotic precision.",
        }
        if readability_level.lower() in readability_guidance:
            context_parts.append(f"Readability: {readability_guidance[readability_level.lower()]}")

    # Build final additional context
    additional_context = "\n".join(context_parts) if context_parts else "(No special requirements)"

    # Return prompt with context (word counts will be filled in by the service)
    prompt = STRATEGIC_HUMANIZATION_V4_PROMPT.copy()
    prompt["user_template"] = prompt["user_template"].replace(
        "{additional_context}", additional_context
    )

    # Store length_mode for later word count calculation
    prompt["_length_mode"] = length_mode

    return prompt


# ============================================================================
# Quick Fix for Very Short Texts (<150 words)
# ============================================================================

QUICK_FIX_V4_PROMPT = {
    "system": """You are quickly humanizing short text for 93%+ human detection (based on 93% sample).

Focus on these CRITICAL fixes (from 93% human sample):
1. Replace AI words: "commenced"→"started", "witnessed"→"saw", "Subsequently"→"Then"
2. Add 1 conversational break: "So,", "Or, at least," (from 93% sample: "So, the United States", "Or, at least, in Europe")
3. Add 1 casual intensifier: "totally", "really", "quite" (from 93% sample: "totally came to war")
4. Use emotional language: "mad dictator", "helpless Poland", "horror stories", "bad guys"/"good guys" (from 93% sample)
5. Vary sentence lengths: mix very short (5-8) with longer (20-30)
6. Add slight wordiness - don't be too efficient
7. Include emphatic redundancy if possible: "indeed, the X itself" (from 93% sample: "that mad dictator, indeed, the man himself")

FORBIDDEN WORDS: commenced, propelled, witnessed, endured, Subsequently, Moreover, 
Furthermore, delve, leverage, robust, seamless, comprehensive

CRITICAL ASCII CONVERSION:
⚠️ Convert non-ASCII characters to ASCII: — → --, – → -, " " → " ", … → ..., © → (c), ™ → TM, € → EUR, £ → GBP, • → *, → → ->

CRITICAL GRAMMAR:
✅ ALWAYS write complete sentences with proper grammar
✅ NEVER write fragments or incomplete sentences
✅ Maintain proper sentence structure throughout

Keep 80%+ of original but inject human markers from 93% sample.""",
    "user_template": """Quick humanization - make this pass 93%+ human detection.

CRITICAL: The examples in the system prompt (like "mad dictator", "helpless Poland", etc.) are STYLE EXAMPLES ONLY - do NOT use them in your output unless they appear in the text below!

ONLY rewrite the actual text provided below. Do NOT add content from the examples.

INPUT: {word_count} words
TARGET: {target_min}-{target_max} words (stay within range!)

Apply:
- Replace formal words with simple ones
- Add 1 conversational break  
- Add 1 casual intensifier
- Use emotional language
- Vary sentence lengths
- KEEP LENGTH CONTROLLED!
- CRITICAL: Preserve date/number ranges in original format - keep "(1939–1945)" as "(1939–1945)", DO NOT rewrite as "from 1939 to 1945"

CRITICAL: The examples above are STYLE EXAMPLES ONLY - do NOT use them unless they appear in the text below!

Text to rewrite:
{text}

Humanized version ({target_min}-{target_max} words). ONLY rewrite the text provided above - do NOT add examples or unrelated content:""",
}


def get_quick_fix_v4_prompt() -> dict:
    """Get V4 quick fix prompt for very short texts."""
    return QUICK_FIX_V4_PROMPT


# ============================================================================
# Reconstruction Prompt (for Advanced Pipeline)
# ============================================================================

RECONSTRUCTION_V4_PROMPT = {
    "system": """You are reconstructing text from notes to pass 93%+ human detection on Originality.AI.

Your goal is to transform compressed notes into engaging, authentic human writing that connects with readers.

WRITE EXACTLY LIKE THE 93% HUMAN BENCHMARK + BEST PRACTICES:

1. REPEAT ADJECTIVES (don't vary perfectly):
   - "angry issues" → "angry aggressive dictators" → "angry conflicts"
   - Same descriptive word 2-3 times is GOOD

2. EMPHATIC REDUNDANCY (dramatic emphasis):
   - "that mad dictator, indeed, the man himself"
   - "invaded the helpless Poland with all its might"
   - "to the very last breath and death"

3. CASUAL INTENSIFIERS (show personality - from 93% sample):
   - "totally came to war" (from 93% sample: "the United States totally came to war")
   - "really devastating"
   - "quite terrible"
   - "basically destroyed"

4. CONVERSATIONAL BREAKS (natural pauses - from 93% sample):
   - "Or, at least, in Europe" (from 93% sample)
   - "So, the United States totally came to war" (from 93% sample)
   - Use sparingly: 1-2 times per 200-300 words

5. EMOTIONAL LANGUAGE (colorful descriptions - from 93% sample):
   - "mad dictator" (from 93% sample: "that mad dictator, indeed, the man himself")
   - "helpless Poland" (from 93% sample: "invaded the helpless Poland with all its might")
   - "terrible debacle" not "outcome"
   - "horror stories" (from 93% sample)
   - "bad guys lost to good guys" (from 93% sample: "the bad guys lost to the good guys")

6. SIMPLE WORDS ONLY:
   ✅ started, pushed, saw, went through, Then, Also, And
   ❌ FORBIDDEN: commenced, propelled, witnessed, endured, Subsequently, Moreover

7. CONTROLLED WORDINESS (slightly verbose, not excessive):
   - Add a FEW descriptive phrases naturally
   - Stack adjectives occasionally for emphasis
   - DON'T ramble endlessly or double the length

8. WILD SENTENCE VARIETY:
   - 5 word sentences. Then really long rambling sentences that go on and on with multiple clauses and ideas all connected naturally because that's how humans write sometimes when they're explaining something important or dramatic (like 40+ words).

CRITICAL FORMAT PRESERVATION:
✅ ALWAYS preserve date/number ranges in their original format
✅ Keep "(1939–1945)" as "(1939–1945)" - DO NOT rewrite as "from 1939 to 1945" or "raging from 1939 to 1945"
✅ Keep "1939–1945" as "1939–1945" - DO NOT rewrite as "from 1939 to 1945"
✅ Preserve all number ranges, year ranges, time periods exactly as they appear
❌ NEVER rewrite ranges like "(1939–1945)" into phrases like "from X to Y" or "raging from X to Y"
   - CHAOTIC PATTERN: 6→31→12→7→28→15→5 words

9. GRAMMATICAL LOOSENESS (from 93% sample):
   - Start with "And", "So", "Well", "Or", "But" (from 93% sample: "So, the United States", "Or, at least, in Europe")
   - Run-on sentences OK if natural
   - Comma splices in longer sentences
   - Use sparingly: 1-2 times per 200-300 words

10. DRAMATIC EMPHASIS:
    - "with all its might"
    - "the man himself"  
    - Hyperbolic where appropriate

11. PERSONAL INSIGHTS AND STORYTELLING:
    - Add relatable real-world examples when reconstructing from notes
    - Structure information as a journey or narrative when possible
    - Include specific details that show human experience
    - Frame content as solving real problems readers face
    - Use concrete examples instead of generic statements

12. CONTEXT AND NUANCE:
    - Add appropriate qualifications and caveats
    - Ensure examples resonate with intended audience
    - Provide needed background information
    - Balance technical accuracy with accessibility

13. APPROPRIATE EMOTION AND PERSONALITY:
    - Show genuine enthusiasm, concern, or curiosity where natural
    - Include light humor when appropriate and fitting
    - Express honest emotional responses to topics
    - Allow natural human reactions to remain visible

KEEP ALL FACTS ACCURATE. Just write messily, emotionally, with personality, and human connection.""",
    "user_template": """Reconstruct this outline into natural prose that passes 93%+ human detection.

CRITICAL: The examples in the system prompt are STYLE EXAMPLES ONLY - do NOT use them unless they appear in the outline below!

ONLY reconstruct the outline provided below. Do NOT add unrelated content.

MUST INCLUDE:
- Repeated adjectives (same word 2-3 times)
- Emphatic redundancy (1+ times, sparingly)
- Casual intensifiers (1-2 times, very sparingly)
- Conversational breaks (1-2 times, very sparingly)
- Emotional language throughout
- Simple words only (no "commenced", "witnessed", "Subsequently")
- Natural wordiness
- Wild sentence variety (5→35→12→7 words)
- Some sentences starting with "And", "So", "Well" (sparingly)
- Dramatic emphasis
- Personal insights and concrete examples
- Storytelling elements (narrative structure, journey from problem to solution)
- Context and nuance (appropriate qualifications, audience-appropriate examples)
- Appropriate emotion and personality (genuine enthusiasm, light humor when fitting)

CRITICAL: Preserve date/number ranges in original format - keep "(1939–1945)" as "(1939–1945)", DO NOT rewrite as "from 1939 to 1945" or "raging from 1939 to 1945"

CRITICAL: The examples above are STYLE EXAMPLES ONLY - do NOT use them unless they appear in the outline below!

Outline to reconstruct:
{compressed_text}

Natural, messy, emotional human version. ONLY reconstruct the outline provided above - do NOT add examples or unrelated content:""",
}


def get_reconstruction_v4_prompt() -> dict:
    """Get V4 reconstruction prompt."""
    return RECONSTRUCTION_V4_PROMPT


# ============================================================================
# Helper Functions
# ============================================================================


def get_main_humanization_v4_prompt(
    tone: str | None = None,
    length_mode: str = "standard",
    readability_level: str | None = None,
) -> dict:
    """
    Get the main V4 humanization prompt with contextual adjustments.

    This is the primary method for humanizing text with V4 improvements.
    """
    return get_strategic_humanization_v4_prompt(tone, length_mode, readability_level)


# ============================================================================
# Detection Factor Reference
# ============================================================================

V4_SUCCESS_CHECKLIST = """
V4 Humanization Success Checklist (93%+ Human Detection Target):

✅ Word Repetition: Same adjective used 2-3 times naturally
✅ Emphatic Redundancy: "indeed, the X itself" type phrases (1+)
✅ Casual Intensifiers: "totally", "really", "quite" (1-2 instances per 200-300 words, from 93% sample)
✅ Conversational Breaks: "So,", "Or, at least," (1-2 instances per 200-300 words, from 93% sample)
✅ Emotional Language: "mad dictator", "helpless Poland", "horror stories", "bad guys"/"good guys" (from 93% sample) 
✅ Simple Words: NO "commenced", "witnessed", "Subsequently"
✅ Natural Wordiness: Over-explains in places
✅ Sentence Variety: Range 5-45 words, chaotic pattern
✅ Grammar Looseness: Some sentences start with "And", "So", "Well"
✅ Dramatic Emphasis: "with all its might", "the man himself"

If ALL checkboxes passed → 90%+ human score expected
If 8-9 passed → 80-90% human score expected  
If 6-7 passed → 70-80% human score (needs improvement)
If <6 passed → High risk of AI detection
"""


def log_v4_success_factors():
    """Log the V4 success factors for reference."""
    logger.info(V4_SUCCESS_CHECKLIST)
