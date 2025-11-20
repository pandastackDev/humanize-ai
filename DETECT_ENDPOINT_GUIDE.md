# AI Detection Endpoint Guide

## Overview

The `/detect` endpoint provides comprehensive AI content detection using multiple external APIs and internal linguistic analysis. It helps determine whether text is AI-generated or human-written.

## Features

### ✅ Multiple Detection Methods

1. **External API Detectors**
   - GPTZero
   - CopyLeaks
   - Sapling
   - Writer.com
   - ZeroGPT
   - Originality.ai
   - QuillBot

2. **Internal Linguistic Analysis**
   - Perplexity scoring
   - Entropy calculation
   - N-gram variance
   - Sentence pattern analysis
   - Lexical diversity
   - Burstiness scoring

### ✅ Key Capabilities

- **Unified Scoring**: Combines results from multiple detectors with confidence weighting
- **Caching**: Automatic caching of detection results for faster repeat queries
- **Comparison Mode**: Compare before/after humanization effectiveness
- **Privacy Controls**: Optional detector selection and anonymized analysis
- **Multilingual Support**: Works with multiple languages via auto-detection

---

## API Endpoints

### 1. POST `/api/v1/detect/`

Detect AI-generated content in text.

#### Request Body

```json
{
  "text": "The text to analyze...",
  "language": "en",  // Optional, auto-detected if not provided
  "detectors": ["gptzero", "copyleaks"],  // Optional, all if not specified
  "include_internal_analysis": true,  // Optional, default true
  "enable_caching": true  // Optional, default true
}
```

#### Response

```json
{
  "text_sample": "The text to analyze...",
  "language": "en",
  "human_likelihood_pct": 72.5,
  "ai_likelihood_pct": 27.5,
  "confidence": 0.85,
  "detector_results": [
    {
      "detector": "gptzero",
      "ai_probability": 0.28,
      "human_probability": 0.72,
      "confidence": 0.87,
      "response_time_ms": 450,
      "details": {}
    }
  ],
  "internal_analysis": {
    "perplexity_score": 45.2,
    "entropy_score": 0.78,
    "ngram_variance": 0.65,
    "avg_sentence_length": 18.5,
    "sentence_length_variance": 42.3,
    "lexical_diversity": 0.72,
    "burstiness_score": 0.68,
    "ai_likelihood_internal": 0.32
  },
  "metadata": {
    "word_count": 125,
    "character_count": 650,
    "processing_time_ms": 1500,
    "detectors_used": 3,
    "detectors_succeeded": 3,
    "detectors_failed": 0
  },
  "cached": false
}
```

#### Status Codes

- `200 OK`: Detection successful
- `400 Bad Request`: Invalid input (empty text, too short, etc.)
- `500 Internal Server Error`: Detection failed

---

### 2. POST `/api/v1/detect/compare`

Compare detection results before and after humanization.

#### Request Body

```json
{
  "original_text": "Original AI-generated text...",
  "humanized_text": "Humanized version...",
  "detectors": ["gptzero"]  // Optional
}
```

#### Response

```json
{
  "original": {
    "human_likelihood_pct": 35.2,
    "ai_likelihood_pct": 64.8,
    "confidence": 0.82
  },
  "humanized": {
    "human_likelihood_pct": 78.6,
    "ai_likelihood_pct": 21.4,
    "confidence": 0.88
  },
  "improvement": {
    "human_likelihood_delta": 43.4,
    "ai_likelihood_delta": -43.4,
    "improvement_percentage": 67.0
  },
  "summary": "Humanization improved human likelihood by 43.4%"
}
```

---

## Frontend Integration

### AI Detector Component

Use the `AIDetector` component to provide a user-friendly detection interface:

```tsx
import { AIDetector } from "@/app/components/ai-detector";

export default function DetectorPage() {
  return (
    <div>
      <h1>AI Content Detector</h1>
      <AIDetector />
    </div>
  );
}
```

### Evaluation Dashboard

Compare before/after humanization with the `EvaluationDashboard`:

```tsx
import { EvaluationDashboard } from "@/app/components/evaluation-dashboard";

export default function EvaluationPage() {
  return (
    <div>
      <h1>Humanization Evaluation</h1>
      <EvaluationDashboard />
    </div>
  );
}
```

### API Client Usage

Direct API calls using the client functions:

