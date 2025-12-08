# Evaluation Framework for Humanize/Detect APIs

This evaluation framework tests the `/humanize` and `/detect` endpoints across multiple dimensions:

- ✅ **Semantic preservation** - meaning unchanged after humanization
- ✅ **Style adherence** - follows requested tone/style
- ✅ **Detector pass-rate** - AI detection scores drop after humanization
- ✅ **Detect accuracy** - correctly identifies AI vs human text
- ✅ **Language support** - works across multiple languages

## Quick Start

### 1. Install Dependencies

```bash
cd backend/eval
pip install -r requirements.txt
```

Or using uv:

```bash
uv pip install -r requirements.txt
```

### 2. Configure Environment

Create a `.env` file in the `backend/` directory:

```bash
# API endpoint (local or deployed)
API_BASE_URL=http://localhost:8000

# LLM APIs (for generating test samples)
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here

# External detector APIs (optional, for pass-rate testing)
GPTZERO_API_KEY=your_key_here
ZEROGPT_API_KEY=your_key_here
ORIGINALITY_API_KEY=your_key_here
# ... etc
```

### 3. Generate Test Datasets

Before running tests, you need test data. You can either:

**Option A: Use the included sample** (WWII text - already included)

```bash
# The human sample is already in datasets/human_only/english_academic_long.json
# You can start testing right away
```

**Option B: Generate AI samples**

```bash
cd backend
python eval/scripts/generate_ai_samples.py --samples 3
```

This will create AI-generated texts using GPT-4 and Claude across different tones.

### 4. Run Tests

**Run all tests:**

```bash
cd backend
python eval/scripts/run_all_tests.py
```

**Run individual tests:**

```bash
# Test semantic preservation
python eval/scripts/test_semantic_preservation.py

# Test style adherence
python eval/scripts/test_style_adherence.py

# Test /detect accuracy
python eval/scripts/test_detect_accuracy.py

# Test detector pass-rate (this is slow and uses external APIs)
python eval/scripts/test_detector_passrate.py --max-samples 3
```

**Limit samples to save time/cost:**

```bash
python eval/scripts/run_all_tests.py --max-samples 2
```

**Skip expensive external detector tests:**

```bash
python eval/scripts/run_all_tests.py --skip-detector-passrate
```

## What Each Test Does

### 1. Test Semantic Preservation

**File:** `scripts/test_semantic_preservation.py`

**Purpose:** Verify that humanization doesn't change the meaning.

**How it works:**
1. Takes original text
2. Calls `/humanize` to get humanized version
3. Computes embedding similarity using multilingual transformer model
4. Checks if similarity ≥ 0.85 (configurable)

**Pass criteria:** ≥85% of samples have similarity ≥ 0.85

### 2. Test Style Adherence

**File:** `scripts/test_style_adherence.py`

**Purpose:** Verify that humanization follows the requested tone/style.

**How it works:**
1. Takes original text with a target tone (e.g., "Academic", "Professional")
2. Calls `/humanize` with that tone
3. Optionally compares output to a style sample
4. Checks if output style matches the request

**Pass criteria:** ≥75% of samples match requested tone

### 3. Test Detect Accuracy

**File:** `scripts/test_detect_accuracy.py`

**Purpose:** Verify that `/detect` correctly identifies AI vs human text.

**How it works:**
1. Takes texts with known ground truth (AI or human)
2. Calls `/detect` on each
3. Compares predicted label to ground truth

**Pass criteria:** ≥80% accuracy overall

### 4. Test Detector Pass-Rate

**File:** `scripts/test_detector_passrate.py`

**Purpose:** **PRIMARY BUSINESS METRIC** - verify that humanization reduces AI detection.

**How it works:**
1. Takes AI-generated text
2. Calls `/detect` on original → gets AI score
3. Calls `/humanize` to humanize it
4. Calls `/detect` on humanized → gets new AI score
5. Measures improvement: Δ human likelihood

**Pass criteria:** ≥75% of samples achieve ≥70% human likelihood after humanization

**⚠️ Warning:** This test calls external detector APIs and can be slow/expensive. Use `--max-samples` to limit.

## Directory Structure

