"""
Scribbr AI Content Detector - Browser-based session authentication.

This implementation uses browser session cookies to authenticate with Scribbr's API.
API: https://quillbot.scribbr.com/api/ai-detector/score
"""

import json
import logging
import time

import httpx

logger = logging.getLogger(__name__)


class ScribbrDetector:
    """
    Scribbr AI Content Detector using browser session authentication.

    This implementation mimics browser requests to Scribbr's web API.
    """

    def __init__(
        self,
        cookies_dict: dict[str, str],
        useridtoken: str | None = None,
        timeout: int = 60,
    ):
        """
        Initialize Scribbr detector.

        Args:
            cookies_dict: Dictionary of browser cookies
            useridtoken: User ID token for API authentication (can be "empty-token" for free tier)
            timeout: Request timeout in seconds
        """
        self.cookies = cookies_dict
        self.useridtoken = useridtoken or "empty-token"
        self.timeout = timeout

        # Build headers matching the curl command
        self.headers = {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-US,en;q=0.9",
            "content-type": "application/json",
            "origin": "https://quillbot.scribbr.com",
            "platform-type": "webapp",
            "priority": "u=1, i",
            "qb-product": "AI_CONTENT_DETECTOR",
            "referer": "https://quillbot.scribbr.com/ai-content-detector?independentTool=true&language=en&partnerCompany=scribbr&enableUpsell=true&fullScreen=true&cookieConsent=true&hideCautionBox=true&hideCautionBox=true",
            "sec-ch-ua": '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
            "useridtoken": self.useridtoken,
            "webapp-version": "38.43.1",
        }

    def detect(self, text: str, language: str = "en", explain: bool = True) -> dict:
        """
        Detect AI-generated content in text.

        Args:
            text: Text to analyze
            language: Language code (default: "en")
            explain: Whether to include explanation data (default: True)

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
            url = "https://quillbot.scribbr.com/api/ai-detector/score"
            payload = {
                "text": text,
                "language": language,
                "explain": explain,
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

                    logger.error(f"Scribbr API error: {error_detail}")
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
                # Response format: {"data": {"value": {"aiScore": 1, "chunks": [...]}}, ...}
                # aiScore is 0-1 where 1 = 100% AI
                if "data" in data and "value" in data["data"]:
                    value = data["data"]["value"]
                    ai_score = value.get("aiScore", 0.5)
                    
                    if isinstance(ai_score, (int, float)):
                        # aiScore is already 0-1 range
                        ai_probability = float(ai_score)
                    else:
                        logger.warning(f"Unexpected aiScore type: {type(ai_score)}, value: {ai_score}")
                        ai_probability = 0.5
                    
                    # Extract chunk-level details if available
                    chunks = value.get("chunks", [])
                    chunk_details = []
                    if chunks:
                        for chunk in chunks:
                            chunk_details.append({
                                "text": chunk.get("text", "")[:100] + "..." if len(chunk.get("text", "")) > 100 else chunk.get("text", ""),
                                "aiScore": chunk.get("aiScore", 0.5),
                                "type": chunk.get("type", "UNKNOWN"),
                            })
                else:
                    logger.warning(f"Unexpected Scribbr response format: {list(data.keys())}")
                    ai_probability = 0.5
                    chunk_details = []

                human_probability = 1.0 - ai_probability
                confidence = abs(ai_probability - 0.5) * 2

                logger.info(
                    f"Scribbr detection successful: AI={ai_probability:.2%}, "
                    f"Human={human_probability:.2%}, Time={response_time_ms:.0f}ms"
                )

                return {
                    "success": True,
                    "ai_probability": ai_probability,
                    "human_probability": human_probability,
                    "confidence": confidence,
                    "response_time_ms": response_time_ms,
                    "raw_response": data,
                    "chunk_details": chunk_details,
                    "error": None,
                }

        except httpx.TimeoutException as e:
            response_time_ms = (time.time() - start_time) * 1000
            error_msg = f"Request timeout: {str(e)}"
            logger.error(f"Scribbr detection timeout: {error_msg}")
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
            logger.error(f"Scribbr detection failed: {error_msg}", exc_info=True)
            return {
                "success": False,
                "ai_probability": 0.5,
                "human_probability": 0.5,
                "confidence": 0.0,
                "response_time_ms": response_time_ms,
                "error": error_msg,
                "raw_response": None,
            }
