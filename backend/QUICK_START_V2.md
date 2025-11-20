# 🚀 Quick Start: Test V2 Improvements

## ⚡ Fast Track - 5 Minutes to Test

### Step 1: Restart Backend (30 seconds)
```bash
cd /home/kevin-gruneberg/kevin/humanize/backend

# Stop current server (Ctrl+C if running)
# Start with v2 improvements
uv run python src/index.py
```

**Look for this log message:**
```
✅ V2 humanization prompts loaded successfully
```

### Step 2: Test with Your World War II Text (2 minutes)

Use your frontend humanization tool, or test via API:

```bash
curl -X POST http://localhost:8000/api/v1/humanize/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @- << 'EOF'
{
  "input_text": "World War II (1939–1945) was a global conflict involving most of the world's nations, and it became the deadliest war in human history. It began in Europe but quickly spread across Asia, Africa, and the world's oceans. At its core, the war grew out of unresolved issues from World War I, the harsh terms of the Treaty of Versailles, economic depression, and the rise of aggressive totalitarian regimes in Germany, Italy, and Japan.\n\nThe war officially started on September 1, 1939, when Nazi Germany, led by Adolf Hitler, invaded Poland. Britain and France responded by declaring war on Germany. Over the next two years, Germany used a strategy called \"Blitzkrieg\" (lightning war) to conquer much of Europe, including France, the Low Countries, and parts of Scandinavia. Italy joined as Germany's ally, and the Axis powers seemed unstoppable on the continent.\n\nMeanwhile, in Asia, Japan had been expanding for years, invading Manchuria in 1931 and China in 1937. Seeking resources and dominance in the Pacific, Japan aimed to establish an empire. On December 7, 1941, Japan attacked the United States at Pearl Harbor, Hawaii, in a surprise air raid. This brought the U.S. fully into the war on the side of the Allies, which included Britain, the Soviet Union (after Germany invaded it in 1941), China, and many other nations.",
  "tone": "academic",
  "length_mode": "standard"
}
EOF
```

### Step 3: Check Originality.ai (2 minutes)

1. Go to https://originality.ai/ai-checker
2. Paste the `humanized_text` from response
3. Click "Check for AI"

**Target: >90% Original Score**

### Step 4: Compare Results

| Service | Before | After V2 (Target) |
|---------|--------|-------------------|
| Our Service | ~70-80% AI | **<10% AI** ✅ |
| humanizeai.pro (benchmark) | 93% Original | Match or beat! 🎯 |

---

## 🎯 What Changed (TL;DR)

### 1. **Smarter Prompts**
- Old: "WILDLY vary, AGGRESSIVELY transform"
- New: "Be strategic, preserve what's natural"

### 2. **Better Settings**
- Temperature: 0.75 → **0.65** (more controlled)
- Top_p: 0.92 → **0.88** (tighter sampling)

### 3. **Removed Tricks**
- ❌ Invisible Unicode characters (detected!)
- ❌ Forced "honestly", "basically" markers
- ✅ Natural, subtle changes only

### 4. **Key Philosophy**
💡 **"Less is More"** - Preserve 40-60% of original, only fix what sounds robotic

---

## 📊 Success Indicators

### Logs Should Show:
```
✅ V2 humanization prompts loaded successfully
✅ Using V2 strategic humanization prompt
✅ Trying Anthropic with model: anthropic/claude-3-5-sonnet-20240620
```

### Response Should Include:
```json
{
  "humanized_text": "...",  // Subtle changes, natural flow
  "metrics": {
    "semantic_similarity": 0.87,  // >0.85 = good
    "word_count": 520,
    "processing_time_ms": 2500
  },
  "metadata": {
    "pipeline": "quick-single-pass",
    "semantic_passed": true
  }
}
```

### Originality.ai Should Show:
```
✅ Original Content: >90%
✅ AI Content: <10%
✅ Plagiarism: 0%
```

---

## 🔧 Troubleshooting

### Issue: Still High AI Detection (>20%)

**Quick Fixes:**
1. Check config temperature is 0.65:
   ```bash
   grep "HUMANIZATION_TEMPERATURE" backend/src/api/config.py
   # Should show: 0.65
   ```

2. Verify v2 is enabled:
   ```bash
   grep "USE_V2_PROMPTS" backend/src/api/config.py
   # Should show: True
   ```

3. Ensure using Claude 3.5 Sonnet:
   ```bash
   # Add to backend/.env if not present:
   ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY
   ```

### Issue: Output Too Different from Original

**Quick Fix:**
- Semantic similarity too low (<0.80)
- May need to adjust prompts to preserve more
- Check if original text is already natural

### Issue: V2 Prompts Not Loading

**Quick Fix:**
```bash
cd backend
ls src/api/services/humanization_prompts_v2.py
# If file doesn't exist, check git status
```

---

## 💡 Pro Tips

### 1. For Best Results:
- Use **Claude 3.5 Sonnet** (better than GPT-4 for this)
- Test with **varied content types** (academic, casual, technical)
- **Compare scores** before/after v2

### 2. For Academic Text:
- Specify tone: `"tone": "academic"`
- Use readability: `"readability_level": "university"`

### 3. For Casual Content:
- Specify tone: `"tone": "casual"`
- Allow more variation

### 4. Monitor Quality:
- Check semantic_similarity (should be >0.85)
- Verify word count is reasonable
- Read output for naturalness

---

## 📈 Benchmark Goals

### Minimum Acceptable:
- ✅ Originality.ai: >85% Original
- ✅ Semantic Similarity: >0.85
- ✅ Readability: Maintained

### Target (Match Best Competitor):
- 🎯 Originality.ai: >90% Original
- 🎯 Semantic Similarity: >0.88
- 🎯 Natural Flow: Indistinguishable from human

### Stretch Goal:
- 🚀 Originality.ai: >95% Original
- 🚀 Beat humanizeai.pro consistently
- 🚀 Fastest processing time

---

## 📞 Need Help?

### Check Logs:
```bash
# Backend logs show which version is running
tail -f backend/logs/app.log | grep "V2"
```

### Read Documentation:
- `HUMANIZATION_IMPROVEMENT_PLAN.md` - Full analysis
- `V2_IMPROVEMENTS_SUMMARY.md` - Detailed changes
- `FIXES_APPLIED.md` - LLM configuration

### Test Systematically:
1. Same input text
2. Same settings
3. Multiple runs (AI detection can vary)
4. Compare averages

---

## 🎉 Ready to Test?

1. ✅ Restart backend
2. ✅ Use World War II text
3. ✅ Check Originality.ai
4. ✅ Compare with competitors
5. ✅ Celebrate >90% original score! 🎊

**Good luck beating humanizeai.pro's 93%!** 🚀