```
eval/
├── README.md                 # This file
├── requirements.txt          # Python dependencies
├── config.py                 # Configuration settings
│
├── datasets/                 # Test datasets
│   ├── README.md
│   ├── ai_only/              # AI-generated texts
│   │   ├── english_ai_long.json
│   │   └── english_ai_short.json
│   ├── human_only/           # Human-written texts
│   │   └── english_academic_long.json
│   ├── mixed/                # Hybrid texts
│   └── style_samples/        # Style samples for each tone
│
├── scripts/                  # Test scripts
│   ├── run_all_tests.py                  # Main test runner
│   ├── generate_ai_samples.py            # Generate test data
│   ├── test_semantic_preservation.py     # Semantic test
│   ├── test_style_adherence.py           # Style test
│   ├── test_detect_accuracy.py           # Detect accuracy
│   └── test_detector_passrate.py         # Pass-rate test
│
└── results/                  # Test results (JSON)
    ├── semantic_preservation_*.json
    ├── style_adherence_*.json
    ├── detect_accuracy_*.json
    ├── detector_passrate_*.json
    └── full_eval_*.json
```

## Configuration

Edit `config.py` or set environment variables to customize:

```python
# Test thresholds
SEMANTIC_SIMILARITY_THRESHOLD = 0.85
STYLE_SIMILARITY_THRESHOLD = 0.75
DETECTOR_PASS_THRESHOLD = 0.70
DETECTOR_SUCCESS_RATE = 0.75

# Supported tones
SUPPORTED_TONES = [
    "Standard", "Professional", "Academic", 
    "Blog/SEO", "Casual", "Creative", 
    "Scientific", "Technical"
]

# Tier 1 languages (full testing)
TIER1_LANGUAGES = ["en", "es", "zh", "hi", "ar"]
```

## Adding New Test Data

### Add Human Samples

1. Create a JSON file in `datasets/human_only/`
2. Follow the format in existing files:

```json
[
  {
    "id": "unique_id",
    "text": "Your text here...",
    "metadata": {
      "language": "en",
      "tone": "Academic",
      "word_count": 500,
      "source": "human_written",
      "generator": "human",
      "domain": "history"
    }
  }
]
```

### Generate AI Samples

```bash
python eval/scripts/generate_ai_samples.py --samples 5 --openai --anthropic
```

### Add Style Samples

Create `datasets/style_samples/en_academic.json`:

```json
[
  {
    "id": "style_en_academic_001",
    "text": "150-300 word sample in academic tone...",
    "metadata": {
      "language": "en",
      "tone": "Academic",
      "word_count": 200
    }
  }
]
```

## Interpreting Results

Results are saved to `results/` as JSON files with detailed metrics.

### Example Output

```
================================================================================
                    HUMANIZE/DETECT EVALUATION SUITE
================================================================================

TEST 1: /detect ACCURACY
  ✅ detect_accuracy: PASSED
      Accuracy: 92.5%

TEST 2: SEMANTIC PRESERVATION
  ✅ semantic_preservation: PASSED
      Pass rate: 88.3%

TEST 3: STYLE ADHERENCE
  ✅ style_adherence: PASSED
      Pass rate: 81.2%

TEST 4: DETECTOR PASS-RATE
  ✅ detector_passrate: PASSED
      Pass rate: 76.7%

Overall: 4 passed, 0 failed, 0 errors, 0 skipped

✅ ALL TESTS PASSED
```

## Cost Considerations

- **Semantic/Style tests:** Use local embedding models (free after download)
- **Detect tests:** Call your own `/detect` endpoint (depends on your API costs)
- **Detector pass-rate:** Calls external APIs (ZeroGPT, GPTZero, etc.) - **can be expensive**

**To minimize costs:**
1. Use `--max-samples 2` to test on small subsets
2. Use `--skip-detector-passrate` to skip external API calls
3. Enable caching: `CACHE_DETECTOR_RESULTS=True` (default)

## Next Steps

1. ✅ **Start with what you have** - test with the WWII sample
2. 🔄 **Generate more samples** - run `generate_ai_samples.py`
3. 📊 **Run full eval** - `python eval/scripts/run_all_tests.py`
4. 📈 **Add more languages** - expand to Spanish, Chinese, etc.
5. 🎨 **Add style samples** - improve style adherence testing
6. 🔁 **CI/CD integration** - run tests on every deployment

## Troubleshooting

**"No datasets found"**
- Run `generate_ai_samples.py` first, or check that human samples exist

**"Failed to call /humanize"**
- Make sure your backend is running: `uv run uvicorn src.index:app --reload`
- Check `API_BASE_URL` in config

**"Failed to detect"**
- Check that external detector API keys are set
- Or use `SKIP_EXTERNAL_DETECTORS=True` for local-only testing

**Import errors**
- Install dependencies: `pip install -r eval/requirements.txt`
- Make sure you're in the `backend/` directory when running scripts

## Questions?

Refer to the client's comprehensive testing strategy document for the full methodology.

**Key documents:**
- `datasets/README.md` - Dataset format specification
- `config.py` - All configurable parameters
- Client's eval strategy (see task description)

