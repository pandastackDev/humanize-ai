"""
GPTZero Detector - Browser-based session authentication.

This implementation uses browser session cookies to authenticate with GPTZero's API,
as provided by the user's working script.
"""

import json
import logging
import time

import httpx

logger = logging.getLogger(__name__)


class GPTZeroDetector:
    """
    GPTZero detector using browser session authentication.

    This implementation mimics browser requests to GPTZero's web API.
    """

    def __init__(self, cookies_dict: dict[str, str], scan_id: str | None = None, timeout: int = 30):
        """
        Initialize GPTZero detector.

        Args:
            cookies_dict: Dictionary of browser cookies
            scan_id: Optional scan ID (must be created through web interface)
            timeout: Request timeout in seconds
        """
        self.cookies = cookies_dict
        # Use provided scan_id or default from your working script
        self.scan_id = scan_id or "ef6eec63-f673-4764-8e96-32875529b4f6"  # Default scan ID
        self.timeout = timeout

        # Browser-like headers for better compatibility
        self.headers = {
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

    def detect(self, text: str) -> dict:
        """
        Detect AI-generated content in text.

        Args:
            text: Text to analyze

        Returns:
            Dictionary with detection results:
            {
                "success": bool,
                "ai_probability": float (0-1),
                "human_probability": float (0-1),
                "mixed_probability": float (0-1),
                "confidence": float (0-1),
                "class_probabilities": dict,
                "raw_response": dict,
                "error": str (if failed)
            }
        """
        start_time = time.time()

        try:
            # Prepare request
            url = "https://api.gptzero.me/v3/ai/text"
            payload = {
                "scanId": self.scan_id,
                "multilingual": True,
                "document": text,
                "interpretability_required": False,
            }

            # Make synchronous request
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(
                    url, json=payload, headers=self.headers, cookies=self.cookies
                )

                # Check response status
                if response.status_code != 200:
                    error_detail = f"HTTP {response.status_code}"
                    try:
                        error_json = response.json()
                        error_detail = f"HTTP {response.status_code}: {json.dumps(error_json)}"
                    except Exception:
                        error_detail = f"HTTP {response.status_code}: {response.text[:200]}"

                    logger.error(f"GPTZero API error: {error_detail}")
                    return {
                        "success": False,
                        "error": error_detail,
                        "ai_probability": 0.5,
                        "human_probability": 0.5,
                        "mixed_probability": 0.0,
                        "confidence": 0.0,
                    }

                # Parse response
                result = response.json()

                # Extract class probabilities from response
                class_probabilities = {}
                ai_prob = 0.5
                human_prob = 0.5
                mixed_prob = 0.0
                confidence = 0.0

                if "documents" in result and len(result["documents"]) > 0:
                    document = result["documents"][0]
                    class_probabilities = document.get("class_probabilities", {})

                    # Extract probabilities
                    ai_prob = float(class_probabilities.get("ai", 0.5))
                    human_prob = float(class_probabilities.get("human", 1 - ai_prob))
                    mixed_prob = float(class_probabilities.get("mixed", 0.0))

                    # Calculate confidence (distance from uncertain 0.5)
                    confidence = abs(ai_prob - 0.5) * 2

                response_time = (time.time() - start_time) * 1000

                logger.info(
                    f"GPTZero detection complete: AI={ai_prob:.2%}, Human={human_prob:.2%}, "
                    f"Mixed={mixed_prob:.2%}, Time={response_time:.0f}ms"
                )

                return {
                    "success": True,
                    "ai_probability": ai_prob,
                    "human_probability": human_prob,
                    "mixed_probability": mixed_prob,
                    "confidence": confidence,
                    "class_probabilities": class_probabilities,
                    "scan_id": self.scan_id,
                    "response_time_ms": response_time,
                    "raw_response": result,
                }

        except httpx.TimeoutException:
            error_msg = f"Request timeout after {self.timeout}s"
            logger.error(f"GPTZero timeout: {error_msg}")
            return {
                "success": False,
                "error": error_msg,
                "ai_probability": 0.5,
                "human_probability": 0.5,
                "mixed_probability": 0.0,
                "confidence": 0.0,
            }

        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            logger.error(f"GPTZero error: {error_msg}")
            return {
                "success": False,
                "error": error_msg,
                "ai_probability": 0.5,
                "human_probability": 0.5,
                "mixed_probability": 0.0,
                "confidence": 0.0,
            }

    async def detect_async(self, text: str) -> dict:
        """
        Async version of detect method.

        Args:
            text: Text to analyze

        Returns:
            Dictionary with detection results
        """
        start_time = time.time()

        try:
            # Prepare request
            url = "https://api.gptzero.me/v3/ai/text"
            payload = {
                "scanId": self.scan_id,
                "multilingual": True,
                "document": text,
                "interpretability_required": False,
            }

            # Make async request
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    url, json=payload, headers=self.headers, cookies=self.cookies
                )

                # Check response status
                if response.status_code != 200:
                    error_detail = f"HTTP {response.status_code}"
                    try:
                        error_json = response.json()
                        error_detail = f"HTTP {response.status_code}: {json.dumps(error_json)}"
                    except Exception:
                        error_detail = f"HTTP {response.status_code}: {response.text[:200]}"

                    logger.error(f"GPTZero API error: {error_detail}")
                    return {
                        "success": False,
                        "error": error_detail,
                        "ai_probability": 0.5,
                        "human_probability": 0.5,
                        "mixed_probability": 0.0,
                        "confidence": 0.0,
                    }

                # Parse response
                result = response.json()

                # Extract class probabilities from response
                class_probabilities = {}
                ai_prob = 0.5
                human_prob = 0.5
                mixed_prob = 0.0
                confidence = 0.0

                if "documents" in result and len(result["documents"]) > 0:
                    document = result["documents"][0]
                    class_probabilities = document.get("class_probabilities", {})

                    # Extract probabilities
                    ai_prob = float(class_probabilities.get("ai", 0.5))
                    human_prob = float(class_probabilities.get("human", 1 - ai_prob))
                    mixed_prob = float(class_probabilities.get("mixed", 0.0))

                    # Calculate confidence
                    confidence = abs(ai_prob - 0.5) * 2

                response_time = (time.time() - start_time) * 1000

                logger.info(
                    f"GPTZero detection complete: AI={ai_prob:.2%}, Human={human_prob:.2%}, "
                    f"Mixed={mixed_prob:.2%}, Time={response_time:.0f}ms"
                )

                return {
                    "success": True,
                    "ai_probability": ai_prob,
                    "human_probability": human_prob,
                    "mixed_probability": mixed_prob,
                    "confidence": confidence,
                    "class_probabilities": class_probabilities,
                    "scan_id": self.scan_id,
                    "response_time_ms": response_time,
                    "raw_response": result,
                }

        except httpx.TimeoutException:
            error_msg = f"Request timeout after {self.timeout}s"
            logger.error(f"GPTZero timeout: {error_msg}")
            return {
                "success": False,
                "error": error_msg,
                "ai_probability": 0.5,
                "human_probability": 0.5,
                "mixed_probability": 0.0,
                "confidence": 0.0,
            }

        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            logger.error(f"GPTZero error: {error_msg}")
            return {
                "success": False,
                "error": error_msg,
                "ai_probability": 0.5,
                "human_probability": 0.5,
                "mixed_probability": 0.0,
                "confidence": 0.0,
            }


def parse_cookie_string(cookie_string: str) -> dict[str, str]:
    """
    Parse a cookie string from browser into a dictionary.

    Args:
        cookie_string: Cookie string (semicolon-separated key=value pairs)

    Returns:
        Dictionary of cookies
    """
    cookies = {}

    for cookie in cookie_string.split(";"):
        cookie = cookie.strip()
        if "=" in cookie:
            key, value = cookie.split("=", 1)
            cookies[key.strip()] = value.strip()

    return cookies


# Example usage
if __name__ == "__main__":
    # Example cookie dictionary (replace with your actual cookies)
    cookies = {
        "hubspotutk": "89c5aec0e4c2365d38d409a9644b0a6b",
        "_ga": "GA1.1.1155724433.1763494749",
        "accessToken4": "your_access_token_here",
        "plan": "Free",
        "__Host-gptzero-csrf-token": "your_csrf_token_here",
    }

    # Create detector
    detector = GPTZeroDetector(cookies)

    # Test text
    test_text = """
    The utilization of advanced technological systems facilitates enhanced productivity
    and operational efficiency across various organizational domains.
    """

    # Run detection
    result = detector.detect(test_text)

    print("Detection Result:")
    print(json.dumps(result, indent=2))
