"""
Unit tests for GPTZero detector.

Tests:
- Cookie parsing
- Request formatting
- Response parsing
- Error handling
- Integration with detection service
"""

# Import the detector
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from api.services.gptzero_detector import GPTZeroDetector, parse_cookie_string


class TestCookieParsing:
    """Test cookie parsing utilities."""

    def test_parse_cookie_string_simple(self):
        """Test parsing a simple cookie string."""
        cookie_string = "key1=value1; key2=value2"
        result = parse_cookie_string(cookie_string)

        assert result == {"key1": "value1", "key2": "value2"}

    def test_parse_cookie_string_with_equals(self):
        """Test parsing cookies with equals signs in values."""
        cookie_string = "token=abc=def=ghi; plan=Free"
        result = parse_cookie_string(cookie_string)

        assert result == {"token": "abc=def=ghi", "plan": "Free"}

    def test_parse_cookie_string_with_spaces(self):
        """Test parsing cookies with extra spaces."""
        cookie_string = "key1=value1;  key2=value2  ; key3=value3"
        result = parse_cookie_string(cookie_string)

        assert result == {"key1": "value1", "key2": "value2", "key3": "value3"}

    def test_parse_cookie_string_empty(self):
        """Test parsing empty cookie string."""
        result = parse_cookie_string("")

        assert result == {}

    def test_parse_cookie_string_url_encoded(self):
        """Test parsing URL-encoded cookies."""
        cookie_string = "csrf=%7C316f78b82da7ad1467b12efea353466a; plan=Free"
        result = parse_cookie_string(cookie_string)

        assert result["csrf"] == "%7C316f78b82da7ad1467b12efea353466a"
        assert result["plan"] == "Free"


class TestGPTZeroDetector:
    """Test GPTZero detector class."""

    @pytest.fixture
    def mock_cookies(self):
        """Mock cookies for testing."""
        return {
            "accessToken4": "mock_jwt_token",
            "__Host-gptzero-csrf-token": "mock_csrf_token",
            "anonymousUserId": "mock_user_id",
            "plan": "Free",
        }

    @pytest.fixture
    def mock_scan_id(self):
        """Mock scan ID."""
        return "ef6eec63-f673-4764-8e96-32875529b4f6"

    @pytest.fixture
    def detector(self, mock_cookies, mock_scan_id):
        """Create detector instance for testing."""
        return GPTZeroDetector(cookies_dict=mock_cookies, scan_id=mock_scan_id, timeout=30)

    def test_init(self, detector, mock_cookies, mock_scan_id):
        """Test detector initialization."""
        assert detector.cookies == mock_cookies
        assert detector.scan_id == mock_scan_id
        assert detector.timeout == 30
        assert "user-agent" in detector.headers
        assert "content-type" in detector.headers

    def test_detect_success(self, detector):
        """Test successful detection."""
        mock_response = {
            "documents": [
                {
                    "class_probabilities": {
                        "ai": 0.75,
                        "human": 0.20,
                        "mixed": 0.05,
                    },
                    "average_generated_prob": 0.75,
                    "completely_generated_prob": 0.80,
                }
            ],
            "meta": {"status": "success"},
        }

        with patch("httpx.Client") as mock_client:
            mock_response_obj = MagicMock()
            mock_response_obj.status_code = 200
            mock_response_obj.json.return_value = mock_response

            mock_client.return_value.__enter__.return_value.post.return_value = mock_response_obj

            result = detector.detect("Test text")

            assert result["success"] is True
            assert result["ai_probability"] == 0.75
            assert result["human_probability"] == 0.20
            assert result["mixed_probability"] == 0.05
            assert result["confidence"] > 0
            assert "class_probabilities" in result
            assert "raw_response" in result

    def test_detect_http_error(self, detector):
        """Test detection with HTTP error."""
        with patch("httpx.Client") as mock_client:
            mock_response_obj = MagicMock()
            mock_response_obj.status_code = 401
            mock_response_obj.json.return_value = {"error": "Unauthorized"}
            mock_response_obj.text = "Unauthorized"

            mock_client.return_value.__enter__.return_value.post.return_value = mock_response_obj

            result = detector.detect("Test text")

            assert result["success"] is False
            assert "error" in result
            assert result["ai_probability"] == 0.5
            assert result["human_probability"] == 0.5

    def test_detect_timeout(self, detector):
        """Test detection with timeout."""
        with patch("httpx.Client") as mock_client:
            mock_client.return_value.__enter__.return_value.post.side_effect = (
                httpx.TimeoutException("Request timeout")
            )

            result = detector.detect("Test text")

            assert result["success"] is False
            assert "timeout" in result["error"].lower()
            assert result["ai_probability"] == 0.5

    def test_detect_network_error(self, detector):
        """Test detection with network error."""
        with patch("httpx.Client") as mock_client:
            mock_client.return_value.__enter__.return_value.post.side_effect = Exception(
                "Network error"
            )

            result = detector.detect("Test text")

            assert result["success"] is False
            assert "error" in result
            assert result["ai_probability"] == 0.5

    def test_detect_empty_documents(self, detector):
        """Test detection with empty documents array."""
        mock_response = {"documents": [], "meta": {"status": "success"}}

        with patch("httpx.Client") as mock_client:
            mock_response_obj = MagicMock()
            mock_response_obj.status_code = 200
            mock_response_obj.json.return_value = mock_response

            mock_client.return_value.__enter__.return_value.post.return_value = mock_response_obj

            result = detector.detect("Test text")

            # Should use default values
            assert result["success"] is True
            assert result["ai_probability"] == 0.5
            assert result["human_probability"] == 0.5

    def test_detect_missing_class_probabilities(self, detector):
        """Test detection with missing class_probabilities."""
        mock_response = {
            "documents": [{"some_other_field": "value"}],
            "meta": {"status": "success"},
        }

        with patch("httpx.Client") as mock_client:
            mock_response_obj = MagicMock()
            mock_response_obj.status_code = 200
            mock_response_obj.json.return_value = mock_response

            mock_client.return_value.__enter__.return_value.post.return_value = mock_response_obj

            result = detector.detect("Test text")

            assert result["success"] is True
            assert result["ai_probability"] == 0.5
            assert result["class_probabilities"] == {}

    @pytest.mark.asyncio
    async def test_detect_async_success(self, detector):
        """Test async detection."""
        mock_response = {
            "documents": [
                {
                    "class_probabilities": {
                        "ai": 0.65,
                        "human": 0.30,
                        "mixed": 0.05,
                    }
                }
            ]
        }

        with patch("httpx.AsyncClient") as mock_client:
            mock_response_obj = MagicMock()
            mock_response_obj.status_code = 200
            mock_response_obj.json.return_value = mock_response

            mock_client.return_value.__aenter__.return_value.post.return_value = mock_response_obj

            result = await detector.detect_async("Test text")

            assert result["success"] is True
            assert result["ai_probability"] == 0.65
            assert result["human_probability"] == 0.30

    def test_confidence_calculation(self, detector):
        """Test confidence calculation."""
        # High AI probability -> high confidence
        mock_response = {"documents": [{"class_probabilities": {"ai": 0.95, "human": 0.05}}]}

        with patch("httpx.Client") as mock_client:
            mock_response_obj = MagicMock()
            mock_response_obj.status_code = 200
            mock_response_obj.json.return_value = mock_response

            mock_client.return_value.__enter__.return_value.post.return_value = mock_response_obj

            result = detector.detect("Test text")

            # Confidence should be high (close to 1.0)
            # confidence = abs(0.95 - 0.5) * 2 = 0.9
            assert result["confidence"] == pytest.approx(0.9, abs=0.01)

        # Uncertain result -> low confidence
        mock_response = {"documents": [{"class_probabilities": {"ai": 0.50, "human": 0.50}}]}

        with patch("httpx.Client") as mock_client:
            mock_response_obj = MagicMock()
            mock_response_obj.status_code = 200
            mock_response_obj.json.return_value = mock_response

            mock_client.return_value.__enter__.return_value.post.return_value = mock_response_obj

            result = detector.detect("Test text")

            # Confidence should be low (close to 0.0)
            assert result["confidence"] == pytest.approx(0.0, abs=0.01)

    def test_request_payload(self, detector):
        """Test that request payload is formatted correctly."""
        with patch("httpx.Client") as mock_client:
            mock_response_obj = MagicMock()
            mock_response_obj.status_code = 200
            mock_response_obj.json.return_value = {
                "documents": [{"class_probabilities": {"ai": 0.5, "human": 0.5}}]
            }

            mock_post = mock_client.return_value.__enter__.return_value.post
            mock_post.return_value = mock_response_obj

            detector.detect("Test text")

            # Check that post was called with correct arguments
            assert mock_post.called
            call_args = mock_post.call_args

            # Check URL
            assert call_args[0][0] == "https://api.gptzero.me/v3/ai/text"

            # Check payload
            payload = call_args.kwargs["json"]
            assert payload["scanId"] == detector.scan_id
            assert payload["document"] == "Test text"
            assert payload["multilingual"] is True
            assert payload["interpretability_required"] is False

    def test_headers_included(self, detector):
        """Test that browser-like headers are included."""
        assert "accept" in detector.headers
        assert "content-type" in detector.headers
        assert "user-agent" in detector.headers
        assert "origin" in detector.headers
        assert "referer" in detector.headers
        assert detector.headers["origin"] == "https://app.gptzero.me"


