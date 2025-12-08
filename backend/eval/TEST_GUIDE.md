# Comprehensive Testing Guide

This guide explains all available tests for the `/humanize` and `/detect` endpoints.

## Quick Reference

### Basic Tests (Fast)
```bash
# Run core tests only (~5-10 minutes)
python eval/scripts/run_all_tests.py --max-samples 2 --skip-detector-passrate
```

### Extended Tests (Comprehensive)
```bash
# Run all tests including extended suite (~30-60 minutes)
python eval/scripts/run_all_tests.py --max-samples 3 --extended
```

### Unit Tests (Fastest)
```bash
# Run pytest unit tests (~1-2 minutes)
pytest tests/ -v
```

## Test Categories

### 1. Core Tests (Always Run)

#### Test 1: /detect Accuracy
**File:** `eval/scripts/test_detect_accuracy.py`

**What it tests:**
- Can /detect correctly identify AI vs human text?
- Measures accuracy, precision, recall

**Metrics:**
- Accuracy ≥ 80%
- Works on both AI and human datasets

**Runtime:** ~2-5 minutes

#### Test 2: Semantic Preservation
**File:** `eval/scripts/test_semantic_preservation.py`

**What it tests:**
- Does humanization preserve meaning?
- Uses multilingual embeddings for similarity

**Metrics:**
- Mean similarity ≥ 0.85
- ≥85% of samples pass threshold

**Runtime:** ~3-5 minutes (first run slower due to model download)

#### Test 3: Style Adherence
**File:** `eval/scripts/test_style_adherence.py`

**What it tests:**
- Does humanization follow requested tone/style?
- Compares to style samples if available

**Metrics:**
- ≥75% match requested tone
- Style similarity improves vs original

**Runtime:** ~3-5 minutes

#### Test 4: Detector Pass-Rate (Optional, Expensive)
**File:** `eval/scripts/test_detector_passrate.py`

**What it tests:**
- **PRIMARY BUSINESS METRIC**
- Does humanization reduce AI detection scores?
- Tests before/after humanization

**Metrics:**
- ≥75% of samples achieve ≥70% human likelihood
- Measures Δ human likelihood

**Runtime:** ~10-30 minutes (calls external APIs)
**Cost:** May incur API costs from external detectors

### 2. Extended Tests (Run with --extended)

#### Test 5: Fluency & Readability
**File:** `eval/scripts/test_fluency_readability.py`

**What it tests:**
- Grammar errors don't increase
- Readability scores maintained
- Uses LanguageTool for grammar checking

**Metrics:**
- Grammar degradation ≤ 5 errors per 100 words
- Readability drop ≤ 20 Flesch points

**Runtime:** ~5-10 minutes
**Dependencies:** `language-tool-python`

#### Test 6: Constraint Satisfaction
**File:** `eval/scripts/test_constraint_satisfaction.py`

**What it tests:**
- Language preservation (output = input language)
- Length mode constraints (shorten/expand/standard)
- Format preservation

**Metrics:**
- ≥85% constraint satisfaction
- All 3 length modes work correctly

**Runtime:** ~5-10 minutes
**Dependencies:** `langdetect`

#### Test 7: Adversarial & Robustness
**File:** `eval/scripts/test_adversarial_robustness.py`

**What it tests:**
- AI → Humanize → Detect (evasion rate)
- Human → Humanize → Detect (preservation)
- Multiple rounds of humanization
- Edge cases (short, long, special chars)

**Metrics:**
- ≥60% evasion rate for AI texts
- ≥80% preservation rate for human texts
- Quality maintained after multiple rounds

**Runtime:** ~10-15 minutes

#### Test 8: Ensemble Calibration
**File:** `eval/scripts/test_ensemble_calibration.py`

**What it tests:**
- ROC-AUC (discrimination ability)
- PR-AUC (precision-recall trade-off)
- Brier Score (calibration quality)
- ECE (Expected Calibration Error)
- Confusion matrix analysis

**Metrics:**
- Accuracy ≥ 0.80
- ROC-AUC ≥ 0.85
- Brier Score ≤ 0.20
- ECE ≤ 0.15

**Runtime:** ~3-5 minutes
**Dependencies:** `scikit-learn`

### 3. Specialized Tests

#### Length Mode Tests
**File:** `eval/scripts/test_length_mode.py`

**What it tests:**
- Shorten: output ≤ 0.8x input
- Expand: output ≥ 1.2x input
- Standard: 0.9-1.1x input

**Usage:**
```bash
python eval/scripts/test_length_mode.py --max-samples 3
```

#### Multi-Language Matrix
**File:** `eval/scripts/test_multi_language_matrix.py`

**What it tests:**
- All combinations of:
  - Languages (EN, ES, ZH, HI, AR)
  - Tones (8 options)
  - Length modes (3 options)
- Total: 120 combinations per sample

**Usage:**
```bash
# Test all combinations
python eval/scripts/test_multi_language_matrix.py

# Sample specific tones
python eval/scripts/test_multi_language_matrix.py --sample-tones Academic Professional

# Sample specific modes
python eval/scripts/test_multi_language_matrix.py --sample-modes standard shorten
```

**Runtime:** ~20-40 minutes for full matrix

### 4. Unit Tests (Pytest)

