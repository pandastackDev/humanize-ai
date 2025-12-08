#!/usr/bin/env python3
"""
Extract QuillBot cookies from your working script and format for .env file.

Usage:
    1. Update the cookies dictionary below with your actual cookies
    2. Run: python scripts/extract_quillbot_cookies.py
    3. Copy the output to your .env file
"""

# Paste your cookies from the working script here
cookies_string = """abIDV2=99; _sp_ses.48cd=*; anonID=97c3503636095b4a; premium=false; acceptedPremiumModesTnc=false; qdid=2847716235329878270; connect.sid=s%3AYL9H00zxjv_SDVKqWbQbQcBwJf008AEf.NAdHwmv831oJ1NHTgLU5j5tp7fwCJZjs9j1Wezx%2FR1w; ajs_anonymous_id=20295edb-3240-4e80-bd95-9934db61a915; AMP_MKTG_6e403e775d=JTdCJTdE; qbDeviceId=a2389b09-4f9c-4677-a478-85dac0987df8; cl_val=55; _gcl_au=1.1.1935673685.1764837838; g_state={"i_l":0,"i_ll":1764837814849}; FPID=FPID2.2.Ep5gH8z%2B%2BNxnS6JWxZMhmP5fCy1S6fj%2FzafLNWhshx4%3D.1764837846; FPLC=7lJAvv0qFyz%2BMh2w9sImY1LPtPY6uG4omQCsM3KuBenq8dx1YDlcGDqZC0w94Hzl7J2NN44xrNrprJsbM%2BTAoLMvu%2F0CBfj16V4%2FkKaOlVBJHmLEnSbikoijtn%2B1oQ%3D%3D; FPAU=1.1.1935673685.1764837838; useridtoken=eyJhbGciOiJSUzI1NiIsImtpZCI6IjdjNzQ5NTFmNjBhMDE0NzE3ZjFlMzA4ZDZiMjgwZjQ4ZjFlODhmZGEiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiSmV0dG9uIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0xOd0xOM3B1SDZ3REsydmNRMDZoRDBpWDdFVHFKSGNmM3RwYkJuYzMtVEE4cTJ5QT1zOTYtYyIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9wYXJhcGhyYXNlci00NzJjMSIsImF1ZCI6InBhcmFwaHJhc2VyLTQ3MmMxIiwiYXV0aF90aW1lIjoxNzY0ODM3ODQ0LCJ1c2VyX2lkIjoieWphSW5OTWZRTlcwckhmMTVkQW5GTTVMMTMxMyIsInN1YiI6InlqYUluTk1mUU5XMHJIZjE1ZEFuRk01TDEzMTMiLCJpYXQiOjE3NjQ4Mzc4NDQsImV4cCI6MTc2NDg0MTQ0NCwiZW1haWwiOiJqZXR0b245NTY0QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7Imdvb2dsZS5jb20iOlsiMTA1ODM5MTk1Mjc1Njk2NjEyNzIxIl0sImVtYWlsIjpbImpldHRvbjk1NjRAZ21haWwuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoiZ29vZ2xlLmNvbSJ9fQ.oiFXjZPxD_f2xZWVaIpqT8yTc3LZeQEw0RszrnSbNOtp9QQqfuXPwdmuULyRIAxISPUuKCC9narljlZiYjJ560oZf03VquKOrE5q4W31bXjvJGrpSMEEvEonzqt3zY3v03GnprqPZwJUE2o2zZK6lXDFr_QdHnPy9dCYPMfaGYRFsfLmj-4YnKSoD5uMYvXGfgKo0ceY9Mj22YI-6Ke87q1hdfu-Y21JJfgc6Rn_2PAigekxZEgas7vDWuyV_D6VM24U5LeBo7J6t5ju_QQ-WocniRqDlqPf7d3o6D9-Hmjru8WisAHXbPrjgbIjl8wwJrTN6PeOaTaiBq_S3jPhsA; authenticated=true; ajs_user_id=yjaInNMfQNW0rHf15dAnFM5L1313; _gid=GA1.2.201402602.1764837876; _clck=r68lqy%5E2%5Eg1k%5E0%5E2164; __cf_bm=unYO7HnPPnA0djC7wgBMoCqUN8lDpWUgDki7bWtJ7mE-1764838995-1.0.1.1-RspBAapWKdCo80L6U6l27crzkaErD4zjOSHkZrf3jitrOsPf0jh3zL2we_nawB3gDHoiu1q56Heb6sKvZ0wG06gA97moukxOPpXYMRVbKwY; OptanonConsent=isGpcEnabled=0&datestamp=Thu+Dec+04+2025+04%3A03%3A30+GMT-0500+(Eastern+Standard+Time)&version=202505.2.0&browserGpcFlag=0&isIABGlobal=false&hosts=&landingPath=NotLandingPage&groups=C0001%3A1%2CC0002%3A1%2CC0003%3A1%2CC0004%3A1%2CC0005%3A1&AwaitingReconsent=false; _ga=GA1.1.1013270079.1764837846; _uetsid=6b9c3710d0ed11f0ba4ac9cf47a6eaca; _uetvid=6b9c70d0d0ed11f09ce97f06d2d81c74; _clsk=1vis57%5E1764839200476%5E4%5E0%5Ev.clarity.ms%2Fcollect; _ga_D39F2PYGLM=GS2.1.s1764837846$o1$g1$t1764839200$j57$l0$h1554490856; AMP_6e403e775d=JTdCJTIyZGV2aWNlSWQlMjIlM0ElMjJhMjM4OWIwOS00ZjljLTQ2NzctYTQ3OC04NWRhYzA5ODdkZjglMjIlMkMlMjJ1c2VySWQlMjIlM0ElMjJ5amFJbk5NZlFOVzBySGYxNWRBbkZNNUwxMzEzJTIyJTJDJTIyc2Vzc2lvbklkJTIyJTNBMTc2NDgzNzgyNDk0MiUyQyUyMm9wdE91dCUyMiUzQWZhbHNlJTJDJTIybGFzdEV2ZW50VGltZSUyMiUzQTE3NjQ4MzkyMDA4MTQlMkMlMjJsYXN0RXZlbnRJZCUyMiUzQTY4JTdE; _sp_id.48cd=89b6479b-4efb-481b-b076-61e0f29e73f2.1764837801.1.1764839202..4a41032e-e400-4d73-98fc-c8c2b0f51502..5c987334-d3fa-4a71-9efd-205f18e8b54f.1764837802947.38"""

