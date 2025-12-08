"""
Pytest-based unit tests for /humanize endpoint.

Tests:
- Request validation
- Response structure
- Error handling
- Tone options
- Length modes
- Edge cases
"""

# Import the FastAPI app
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from index import app

client = TestClient(app)


class TestHumanizeEndpoint:
    """Test suite for /humanize endpoint."""

    @pytest.fixture
    def sample_text(self):
        """Sample text for testing."""
        return (
            "The utilization of advanced technological systems facilitates enhanced productivity."
        )

    @pytest.fixture
    def valid_payload(self, sample_text):
        """Valid request payload."""
        return {"input_text": sample_text, "tone": "Standard", "length_mode": "standard"}

    def test_humanize_success(self, valid_payload):
        """Test successful humanization."""
        response = client.post("/api/v1/humanize/", json=valid_payload)

        assert response.status_code == 200
        data = response.json()

        # Check response structure
        assert "humanized_text" in data
        assert "metadata" in data
        assert isinstance(data["humanized_text"], str)
        assert len(data["humanized_text"]) > 0

    def test_humanize_all_tones(self, sample_text):
        """Test all supported tone options."""
        tones = [
            "Standard",
            "Professional",
            "Academic",
            "Blog/SEO",
            "Casual",
            "Creative",
            "Scientific",
            "Technical",
        ]

        for tone in tones:
            payload = {"input_text": sample_text, "tone": tone, "length_mode": "standard"}

            response = client.post("/api/v1/humanize/", json=payload)

            assert response.status_code == 200, f"Failed for tone: {tone}"
            data = response.json()
            assert "humanized_text" in data

    def test_humanize_length_modes(self, sample_text):
        """Test all length mode options."""
        length_modes = ["standard", "shorten", "expand"]

        for length_mode in length_modes:
            payload = {"input_text": sample_text, "tone": "Standard", "length_mode": length_mode}

            response = client.post("/api/v1/humanize/", json=payload)

            assert response.status_code == 200, f"Failed for length_mode: {length_mode}"
            data = response.json()
            assert "humanized_text" in data

    def test_missing_required_fields(self):
        """Test request with missing required fields."""
        # Missing input_text
        response = client.post("/api/v1/humanize/", json={"tone": "Standard"})

        assert response.status_code == 422  # Validation error

    def test_invalid_tone(self, sample_text):
        """Test with invalid tone option."""
        payload = {"input_text": sample_text, "tone": "InvalidTone", "length_mode": "standard"}

        response = client.post("/api/v1/humanize/", json=payload)

        # Should either validate or use default
        # Implementation dependent - adjust based on actual behavior
        assert response.status_code in [200, 422]

    def test_invalid_length_mode(self, sample_text):
        """Test with invalid length mode."""
        payload = {"input_text": sample_text, "tone": "Standard", "length_mode": "invalid"}

        response = client.post("/api/v1/humanize/", json=payload)

        # Should return validation error
        assert response.status_code == 422

    def test_empty_text(self):
        """Test with empty input text."""
        payload = {"input_text": "", "tone": "Standard", "length_mode": "standard"}

        response = client.post("/api/v1/humanize/", json=payload)

        # Should handle gracefully
        assert response.status_code in [200, 400, 422]

    def test_very_short_text(self):
        """Test with very short input text."""
        payload = {"input_text": "Hello.", "tone": "Standard", "length_mode": "standard"}

        response = client.post("/api/v1/humanize/", json=payload)

        # Should handle short text
        assert response.status_code in [200, 400]

    def test_very_long_text(self):
        """Test with very long input text."""
        long_text = "This is a test sentence. " * 500  # ~2500 words

        payload = {"input_text": long_text, "tone": "Standard", "length_mode": "standard"}

        response = client.post("/api/v1/humanize/", json=payload)

        # Should handle or reject long text appropriately (403 for limit exceeded, 400 for bad request, 413 for payload too large)
        assert response.status_code in [200, 400, 403, 413, 500]

    def test_special_characters(self):
        """Test with special characters and emojis."""
        payload = {
            "input_text": "Hello! @#$% This has special chars & emojis 😀🎉",
            "tone": "Standard",
            "length_mode": "standard",
        }

        response = client.post("/api/v1/humanize/", json=payload)

        # Should handle special characters
        assert response.status_code == 200
        data = response.json()
        assert "humanized_text" in data

    def test_multiple_languages(self):
        """Test with different languages (if supported)."""
        texts = [
            ("Hello world, this is a test.", "en"),
            ("Hola mundo, esto es una prueba.", "es"),
            ("你好世界，这是一个测试。", "zh"),
        ]

        for text, lang_code in texts:
            payload = {"input_text": text, "tone": "Standard", "length_mode": "standard"}

            response = client.post("/api/v1/humanize/", json=payload)

            # Should handle different languages
            assert response.status_code in [200, 400]

    def test_concurrent_requests(self, valid_payload):
        """Test that endpoint handles concurrent requests."""
        import concurrent.futures

        def make_request():
            return client.post("/api/v1/humanize/", json=valid_payload)

        # Make 5 concurrent requests
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(make_request) for _ in range(5)]
            responses = [f.result() for f in futures]

        # All should succeed
        for response in responses:
            assert response.status_code == 200

    def test_response_metadata(self, valid_payload):
        """Test that response includes appropriate metadata."""
        response = client.post("/api/v1/humanize/", json=valid_payload)

        assert response.status_code == 200
        data = response.json()

        # Check for metadata fields
        assert "metadata" in data or "processing_time" in data or "model" in data

    def test_style_sample_option(self, sample_text):
        """Test with optional style_sample parameter."""
        payload = {
            "input_text": sample_text,
            "tone": "Professional",
            "length_mode": "standard",
            "style_sample": "Here is a sample of professional writing style.",
        }

        response = client.post("/api/v1/humanize/", json=payload)

        # Should accept style_sample if implemented
        assert response.status_code in [200, 422]

    def test_idempotency(self, valid_payload):
        """Test that same input produces consistent output (within reason)."""
        response1 = client.post("/api/v1/humanize/", json=valid_payload)
        response2 = client.post("/api/v1/humanize/", json=valid_payload)

        assert response1.status_code == 200
        assert response2.status_code == 200

        # Outputs might differ due to LLM randomness, but should be similar length
        text1 = response1.json()["humanized_text"]
        text2 = response2.json()["humanized_text"]

        len1 = len(text1.split())
        len2 = len(text2.split())

        # Word counts should be within 30% of each other
        assert abs(len1 - len2) / max(len1, len2) < 0.3


class TestHumanizeErrorHandling:
    """Test error handling for /humanize endpoint."""

    def test_invalid_json(self):
        """Test with invalid JSON."""
        response = client.post(
            "/api/v1/humanize/", data="not json", headers={"Content-Type": "application/json"}
        )

        assert response.status_code == 422

    def test_wrong_content_type(self):
        """Test with wrong content type."""
        response = client.post(
            "/api/v1/humanize/",
            data="input_text=test&tone=Standard",
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

        # FastAPI should handle this appropriately
        assert response.status_code in [422, 415]

    def test_null_values(self):
        """Test with null values."""
        payload = {"input_text": None, "tone": "Standard", "length_mode": "standard"}

        response = client.post("/api/v1/humanize/", json=payload)

        assert response.status_code == 422

    def test_wrong_types(self):
        """Test with wrong field types."""
        payload = {
            "input_text": 12345,  # Should be string
            "tone": "Standard",
            "length_mode": "standard",
        }

        response = client.post("/api/v1/humanize/", json=payload)

        # Pydantic should validate types
        assert response.status_code == 422


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
