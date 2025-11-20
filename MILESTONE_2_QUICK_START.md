# Milestone 2 — Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide will help you quickly test the new AI Detection features.

---

## Prerequisites

- ✅ Backend running on `http://localhost:8000`
- ✅ Frontend running on `http://localhost:3000`
- ✅ Python environment activated (for backend)
- ✅ Node.js and pnpm installed (for frontend)

---

## Step 1: Start the Backend

```bash
cd backend
uv run fastapi dev src/api/main.py
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

---

## Step 2: Test Backend API (Optional)

Run the automated test script:

```bash
cd backend
python test_detect_endpoint.py
```

Or test manually with curl:

```bash
curl -X POST http://localhost:8000/api/v1/detect/ \
  -H "Content-Type: application/json" \
  -d '{
    "text": "The utilization of advanced technological systems facilitates enhanced productivity.",
    "include_internal_analysis": true
  }'
```

---

## Step 3: Start the Frontend

```bash
cd apps/next
pnpm dev
```

You should see:
```
- Local:   http://localhost:3000
```

---

## Step 4: Access the AI Detector

Open your browser and go to:

**http://localhost:3000/tools/ai-detector**

---

## 🎯 Quick Test Scenarios

### Scenario 1: Detect AI-Generated Text

1. Go to **AI Detector** tab
2. Paste this AI-like text:
   ```
   The utilization of advanced technological systems facilitates enhanced productivity
   and operational efficiency. Moreover, the implementation of sophisticated algorithms
   enables organizations to streamline their processes and optimize resource allocation.
   ```
3. Click **"Detect AI Content"**
4. ✅ **Expected**: Low human likelihood (20-40%)

### Scenario 2: Detect Human-Written Text

1. Clear the text area
2. Paste this human-like text:
   ```
   Hey! So I've been thinking about this project. You know what? I think we should
   totally go for it. It's risky, sure, but sometimes you gotta take chances.
   What do you think? Let me know!
   ```
3. Click **"Detect AI Content"**
4. ✅ **Expected**: High human likelihood (60-80%)

### Scenario 3: Compare Before/After Humanization

1. Switch to **Evaluation** tab
2. **Original Text** (left):
   ```
   The utilization of advanced technological systems facilitates enhanced productivity
   and operational efficiency within organizational frameworks.
   ```
3. **Humanized Text** (right):
   ```
   Using modern technology helps us work better and more efficiently in our company.
   ```
4. Click **"Compare Detection Results"**
5. ✅ **Expected**: Positive improvement showing increased human likelihood

---

## 🔍 What to Look For

### In the Results Panel:

1. **Overall Scores**
   - Human Likelihood % (green = good)
   - AI Likelihood % (red = AI-detected)
   - Confidence level

2. **Detector Breakdown**
   - Individual results from each detector
   - Response times
   - Confidence per detector

3. **Internal Analysis** (if enabled)
   - Perplexity score
   - Entropy score
   - Lexical diversity
   - Burstiness score

4. **Metadata**
   - Word count
   - Processing time
   - Number of detectors used
   - Cache status

---

## 🎨 UI Features to Test

### AI Detector Component

- [ ] Text input with word count
- [ ] Detector selection dropdown
- [ ] Internal analysis checkbox
- [ ] Loading state during detection
- [ ] Error messages for invalid input
- [ ] Results with color-coded scores
- [ ] Progress bars for visualization
- [ ] Copy results button
- [ ] Cached result indicator

### Evaluation Dashboard

- [ ] Side-by-side text comparison
- [ ] Word count for both texts
- [ ] Loading state
- [ ] Improvement summary card
- [ ] Before/after comparison charts
- [ ] Visual improvement bar
- [ ] Copy results button

---

## 🧪 API Endpoints to Test

### 1. Detection Endpoint

```bash
POST /api/v1/detect/

# Request
{
  "text": "Your text here...",
  "detectors": ["gptzero", "copyleaks"],  # Optional
  "include_internal_analysis": true,      # Optional
  "enable_caching": true                  # Optional
}

# Response
{
  "human_likelihood_pct": 72.5,
  "ai_likelihood_pct": 27.5,
  "confidence": 0.85,
  "detector_results": [...],
  "internal_analysis": {...},
  "cached": false
}
```

### 2. Comparison Endpoint

```bash
POST /api/v1/detect/compare

# Request
{
  "original_text": "Original text...",
  "humanized_text": "Humanized text..."
}

