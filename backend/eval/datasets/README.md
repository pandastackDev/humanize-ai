# Evaluation Datasets

This directory contains test datasets for evaluating the `/humanize` and `/detect` endpoints.

## Directory Structure

```
datasets/
├── ai_only/          # AI-generated texts (various LLMs, tones, languages)
├── human_only/       # Real human-written texts
├── mixed/            # Hybrid texts (AI + human edits, or human + AI rewrites)
├── style_samples/    # Style samples (150-300 words) for each tone/language
└── README.md         # This file
```

## Dataset Format

Each dataset file is a JSON array of test samples with the following structure:

```json
{
  "id": "unique_identifier",
  "text": "The actual text content...",
  "metadata": {
    "language": "en",
    "tone": "Academic",
    "word_count": 500,
    "source": "human_written|ai_generated|mixed",
    "generator": "human|gpt4|claude|gemini|mixed",
    "domain": "history|technology|science|blog|...",
    "date_added": "2025-12-03"
  }
}
```

## Dataset Requirements

### AI-Only Pool
- **Short texts**: 80-200 words
- **Long texts**: 400-800 words
- **Tones**: Standard, Professional, Academic, Blog/SEO, Casual, Creative, Scientific, Technical
- **Languages**: English, Spanish, Chinese (Simplified), Hindi, Arabic, French, Bengali, Russian, Portuguese, Indonesian, Ukrainian, Polish (12 languages total)

### Human-Only Pool
- Real human-written content from verified sources
- Same length and language distribution as AI pool
- Labeled by tone/domain

### Mixed Pool
- AI text + human edits
- Human text + AI rewrites
- Partially edited content

### Style Samples
- 150-300 words per sample
- Organized by tone and language
- Used for `style_sample` parameter testing

## Ground Truth Labels

**Critical**: Every sample must have accurate ground truth labels:
- `source`: "human_written" | "ai_generated" | "mixed"
- `generator`: Specific model or "human"
- This is essential for evaluation accuracy

## Usage

These datasets are used by:
- `eval/scripts/test_semantic_preservation.py`
- `eval/scripts/test_style_adherence.py`
- `eval/scripts/test_detector_passrate.py`
- `eval/scripts/test_detect_accuracy.py`
- `eval/scripts/test_language_detection.py`

