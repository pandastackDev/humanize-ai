"""
CrossPlag AI Content Detector - Public API (no authentication required).

This implementation uses CrossPlag's free public API for AI detection.
API: https://lkv1fgxnwa.execute-api.eu-central-1.amazonaws.com/production/detect
"""

import json
import logging
import time

import httpx

logger = logging.getLogger(__name__)


class CrossPlagDetector:
    """
    CrossPlag AI Content Detector using public API.

    No authentication required - this is a free public endpoint.
    """

    def __init__(self, timeout: int = 60):
        """
        Initialize CrossPlag detector.

        Args:
            timeout: Request timeout in seconds
        """
        self.base_url = (
            "https://lkv1fgxnwa.execute-api.eu-central-1.amazonaws.com/production/detect"
        )
        self.timeout = timeout

        # Build headers - matching actual API request from app.crossplag.com
        self.headers = {
            "accept": "*/*",
            "accept-encoding": "gzip, deflate, br, zstd",
            "accept-language": "en-US,en;q=0.9",
            "content-type": "application/json",
            "origin": "https://app.crossplag.com",
            "referer": "https://app.crossplag.com/",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "cross-site",
            "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
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
                "confidence": float (0-1),
                "raw_response": dict,
                "response_time_ms": float,
                "error": str (if failed)
            }
        """
        start_time = time.time()

        try:
            # Prepare request
            payload = {
                "text": text,
            }

            # Make synchronous request
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(self.base_url, json=payload, headers=self.headers)

                response_time_ms = (time.time() - start_time) * 1000

                # Check response status
                if response.status_code != 200:
                    error_detail = f"HTTP {response.status_code}"
                    try:
                        error_json = response.json()
                        error_detail = f"HTTP {response.status_code}: {json.dumps(error_json)}"
                    except Exception:
                        error_detail = f"HTTP {response.status_code}: {response.text[:200]}"

                    logger.error(f"CrossPlag API error: {error_detail}")
                    return {
                        "success": False,
                        "ai_probability": 0.5,
                        "human_probability": 0.5,
                        "confidence": 0.0,
                        "response_time_ms": response_time_ms,
                        "error": f"CrossPlag API returned status {response.status_code}",
                        "raw_response": {
                            "status_code": response.status_code,
                            "text": response.text[:500],
                        },
                    }

                # Parse response
                try:
                    data = response.json()
                except Exception as parse_error:
                    logger.error(f"CrossPlag: Failed to parse JSON response: {parse_error}")
                    return {
                        "success": False,
                        "ai_probability": 0.5,
                        "human_probability": 0.5,
                        "confidence": 0.0,
                        "response_time_ms": response_time_ms,
                        "error": "Invalid response format from CrossPlag API",
                        "raw_response": {"raw_text": response.text[:500]},
                    }

                # Check for error indicators in response
                if "error" in data or "message" in data:
                    error_msg = (
                        data.get("error")
                        or data.get("message")
                        or "Unknown error from CrossPlag API"
                    )
                    logger.error(f"CrossPlag API returned error: {error_msg}")
                    return {
                        "success": False,
                        "ai_probability": 0.5,
                        "human_probability": 0.5,
                        "confidence": 0.0,
                        "response_time_ms": response_time_ms,
                        "error": str(error_msg),
                        "raw_response": data,
                    }

                # Extract AI probability from response
                # CrossPlag's actual response format: {"dataToreturn": {"aiIndex": "1.00"}}
                # aiIndex is a string representing percentage (1.00 = 100% = 1.0 probability)
                ai_probability = None
                found_valid_field = False

                # Check for actual API response format: dataToreturn.aiIndex
                if "dataToreturn" in data and isinstance(data["dataToreturn"], dict):
                    data_to_return = data["dataToreturn"]
                    if "aiIndex" in data_to_return:
                        # aiIndex is a string like "1.00" representing percentage
                        ai_index_str = str(data_to_return["aiIndex"])
                        ai_probability = float(ai_index_str)
                        # Ensure it's normalized to 0-1 range (if it's > 1, divide by 100)
                        if ai_probability > 1.0:
                            ai_probability = ai_probability / 100.0
                        found_valid_field = True
                    elif "ai_probability" in data_to_return:
                        ai_probability = float(data_to_return["ai_probability"])
                        found_valid_field = True

                # Fallback to other possible formats for backward compatibility
                if not found_valid_field:
                    if "ai_probability" in data:
                        ai_probability = float(data["ai_probability"])
                        found_valid_field = True
                    elif "ai_score" in data:
                        score = data["ai_score"]
                        # Normalize to 0-1 if needed
                        ai_probability = float(score) / 100.0 if score > 1 else float(score)
                        found_valid_field = True
                    elif "score" in data:
                        score = data["score"]
                        ai_probability = float(score) / 100.0 if score > 1 else float(score)
                        found_valid_field = True
                    elif "result" in data and isinstance(data["result"], dict):
                        result = data["result"]
                        if "ai_probability" in result:
                            ai_probability = float(result["ai_probability"])
                            found_valid_field = True
                        elif "ai_score" in result:
                            score = result["ai_score"]
                            ai_probability = float(score) / 100.0 if score > 1 else float(score)
                            found_valid_field = True
                    elif "probability" in data:
                        ai_probability = float(data["probability"])
                        found_valid_field = True

                # If we couldn't extract a valid probability, treat as error
                if not found_valid_field or ai_probability is None:
                    logger.error(
                        f"CrossPlag: Could not extract AI probability from response. "
                        f"Response keys: {list(data.keys())}, Response: {json.dumps(data)[:500]}"
                    )
                    return {
                        "success": False,
                        "ai_probability": 0.5,
                        "human_probability": 0.5,
                        "confidence": 0.0,
                        "response_time_ms": response_time_ms,
                        "error": "Unexpected response format from CrossPlag API",
                        "raw_response": data,
                    }

                # Ensure in 0-1 range
                ai_probability = max(0.0, min(1.0, ai_probability))
                human_probability = 1.0 - ai_probability
                confidence = abs(ai_probability - 0.5) * 2

                logger.info(
                    f"CrossPlag detection successful: AI={ai_probability:.2%}, "
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
            logger.error(f"CrossPlag detection timeout: {error_msg}")
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
            logger.error(f"CrossPlag detection failed: {error_msg}", exc_info=True)
            return {
                "success": False,
                "ai_probability": 0.5,
                "human_probability": 0.5,
                "confidence": 0.0,
                "response_time_ms": response_time_ms,
                "error": error_msg,
                "raw_response": None,
            }
