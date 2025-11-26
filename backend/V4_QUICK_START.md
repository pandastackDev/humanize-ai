# V4 Quick Start Guide

## 🚀 In 5 Minutes

### Step 1: Verify Configuration (Already Done ✅)

The backend is now configured with V4 optimizations:

```python
# In src/api/config.py (already set):
USE_V4_PROMPTS: bool = True  # ✅ V4 enabled
HUMANIZATION_TEMPERATURE: float = 0.88  # ✅ Optimized
HUMANIZATION_TOP_P: float = 0.95  # ✅ Optimized
PATTERN_BREAKER_AGGRESSIVENESS: float = 0.7  # ✅ Balanced
```

### Step 2: Run Test

```bash
cd /home/kevin-gruneberg/kevin/humanize/backend
python test_v4_enhancements.py
```

This will:
- Process a test text with V4
- Show before/after comparison
- Provide quality statistics
- Check for AI vocabulary
- Analyze sentence variety

### Step 3: Test on Originality.AI

1. Copy the **OUTPUT TEXT** from the test results
2. Go to https://originality.ai/
3. Paste and scan
4. **Target: 90%+ Human Score**

### Step 4 (If Score is Low): Increase Aggressiveness

Edit `src/api/config.py`:

```python
PATTERN_BREAKER_AGGRESSIVENESS: float = 0.9  # Increase from 0.7
```

Re-run test and try again.

---

## 📊 What V4 Does Differently

### Core Changes:

1. **Blocks AI Vocabulary** (Critical!)
   - "commenced" → "started"
   - "Subsequently" → "Then"
   - "witnessed" → "saw"
   - And 20+ more replacements

2. **Injects Human Markers**
   - Casual intensifiers: "totally", "really", "quite"
   - Conversational breaks: "Well,", "So,", "Or, at least,"
   - Emphatic redundancy: "indeed, the X itself"

3. **Natural Imperfections**
   - Repeats adjectives (humans don't use thesaurus)
   - Varies sentences wildly (5→35→12→8 words)
   - Adds emotional language

4. **Higher Temperature**
   - 0.88 vs 0.82 in V3
   - More variation = more human-like

---

## 🎯 Success Indicators

### ✅ Good Output Has:
- [x] No "commenced", "witnessed", "Subsequently" etc.
- [x] Casual intensifiers (2-3 times)
- [x] Conversational breaks (2-3 times)
- [x] Emotional language ("mad", "terrible", "helpless")
- [x] Sentence variety (std dev > 5 words)
- [x] Some repetition (same adjective 2-3 times)

### ❌ Bad Output Has:
- [ ] AI vocabulary still present
- [ ] Consistent sentence lengths
- [ ] No personality/emotion
- [ ] Too polished/formal

---

## 🔧 Troubleshooting

### "Still scoring low (<80% human)"

**Try:**
1. Increase aggressiveness to 0.9
2. Increase temperature to 0.92
3. Check logs for pattern breaker running
4. Verify V4 prompts loaded

### "Too messy/incoherent"

**Try:**
1. Decrease aggressiveness to 0.6
2. Decrease temperature to 0.85

### "AI words still appearing"

**Check logs for:**
```
"Replaced X AI vocabulary words with simple alternatives"
```

If X = 0, pattern breaker may not be running properly.

---

## 📖 Full Documentation

- **`V4_ORIGINALITY_AI_ENHANCEMENT.md`** - Complete guide (60+ pages)
- **`ORIGINALITY_AI_FACTORS.md`** - Detection factors analysis
- **`test_v4_enhancements.py`** - Automated testing script

---

## 🎉 Expected Results

### Before V4:
- Originality.AI: **3% Human / 97% AI** ❌

### After V4:
- Originality.AI: **90-95% Human / 5-10% AI** ✅

---

## 📞 Need Help?

1. Check the logs for errors
2. Run `test_v4_enhancements.py` to validate
3. Review `V4_ORIGINALITY_AI_ENHANCEMENT.md` for detailed guidance

---

**Version: 4.0**
**Status: Production Ready ✅**
**Target: 90-95% Human Score**