useridtoken = """eyJhbGciOiJSUzI1NiIsImtpZCI6IjdjNzQ5NTFmNjBhMDE0NzE3ZjFlMzA4ZDZiMjgwZjQ4ZjFlODhmZGEiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiSmV0dG9uIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0xOd0xOM3B1SDZ3REsydmNRMDZoRDBpWDdFVHFKSGNmM3RwYkJuYzMtVEE4cTJ5QT1zOTYtYyIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9wYXJhcGhyYXNlci00NzJjMSIsImF1ZCI6InBhcmFwaHJhc2VyLTQ3MmMxIiwiYXV0aF90aW1lIjoxNzY0ODM3ODQ0LCJ1c2VyX2lkIjoieWphSW5OTWZRTlcwckhmMTVkQW5GTTVMMTMxMyIsInN1YiI6InlqYUluTk1mUU5XMHJIZjE1ZEFuRk01TDEzMTMiLCJpYXQiOjE3NjQ4Mzc4NDQsImV4cCI6MTc2NDg0MTQ0NCwiZW1haWwiOiJqZXR0b245NTY0QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7Imdvb2dsZS5jb20iOlsiMTA1ODM5MTk1Mjc1Njk2NjEyNzIxIl0sImVtYWlsIjpbImpldHRvbjk1NjRAZ21haWwuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoiZ29vZ2xlLmNvbSJ9fQ.oiFXjZPxD_f2xZWVaIpqT8yTc3LZeQEw0RszrnSbNOtp9QQqfuXPwdmuULyRIAxISPUuKCC9narljlZiYjJ560oZf03VquKOrE5q4W31bXjvJGrpSMEEvEonzqt3zY3v03GnprqPZwJUE2o2zZK6lXDFr_QdHnPy9dCYPMfaGYRFsfLmj-4YnKSoD5uMYvXGfgKo0ceY9Mj22YI-6Ke87q1hdfu-Y21JJfgc6Rn_2PAigekxZEgas7vDWuyV_D6VM24U5LeBo7J6t5ju_QQ-WocniRqDlqPf7d3o6D9-Hmjru8WisAHXbPrjgbIjl8wwJrTN6PeOaTaiBq_S3jPhsA"""


def parse_cookies(cookie_string: str) -> dict:
    """Parse cookie string into dictionary."""
    cookies = {}
    for item in cookie_string.split("; "):
        if "=" in item:
            key, value = item.split("=", 1)
            cookies[key.strip()] = value.strip()
    return cookies


def format_for_env():
    """Format cookies for .env file."""

    print("=" * 80)
    print("QuillBot Configuration for .env")
    print("=" * 80)
    print()
    print("# Copy the lines below to your backend/.env file:")
    print()
    print(f'QUILLBOT_COOKIE_STRING="{cookies_string}"')
    print()
    print("# Optional: User ID token (JWT)")
    print(f'QUILLBOT_USERIDTOKEN="{useridtoken}"')
    print()
    print("=" * 80)
    print()
    print("Important Notes:")
    print("1. The useridtoken JWT will expire - check the 'exp' claim")
    print("2. Get fresh cookies by:")
    print("   - Open https://quillbot.com/ai-content-detector in your browser")
    print("   - Open DevTools (F12) -> Network tab")
    print("   - Make a detection request")
    print("   - Copy cookies from the request headers")
    print("3. QuillBot requires both cookies AND useridtoken")
    print()

    # Parse and display cookies
    cookies_dict = parse_cookies(cookies_string)

    print("Cookies parsed:")
    print(f"  Total: {len(cookies_dict)} cookies")
    print(f"  Has useridtoken: {'useridtoken' in cookies_dict}")
    print(f"  Has authenticated: {cookies_dict.get('authenticated') == 'true'}")
    print()

    # Extract key cookies
    important_cookies = ["useridtoken", "authenticated", "ajs_user_id", "qbDeviceId"]
    print("Key cookies:")
    for key in important_cookies:
        value = cookies_dict.get(key, "NOT FOUND")
        if key == "useridtoken" and value != "NOT FOUND":
            value = value[:50] + "..."  # Truncate for display
        print(f"  {key}: {value}")
    print()


if __name__ == "__main__":
    format_for_env()
