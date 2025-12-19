"""
StealthWriter API service for additional humanization pass.

This service calls the StealthWriter API as a final optional enhancement step.
NOTE: This API requires session authentication via cookies and puzzle verification.
"""

import hashlib
import json
import logging
import random
import time
import urllib.parse
from typing import Any

import requests

logger = logging.getLogger(__name__)


def parse_cookie_string(cookie_string: str) -> dict[str, str]:
    """
    Parse a cookie string and extract all cookies.

    Args:
        cookie_string: Cookie string from browser (semicolon-separated)

    Returns:
        Dictionary with all cookies
    """
    cookies = {}

    for cookie in cookie_string.split(";"):
        cookie = cookie.strip()
        if "=" in cookie:
            key, value = cookie.split("=", 1)
            key = key.strip()
            value = value.strip()

            # Store all cookies with URL-decoded values
            cookies[key] = urllib.parse.unquote(value)

    return cookies


class StealthWriterService:
    """Service for calling StealthWriter API with puzzle verification."""

    def __init__(self, cookie_string: str | None = None):
        """
        Initialize the StealthWriter client.

        Args:
            cookie_string: Full cookie string from DEFAULT_COOKIE_STRING env var
        """
        self.base_url = "https://app.stealthwriter.ai/api"
        self.cookies: dict[str, str] = {}
        self.is_available = False
        self.access_token: str | None = None  # Will be set after puzzle verification

        if cookie_string and cookie_string.strip():
            try:
                self.cookies = parse_cookie_string(cookie_string)
                self.is_available = True
                logger.info("StealthWriter service initialized with cookies")
            except Exception as e:
                logger.warning(f"Failed to parse StealthWriter cookies: {e}")
                self.is_available = False
        else:
            logger.info("StealthWriter service not available (no cookie string provided)")

        # Build base headers similar to browser request
        self.base_headers = {
            "accept": "*/*",
            "accept-encoding": "gzip, deflate, br, zstd",
            "accept-language": "en-US,en;q=0.9",
            "origin": "https://app.stealthwriter.ai",
            "referer": "https://app.stealthwriter.ai/humanizer",
            "sec-ch-ua": '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        }

    def is_valid(self) -> bool:
        """Check if the service is available and properly configured."""
        return self.is_available and bool(self.cookies)

    def puzzle_generate(self) -> dict[str, Any] | None:
        """
        Generate a puzzle challenge.

        Returns:
            Dictionary with puzzle_token, puzzle_width, and visual_x, or None if failed
        """
        headers = self.base_headers.copy()
        # puzzle_generate doesn't need content-type

        try:
            response = requests.get(
                f"{self.base_url}/puzzle_generate",
                headers=headers,
                cookies=self.cookies if self.cookies else None,
                timeout=30,
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Error generating puzzle: {e}")
            return None

    def puzzle_verify(self, puzzle_token: str, user_solution_x: float) -> dict[str, Any] | None:
        """
        Verify puzzle solution.

        Args:
            puzzle_token: Token from puzzle_generate
            user_solution_x: X coordinate solution (typically visual_x from puzzle_generate)

        Returns:
            Dictionary with success status and access_token, or None if failed
        """
        headers = self.base_headers.copy()
        headers["content-type"] = "text/plain;charset=UTF-8"

        payload = {
            "puzzle_token": puzzle_token,
            "user_solution_x": user_solution_x,
        }

        try:
            response = requests.post(
                f"{self.base_url}/puzzle_verify",
                headers=headers,
                cookies=self.cookies if self.cookies else None,
                json=payload,
                timeout=30,
            )
            response.raise_for_status()
            result = response.json()

            # Store access token for future use
            if result.get("success") and "access_token" in result:
                self.access_token = result["access_token"]

            return result
        except requests.exceptions.RequestException as e:
            logger.error(f"Error verifying puzzle: {e}")
            return None

    def puzzle_check(self, access_token: str | None = None) -> dict[str, Any] | None:
        """
        Check if access token is valid.

        Args:
            access_token: Access token from puzzle_verify (uses stored token if not provided)

        Returns:
            Dictionary with valid status, or None if failed
        """
        if not access_token:
            access_token = self.access_token

        if not access_token:
            logger.error("No access token available. Complete puzzle verification first.")
            return None

        headers = self.base_headers.copy()
        headers["content-type"] = "text/plain;charset=UTF-8"

        payload = {"access_token": access_token}

        try:
            response = requests.post(
                f"{self.base_url}/puzzle_check",
                headers=headers,
                cookies=self.cookies if self.cookies else None,
                json=payload,
                timeout=30,
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Error checking puzzle token: {e}")
            return None

    def complete_puzzle_verification(self, max_retries: int = 3) -> bool:
        """
        Complete the full puzzle verification flow:
        1. Generate puzzle
        2. Verify puzzle (using visual_x as solution)
        3. Check access token

        Args:
            max_retries: Maximum number of retry attempts if verification fails

        Returns:
            True if verification successful, False otherwise
        """
        for attempt in range(max_retries):
            try:
                # Step 1: Generate puzzle
                if attempt == 0:
                    logger.info("🔐 Step 1: Generating puzzle challenge...")
                else:
                    logger.info(
                        f"🔐 Step 1: Regenerating puzzle challenge (attempt {attempt + 1}/{max_retries})..."
                    )

                puzzle_data = self.puzzle_generate()
                if not puzzle_data:
                    raise Exception("Failed to generate puzzle")

                puzzle_token = puzzle_data.get("puzzle_token")
                visual_x = puzzle_data.get("visual_x")
                puzzle_width = puzzle_data.get("puzzle_width", 300)

                if not puzzle_token or visual_x is None:
                    raise Exception("Invalid puzzle response. Missing puzzle_token or visual_x.")

                if attempt == 0:
                    logger.info(f"   ✓ Puzzle generated (visual_x: {visual_x}, width: {puzzle_width})")

                # Step 2: Verify puzzle
                # Use visual_x as the solution (with slight variation to mimic human behavior)
                if attempt == 0:
                    # First attempt: use visual_x directly
                    user_solution_x = float(visual_x)
                else:
                    # Retry attempts: add small random variation (±3 pixels) to mimic human imprecision
                    user_solution_x = visual_x + random.uniform(-3, 3)

                if attempt == 0:
                    logger.info(f"🔐 Step 2: Verifying puzzle solution (x: {user_solution_x:.2f})...")
                else:
                    logger.info(
                        f"🔐 Step 2: Retrying puzzle verification (x: {user_solution_x:.2f})..."
                    )

                verify_result = self.puzzle_verify(puzzle_token, user_solution_x)
                if not verify_result:
                    raise Exception("Failed to verify puzzle")

                if not verify_result.get("success"):
                    if attempt < max_retries - 1:
                        logger.warning("   ⚠️  Puzzle verification failed, retrying...")
                        time.sleep(1)  # Brief delay before retry
                        continue
                    raise Exception("Puzzle verification failed after all retries.")

                access_token = verify_result.get("access_token")
                if not access_token:
                    if attempt < max_retries - 1:
                        logger.warning("   ⚠️  No access token received, retrying...")
                        time.sleep(1)
                        continue
                    raise Exception("No access token received from puzzle verification.")

                logger.info("   ✓ Puzzle verified successfully")

                # Step 3: Check access token
                logger.info("🔐 Step 3: Validating access token...")
                check_result = self.puzzle_check(access_token)

                if not check_result:
                    raise Exception("Failed to check access token")

                if not check_result.get("valid"):
                    if attempt < max_retries - 1:
                        logger.warning("   ⚠️  Access token validation failed, retrying...")
                        time.sleep(1)
                        continue
                    raise Exception("Access token validation failed after all retries.")

                logger.info("   ✓ Access token validated")
                logger.info("🔐 Puzzle verification complete!\n")

                return True

            except Exception as e:
                if attempt < max_retries - 1:
                    logger.warning(f"   ⚠️  Error: {e}, retrying...")
                    time.sleep(2)  # Longer delay on error
                    continue
                else:
                    logger.error(f"❌ Puzzle verification failed after {max_retries} attempts: {e}")
                    return False

        return False

    def _decode_error_response(self, response: requests.Response) -> str | None:
        """
        Decode error response from StealthWriter API.

        Args:
            response: The response object

        Returns:
            Error message string or None if decoding fails
        """
        try:
            content_encoding = response.headers.get("content-encoding", "").lower()
            content = response.content

            # Decompress if needed
            if content_encoding == "br":
                try:
                    import brotli

                    content = brotli.decompress(content)
                except ImportError:
                    logger.debug("Brotli not available for error message decoding")
                    return None
                except Exception:
                    return None
            elif content_encoding == "gzip":
                try:
                    import gzip

                    content = gzip.decompress(content)
                except Exception:
                    return None
            elif content_encoding == "deflate":
                try:
                    import zlib

                    content = zlib.decompress(content)
                except Exception:
                    return None

            # Try to parse as JSON
            try:
                error_data = json.loads(content.decode("utf-8"))
                if isinstance(error_data, dict):
                    # Try common error message fields
                    for key in ["error", "message", "detail", "error_message", "msg"]:
                        if key in error_data:
                            return str(error_data[key])
                    # If no standard field, return string representation
                    return str(error_data)
                return str(error_data)
            except (ValueError, json.JSONDecodeError):
                # If not JSON, return as text
                try:
                    return content.decode("utf-8", errors="replace")[:500]
                except Exception:
                    return None
        except Exception as e:
            logger.debug(f"Failed to decode error response: {e}")
            return None

    def humanize_text(
        self,
        text: str,
        model: str = "ghost-v4.6-mini",
        level: int = 8,
        n: int = 5,
        style: str = "Don't Change",
        use_british_english: bool = False,
        detector_mode: str = "normal",
        skip_puzzle: bool = False,
    ) -> dict[str, Any] | None:
        """
        Humanize text using StealthWriter API.

        Args:
            text: Text content to humanize
            model: Model to use (default: "ghost-v4.6-mini")
            level: Humanization level 1-10 (default: 8)
            n: Number of variations to generate (default: 5)
            style: Writing style (default: "Don't Change")
            use_british_english: Use British English (default: False)
            detector_mode: Detector mode (default: "normal")
            skip_puzzle: Skip puzzle verification (for testing, default: False)

        Returns:
            Humanization results from the API, or None if failed
        """
        if not self.is_valid():
            logger.warning("StealthWriter service not available, skipping")
            return None

        # Complete puzzle verification first (unless skipped)
        if not skip_puzzle and not self.access_token:
            if not self.complete_puzzle_verification():
                logger.error("Puzzle verification failed. Cannot proceed with humanization.")
            return None

        # Log input details
        text_length = len(text)
        text_words = len(text.split())
        logger.info("📤 StealthWriter Request:")
        logger.info(f"   • Input text length: {text_length} characters")
        logger.info(f"   • Input text words: {text_words} words")
        logger.info(
            f"   • Input preview: {text[:150]}..." if text_length > 150 else f"   • Input: {text}"
        )
        logger.info(f"   • Model: {model}")
        logger.info(f"   • Level: {level}")
        logger.info(f"   • Variations (n): {n}")

        # Generate fingerprint (simple hash-based approach)
        fingerprint = hashlib.md5(text.encode()).hexdigest()

        # API expects an "options" object containing the parameters
        payload = {
            "text": text,
            "options": {
                "model": model,
                "level": level,
                "n": n,
                "style": style,
                "useBritishEnglish": use_british_english,
                "detectorMode": detector_mode,
                "fingerprint": fingerprint,
                "rehumanizeRequest": False,
            },
        }

        # Build headers for humanize request
        headers = self.base_headers.copy()
        headers["content-type"] = "application/json"

        # Retry logic for server errors
        max_retries = 2
        retry_delay = 2  # seconds

        try:
            for attempt in range(max_retries + 1):
                try:
                    logger.info(
                        f"🌐 StealthWriter API call (attempt {attempt + 1}/{max_retries + 1})..."
                    )
                    logger.debug(f"   • URL: {self.base_url}/humanize")
                    logger.debug(f"   • Payload size: {len(json.dumps(payload))} bytes")

                    response = requests.post(
                        f"{self.base_url}/humanize",
                        headers=headers,
                        cookies=self.cookies,
                        json=payload,
                        timeout=60,
                    )

                    # Log response details
                    logger.info("📥 StealthWriter Response:")
                    logger.info(f"   • Status code: {response.status_code}")
                    logger.info(
                        f"   • Content-Type: {response.headers.get('content-type', 'unknown')}"
                    )
                    logger.info(
                        f"   • Content-Encoding: {response.headers.get('content-encoding', 'none')}"
                    )
                    logger.info(f"   • Content-Length: {len(response.content)} bytes")

                    # Check for error status codes and decode error message
                    if response.status_code >= 400:
                        error_message = self._decode_error_response(response)
                        if error_message:
                            logger.error(
                                f"❌ StealthWriter API error ({response.status_code}): {error_message}"
                            )
                        else:
                            logger.error(f"❌ StealthWriter API error ({response.status_code})")
                        response.raise_for_status()  # This will raise HTTPError

                    logger.info("✅ StealthWriter API call successful")
                    break  # Success, exit retry loop
                except requests.exceptions.HTTPError as e:
                    # If it's a 500 error and we have retries left, wait and retry
                    if e.response.status_code == 500 and attempt < max_retries:
                        import time

                        logger.warning(
                            f"StealthWriter server error (500), retrying in {retry_delay} seconds... "
                            f"(attempt {attempt + 1}/{max_retries + 1})"
                        )
                        time.sleep(retry_delay)
                        continue
                    else:
                        # Re-raise to be handled by outer exception handler
                        raise

            # Try to parse JSON response
            # Note: requests library automatically handles Brotli decompression if available
            try:
                logger.info("🔄 Parsing StealthWriter JSON response...")
                json_data = response.json()

                # Log response structure
                logger.info("✅ Successfully parsed JSON response")
                logger.info(f"   • Response keys: {list(json_data.keys())}")

                # Log size info
                if isinstance(json_data, dict):
                    for key in json_data.keys():
                        if isinstance(json_data[key], (str, list, dict)):
                            if isinstance(json_data[key], str):
                                logger.info(f"   • {key}: {len(json_data[key])} chars")
                            elif isinstance(json_data[key], list):
                                logger.info(f"   • {key}: {len(json_data[key])} items")
                            elif isinstance(json_data[key], dict):
                                logger.info(f"   • {key}: {len(json_data[key])} keys")

                return json_data
            except (ValueError, json.JSONDecodeError) as e:
                # If JSON parsing fails, check if response is compressed
                content_encoding = response.headers.get("content-encoding", "").lower()
                logger.warning(
                    "⚠️  Initial JSON parsing failed, checking for compressed response..."
                )
                logger.debug(f"   • Error: {e}")
                logger.debug(f"   • Content-Encoding: {content_encoding}")
                logger.debug(f"   • Response length: {len(response.content)} bytes")

                # Try manual Brotli decompression if needed
                if content_encoding == "br":
                    try:
                        import brotli

                        logger.info("🔧 Attempting manual Brotli decompression...")
                        decompressed = brotli.decompress(response.content)
                        logger.info(
                            f"✅ Successfully decompressed: {len(response.content)} bytes → {len(decompressed)} bytes"
                        )

                        # Try parsing decompressed JSON
                        try:
                            json_data = json.loads(decompressed.decode("utf-8"))
                            logger.info("✅ Successfully parsed decompressed JSON response")
                            logger.info(f"   • Response keys: {list(json_data.keys())}")

                            # Log size info
                            if isinstance(json_data, dict):
                                for key in json_data.keys():
                                    if isinstance(json_data[key], (str, list, dict)):
                                        if isinstance(json_data[key], str):
                                            logger.info(f"   • {key}: {len(json_data[key])} chars")
                                        elif isinstance(json_data[key], list):
                                            logger.info(f"   • {key}: {len(json_data[key])} items")
                                        elif isinstance(json_data[key], dict):
                                            logger.info(f"   • {key}: {len(json_data[key])} keys")

                            return json_data
                        except (ValueError, json.JSONDecodeError) as json_error:
                            logger.error(f"❌ Failed to parse decompressed JSON: {json_error}")
                            logger.debug(f"   • Decompressed preview: {decompressed[:500]}")
                    except ImportError:
                        logger.error(
                            "❌ Response is Brotli-compressed but 'brotli' library is not installed. "
                            "Install it with: pip install brotli"
                        )
                    except Exception as decompress_error:
                        logger.error(f"❌ Failed to decompress Brotli response: {decompress_error}")
                        logger.debug("   • Decompression error details: ", exc_info=True)

                # Also try gzip/deflate if needed
                elif content_encoding in ("gzip", "deflate"):
                    try:
                        if content_encoding == "gzip":
                            import gzip

                            logger.info("🔧 Attempting manual gzip decompression...")
                            decompressed = gzip.decompress(response.content)
                        else:  # deflate
                            import zlib

                            logger.info("🔧 Attempting manual deflate decompression...")
                            decompressed = zlib.decompress(response.content)

                        logger.info(
                            f"✅ Successfully decompressed: {len(response.content)} bytes → {len(decompressed)} bytes"
                        )
                        json_data = json.loads(decompressed.decode("utf-8"))
                        logger.info("✅ Successfully parsed decompressed JSON response")
                        return json_data
                    except Exception as decompress_error:
                        logger.error(
                            f"❌ Failed to decompress {content_encoding} response: {decompress_error}"
                        )

                # Log error details if all decompression attempts failed
                logger.error("❌ StealthWriter JSON parsing failed - unable to decompress or parse")
                logger.error(f"   • Content-Encoding: {content_encoding}")
                logger.error(f"   • Response length: {len(response.content)} bytes")

                # Try to show response preview
                try:
                    content_preview = response.content[:200]
                    logger.error(f"   • Response preview (first 200 bytes): {content_preview}")
                except Exception:
                    pass

                return None

        except requests.exceptions.HTTPError as e:
            status_code = e.response.status_code

            # Try to decode error message from response
            error_message = self._decode_error_response(e.response) if e.response else None

            if status_code == 401:
                if error_message:
                    logger.warning(f"StealthWriter authentication failed (401): {error_message}")
                else:
                    logger.warning("StealthWriter authentication failed - cookies may have expired")
            elif status_code == 403:
                if error_message:
                    logger.warning(f"StealthWriter access forbidden (403): {error_message}")
                    logger.warning(
                        "💡 Action needed: Update DEFAULT_COOKIE_STRING in .env with fresh cookies"
                    )
                else:
                    logger.warning("StealthWriter access forbidden - session may have expired")
                    logger.warning(
                        "💡 Action needed: Update DEFAULT_COOKIE_STRING in .env with fresh cookies"
                    )
            elif status_code == 429:
                if error_message:
                    logger.warning(f"StealthWriter rate limit reached (429): {error_message}")
                else:
                    logger.warning("StealthWriter rate limit reached")
            elif status_code == 500:
                if error_message:
                    logger.warning(f"StealthWriter server error (500): {error_message}")
                else:
                    logger.warning("StealthWriter server error (500)")
            else:
                if error_message:
                    logger.warning(f"StealthWriter HTTP error {status_code}: {error_message}")
                else:
                    logger.warning(f"StealthWriter HTTP error {status_code}")

            return None

        except requests.exceptions.RequestException as e:
            logger.warning(f"StealthWriter request error: {e}")
            return None

        except Exception as e:
            logger.error(f"Unexpected error calling StealthWriter: {e}", exc_info=True)
            return None

    def extract_humanized_text(self, result: dict[str, Any]) -> str | None:
        """
        Extract the final humanized text from StealthWriter API response.

        Args:
            result: The API response dictionary

        Returns:
            Combined humanized text, or None if extraction fails
        """
        if not result:
            return None

        try:
            logger.info("🔍 Extracting humanized text from StealthWriter response...")
            logger.debug(f"   • Response keys available: {list(result.keys())}")

            # Check if we have the combined format
            if "SentencesWithScannedAlternatives" in result and "originalText" in result:
                original_text = result["originalText"]
                sentences_data = result["SentencesWithScannedAlternatives"]

                logger.info("   • Found SentencesWithScannedAlternatives format")
                logger.info(f"   • Original text length: {len(original_text)} chars")
                logger.info(
                    f"   • Number of sentences: {len(sentences_data) if isinstance(sentences_data, list) else 'N/A'}"
                )

                # Start with the original text to preserve all formatting
                combined_humanized = original_text

                # Replace each original sentence with its first alternative
                # Process in reverse order to avoid index shifting issues
                replacements_count = 0
                for sentence_data in reversed(sentences_data):
                    if (
                        isinstance(sentence_data, dict)
                        and "original" in sentence_data
                        and "alternatives" in sentence_data
                    ):
                        original_sentence = sentence_data["original"]
                        alternatives = sentence_data["alternatives"]

                        if len(alternatives) > 0:
                            # Get the first alternative's sentence
                            first_alternative = alternatives[0]
                            replacement_text = ""

                            if (
                                isinstance(first_alternative, dict)
                                and "sentence" in first_alternative
                            ):
                                replacement_text = first_alternative["sentence"]
                            elif isinstance(first_alternative, str):
                                replacement_text = first_alternative

                            if replacement_text:
                                # Find and replace the original sentence with the alternative
                                if original_sentence in combined_humanized:
                                    combined_humanized = combined_humanized.replace(
                                        original_sentence, replacement_text, 1
                                    )
                                    replacements_count += 1

                logger.info("✅ Extracted combined humanized text")
                logger.info(f"   • Applied {replacements_count} sentence replacements")
                logger.info(f"   • Final text length: {len(combined_humanized)} chars")
                logger.info(
                    f"   • Final text preview: {combined_humanized[:200]}..."
                    if len(combined_humanized) > 200
                    else f"   • Final text: {combined_humanized}"
                )

                return combined_humanized

            # Fallback: check for humanizedText field
            elif "humanizedText" in result:
                humanized_text = result["humanizedText"]
                logger.info("   • Found humanizedText field")
                logger.info(f"   • Text length: {len(humanized_text)} chars")
                logger.info(
                    f"   • Text preview: {humanized_text[:200]}..."
                    if len(humanized_text) > 200
                    else f"   • Text: {humanized_text}"
                )
                return humanized_text

            # Fallback: check for data field
            elif "data" in result:
                logger.info("   • Found data field")
                data = result["data"]
                if isinstance(data, list) and len(data) > 0:
                    # Return first variation
                    if isinstance(data[0], dict):
                        return data[0].get("text") or data[0].get("content") or str(data[0])
                    return str(data[0])
                elif isinstance(data, dict):
                    extracted = data.get("text") or data.get("content") or data.get("humanized")
                    if extracted:
                        logger.info("✅ Extracted from data field")
                        logger.info(f"   • Text length: {len(extracted)} chars")
                    return extracted
            else:
                logger.warning(
                    f"   • Unknown response format, available keys: {list(result.keys())}"
                )

        except Exception as e:
            logger.error(
                f"❌ Failed to extract humanized text from StealthWriter response: {e}",
                exc_info=True,
            )

        logger.warning("⚠️  Could not extract humanized text from StealthWriter response")
        return None
