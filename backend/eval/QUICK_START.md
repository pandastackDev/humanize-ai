# Quick Start Guide - Testing Your Humanize/Detect APIs

This guide will get you testing in **5 minutes**.

## Step 1: Install Dependencies (1 min)

```bash
cd backend/eval
pip install -r requirements.txt
```

Or with uv:

```bash
cd backend
uv pip install -r eval/requirements.txt
```

## Step 2: Configure Environment (1 min)

Create `.env` file in `backend/` directory:

```bash
cd backend
cp eval/.env.example .env
```

Edit `.env` and set at minimum:

```bash
API_BASE_URL=http://localhost:8000

# For generating AI samples (optional):
OPENAI_API_KEY=sk-...
# OR
ANTHROPIC_API_KEY=sk-ant-...
```

**Note:** You can start testing immediately with the included human sample (WWII text). LLM API keys are only needed to generate more AI samples.

## Step 3: Start Your Backend (1 min)

In a separate terminal:

```bash
cd backend
uv run uvicorn src.index:app --reload --host 0.0.0.0 --port 8000
```

Verify it's running: http://localhost:8000/docs

## Step 4: Run Tests! (2 min)

### Option A: Quick Test (just the human sample)

```bash
cd backend

# Test semantic preservation
python eval/scripts/test_semantic_preservation.py

# Test /detect accuracy
python eval/scripts/test_detect_accuracy.py
```

### Option B: Generate AI Samples First (recommended)

```bash
cd backend

# Generate AI test samples (requires OpenAI or Anthropic API key)
python eval/scripts/generate_ai_samples.py --samples 2

# Run ALL tests
python eval/scripts/run_all_tests.py --max-samples 2
```

### Option C: Skip Expensive Tests

```bash
# Run all tests but skip external detector APIs
python eval/scripts/run_all_tests.py --skip-detector-passrate --max-samples 2
```

## What You Get

After running tests, you'll see:

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
```

Results are saved to `backend/eval/results/` as JSON files.

## Common Issues

**"No datasets found"**
- You need at least one dataset. Either:
  - The WWII sample is already included in `datasets/human_only/`
  - Generate AI samples: `python eval/scripts/generate_ai_samples.py`

**"Failed to call /humanize"**
- Make sure backend is running on port 8000
- Check `API_BASE_URL` in `.env`

**"Module not found"**
- Install dependencies: `pip install -r eval/requirements.txt`

## Next Steps

1. ✅ **You just tested with the WWII sample!**
2. 🤖 **Generate AI samples** - `python eval/scripts/generate_ai_samples.py --samples 3`
3. 📊 **Run full suite** - `python eval/scripts/run_all_tests.py`
4. 🌍 **Add more languages** - edit datasets or generate samples in Spanish/Chinese
5. 📈 **Track progress** - results are saved to `eval/results/`

## What Each Test Does (TL;DR)

| Test | What It Checks | Pass Criteria |
|------|----------------|---------------|
| **Semantic Preservation** | Meaning stays the same after humanization | ≥85% similarity |
| **Style Adherence** | Output matches requested tone | ≥75% match |
| **Detect Accuracy** | /detect correctly identifies AI vs human | ≥80% accuracy |
| **Detector Pass-Rate** | Humanization reduces AI detection scores | ≥75% samples pass |

## Full Documentation

See `README.md` for complete documentation.

## Your Sample Text

Your World War II text is already included as a test sample in:
```
backend/eval/datasets/human_only/english_academic_long.json
```

It's labeled as:
- **Source:** human_written
- **Tone:** Academic
- **Language:** English
- **Word count:** 523 words

This is a perfect example for testing! 🎯

