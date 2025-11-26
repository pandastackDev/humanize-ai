# 🎯 Em-Dash Removal Update

## Problem Identified

**Em-dashes (—) are a strong AI writing pattern** that detection tools like Originality.ai recognize as suspicious.

### Example from Your Analysis:

❌ **AI-like** (with em-dash):
```
Over in Asia meanwhile — you've got Japan who'd been getting pretty ambitious
```

✅ **Human-like** (without em-dash):
```
Japan had been quite ambitious and over the years they expanded their empire
```

## What Changed

### 1. Updated Prompts (humanization_prompts.py)

**Added to AVOID list:**
```python
❌ Em-dashes (—) - replace with commas, periods, or "and"
```

**Updated instructions:**
- Reconstruction phase: "Use commas or periods (NOT em-dashes)"
- Quick humanization: Added em-dash avoidance rule
- All phases: Explicit instruction to avoid em-dashes

### 2. Added Post-Processing Function

**New function in `humanization_service.py`:**
```python
def remove_ai_patterns(text: str) -> str:
    """Remove common AI writing patterns from text."""
    # Replace em-dashes with commas
    text = re.sub(r'\s+—\s+', ', ', text)  # "word — word" → "word, word"
    text = re.sub(r'—', ', ', text)         # "word—word" → "word, word"
    
    # Clean up spacing
    text = re.sub(r',\s*,', ',', text)      # Remove double commas
    text = re.sub(r'\s*,\s*', ', ', text)   # Fix comma spacing
    
    return text
```

### 3. Applied to Both Pipelines

**Quick Pipeline:**
```python
humanized_text = llm_service.generate_text(...)
humanized_text = remove_ai_patterns(humanized_text)  # ✅ Added
```

**Advanced Pipeline:**
```python
humanized_text = final_tuning(...)
humanized_text = remove_ai_patterns(humanized_text)  # ✅ Added
```

## How It Works

### Before Processing (Prompt Level):
1. LLM is instructed to avoid em-dashes
2. Alternative constructions suggested (commas, periods, conjunctions)

### After Processing (Post-Processing):
1. Any remaining em-dashes are automatically removed
2. Replaced with natural comma punctuation
3. Spacing cleaned up

## Examples of Transformations

### Example 1: Simple replacement
```
Input:  "World War II — a global conflict — changed history"
Output: "World War II, a global conflict, changed history"
```

### Example 2: Multiple em-dashes
```
Input:  "Japan expanded — first Manchuria — then China — finally the Pacific"
Output: "Japan expanded, first Manchuria, then China, finally the Pacific"
```

### Example 3: With context
```
Input:  "The war started in 1939 — when Germany invaded Poland"
Output: "The war started in 1939, when Germany invaded Poland"
```

## Why This Matters

### AI Detection Patterns:

| Pattern | Detection Risk | Our Solution |
|---------|---------------|--------------|
| Em-dashes (—) | HIGH | ✅ Removed |
| Invisible Unicode | HIGH | ✅ Disabled (v2) |
| "delve", "leverage" | HIGH | ✅ Avoided in prompts |
| Forced "honestly" | MEDIUM | ✅ Removed from prompts |
| Perfect parallelism | MEDIUM | ✅ Instructed to vary |

### Impact on Detection Scores:

Em-dashes are particularly problematic because:
1. **AI models overuse them** - GPT-4 and Claude love em-dashes
2. **Humans rarely use them** - especially in casual/academic writing
3. **Easy to detect** - simple pattern matching catches them
4. **High signal** - strong indicator of AI generation

## Testing

### Before (with em-dashes):
```
Originality.ai: ~70-80% AI detection
Common pattern: "sentence — phrase — another phrase"
```

### After (without em-dashes):
```
Originality.ai: Expected <10% AI detection
Natural pattern: "sentence, phrase, another phrase"
```

## Additional AI Patterns to Watch

While we've addressed em-dashes, here are other patterns to monitor:

### Already Handled:
✅ Em-dashes (—)
✅ Invisible Unicode characters
✅ AI buzzwords ("delve", "leverage", "robust")
✅ Forced discourse markers ("honestly", "basically")

### Future Considerations:
⏳ Colon overuse ("Here's the thing:")
⏳ Perfect list structures
⏳ Overly consistent sentence rhythm
⏳ "However," at sentence start (overused by AI)

## Configuration

No configuration needed - this improvement is **automatically applied** to all humanization requests.

### Prompt Changes:
- ✅ Em-dash avoidance added to all prompt templates
- ✅ Alternative constructions suggested

### Post-Processing:
- ✅ Automatic em-dash removal
- ✅ Applied to both quick and advanced pipelines
- ✅ No performance impact (regex is fast)

## Verification

### Check Logs:
```bash
# After humanization, check output
# Should NOT contain em-dashes (—)
```

### Test Example:
```python
# Input with em-dashes
input_text = "World War II — a global conflict — began in 1939"

# After humanization
output = humanize(input_text)
# Expected: "World War II, a global conflict, began in 1939"

# Verify no em-dashes
assert '—' not in output
```

## Files Modified

1. ✅ `backend/src/api/services/humanization_prompts.py`
   - Added em-dash avoidance to all prompts
   - Updated AVOID lists

2. ✅ `backend/src/api/services/humanization_service.py`
   - Added `remove_ai_patterns()` function
   - Applied to quick pipeline (line ~208)
   - Applied to advanced pipeline (line ~337)

## Summary

### What We Fixed:
❌ Em-dashes (—) are a strong AI writing pattern
✅ Now removed both at prompt level and post-processing

### How:
1. **Prompt instructions** - Tell LLM to avoid em-dashes
2. **Post-processing** - Remove any that slip through
3. **Natural alternatives** - Use commas, periods, conjunctions

### Impact:
🎯 **Expected improvement:** ~5-10% better Originality.ai scores
🎯 **Total target:** >90% Original (<10% AI detection)

### Why It Works:
- Em-dashes are **highly correlated** with AI writing
- Humans use them sparingly, AI overuses them
- Simple pattern = easy for detectors to catch
- Removing them = one less signal for AI detection

---

**Your observation was spot-on!** Em-dashes are a red flag for AI detectors. This update removes them systematically. 🎉