```typescript
import { detectAIContent, compareDetection } from "@/lib/detect-api";

// Single detection
const result = await detectAIContent({
  text: "Text to analyze...",
  detectors: ["gptzero", "copyleaks"],
  include_internal_analysis: true,
});

console.log(`Human likelihood: ${result.human_likelihood_pct}%`);

// Compare before/after
const comparison = await compareDetection({
  original_text: "Original text...",
  humanized_text: "Humanized text...",
});

console.log(`Improvement: ${comparison.improvement.human_likelihood_delta}%`);
```

---

## Configuration

### Environment Variables

Add detection API keys to your `.env` file (optional - works in demo mode without keys):

```bash
# AI Detection API Keys
GPTZERO_API_KEY=your_key_here
COPYLEAKS_API_KEY=your_key_here
SAPLING_API_KEY=your_key_here
WRITER_API_KEY=your_key_here
ZEROGPT_API_KEY=your_key_here
ORIGINALITY_API_KEY=your_key_here
QUILLBOT_API_KEY=your_key_here
TURNITIN_API_KEY=your_key_here
GRAMMARLY_API_KEY=your_key_here
SCRIBBR_API_KEY=your_key_here

# Detection Cache Configuration
DETECTION_CACHE_SIZE=1000
DETECTION_CACHE_TTL_SECONDS=3600
```

### Cache Settings

The detection service includes an in-memory cache to improve performance:

- **Cache Size**: 1000 entries (configurable via `DETECTION_CACHE_SIZE`)
- **TTL**: 1 hour (configurable via `DETECTION_CACHE_TTL_SECONDS`)
- **Key Generation**: SHA-256 hash of text + selected detectors
- **Eviction**: LRU (Least Recently Used) when cache is full

---

## Internal Analysis Metrics

### Perplexity Score (0-100)

Measures text predictability using Claude API.

- **0-30**: Unpredictable, creative (human-like)
- **30-60**: Moderate predictability
- **60-100**: Highly predictable (AI-like)

### Entropy Score (0-1)

Shannon entropy of word distribution.

- **Higher**: More varied vocabulary (human-like)
- **Lower**: More uniform/repetitive (AI-like)

### N-gram Variance (0-1)

Variation in word sequence patterns (bigrams).

- **Higher**: More varied patterns (human-like)
- **Lower**: Repetitive patterns (AI-like)

### Lexical Diversity (0-1)

Ratio of unique words to total words.

- **Higher**: More diverse vocabulary (human-like)
- **Lower**: Repetitive vocabulary (AI-like)

### Burstiness Score (0-1)

Variation in word usage patterns (clustering vs. uniform).

- **Higher**: Bursty, clustered usage (human-like)
- **Lower**: Uniform distribution (AI-like)

### Sentence Metrics

- **Average Length**: Mean words per sentence
- **Length Variance**: Variation in sentence lengths (higher = more human-like)

---

## Detection Algorithms

### External Detectors

Each external detector uses proprietary algorithms:

1. **GPTZero**: Specialized in detecting GPT-generated content
2. **CopyLeaks**: Multi-model AI detection
3. **Sapling**: Linguistic pattern analysis
4. **Writer**: Enterprise-grade detection
5. **ZeroGPT**: Fast detection with high accuracy
6. **Originality.ai**: Focused on SEO content
7. **QuillBot**: Paraphrasing and AI detection

### Weighted Scoring

The unified score combines:

1. Individual detector scores weighted by confidence
2. Internal analysis (if enabled) with 0.85 confidence
3. Average confidence across all successful detections

Formula:
```
weighted_human = Σ(score × confidence) / Σ(confidence)
```

---

## Best Practices

### 1. Minimum Text Length

- Use at least **10 words** for any detection
- **50+ words** recommended for accurate results
- **200+ words** ideal for comprehensive analysis

### 2. Detector Selection

- **Quick Check**: Use `gptzero` or `zerogpt` (fastest)
- **Comprehensive**: Use all detectors (most accurate)
- **Budget-Conscious**: Use internal analysis only (free)

### 3. Caching Strategy

- Enable caching for repeated analysis of same content
- Disable for real-time, always-fresh results
- Clear cache periodically (automatic after 1 hour)

### 4. Error Handling

```typescript
try {
  const result = await detectAIContent({ text });
  // Use result
} catch (error) {
  if (error.message.includes("too short")) {
    // Handle short text error
  } else if (error.message.includes("failed")) {
    // Handle detection failure
  }
}
```

### 5. Privacy Considerations

- Text is not stored permanently (only cached temporarily)
- API calls to external detectors include text content
- For sensitive content, use internal analysis only
- Disable caching for confidential text

---

## Evaluation Dashboard Usage

### Step 1: Prepare Texts

1. Paste original (possibly AI-generated) text in left panel
2. Paste humanized version in right panel
3. Ensure both have at least 10 words

