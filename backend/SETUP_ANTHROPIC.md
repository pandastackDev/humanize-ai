# Setting Up Anthropic Claude API

## Quick Start

To use Claude 3.5 Sonnet, you need to set up your Anthropic API key.

### Step 1: Get Your Anthropic API Key

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to **API Keys** section
4. Click **Create Key**
5. Copy your API key (starts with `sk-ant-api03-...`)

### Step 2: Add API Key to Your Environment

Add this line to your `backend/.env` file:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE
```

### Step 3: Restart Your Backend Server

```bash
cd backend
# Stop the current server (Ctrl+C)
# Start it again
uv run python src/index.py
```

### Step 4: Test It Works

You should see in your logs:
```
✅ Anthropic client initialized
Trying Anthropic with model: anthropic/claude-3-5-sonnet-20240620
```

## Available Claude Models

### On Anthropic Direct API
- `claude-3-5-sonnet-20240620` ✅ (what we're using)
- `claude-3-5-sonnet-latest` ✅ (alias for latest)
- `claude-3-opus-20240229` ✅
- `claude-3-haiku-20240307` ✅

### Note on Model Naming
- **Direct Anthropic API**: Use names like `claude-3-5-sonnet-20240620`
- **OpenRouter API**: Use names like `anthropic/claude-3-5-sonnet-20240620`

Our code automatically handles both formats!

## Fallback Behavior

The system tries providers in this order:

1. **Anthropic** (if `ANTHROPIC_API_KEY` is set)
   - Uses `claude-3-5-sonnet-20240620`

2. **OpenRouter** (if `OPENROUTER_API_KEY` is set)
   - Uses `anthropic/claude-3-5-sonnet-20240620`

3. **OpenAI** (if `OPENAI_API_KEY` is set)  
   - Uses `gpt-4-turbo`

Configure at least one to avoid errors!

## Pricing (as of Dec 2024)

### Anthropic Direct API
- **Claude 3.5 Sonnet**: $3.00 per million input tokens, $15.00 per million output tokens
- **Claude 3 Haiku**: $0.25 per million input tokens, $1.25 per million output tokens

### Through OpenRouter
- Usually similar pricing or slightly marked up
- Access multiple providers with one API key
- Automatic load balancing

## Recommended Setup

### Option 1: Use Anthropic Direct (Best for Claude)
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-...  # fallback
```

### Option 2: Use OpenRouter (Best for Multiple Models)
```bash
OPENROUTER_API_KEY=sk-or-v1-...
```

### Option 3: Use Both (Best Reliability)
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENROUTER_API_KEY=sk-or-v1-...
OPENAI_API_KEY=sk-...
```

## Troubleshooting

### "Error code: 404 - model: claude-3-5-sonnet-20241022"
❌ This model doesn't exist on Anthropic's API yet
✅ **Fixed!** We now use `claude-3-5-sonnet-20240620`

### "Error code: 401 - authentication_error"
❌ API key not set or invalid
✅ Check your `.env` file has `ANTHROPIC_API_KEY=sk-ant-api03-...`

### "No auth credentials found"
❌ For OpenRouter - API key not set
✅ Add `OPENROUTER_API_KEY=sk-or-v1-...` to `.env`

## Testing Your Setup

Run this test command:

```bash
cd backend
export ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY
uv run python -c "
import anthropic
client = anthropic.Anthropic()
response = client.messages.create(
    model='claude-3-5-sonnet-20240620',
    max_tokens=50,
    messages=[{'role': 'user', 'content': 'Say hi!'}]
)
print('✅ Anthropic API working!')
print('Response:', response.content[0].text)
"
```

If this works, your humanization service will work too!

