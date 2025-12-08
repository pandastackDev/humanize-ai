#!/usr/bin/env python3
"""
Simple GPTZero API test script
Extracts class_probabilities from the API response

Usage:
    python scripts/test_gptzero_api.py [--file path/to/text.txt] [--scan-id YOUR_SCAN_ID]

Examples:
    # Test with default sample text
    python scripts/test_gptzero_api.py

    # Test with custom text file
    python scripts/test_gptzero_api.py --file sample.txt

    # Test with custom scan ID
    python scripts/test_gptzero_api.py --scan-id ef6eec63-f673-4764-8e96-32875529b4f6
"""

import argparse
import json
import sys
from pathlib import Path

import requests

# Add parent directory to path to import from src
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

# Import settings for cookies
try:
    from api.config import settings

    USE_ENV_COOKIES = True
except ImportError:
    USE_ENV_COOKIES = False
    print("Warning: Could not import settings. Using hardcoded cookies.")


def test_gptzero(document_text, scan_id=None, cookies=None):
    """
    Test GPTZero API and get full analysis results

    Args:
        document_text: The text to analyze
        scan_id: Optional scan ID. If not provided, uses a default scanId.
                 Note: Scans must be created through the web interface first.
                 Visit https://app.gptzero.me/ to create a scan and get a scanId.
        cookies: Optional cookies dict. If not provided, uses cookies from .env

    Returns:
        dict: Full API response including meta, version, documents, class_probabilities, etc.
    """
    # Use session to maintain cookies
    session = requests.Session()

    # Headers from the curl command
    headers = {
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/json",
        "origin": "https://app.gptzero.me",
        "priority": "u=1, i",
        "referer": "https://app.gptzero.me/",
        "sec-ch-ua": '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
    }

    # Get cookies - either from parameter, environment, or hardcoded
    if cookies is None:
        if USE_ENV_COOKIES and settings.GPTZERO_COOKIE_STRING:
            # Parse cookie string from .env
            cookies = {}
            for cookie in settings.GPTZERO_COOKIE_STRING.split(";"):
                cookie = cookie.strip()
                if "=" in cookie:
                    key, value = cookie.split("=", 1)
                    cookies[key.strip()] = value.strip()
            print(f"Using cookies from .env file ({len(cookies)} cookies)")
        else:
            # Fallback to hardcoded cookies (latest working session)
            cookies = {
                "_gcl_au": "1.1.670181255.1764836389",
                "__Host-gptzero-csrf-token": "a821057457241ebe4fbdb8bbe92004246f968753fac59eec15463391dad095aff9b867e8a43078de291e07ace3d7d1770cbe209cdf4acc1d063f7dcf75bb483e%7C316f78b82da7ad1467b12efea353466a96c3d3d7d0bb63f5b72579c121cc1301",
                "_ga": "GA1.1.1204378151.1764836389",
                "_ca_device_id": "ca_2114a308-a8ba-4578-b25a-8298193b4d85",
                "__hstc": "72891980.d380dbc8a9e224c9158dcc1a05fb2917.1764836430420.1764836430420.1764836430420.1",
                "hubspotutk": "d380dbc8a9e224c9158dcc1a05fb2917",
                "__hssrc": "1",
                "_hjSessionUser_3701535": "eyJpZCI6IjZhNTkwYWUwLWE2NjktNTkzMC04NjUwLTZlYjc4YWMyNTg1MiIsImNyZWF0ZWQiOjE3NjQ4MzY1Mzc4NDEsImV4aXN0aW5nIjp0cnVlfQ==",
                "accessToken4": "eyJhbGciOiJIUzI1NiIsImtpZCI6IkxQUGtRbDRKRlQvcmY5VkoiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2x5ZHFoZ2R6aHZzcWxjb2JkZnhpLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI5ZmUyMGEyZi00Y2E3LTQ1YmYtYmIyYy1hODAxZGU5OGQ0MTYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY1NDQxMzc0LCJpYXQiOjE3NjQ4MzY1NzQsImVtYWlsIjoiMDBqYWxpbmdvNjRAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJnb29nbGUiLCJwcm92aWRlcnMiOlsiZ29vZ2xlIl19LCJ1c2VyX21ldGFkYXRhIjp7ImF2YXRhcl91cmwiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NLNTVoLWdHRExhQmRZNGtQSFo1RDdmRGV4X2JUS2NtY0xBSk9SX25VN1pLQ2NKNEE9czk2LWMiLCJlbWFpbCI6IjAwamFsaW5nbzY0QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmdWxsX25hbWUiOiJTYWRpeWEgSmliaXIiLCJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYW1lIjoiU2FkaXlhIEppYmlyIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSzU1aC1nR0RMYUJkWTRrUEhaNUQ3ZkRleF9iVEtjbWNMQUpPUl9uVTdaS0NjSjRBPXM5Ni1jIiwicHJvdmlkZXJfaWQiOiIxMDYyOTc5NDk2NzYwMTU2MTQ3ODYiLCJzdWIiOiIxMDYyOTc5NDk2NzYwMTU2MTQ3ODYifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJvYXV0aCIsInRpbWVzdGFtcCI6MTc2NDgzNjU3NH1dLCJzZXNzaW9uX2lkIjoiYmZmMTdhOTMtNDA2ZC00ODkxLWI1ZWMtNTY1YzAwMTFjOGE5IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.eKtiHQVb91ty1A_nmAq6jOgi2w_INnmidvEG4btszKU",
                "anonymousUserId": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhNWIyN2JiYi04MjE3LTRmYmItYWQ2Ni0zODNmMTk5MWZhZGIiLCJpYXQiOjE3NjQ4MzY1NzUsImV4cCI6MTc2NDkyMjk3NX0.icjkvORqPVuVhiK84YfaDXEMktzravLuro3VoT4JSoY",
                "plan": "Free",
                "_ga_Z6QQHT52V9": "GS2.1.s1764841308$o2$g0$t1764841308$j60$l0$h0",
                "AMP_8f1ede8e9c": "JTdCJTIyZGV2aWNlSWQlMjIlM0ElMjJkNzkzYTQ0ZC02ODY1LTRlNDItYTRmMC01NzUyZjc5NjQ0NmQlMjIlMkMlMjJ1c2VySWQlMjIlM0ElMjI5ZmUyMGEyZi00Y2E3LTQ1YmYtYmIyYy1hODAxZGU5OGQ0MTYlMjIlMkMlMjJzZXNzaW9uSWQlMjIlM0ExNzY0ODQ3MTQ0OTA0JTJDJTIyb3B0T3V0JTIyJTNBZmFsc2UlMkMlMjJsYXN0RXZlbnRUaW1lJTIyJTNBMTc2NDg0NzE0NTQ3MSUyQyUyMmxhc3RFdmVudElkJTIyJTNBNDQlMkMlMjJwYWdlQ291bnRlciUyMiUzQTAlN0Q=",
            }
            print(f"Using hardcoded cookies ({len(cookies)} cookies)")

    session.cookies.update(cookies)
    session.headers.update(headers)

    # Generate / validate scan_id if not provided
    # Note: Scan must be created through web interface first at https://app.gptzero.me/
    # You should pass your real scanId via --scan-id; the default here is only a placeholder.
    if not scan_id:
        if USE_ENV_COOKIES and hasattr(settings, "GPTZERO_SCAN_ID") and settings.GPTZERO_SCAN_ID:
            scan_id = settings.GPTZERO_SCAN_ID
            print(f"Using scan ID from .env: {scan_id}")
        else:
            # PLACEHOLDER: replace with your own scanId if you want a built-in default
            scan_id = "ef6eec63-f673-4764-8e96-32875529b4f6"
            print(f"Using default scan ID: {scan_id}")

    # Submit text for analysis
    url = "https://api.gptzero.me/v3/ai/text"
    payload = {
        "scanId": scan_id,
        "multilingual": True,
        "document": document_text,
        "interpretability_required": False,
    }

    print(f"\nMaking request to {url}...")
    print(f"Text length: {len(document_text)} characters")
    print(f"Using scan ID: {scan_id}\n")

    # Make the API request
    response = session.post(url, json=payload)

    # Better error handling
    if response.status_code != 200:
        try:
            error_detail = response.json()
            raise Exception(f"API Error {response.status_code}: {error_detail}")
        except json.JSONDecodeError:
            raise Exception(f"API Error {response.status_code}: {response.text}")

    # Parse response and return full result
    result = response.json()

    # Add scanId to the result for reference
    result["scanId"] = scan_id

    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test GPTZero API with a text sample.")
    parser.add_argument(
        "--file",
        help="Path to a text file to analyze. If omitted, uses the built-in sample text.",
    )
    parser.add_argument(
        "--scan-id",
        help="GPTZero scanId to use. If omitted, tries to use GPTZERO_SCAN_ID from .env, then falls back to placeholder.",
    )
    parser.add_argument(
        "--output",
        help="Path to save the full JSON response. If omitted, prints to console.",
    )
    args = parser.parse_args()

    if args.file:
        with open(args.file, encoding="utf-8") as f:
            sample_text = f.read()
        print(f"Loaded text from {args.file}")
    else:
        # Fallback built-in sample text (AI-generated text for testing)
        sample_text = """The utilization of advanced technological systems facilitates enhanced productivity and operational efficiency across various organizational domains. Contemporary enterprises increasingly leverage sophisticated digital infrastructures to optimize workflow processes and streamline communication protocols. The implementation of automated solutions enables systematic task execution while minimizing human intervention requirements. Furthermore, the integration of artificial intelligence capabilities provides unprecedented analytical insights and predictive modeling functionalities."""
        print("Using built-in sample text (AI-generated)")

    try:
        result = test_gptzero(sample_text, scan_id=args.scan_id)

        if result:
            # Save or print full response
            if args.output:
                with open(args.output, "w", encoding="utf-8") as f:
                    json.dump(result, f, indent=4)
                print(f"\n✓ Full response saved to {args.output}")
            else:
                print("\n" + "=" * 80)
                print("Full API Response:")
                print("=" * 80)
                print(json.dumps(result, indent=4))

            # Also show class_probabilities for quick reference
            print("\n" + "=" * 80)
            if result.get("documents") and len(result["documents"]) > 0:
                document = result["documents"][0]
                class_probabilities = document.get("class_probabilities", {})

                print("Detection Results Summary:")
                print("=" * 80)
                print(f"AI Probability:    {class_probabilities.get('ai', 0):.2%}")
                print(f"Human Probability: {class_probabilities.get('human', 0):.2%}")
                print(f"Mixed Probability: {class_probabilities.get('mixed', 0):.2%}")
                print()

                # Show other useful fields if available
                if "average_generated_prob" in document:
                    print(f"Average Generated Prob: {document['average_generated_prob']:.2%}")
                if "completely_generated_prob" in document:
                    print(f"Completely Generated:   {document['completely_generated_prob']:.2%}")

                print("=" * 80)
                print("\n✓ Detection completed successfully!")
            else:
                print("Warning: No documents found in response")
                print("=" * 80)
        else:
            print("\n✗ No response data found")

    except Exception as e:
        print(f"\n✗ Error: {e}")
        print("\nTroubleshooting tips:")
        print("1. Make sure your cookies are fresh (check accessToken4 expiration)")
        print("2. Create a scan at https://app.gptzero.me/ and use --scan-id")
        print("3. Set GPTZERO_COOKIE_STRING in backend/.env file")
        print("4. Run: python scripts/extract_gptzero_cookies.py to update cookies")
        sys.exit(1)
