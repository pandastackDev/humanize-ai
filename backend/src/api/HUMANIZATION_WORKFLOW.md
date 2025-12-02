# Humanization Workflow Documentation

## Overview
This document describes the complete humanization workflow used in the backend, including all processing steps, length mode handling, ASCII conversion, and grammar enforcement.

## Workflow Steps

### 1. Input Sanitization & ASCII Conversion
- **Location**: `humanization_service.py` → `humanize()` method
- **Process**:
  - Input text is first converted from non-ASCII to ASCII characters
  - Common conversions:
    - Em dashes (—) → `--`
    - En dashes (–) → `-`
    - Smart quotes (" " ' ') → `" " ' '`
    - Ellipsis (…) → `...`
    - Copyright (©) → `(c)`
    - Trademark (™) → `TM`
    - Euro (€) → `EUR`
    - Pound (£) → `GBP`
    - Bullet (•) → `*`
    - Arrow (→) → `->`
  - Remaining non-ASCII characters are normalized using Unicode NFKD normalization
  - All output is guaranteed to be ASCII-compatible

### 2. Pipeline Selection
- **Decision Point**: Based on text length and configuration
- **Advanced Pipeline**: Used for texts >= 1500 words (configurable via `ADVANCED_PIPELINE_MIN_WORDS`)
- **Quick Pipeline**: Used for texts < 1500 words
- **Configuration**: `USE_ADVANCED_PIPELINE` setting

### 3. Language Detection
- **Service**: `LanguageDetectionService`
- **Process**: Detects language of input text (auto-detection if not provided)
- **Fallback**: Uses provided language parameter if available

### 4. Length Mode Processing

#### Length Mode Ratios (Updated)
- **Keep it as is (standard)**: 1.2~1.3x (120-130% of original)
  - Config: `LENGTH_STANDARD_MIN_RATIO = 1.2`, `LENGTH_STANDARD_MAX_RATIO = 1.3`
  - Target: Slight expansion with human markers
  
- **Make it shorter**: 80~95% of original
  - Config: `LENGTH_SHORTEN_MIN_RATIO = 0.80`, `LENGTH_SHORTEN_MAX_RATIO = 0.95`
  - Target: More concise while preserving key points
  
- **Make it longer**: 1.5~2.7x (150-270% of original)
  - Config: `LENGTH_EXPAND_MIN_RATIO = 1.5`, `LENGTH_EXPAND_MAX_RATIO = 2.7`
  - Target: Significant expansion with details and examples

#### Length Enforcement
- Word count targets are calculated based on length mode
- Prompts include explicit word count ranges
- Post-processing validation ensures output falls within target range
- Correction pass runs if output is outside target range

### 5. Quick Pipeline (< 1500 words)

#### Steps:
1. **ASCII Conversion** (already done)
2. **Line Break Normalization**
3. **Format Metadata Extraction** (for paragraph preservation)
4. **Prompt Selection**:
   - V4 prompts (Originality.AI optimized) - **RECOMMENDED**
   - V2 prompts (strategic subtlety)
   - Original prompts (fallback)
5. **Single-Pass Humanization**:
   - Uses selected prompt template
   - Word count targets included in prompt
   - Grammar rules enforced
   - ASCII conversion instructions included
6. **Post-Processing**:
   - Remove AI patterns (em-dashes, etc.)
   - V4 pattern breaking (if enabled)
   - Grammar error fixes
   - Phrase repetition prevention
   - Invisible character injection (for AI detection bypass)

### 6. Advanced Pipeline (>= 1500 words)

#### Steps:
1. **ASCII Conversion** (already done)
2. **Line Break Normalization**
3. **Format Metadata Extraction**
4. **Style Conditioning** (if style sample provided)
5. **Text Chunking** (with overlap for smooth transitions)
6. **Per-Chunk Processing**:
   - **Phase 1: Compression** - Convert to human-style outline
   - **Phase 2: Reconstruction** - Rebuild with natural human style
7. **Reassembly** - Join chunks with boundary smoothing
8. **Final Polish** - Lightweight optimization pass
9. **Length Enforcement** - Ensure output matches length mode
10. **Post-Processing** (same as quick pipeline)

### 7. Grammar Enforcement

