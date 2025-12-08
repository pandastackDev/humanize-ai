# GPTZero Quick Reference

Quick commands and snippets for working with GPTZero API integration.

## Quick Setup

```bash
# 1. Extract cookies
cd backend
python scripts/extract_gptzero_cookies.py

# 2. Add to .env file
echo 'GPTZERO_COOKIE_STRING="your-cookies-here"' >> .env
echo 'GPTZERO_SCAN_ID="your-scan-id-here"' >> .env

# 3. Test the integration
python scripts/test_gptzero_api.py
```

## Essential Commands

### Test GPTZero API

```bash
# Basic test
python scripts/test_gptzero_api.py

# Test with file
python scripts/test_gptzero_api.py --file sample.txt

# Custom scan ID
python scripts/test_gptzero_api.py --scan-id YOUR_SCAN_ID

# Save output
python scripts/test_gptzero_api.py --output result.json
```

### Run Unit Tests

```bash
# Test GPTZero detector
pytest tests/test_gptzero_detector.py -v

# Test detection endpoint
pytest tests/test_detect_endpoint.py -v

# Run all tests
pytest tests/ -v
```

### Update Cookies

```bash
# 1. Edit the extraction script with new cookies
nano scripts/extract_gptzero_cookies.py

# 2. Generate .env format
python scripts/extract_gptzero_cookies.py

# 3. Copy output to .env file
```

## Cookie Extraction (Step-by-Step)

1. **Open GPTZero**: https://app.gptzero.me/
2. **Open DevTools**: Press F12
3. **Go to Network Tab**: Click "Network"
4. **Make Detection**: Paste text and click "Detect AI"
5. **Find Request**: Look for `text` request to `api.gptzero.me`
6. **Copy Cookies**: Headers → Request Headers → cookie:
7. **Update Script**: Paste into `scripts/extract_gptzero_cookies.py`
8. **Generate Config**: Run extraction script
9. **Update .env**: Copy output to `.env` file

## Python Code Snippets

### Basic Usage

```python
from api.services.gptzero_detector import GPTZeroDetector

# Initialize
cookies = {"accessToken4": "...", "plan": "Free"}
detector = GPTZeroDetector(cookies_dict=cookies, scan_id="your-scan-id")

# Detect
result = detector.detect("Your text here")
print(f"AI: {result['ai_probability']:.2%}")
print(f"Human: {result['human_probability']:.2%}")
```

### Async Usage

```python
import asyncio
from api.services.gptzero_detector import GPTZeroDetector

async def detect():
    detector = GPTZeroDetector(cookies_dict=cookies, scan_id="scan-id")
    result = await detector.detect_async("Your text here")
    return result

# Run
result = asyncio.run(detect())
```

### Parse Cookie String

```python
from api.services.gptzero_detector import parse_cookie_string

cookie_string = "key1=value1; key2=value2"
cookies = parse_cookie_string(cookie_string)
# Returns: {"key1": "value1", "key2": "value2"}
```

### Using with Config

```python
from api.config import settings
from api.services.gptzero_detector import GPTZeroDetector, parse_cookie_string

# Load from environment
cookies = parse_cookie_string(settings.GPTZERO_COOKIE_STRING)
detector = GPTZeroDetector(
    cookies_dict=cookies,
    scan_id=settings.GPTZERO_SCAN_ID
)
```

## API Endpoints

### Test Detection Endpoint

```bash
# Start server
uvicorn src.index:app --reload

# Test with curl
curl -X POST "http://localhost:8000/api/v1/detect/" \
  -H "Content-Type: application/json" \
  -d '{"text": "The utilization of advanced systems..."}'
```

### Python Requests

```python
import requests

response = requests.post(
    "http://localhost:8000/api/v1/detect/",
    json={"text": "Your text here"}
)
print(response.json())
```

## Common Issues & Solutions

### Issue: 401 Unauthorized
**Solution**: Update `accessToken4` cookie (expired JWT)
```bash
# Check token expiration
python -c "import jwt; print(jwt.decode('TOKEN', options={'verify_signature': False}))"
```

### Issue: 404 Not Found
**Solution**: Create scan at https://app.gptzero.me/ and update `GPTZERO_SCAN_ID`

### Issue: Cookie Parse Error
**Solution**: Use extraction script to format cookies correctly
```bash
python scripts/extract_gptzero_cookies.py
```

### Issue: Rate Limit
**Solution**: Add delay between requests
```python
import time
time.sleep(2)  # 2 second delay
```

## Environment Variables

```bash
# Required
GPTZERO_COOKIE_STRING="cookie1=value1; cookie2=value2; ..."
GPTZERO_SCAN_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

## Important Cookies

| Cookie | Purpose | Required |
|--------|---------|----------|
| `accessToken4` | JWT authentication token | ✅ Yes |
| `__Host-gptzero-csrf-token` | CSRF protection | ✅ Yes |
| `anonymousUserId` | User session ID | ✅ Yes |
| `plan` | Subscription tier | ✅ Yes |
| `_ga`, `_gcl_au` | Analytics | ❌ No |

## Response Format

```python
{
    "success": True,
    "ai_probability": 0.75,        # 0-1 scale
    "human_probability": 0.20,     # 0-1 scale
    "mixed_probability": 0.05,     # 0-1 scale
    "confidence": 0.50,            # 0-1 scale
    "scan_id": "...",
    "response_time_ms": 1234.56,
    "class_probabilities": { ... },
    "raw_response": { ... }
}
```

## Useful Links

- **GPTZero Web**: https://app.gptzero.me/
- **API Docs**: https://docs.gptzero.me/
- **Full Setup Guide**: [GPTZERO_SETUP.md](./GPTZERO_SETUP.md)

## Checklist

- [ ] GPTZero account created
- [ ] Logged in to https://app.gptzero.me/
- [ ] Scan created and scan ID copied
- [ ] Cookies extracted from browser
- [ ] `extract_gptzero_cookies.py` updated
- [ ] `.env` file configured
- [ ] Test script runs successfully
- [ ] Unit tests pass

## Need Help?

1. Check [GPTZERO_SETUP.md](./GPTZERO_SETUP.md) for detailed guide
2. Review troubleshooting section
3. Check API status: https://status.gptzero.me/
4. Open an issue on GitHub