#### Humanize Endpoint Tests
**File:** `tests/test_humanize_endpoint.py`

**What it tests:**
- Request validation
- All tone options
- All length modes
- Edge cases (empty, short, long, special chars)
- Concurrent requests
- Error handling

**Usage:**
```bash
pytest tests/test_humanize_endpoint.py -v
```

#### Detect Endpoint Tests
**File:** `tests/test_detect_endpoint.py`

**What it tests:**
- Request validation
- Response structure
- Caching behavior
- Edge cases
- Performance benchmarks
- Error handling

**Usage:**
```bash
pytest tests/test_detect_endpoint.py -v
```

## Running Tests

### Option 1: All-in-One Script

```bash
# Basic test suite (recommended for CI/CD)
python eval/scripts/run_all_tests.py --max-samples 2 --skip-detector-passrate

# Extended test suite (recommended before releases)
python eval/scripts/run_all_tests.py --max-samples 3 --extended

# Full test suite (nightly/weekly)
python eval/scripts/run_all_tests.py --extended
```

### Option 2: Individual Tests

```bash
# Core tests
python eval/scripts/test_semantic_preservation.py
python eval/scripts/test_style_adherence.py
python eval/scripts/test_detect_accuracy.py

# Extended tests
python eval/scripts/test_fluency_readability.py --max-samples 3
python eval/scripts/test_constraint_satisfaction.py --max-samples 2
python eval/scripts/test_adversarial_robustness.py --max-samples 2
python eval/scripts/test_ensemble_calibration.py --max-samples 5
```

### Option 3: Pytest Unit Tests

```bash
# Run all unit tests
pytest tests/ -v

# Run specific test file
pytest tests/test_humanize_endpoint.py -v

# Run with coverage
pytest tests/ --cov=src --cov-report=html

# Run only fast tests
pytest tests/ -m "not slow"
```

## Dependencies

### Core Dependencies (Required)
```bash
pip install httpx sentence-transformers numpy torch pydantic python-dotenv
```

### Extended Test Dependencies (Optional)
```bash
pip install scikit-learn language-tool-python langdetect
```

### Unit Test Dependencies
```bash
pip install pytest pytest-asyncio pytest-cov fastapi
```

### Install All
```bash
pip install -r eval/requirements.txt
```

## Configuration

Edit `eval/config.py` or set environment variables:

```python
# Test thresholds
SEMANTIC_SIMILARITY_THRESHOLD = 0.85
STYLE_SIMILARITY_THRESHOLD = 0.75
DETECTOR_PASS_THRESHOLD = 0.70
DETECTOR_SUCCESS_RATE = 0.75

# Length mode tolerances
LENGTH_STANDARD_MIN = 0.9
LENGTH_STANDARD_MAX = 1.1
LENGTH_SHORTEN_MAX = 0.8
LENGTH_EXPAND_MIN = 1.2
```

## Results

All test results are saved to `eval/results/` as JSON files with timestamps.

Example files:
- `semantic_preservation_20240115_143022.json`
- `detector_passrate_20240115_150045.json`
- `full_eval_20240115_153012.json`

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Backend Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          cd backend
          pip install -r eval/requirements.txt
      
      - name: Run unit tests
        run: |
          cd backend
          pytest tests/ -v
      
      - name: Run evaluation tests
        run: |
          cd backend
          python eval/scripts/run_all_tests.py --max-samples 1 --skip-detector-passrate
        env:
          API_BASE_URL: http://localhost:8000
```

## Troubleshooting

### Common Issues

#### "No datasets found"
```bash
# Generate test samples first
python eval/scripts/generate_ai_samples.py --samples 3
```

#### "Could not connect to API"
```bash
# Make sure backend is running
cd backend
uv run uvicorn src.index:app --reload --port 8000
```

#### "LanguageTool errors"
```bash
# Install Java (required for LanguageTool)
sudo apt-get install default-jre  # Ubuntu/Debian
brew install java                  # macOS
```

#### "Model download takes forever"
```bash
# Pre-download models
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('paraphrase-multilingual-mpnet-base-v2')"
```

## Best Practices

### Before Committing Code
```bash
# Run fast tests
pytest tests/ -v
python eval/scripts/run_all_tests.py --max-samples 1 --skip-detector-passrate
```

### Before Pull Request
```bash
# Run extended tests
pytest tests/ -v
python eval/scripts/run_all_tests.py --max-samples 2 --extended --skip-detector-passrate
```

### Before Release
```bash
# Run full suite
pytest tests/ -v --cov=src
python eval/scripts/run_all_tests.py --max-samples 5 --extended
python eval/scripts/test_multi_language_matrix.py
```

### Weekly/Nightly
```bash
# Full regression suite with external detectors
python eval/scripts/run_all_tests.py --extended
python eval/scripts/test_multi_language_matrix.py --test-detect
```

## Summary

| Test Suite | Runtime | Cost | Use Case |
|------------|---------|------|----------|
| Unit Tests | 1-2 min | Free | Every commit |
| Core Tests | 5-10 min | Free | PR reviews |
| Extended Tests | 30-60 min | Free | Before release |
| Full Suite | 60-90 min | $$ | Weekly/Nightly |
| Matrix Tests | 20-40 min | Free | Language coverage |

Choose the appropriate test suite based on your needs and time constraints.







