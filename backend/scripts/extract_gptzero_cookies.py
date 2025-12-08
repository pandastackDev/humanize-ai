#!/usr/bin/env python3
"""
Extract GPTZero cookies from your working script and format for .env file.

Usage:
    1. Update the cookies dictionary below with your actual cookies
    2. Run: python scripts/extract_gptzero_cookies.py
    3. Copy the output to your .env file

To get fresh cookies:
    1. Open https://app.gptzero.me/ in your browser
    2. Log in with your account
    3. Open DevTools (F12) -> Network tab
    4. Make a detection request
    5. Find the request to api.gptzero.me/v3/ai/text
    6. Copy the cookies from the request headers
    7. Update the cookies_dict below
"""

# Paste your cookies from the working script here
# These cookies are from the latest working session (Dec 4, 2025)
cookies_dict = {
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

# Default scan ID - you should create your own scan at https://app.gptzero.me/
# This is required for the API to work
DEFAULT_SCAN_ID = "ef6eec63-f673-4764-8e96-32875529b4f6"


def dict_to_cookie_string(cookies_dict: dict) -> str:
    """Convert dictionary to cookie string."""
    return "; ".join([f"{k}={v}" for k, v in cookies_dict.items()])


def format_for_env():
    """Format cookies for .env file."""

    print("=" * 80)
    print("GPTZero Configuration for .env")
    print("=" * 80)
    print()
    print("# Copy the lines below to your backend/.env file:")
    print()

    # Convert to cookie string
    cookie_string = dict_to_cookie_string(cookies_dict)
    print(f'GPTZERO_COOKIE_STRING="{cookie_string}"')
    print()
    print("# Optional: Scan ID (create a scan at https://app.gptzero.me/)")
    print(f'GPTZERO_SCAN_ID="{DEFAULT_SCAN_ID}"')
    print()
    print("=" * 80)
    print()
    print("Important Notes:")
    print("1. The accessToken4 JWT will expire - check the 'exp' claim")
    print("   - Token expires at: 1765441374 (Unix timestamp)")
    print("   - After expiration, log in again at https://app.gptzero.me/")
    print()
    print("2. Get fresh cookies by:")
    print("   - Open https://app.gptzero.me/ in your browser")
    print("   - Log in with your Google account")
    print("   - Open DevTools (F12) -> Network tab")
    print("   - Make a detection request")
    print("   - Find the request to api.gptzero.me/v3/ai/text")
    print("   - Copy cookies from the request headers")
    print()
    print("3. Create a scan at https://app.gptzero.me/ to get a scanId")
    print("   - The scan must exist before you can use it in API calls")
    print("   - Pass --scan-id when using test_gptzero_api.py")
    print()

    # Display key cookies
    print("Key cookies:")
    important_cookies = ["accessToken4", "__Host-gptzero-csrf-token", "anonymousUserId", "plan"]
    for key in important_cookies:
        value = cookies_dict.get(key, "NOT FOUND")
        if key in ["accessToken4", "__Host-gptzero-csrf-token"] and value != "NOT FOUND":
            value = value[:50] + "..."  # Truncate for display
        print(f"  {key}: {value}")
    print()


if __name__ == "__main__":
    format_for_env()