#### Critical Grammar Rules (Enforced in All Modes):
✅ **Complete Sentences**: Every sentence must have subject and verb
✅ **Proper Capitalization**: Only at sentence start and for proper nouns
✅ **Proper Punctuation**: No double punctuation, no missing periods
✅ **No Fragments**: Never write incomplete sentences
✅ **Grammar Corrections**: Automatic fixes for common errors:
   - Double punctuation → Single
   - Double commas → Single
   - "helped dragged" → "helped bring"
   - Missing "On" before dates
   - Fragment sentences → Complete sentences

#### Grammar Fixes Applied:
- `fix_common_grammar_errors()` - Comprehensive grammar correction
- `prevent_phrase_repetition()` - Avoids repetitive phrases
- Pattern breaking enhancements (V4)

### 8. ASCII Conversion in Prompts

#### Instructions Included:
- System prompts explicitly instruct LLM to convert non-ASCII characters
- User prompts include ASCII conversion requirements
- Conversion happens both:
  1. **Pre-processing**: Automatic conversion via `InputSanitizer.convert_to_ascii()`
  2. **In prompts**: LLM instructed to maintain ASCII-only output

### 9. Validation

#### Semantic Similarity Check:
- Ensures humanized text maintains meaning of original
- Threshold: `SEMANTIC_SIMILARITY_THRESHOLD = 0.85`
- Uses embedding-based comparison

#### Style Similarity Check (if style sample provided):
- Compares output to provided style sample
- Threshold: `STYLE_SIMILARITY_THRESHOLD = 0.75`
- Uses embedding-based comparison

### 10. Final Output

#### Output Dictionary Contains:
- `humanized_text`: Final humanized text (ASCII-only, grammar-correct)
- `language`: Detected/target language
- `metrics`: 
  - Semantic similarity score
  - Word count (original vs. humanized)
  - Processing time
  - Chunks used (advanced pipeline)
- `metadata`:
  - Language confidence
  - Pipeline used (quick/advanced)
  - Model used
  - Validation results

## Advanced Mode Features

### When `advanced_mode = True`:
- Uses advanced pipeline regardless of text length
- Multi-phase processing for maximum quality
- Enhanced pattern breaking
- More thorough grammar enforcement
- Better length mode adherence

## Configuration

### Key Settings (`config.py`):
- `USE_V4_PROMPTS = True` - Use Originality.AI optimized prompts
- `USE_ADVANCED_PIPELINE = False` - Use quick pipeline by default
- `ADVANCED_PIPELINE_MIN_WORDS = 1500` - Threshold for advanced pipeline
- `LENGTH_STANDARD_MIN_RATIO = 1.2` - Keep it as is: minimum 120%
- `LENGTH_STANDARD_MAX_RATIO = 1.3` - Keep it as is: maximum 130%
- `LENGTH_SHORTEN_MIN_RATIO = 0.80` - Make shorter: minimum 80%
- `LENGTH_SHORTEN_MAX_RATIO = 0.95` - Make shorter: maximum 95%
- `LENGTH_EXPAND_MIN_RATIO = 1.5` - Make longer: minimum 150%
- `LENGTH_EXPAND_MAX_RATIO = 2.7` - Make longer: maximum 270%

## Quality Assurance

### Grammar Checks:
- ✅ Complete sentences only
- ✅ Proper capitalization
- ✅ Proper punctuation
- ✅ No fragments
- ✅ No double punctuation
- ✅ No grammar errors

### ASCII Compliance:
- ✅ All non-ASCII characters converted
- ✅ Output is ASCII-only
- ✅ Special characters properly mapped

### Length Compliance:
- ✅ Output within target word count range
- ✅ Correction pass if outside range
- ✅ Length mode properly enforced

## Error Handling

- ASCII conversion failures: Logged, text continues with best-effort conversion
- Grammar fixes: Applied automatically, errors logged
- Length correction: Automatic correction pass if needed
- Validation failures: Logged, but output still returned (with warnings)

## Performance Optimizations

- Fast model (Haiku) used for quick pipeline when enabled
- Validation can be skipped for quick pipeline (not recommended)
- Pattern breaking aggressiveness adjusted based on Originality.AI optimization
- Chunking with overlap for better boundary handling