class TestIntegration:
    """Integration tests for GPTZero detector."""

    @pytest.fixture
    def sample_ai_text(self):
        """Sample AI-generated text."""
        return (
            "The utilization of advanced technological systems facilitates "
            "enhanced productivity and operational efficiency across various "
            "organizational domains."
        )

    @pytest.fixture
    def sample_human_text(self):
        """Sample human-written text."""
        return (
            "Hey! I've been thinking about this. You know what? Let's just go for it! It'll be fun."
        )

    def test_full_detection_flow(self, sample_ai_text):
        """Test complete detection flow with realistic response."""
        cookies = {
            "accessToken4": "mock_token",
            "__Host-gptzero-csrf-token": "mock_csrf",
            "plan": "Free",
        }

        detector = GPTZeroDetector(
            cookies_dict=cookies,
            scan_id="test-scan-id",
        )

        # Mock realistic API response
        mock_response = {
            "documents": [
                {
                    "class_probabilities": {
                        "ai": 0.82,
                        "human": 0.15,
                        "mixed": 0.03,
                    },
                    "average_generated_prob": 0.82,
                    "completely_generated_prob": 0.85,
                    "sentences": [],
                }
            ],
            "meta": {"status": "success"},
            "version": "v3",
        }

        with patch("httpx.Client") as mock_client:
            mock_response_obj = MagicMock()
            mock_response_obj.status_code = 200
            mock_response_obj.json.return_value = mock_response

            mock_client.return_value.__enter__.return_value.post.return_value = mock_response_obj

            result = detector.detect(sample_ai_text)

            assert result["success"] is True
            assert result["ai_probability"] == 0.82
            assert result["human_probability"] == 0.15
            assert result["mixed_probability"] == 0.03
            assert result["scan_id"] == "test-scan-id"
            assert "response_time_ms" in result
            assert result["raw_response"] == mock_response


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
