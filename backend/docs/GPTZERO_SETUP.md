# GPTZero API Integration Setup Guide

This guide explains how to set up and use the GPTZero API integration for AI content detection.

## Overview

The GPTZero integration uses browser session authentication to detect AI-generated content. It requires:
- Valid browser cookies from an authenticated GPTZero session
- A scan ID created through the GPTZero web interface

## Table of Contents

- [Getting Started](#getting-started)
- [Cookie Extraction](#cookie-extraction)
- [Configuration](#configuration)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)

## Getting Started

### Prerequisites

1. A GPTZero account (free tier available)
2. Access to https://app.gptzero.me/
3. Browser DevTools knowledge (for cookie extraction)

### Quick Setup

1. **Log in to GPTZero**
   - Visit https://app.gptzero.me/
   - Log in with your Google account (or create an account)

2. **Create a Scan**
   - Navigate to the scans section
   - Create a new scan
   - Copy the scan ID (UUID format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

3. **Extract Cookies**
   - Open DevTools (F12)
   - Go to the Network tab
   - Make a detection request on GPTZero
   - Find the request to `api.gptzero.me/v3/ai/text`
   - Copy the cookies from the request headers

4. **Configure Environment**
   - Add cookies and scan ID to your `.env` file (see [Configuration](#configuration))

## Cookie Extraction

### Method 1: Using Browser DevTools (Recommended)

1. **Open GPTZero and DevTools**
   ```
   1. Visit https://app.gptzero.me/
   2. Press F12 to open DevTools
   3. Click on the "Network" tab
   4. Ensure "Preserve log" is checked
   ```

2. **Make a Detection Request**
   ```
   1. Paste some text in GPTZero
   2. Click "Detect AI"
   3. Wait for the detection to complete
   ```

3. **Find the API Request**
   ```
   1. In the Network tab, find the request to "text" (api.gptzero.me/v3/ai/text)
   2. Click on the request
   3. Go to the "Headers" tab
   4. Scroll down to "Request Headers"
   5. Find the "cookie:" header
   6. Copy the entire cookie value
   ```

4. **Update the Extraction Script**
   ```bash
   cd backend/scripts
   # Edit extract_gptzero_cookies.py and paste your cookies
   nano extract_gptzero_cookies.py
   ```

5. **Generate .env Format**
   ```bash
   python scripts/extract_gptzero_cookies.py
   ```

### Method 2: Using the Test Script

The provided test script can use cookies directly from your `.env` file:

```bash
cd backend
python scripts/test_gptzero_api.py --file sample.txt
```

### Important Cookies

The following cookies are essential for authentication:

- `accessToken4` - JWT token (expires after ~7 days)
- `__Host-gptzero-csrf-token` - CSRF protection token
- `anonymousUserId` - User session identifier
- `plan` - Subscription plan (Free, Pro, etc.)

**Note**: The `accessToken4` JWT token has an expiration date. Check the `exp` claim in the JWT to see when it expires.

## Configuration

### Environment Variables

Add the following to your `backend/.env` file:

```bash
# GPTZero Configuration
GPTZERO_COOKIE_STRING="cookie1=value1; cookie2=value2; ..."
GPTZERO_SCAN_ID="your-scan-id-here"
```

### Example .env Configuration

```bash
# GPTZero API Configuration
GPTZERO_COOKIE_STRING="_gcl_au=1.1.670181255.1764836389; __Host-gptzero-csrf-token=a821057457241ebe4fbdb8bbe92004246f968753fac59eec15463391dad095aff9b867e8a43078de291e07ace3d7d1770cbe209cdf4acc1d063f7dcf75bb483e%7C316f78b82da7ad1467b12efea353466a96c3d3d7d0bb63f5b72579c121cc1301; _ga=GA1.1.1204378151.1764836389; accessToken4=eyJhbGciOiJIUzI1NiIsImtpZCI6IkxQUGtRbDRKRlQvcmY5VkoiLCJ0eXAiOiJKV1QifQ...; anonymousUserId=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; plan=Free"

GPTZERO_SCAN_ID="ef6eec63-f673-4764-8e96-32875529b4f6"
```

## Testing

### Standalone Test Script

Use the standalone test script to verify your setup:

```bash
cd backend

# Test with default sample text
python scripts/test_gptzero_api.py

# Test with custom text file
python scripts/test_gptzero_api.py --file /path/to/text.txt

# Test with custom scan ID
python scripts/test_gptzero_api.py --scan-id your-scan-id

# Save full response to JSON file
python scripts/test_gptzero_api.py --output response.json
```

### Expected Output

```
Using cookies from .env file (16 cookies)
Using scan ID from .env: ef6eec63-f673-4764-8e96-32875529b4f6

Making request to https://api.gptzero.me/v3/ai/text...
Text length: 324 characters
Using scan ID: ef6eec63-f673-4764-8e96-32875529b4f6

================================================================================
Detection Results Summary:
================================================================================
AI Probability:    75.23%
Human Probability: 20.45%
Mixed Probability: 4.32%

Average Generated Prob: 75.23%
Completely Generated:   80.12%
================================================================================

✓ Detection completed successfully!
```

### Unit Tests

Run the GPTZero detector unit tests:

```bash
cd backend

# Run GPTZero detector tests
pytest tests/test_gptzero_detector.py -v

# Run all detection tests
pytest tests/test_detect_endpoint.py -v
```

### Integration Tests

Test the full detection endpoint:

```bash
# Start the API server
cd backend
uvicorn src.index:app --reload

# In another terminal, test the /detect endpoint
curl -X POST "http://localhost:8000/api/v1/detect/" \
  -H "Content-Type: application/json" \
  -d '{"text": "Your text here"}'
```

## Troubleshooting

### Common Issues

#### 1. Authentication Errors (401 Unauthorized)

**Problem**: API returns 401 Unauthorized

**Solutions**:
- Check if `accessToken4` has expired (JWT expiration)
- Log out and log back into GPTZero to get fresh cookies
- Re-extract cookies using the instructions above
- Update `.env` file with new cookies

#### 2. Invalid Scan ID (404 Not Found)

**Problem**: API returns 404 or scan not found error

**Solutions**:
- Create a new scan at https://app.gptzero.me/
- Copy the scan ID from the URL or scan details
- Update `GPTZERO_SCAN_ID` in `.env`

#### 3. Cookie Parsing Errors

**Problem**: Cookies not parsing correctly

**Solutions**:
- Ensure cookies are in the format: `key1=value1; key2=value2`
- Check for special characters or encoding issues
- Use the extraction script to format cookies properly

#### 4. Rate Limiting

**Problem**: Too many requests error

**Solutions**:
- GPTZero free tier has rate limits
- Implement exponential backoff
- Consider upgrading to a paid plan
- Add delays between requests

#### 5. Token Expiration

**Problem**: Cookies stop working after a few days

**Solutions**:
- Check JWT expiration: `exp` claim in `accessToken4`
- Refresh cookies by logging into GPTZero again
- Automate cookie refresh (advanced)

### Debugging Tips

1. **Enable Detailed Logging**
   ```python
   import logging
   logging.basicConfig(level=logging.DEBUG)
   ```

2. **Check Token Expiration**
   ```bash
   # Decode JWT to check expiration
   python -c "import jwt; print(jwt.decode('YOUR_TOKEN', options={'verify_signature': False}))"
   ```

3. **Test Cookie String**
   ```bash
   # Run the extraction script to validate format
   python scripts/extract_gptzero_cookies.py
   ```

4. **Monitor API Requests**
   - Use the test script with verbose output
   - Check response headers and status codes
   - Look for error messages in response body

## API Reference

### GPTZeroDetector Class

```python
from api.services.gptzero_detector import GPTZeroDetector

# Initialize detector
detector = GPTZeroDetector(
    cookies_dict={"accessToken4": "...", "plan": "Free"},
    scan_id="your-scan-id",
    timeout=30
)

# Synchronous detection
result = detector.detect("Text to analyze")

# Async detection
result = await detector.detect_async("Text to analyze")
```

### Response Format

```json
{
  "success": true,
  "ai_probability": 0.75,
  "human_probability": 0.20,
  "mixed_probability": 0.05,
  "confidence": 0.50,
  "class_probabilities": {
    "ai": 0.75,
    "human": 0.20,
    "mixed": 0.05
  },
  "scan_id": "ef6eec63-f673-4764-8e96-32875529b4f6",
  "response_time_ms": 1234.56,
  "raw_response": { ... }
}
```

### Detection Endpoint

```bash
POST /api/v1/detect/
Content-Type: application/json

{
  "text": "Text to analyze"
}
```

Response:
```json
{
  "human_likelihood_pct": 20.5,
  "ai_likelihood_pct": 79.5,
  "detectors": {
    "gptzero": {
      "name": "GPTZero",
      "ai_probability": 0.795,
      "human_probability": 0.205,
      "confidence": 0.590,
      "response_time_ms": 1234.56
    }
  }
}
```

## Security Considerations

1. **Never commit cookies to version control**
   - Add `.env` to `.gitignore`
   - Use environment variables for production

2. **Rotate cookies regularly**
   - Set up a schedule to refresh cookies
   - Monitor token expiration

3. **Use secure storage**
   - Store cookies in encrypted environment variables
   - Use secrets management in production

4. **Limit cookie access**
   - Only share cookies with authorized services
   - Use read-only access when possible

## Production Deployment

### Best Practices

1. **Use environment-specific configurations**
   ```bash
   # Development
   GPTZERO_COOKIE_STRING="dev-cookies"
   
   # Production
   GPTZERO_COOKIE_STRING="prod-cookies"
   ```

2. **Implement retry logic**
   ```python
   from tenacity import retry, stop_after_attempt, wait_exponential
   
   @retry(stop=stop_after_attempt(3), wait=wait_exponential())
   async def detect_with_retry(text):
       return await detector.detect_async(text)
   ```

3. **Monitor API usage**
   - Track request counts
   - Log response times
   - Alert on errors

4. **Cache results**
   - Cache detection results to reduce API calls
   - Use content hash as cache key

## Resources

- [GPTZero Official Website](https://gptzero.me/)
- [GPTZero Web App](https://app.gptzero.me/)
- [GPTZero Documentation](https://docs.gptzero.me/)
- [API Status Page](https://status.gptzero.me/)

## Support

For issues or questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review the [API Reference](#api-reference)
3. Open an issue on the project repository
4. Contact GPTZero support for API-specific issues

## License

This integration code is part of the Humanize project and follows the project's license.


