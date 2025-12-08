"""
QuillBot AI Content Detector - Browser-based session authentication.

This implementation uses browser session cookies to authenticate with QuillBot's API,
following the 3-step workflow:
1. Get AI score from /api/ai-detector/score
2. Create document in /api/docupine/documents
3. Upload content to /api/docupine/documents/{id}/content
"""

import json
import logging
import time
import uuid

import httpx

logger = logging.getLogger(__name__)


def parse_cookie_string(cookie_string: str) -> dict[str, str]:
    """
    Parse cookie string into dictionary.

    Args:
        cookie_string: Cookie string from browser

    Returns:
        Dictionary of cookies
    """
    cookies = {}
    for item in cookie_string.split("; "):
        if "=" in item:
            key, value = item.split("=", 1)
            cookies[key.strip()] = value.strip()
    return cookies


class QuillBotDetector:
    """
    QuillBot AI Content Detector using browser session authentication.

    This implementation mimics browser requests to QuillBot's web API.
    """

    def __init__(self, cookie_string: str, useridtoken: str | None = None, timeout: int = 60):
        """
        Initialize QuillBot detector.

        Args:
            cookie_string: Full cookie string from browser
            useridtoken: User ID token (can be extracted from cookies or provided separately)
            timeout: Request timeout in seconds
        """
        self.base_url = "https://quillbot.com/api"
        self.cookies = parse_cookie_string(cookie_string) if cookie_string else {}
        self.useridtoken = useridtoken
        self.timeout = timeout

        # Extract useridtoken from cookies if not provided separately
        if not self.useridtoken and "useridtoken" in self.cookies:
            self.useridtoken = self.cookies["useridtoken"]

        # Build headers
        self.headers = {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
            "content-type": "application/json",
            "origin": "https://quillbot.com",
            "platform-type": "webapp",
            "priority": "u=1, i",
            "qb-product": "AI_CONTENT_DETECTOR",
            "referer": "https://quillbot.com/ai-content-detector",
            "sec-ch-ua": '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
            "webapp-version": "38.9.0",
        }

        # Add useridtoken to headers if available
        if self.useridtoken:
            self.headers["useridtoken"] = self.useridtoken

    def detect(self, text: str, language: str = "en", language_name: str = "English") -> dict:
        """
        Detect AI-generated content in text.

        Args:
            text: Text to analyze
            language: Language code (default: "en")
            language_name: Language name (default: "English")

        Returns:
            Dictionary with detection results:
            {
                "success": bool,
                "ai_probability": float (0-1),
                "human_probability": float (0-1),
                "confidence": float (0-1),
                "total_ai_score": float (0-1),
                "document_id": str,
                "raw_response": dict,
                "error": str (if failed)
            }
        """
        start_time = time.time()

        try:
            # Step 1: Get AI detection score
            logger.info("QuillBot: Getting AI detection score...")
            ai_score_response = self._get_ai_score(text, language)

            # Extract totalAiScore from the response
            total_ai_score = self._extract_total_ai_score(ai_score_response)

            if total_ai_score is None:
                logger.warning("QuillBot: Could not extract totalAiScore from response")
                # Try to get it from data.value.aiScore
                if isinstance(ai_score_response, dict):
                    data = ai_score_response.get("data", {})
                    if isinstance(data, dict):
                        value = data.get("value", {})
                        if isinstance(value, dict):
                            total_ai_score = value.get("aiScore")

            # Step 2: Create document
            logger.info("QuillBot: Creating document...")
            document_data = self._create_document(text, language, language_name)
            document_id = document_data.get("id")

            if not document_id:
                raise Exception("Failed to create document - no ID returned")

            logger.info(f"QuillBot: Document created with ID: {document_id}")

            # Step 3: Upload content
            logger.info("QuillBot: Uploading content...")
            upload_response = self._upload_content(document_id, text, ai_score_response)

            # Try to get total_ai_score from upload response if not found earlier
            if total_ai_score is None:
                total_ai_score = self._extract_total_ai_score_from_upload(upload_response)

            # Convert to 0-1 scale if it's in percentage (0-100)
            if total_ai_score is not None and total_ai_score > 1.0:
                total_ai_score = total_ai_score / 100.0

            # Default to 0.5 if we couldn't extract the score
            if total_ai_score is None:
                logger.warning("QuillBot: Could not extract total_ai_score, defaulting to 0.5")
                total_ai_score = 0.5

            ai_probability = float(total_ai_score)
            human_probability = 1.0 - ai_probability
            confidence = abs(ai_probability - 0.5) * 2  # Distance from uncertain 0.5

            response_time = (time.time() - start_time) * 1000

            logger.info(
                f"QuillBot detection complete: AI={ai_probability:.2%}, Human={human_probability:.2%}, "
                f"Time={response_time:.0f}ms"
            )

            return {
                "success": True,
                "ai_probability": ai_probability,
                "human_probability": human_probability,
                "confidence": confidence,
                "total_ai_score": ai_probability,
                "document_id": document_id,
                "raw_response": {
                    "ai_score_response": ai_score_response,
                    "upload_response": upload_response,
                },
            }

        except httpx.HTTPError as e:
            error_detail = f"HTTP error: {str(e)}"
            if hasattr(e, "response") and e.response is not None:  # type: ignore[attr-defined]
                response = e.response  # type: ignore[attr-defined]
                try:
                    error_json = response.json()
                    error_detail = f"HTTP {response.status_code}: {json.dumps(error_json)}"
                except Exception:
                    error_detail = f"HTTP {response.status_code}: {response.text[:200]}"

            logger.error(f"QuillBot API error: {error_detail}")
            return {
                "success": False,
                "error": error_detail,
                "ai_probability": 0.5,
                "human_probability": 0.5,
                "confidence": 0.0,
            }
        except Exception as e:
            logger.error(f"QuillBot detection failed: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "ai_probability": 0.5,
                "human_probability": 0.5,
                "confidence": 0.0,
            }

    def _get_ai_score(self, text: str, language: str = "en") -> dict:
        """
        Get AI detection score for text.

        Args:
            text: Text content to analyze
            language: Language code (default: "en")

        Returns:
            Dictionary containing AI detection results
        """
        payload = {"text": text, "language": language, "explain": False}

        url = f"{self.base_url}/ai-detector/score"

        with httpx.Client(timeout=self.timeout) as client:
            response = client.post(url, headers=self.headers, cookies=self.cookies, json=payload)
            response.raise_for_status()
            return response.json()

    def _create_document(
        self, text: str, language: str = "en", language_name: str = "English"
    ) -> dict:
        """
        Create a document and get its ID.

        Args:
            text: Text content to analyze
            language: Language code (default: "en")
            language_name: Language name (default: "English")

        Returns:
            Dictionary containing document data including ID
        """
        file_name = f"Document_{uuid.uuid4().hex[:8]}"
        submission_id = uuid.uuid4().hex[:16]

        payload = {
            "name": file_name,
            "documentMeta": {
                "submission_id": submission_id,
                "file_name": file_name,
                "file_type": "txt",
                "total_ai_score": 0,
                "language": language,
                "language_name": language_name,
            },
            "namespace": "ai-detector",
            "dirPath": "",
            "description": text[:100] if len(text) > 100 else text,
        }

        url = f"{self.base_url}/docupine/documents"

        with httpx.Client(timeout=self.timeout) as client:
            response = client.post(url, headers=self.headers, cookies=self.cookies, json=payload)
            response.raise_for_status()
            result = response.json()

            if not result.get("success") or "data" not in result:
                raise Exception(f"Failed to create document: {result}")

            return result["data"]

    def _upload_content(self, document_id: str, text: str, api_response: dict) -> dict:
        """
        Upload content to the document.

        Args:
            document_id: Document ID from create_document
            text: Text content to analyze
            api_response: API response from get_ai_score

        Returns:
            Dictionary containing the upload response
        """
        # Prepare multipart form data
        file_data = {"text": text, "apiResponse": api_response}

        # Create multipart form data
        files = {"file": ("data.json", json.dumps(file_data), "application/octet-stream")}

        # Update headers for multipart request
        upload_headers = self.headers.copy()
        upload_headers.pop("content-type", None)  # Remove content-type, httpx will set it

        # Add additional headers
        upload_headers["x-beaver-change_timestamp"] = str(int(time.time() * 1000))
        upload_headers["x-beaver-create_new"] = "false"
        upload_headers["x-beaver-current_version"] = "1"

        url = f"{self.base_url}/docupine/documents/{document_id}/content"

        with httpx.Client(timeout=self.timeout) as client:
            response = client.put(url, headers=upload_headers, cookies=self.cookies, files=files)
            response.raise_for_status()
            return response.json()

    def _extract_total_ai_score(self, ai_score_response: dict) -> float | None:
        """Extract total AI score from the AI score response."""
        if not isinstance(ai_score_response, dict):
            return None

        # Try multiple possible locations
        score = (
            ai_score_response.get("totalAiScore")
            or ai_score_response.get("total_ai_score")
            or ai_score_response.get("data", {}).get("totalAiScore")
            or ai_score_response.get("data", {}).get("total_ai_score")
        )
        logger.info(f"Total AI Score: {score}")
        # Also try data.value.aiScore
        if score is None:
            data = ai_score_response.get("data", {})
            if isinstance(data, dict):
                value = data.get("value", {})
                if isinstance(value, dict):
                    score = value.get("aiScore")

        return float(score) if score is not None else None

    def _extract_total_ai_score_from_upload(self, upload_response: dict) -> float | None:
        """Extract total AI score from the upload response."""
        if not isinstance(upload_response, dict):
            return None

        # Check in various locations
        data = upload_response.get("data", {})
        if isinstance(data, dict):
            # Check documentMeta
            doc_meta = data.get("documentMeta", {})
            if isinstance(doc_meta, dict):
                score = doc_meta.get("total_ai_score")
                if score is not None:
                    return float(score)

        return None
