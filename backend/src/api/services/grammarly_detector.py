"""
Grammarly AI Content Detector - Browser-based session authentication.

This implementation uses browser session cookies to authenticate with Grammarly's API.
API: https://capi.grammarly.com/api/check/aidetector
"""

import json
import logging
import time

import httpx

logger = logging.getLogger(__name__)


class GrammarlyDetector:
    """
    Grammarly AI Content Detector using browser session authentication.

    This implementation mimics browser requests to Grammarly's web API.
    """

    def __init__(
        self,
        cookies_dict: dict[str, str],
        csrf_token: str | None = None,
        container_id: str | None = None,
        timeout: int = 60,
    ):
        """
        Initialize Grammarly detector.

        Args:
            cookies_dict: Dictionary of browser cookies
            csrf_token: CSRF token for API authentication
            container_id: Container ID for Grammarly session
            timeout: Request timeout in seconds
        """
        self.cookies = cookies_dict
        self.csrf_token = csrf_token or ""
        self.container_id = container_id or ""
        self.timeout = timeout

        # Build headers
        self.headers = {
            "accept": "application/json",
            "accept-language": "en-US,en;q=0.9",
            "content-type": "application/json",
            "origin": "https://app.grammarly.com",
            "referer": "https://app.grammarly.com/",
            "sec-ch-ua": '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
        }

        # Add CSRF token and container ID to headers if available
        if self.csrf_token:
            self.headers["x-csrf-token"] = self.csrf_token
        if self.container_id:
            self.headers["x-container-id"] = self.container_id

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
                "confidence": float (0-1),
                "raw_response": dict,
                "response_time_ms": float,
                "error": str (if failed)
            }
        """
        start_time = time.time()

        try:
            # Prepare request
            url = "https://capi.grammarly.com/api/check/aidetector"
            payload = {
                "text": text,
            }

            # Make synchronous request
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(
                    url, json=payload, headers=self.headers, cookies=self.cookies
                )

                response_time_ms = (time.time() - start_time) * 1000

                # Check response status
                if response.status_code != 200:
                    error_detail = f"HTTP {response.status_code}"
                    try:
                        error_json = response.json()
                        error_detail = f"HTTP {response.status_code}: {json.dumps(error_json)}"
                    except Exception:
                        error_detail = f"HTTP {response.status_code}: {response.text[:200]}"

                    logger.error(f"Grammarly API error: {error_detail}")
                    return {
                        "success": False,
                        "ai_probability": 0.5,
                        "human_probability": 0.5,
                        "confidence": 0.0,
                        "response_time_ms": response_time_ms,
                        "error": error_detail,
                        "raw_response": None,
                    }

                # Parse response
                data = response.json()

                # Extract AI probability from response
                # Grammarly's response format may vary - adjust as needed
                ai_score = data.get("ai_score", 0.5)
                if isinstance(ai_score, (int, float)):
                    # Normalize to 0-1 range if needed
                    if ai_score > 1:
                        ai_score = ai_score / 100.0
                    ai_probability = float(ai_score)
                else:
                    ai_probability = 0.5

                human_probability = 1.0 - ai_probability
                confidence = abs(ai_probability - 0.5) * 2

                logger.info(
                    f"Grammarly detection successful: AI={ai_probability:.2%}, "
                    f"Human={human_probability:.2%}, Time={response_time_ms:.0f}ms"
                )

                return {
                    "success": True,
                    "ai_probability": ai_probability,
                    "human_probability": human_probability,
                    "confidence": confidence,
                    "response_time_ms": response_time_ms,
                    "raw_response": data,
                    "error": None,
                }

        except httpx.TimeoutException as e:
            response_time_ms = (time.time() - start_time) * 1000
            error_msg = f"Request timeout: {str(e)}"
            logger.error(f"Grammarly detection timeout: {error_msg}")
            return {
                "success": False,
                "ai_probability": 0.5,
                "human_probability": 0.5,
                "confidence": 0.0,
                "response_time_ms": response_time_ms,
                "error": error_msg,
                "raw_response": None,
            }
        except Exception as e:
            response_time_ms = (time.time() - start_time) * 1000
            error_msg = f"Unexpected error: {str(e)}"
            logger.error(f"Grammarly detection failed: {error_msg}", exc_info=True)
            return {
                "success": False,
                "ai_probability": 0.5,
                "human_probability": 0.5,
                "confidence": 0.0,
                "response_time_ms": response_time_ms,
                "error": error_msg,
                "raw_response": None,
            }
