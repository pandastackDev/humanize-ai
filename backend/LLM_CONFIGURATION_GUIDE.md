# LLM Configuration Guide

## Issue Summary

The application was failing with error:
```
Service unavailable: All LLM providers failed. Last error: Error code: 400 - {'error': {'message': 'invalid model ID'}}
```

## Root Causes

1. **Model Name Prefix Issue**: The code was using OpenRouter-formatted model names (e.g., `anthropic/claude-3-5-sonnet-20241022`) when calling direct provider APIs (Anthropic, OpenAI), which don't accept those prefixes.

2. **Invalid Model Names**: Some configured model names were outdated or non-existent:
   - `gpt-5.1` (doesn't exist) → `gpt-4-turbo`
   - `claude-4.5-sonnet` (doesn't exist) → `claude-3-5-sonnet-20241022`
   - `gpt-4-turbo-preview` (outdated) → `gpt-4-turbo`

3. **Missing API Keys**: The API keys were not configured in the `.env` file.

## Fixes Applied

### 1. Model Name Handling (`llm_service.py`)

Added logic to strip provider prefixes when using direct APIs:

```python
# For Anthropic direct API
if "/" in model_name:
    model_name = model_name.split("/", 1)[1]
# "anthropic/claude-3-5-sonnet-20241022" → "claude-3-5-sonnet-20241022"

# For OpenAI direct API  
if "/" in model_name:
    model_name = model_name.split("/", 1)[1]
# "openai/gpt-4-turbo" → "gpt-4-turbo"
```

### 2. Updated Model Names (`config.py`)

Updated to use valid, current model names:

| Old Value | New Value | Usage |
|-----------|-----------|-------|
| `gpt-5.1` | `gpt-4-turbo` | OpenAI direct API |
| `claude-4.5-sonnet` | `claude-3-5-sonnet-20241022` | Anthropic direct API |
| `openai/gpt-4-turbo-preview` | `openai/gpt-4-turbo` | OpenRouter / Fallback |

### 3. Added Logging

Added informative logging to track which provider is being used:
- `Trying Anthropic with model: ...`
- `Trying OpenRouter with model: ...`
- `Trying OpenAI with model: ...`

## Configuration Required

### Option 1: Using OpenRouter (Recommended)

OpenRouter provides access to multiple LLM providers through a single API key:

1. Get an API key from [OpenRouter](https://openrouter.ai/)
2. Add to your `.env` file:

```bash
OPENROUTER_API_KEY=sk-or-v1-xxx...
```

**Benefits**: 
- Single API key for multiple models
- Automatic fallback between providers
- Pay-per-use pricing

### Option 2: Using Direct Provider APIs

Configure API keys for one or more providers:

```bash
# Anthropic (Claude models)
ANTHROPIC_API_KEY=sk-ant-xxx...

# OpenAI (GPT models)
OPENAI_API_KEY=sk-xxx...
```

### Recommended Setup

For best reliability, configure at least two providers:

```bash
# Primary (recommended)
OPENROUTER_API_KEY=sk-or-v1-xxx...

# Fallback options
ANTHROPIC_API_KEY=sk-ant-xxx...
OPENAI_API_KEY=sk-xxx...
```

## Model Formats

### OpenRouter Format
- Uses `provider/model` format
- Example: `anthropic/claude-3-5-sonnet-20241022`
- Used for OpenRouter API calls

### Direct API Format  
- Uses just the model name
- Example: `claude-3-5-sonnet-20241022`
- Used for Anthropic, OpenAI direct API calls

The code now automatically strips the provider prefix when needed.

## Current Model Configuration

### Primary Models
- **PRIMARY_HUMANIZATION_MODEL**: `anthropic/claude-3-5-sonnet-20240620` (OpenRouter format)
- **COMPRESSION_MODEL**: `anthropic/claude-3-haiku-20240307` (OpenRouter format)
- **FALLBACK_HUMANIZATION_MODEL**: `openai/gpt-4-turbo` (OpenRouter format)

### Direct API Defaults
- **ANTHROPIC_LLM_MODEL**: `claude-3-5-sonnet-20240620` (no prefix, June 2024 release)
- **OPENAI_LLM_MODEL**: `gpt-4-turbo` (no prefix)

### Important Note on Model Names
- ⚠️ **`claude-3-5-sonnet-20241022` does NOT exist on Anthropic's direct API**
- ✅ Use `claude-3-5-sonnet-20240620` for the actual available version
- The October 2024 version may only be available through OpenRouter

## Testing

After configuring API keys, restart your backend server and check the logs:

```bash
cd backend
uv run python src/index.py
```

Look for:
```
✅ OpenRouter client initialized
✅ Anthropic client initialized  
✅ OpenAI client initialized
```

Then test a humanization request. You should see:
```
Trying Anthropic with model: anthropic/claude-3-5-sonnet-20241022
```

Or similar log indicating which provider is being used.

## Troubleshooting

### "No auth credentials found"
- Check that `OPENROUTER_API_KEY` is set in `.env`
- Verify the API key is valid

### "invalid model ID"
- The model name might be incorrect
- Check [OpenRouter models](https://openrouter.ai/models) for valid names
- Check [Anthropic models](https://docs.anthropic.com/claude/docs/models-overview) for Claude models
- Check [OpenAI models](https://platform.openai.com/docs/models) for GPT models

### All providers fail
- Ensure at least one API key is configured
- Check API key validity
- Verify network connectivity to provider APIs
- Check provider status pages for outages