# Response
{
  "original": {
    "human_likelihood_pct": 35.2,
    "ai_likelihood_pct": 64.8
  },
  "humanized": {
    "human_likelihood_pct": 78.6,
    "ai_likelihood_pct": 21.4
  },
  "improvement": {
    "human_likelihood_delta": 43.4,
    "improvement_percentage": 67.0
  }
}
```

---

## 📊 OpenAPI Documentation

View interactive API docs:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Scalar**: http://localhost:8000/scalar

Navigate to the **"AI Detection"** section to see:
- Endpoint definitions
- Request/response schemas
- Try it out feature

---

## 🐛 Troubleshooting

### Backend Issues

**Error: "Could not connect to backend"**
```bash
# Make sure backend is running
cd backend
uv run fastapi dev src/api/main.py
```

**Error: "Detection failed"**
- Check backend logs for details
- Verify text has at least 10 words
- Ensure JSON is properly formatted

### Frontend Issues

**Error: "Failed to fetch"**
```bash
# Check NEXT_PUBLIC_API_URL in .env
echo $NEXT_PUBLIC_API_URL
# Should be: http://localhost:8000
```

**Error: "Module not found"**
```bash
# Reinstall dependencies
cd apps/next
pnpm install
```

### Common Issues

**Slow Detection**
- Normal: 1-3 seconds for all detectors
- Using cache: < 10ms for repeated queries
- Demo mode: Simulated delays (100ms per detector)

**Low Confidence Scores**
- Text too short (< 50 words)
- Ambiguous text
- Detectors disagree

---

## 🔑 API Keys (Optional)

The system works in **demo mode** without API keys. To enable real detection:

1. Create `.env` file in `backend/`:
   ```bash
   GPTZERO_API_KEY=your_key_here
   COPYLEAKS_API_KEY=your_key_here
   SAPLING_API_KEY=your_key_here
   # ... add others as needed
   ```

2. Restart backend

3. Test with real detectors

---

## 📈 Performance Testing

### Cache Performance

```bash
# First run (no cache)
time curl -X POST http://localhost:8000/api/v1/detect/ \
  -H "Content-Type: application/json" \
  -d '{"text": "Your text here..."}'

# Second run (cached)
time curl -X POST http://localhost:8000/api/v1/detect/ \
  -H "Content-Type: application/json" \
  -d '{"text": "Your text here..."}'
```

Expected results:
- First run: 1500-3000ms
- Second run: < 10ms

### Parallel Detector Testing

All external detectors run in parallel using `asyncio.gather()`:
- Sequential: ~7 detectors × 1000ms = 7000ms
- Parallel: max(detector_times) ≈ 1500ms

---

## ✅ Feature Checklist

Test these features:

### Backend
- [ ] `/detect/` endpoint responds
- [ ] Multiple detectors work
- [ ] Internal analysis calculates
- [ ] Caching works (second request faster)
- [ ] Comparison endpoint works
- [ ] Error handling (short text)
- [ ] API documentation loads

### Frontend
- [ ] AI Detector page loads
- [ ] Text input works
- [ ] Detector selection works
- [ ] Detection results display
- [ ] Progress bars animate
- [ ] Copy button works
- [ ] Evaluation dashboard works
- [ ] Comparison charts display
- [ ] Responsive design works

---

## 📚 Additional Resources

- **Full Documentation**: `DETECT_ENDPOINT_GUIDE.md`
- **Deployment Guide**: `MILESTONE_2_DEPLOYMENT_SUMMARY.md`
- **Backend Code**: `backend/src/api/services/detection_service.py`
- **Frontend Code**: `apps/next/src/app/components/ai-detector.tsx`

---

## 🎉 Success Criteria

You've successfully tested Milestone 2 when:

✅ Backend responds to `/detect/` requests  
✅ Frontend AI Detector page loads  
✅ Detection results display correctly  
✅ Comparison dashboard works  
✅ Cache improves performance  
✅ Error handling works  
✅ UI is responsive and clean  

---

## 🚢 Next Steps

1. **Deploy to Production**
   - Push to GitHub
   - Deploy via Vercel
   - Add API keys to environment

2. **Monitor Performance**
   - Check response times
   - Review cache hit rates
   - Monitor error logs

3. **Gather Feedback**
   - Test with real content
   - Evaluate accuracy
   - Refine algorithms

---

## 💡 Tips

- Use **Internal Analysis Only** for fastest results (no external API calls)
- Enable **Caching** for repeated queries
- Use **Specific Detectors** for focused testing
- Check **Metadata** for performance insights
- Compare **Before/After** to validate humanization

---

## 📞 Need Help?

- Check backend logs: `backend/src/api/`
- Review browser console for frontend errors
- Verify API responses in Network tab
- Test endpoints with curl/Postman
- Read full documentation in `DETECT_ENDPOINT_GUIDE.md`

---

**Happy Testing! 🎉**

If everything works, you're ready for production deployment!