### Step 2: Run Comparison

Click "Compare Detection Results" button.

### Step 3: Analyze Results

Review the improvement metrics:

- **Human Likelihood Gain**: Absolute percentage increase
- **Relative Improvement**: Percentage of potential improvement achieved
- **AI Likelihood Reduction**: How much AI score decreased

### Interpreting Results

- **+10% or more**: Excellent humanization
- **+5% to +10%**: Good improvement
- **0% to +5%**: Minor improvement
- **Negative**: Humanization didn't help (rare)

---

## Performance Optimization

### Parallel Detection

All external detectors run concurrently using `asyncio.gather()`:

```python
tasks = [
    self._detect_gptzero(text),
    self._detect_copyleaks(text),
    # ... more detectors
]
results = await asyncio.gather(*tasks, return_exceptions=True)
```

### Response Times

Typical response times:

- **Internal Analysis Only**: 100-300ms
- **Single External Detector**: 500-1500ms
- **All Detectors**: 1500-3000ms (parallel)
- **Cached Result**: < 10ms

---

## Troubleshooting

### Issue: "Text must contain at least 10 words"

**Solution**: Provide longer text. Short snippets can't be accurately analyzed.

### Issue: All detectors showing errors

**Solution**: Check API keys in `.env` file. Detectors work in demo mode without keys but use simple heuristics.

### Issue: Low confidence scores

**Solution**: Detectors disagree on classification. Consider:
- Using more detectors for consensus
- Providing longer text
- Checking if text is ambiguous or edge case

### Issue: Slow detection

**Solution**: 
- Use fewer detectors for faster results
- Enable caching for repeated queries
- Use internal analysis only (fastest)

---

## API Rate Limits

External APIs have rate limits:

- **GPTZero**: 100 requests/minute
- **CopyLeaks**: 50 requests/minute
- **Sapling**: 100 requests/minute
- **Others**: Varies by provider

The service automatically handles:
- Timeouts (30 seconds per detector)
- Errors (returns partial results)
- Retries (not implemented yet - future enhancement)

---

## Future Enhancements

### Planned Features

1. **Redis Cache**: Replace in-memory cache with Redis for multi-instance support
2. **Convex Integration**: Store detection history in Convex
3. **Rate Limiting**: Per-user rate limits for API protection
4. **Webhooks**: Async detection with webhook callbacks
5. **Batch Detection**: Analyze multiple texts in one request
6. **Historical Tracking**: Track detection scores over time
7. **Custom Thresholds**: User-configurable AI/human thresholds
8. **Advanced Analytics**: Detailed linguistic feature visualization

### Experimental Features

- **Model Training**: Train custom detection models on your data
- **Adversarial Testing**: Test against detection evasion techniques
- **Style Fingerprinting**: Identify specific AI model signatures

---

## Examples

### Example 1: Quick Detection

```typescript
const result = await detectAIContent({
  text: "Your text here...",
  detectors: ["gptzero"], // Fast, single detector
  include_internal_analysis: false,
});

console.log(`AI probability: ${result.ai_likelihood_pct}%`);
```

### Example 2: Comprehensive Analysis

```typescript
const result = await detectAIContent({
  text: "Your text here...",
  // Use all detectors (omit 'detectors' parameter)
  include_internal_analysis: true,
  enable_caching: true,
});

// Show all detector results
result.detector_results.forEach(d => {
  console.log(`${d.detector}: ${d.human_probability * 100}% human`);
});

// Show internal metrics
if (result.internal_analysis) {
  console.log(`Perplexity: ${result.internal_analysis.perplexity_score}`);
  console.log(`Entropy: ${result.internal_analysis.entropy_score}`);
}
```

### Example 3: Evaluation Workflow

```typescript
// 1. Detect original text
const originalResult = await detectAIContent({
  text: originalText,
});

console.log(`Original: ${originalResult.human_likelihood_pct}% human`);

// 2. Humanize the text (using your humanization API)
const humanizedText = await humanizeText({ input_text: originalText });

// 3. Compare results
const comparison = await compareDetection({
  original_text: originalText,
  humanized_text: humanizedText.humanized_text,
});

console.log(comparison.summary);
console.log(`Improvement: ${comparison.improvement.improvement_percentage}%`);
```

---

## Support

For issues or questions:

1. Check this documentation
2. Review backend logs: `backend/src/api/services/detection_service.py`
3. Test with demo mode (no API keys required)
4. Contact support with error details

---

## License

This detection service is part of the Humanize application.

© 2024 Humanize AI. All rights reserved.

