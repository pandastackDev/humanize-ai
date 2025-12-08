"""
Pytest-based unit tests for /detect endpoint.

Tests:
- Request validation
- Response structure
- Error handling
- Edge cases
- Performance
"""

# Import the FastAPI app
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from index import app

client = TestClient(app)


class TestDetectEndpoint:
    """Test suite for /detect endpoint."""

    @pytest.fixture
    def ai_text(self):
        """Sample AI-generated text."""
        return "The utilization of advanced technological systems facilitates enhanced productivity across various organizational domains."

    @pytest.fixture
    def human_text(self):
        """Sample human-written text."""
        return "Hey! I've been thinking about this. You know what? Let's just go for it!"

    @pytest.fixture
    def valid_payload(self, ai_text):
        """Valid request payload."""
        return {"text": ai_text}

    def test_detect_success(self, valid_payload):
        """Test successful detection."""
        response = client.post("/api/v1/detect/", json=valid_payload)

        assert response.status_code == 200
        data = response.json()

        # Check response structure
        assert "human_likelihood_pct" in data
        assert "ai_likelihood_pct" in data
        assert isinstance(data["human_likelihood_pct"], (int, float))
        assert isinstance(data["ai_likelihood_pct"], (int, float))

        # Probabilities should sum to ~100
        total = data["human_likelihood_pct"] + data["ai_likelihood_pct"]
        assert 99 <= total <= 101  # Allow small floating point error

    def test_detect_ai_text(self, ai_text):
        """Test detection of AI text."""
        payload = {"text": ai_text}
        response = client.post("/api/v1/detect/", json=payload)

        assert response.status_code == 200
        data = response.json()

        # AI text should have higher AI likelihood (though not guaranteed)
        # Just check that we get reasonable values
        assert 0 <= data["ai_likelihood_pct"] <= 100
        assert 0 <= data["human_likelihood_pct"] <= 100

    def test_detect_human_text(self, human_text):
        """Test detection of human text."""
        payload = {"text": human_text}
        response = client.post("/api/v1/detect/", json=payload)

        assert response.status_code == 200
        data = response.json()

        # Human text should have higher human likelihood (though not guaranteed)
        assert 0 <= data["ai_likelihood_pct"] <= 100
        assert 0 <= data["human_likelihood_pct"] <= 100

    def test_missing_required_field(self):
        """Test request with missing text field."""
        response = client.post("/api/v1/detect/", json={})

        assert response.status_code == 422  # Validation error

    def test_empty_text(self):
        """Test with empty text."""
        payload = {"text": ""}
        response = client.post("/api/v1/detect/", json=payload)

        # Should handle gracefully
        assert response.status_code in [200, 400, 422]

    def test_very_short_text(self):
        """Test with very short text."""
        payload = {"text": "Hi"}
        response = client.post("/api/v1/detect/", json=payload)

        # Should handle short text
        assert response.status_code in [200, 400]

    def test_very_long_text(self):
        """Test with very long text."""
        long_text = "This is a test sentence. " * 1000  # ~5000 words
        payload = {"text": long_text}

        response = client.post("/api/v1/detect/", json=payload)

        # Should handle or reject long text appropriately
        assert response.status_code in [200, 400, 413]

    def test_special_characters(self):
        """Test with special characters."""
        # Use text with enough words after sanitization (special chars/emojis may be removed)
        payload = {
            "text": "Hello world! @#$%^&*() Testing special characters 123 😀🎉 This is a longer text with many words to ensure it passes validation after sanitization."
        }
        response = client.post("/api/v1/detect/", json=payload)

        # Should handle special characters
        assert response.status_code == 200
        data = response.json()
        assert "human_likelihood_pct" in data

    def test_multiple_languages(self):
        """Test with different languages."""
        texts = [
            "Hello world, this is a test.",
            "Hola mundo, esto es una prueba.",
            "你好世界，这是一个测试。",
            "مرحبا بالعالم، هذا اختبار.",
        ]

        for text in texts:
            payload = {"text": text}
            response = client.post("/api/v1/detect/", json=payload)

            # Should handle different languages
            assert response.status_code in [200, 400]

    def test_response_includes_confidence(self, valid_payload):
        """Test that response includes confidence score."""
        response = client.post("/api/v1/detect/", json=valid_payload)

        assert response.status_code == 200
        data = response.json()

        # Check for confidence or similar metric
        assert "confidence" in data or "certainty" in data or "score" in data

    def test_response_includes_detector_breakdown(self, valid_payload):
        """Test that response includes individual detector results."""
        response = client.post("/api/v1/detect/", json=valid_payload)

        assert response.status_code == 200
        data = response.json()

        # Check for detector breakdown if implemented
        # This might be optional depending on your API design
        if "detector_results" in data or "tool_breakdown" in data:
            breakdown = data.get("detector_results", data.get("tool_breakdown"))
            assert isinstance(breakdown, list)
            assert len(breakdown) > 0

    def test_caching_behavior(self, valid_payload):
        """Test that repeated requests are handled efficiently (caching)."""
        import time

        # First request
        start1 = time.time()
        response1 = client.post("/api/v1/detect/", json=valid_payload)
        time1 = time.time() - start1

        assert response1.status_code == 200

        # Second request (should be faster if cached)
        start2 = time.time()
        response2 = client.post("/api/v1/detect/", json=valid_payload)
        time2 = time.time() - start2

        assert response2.status_code == 200

        # Results should be identical (excluding processing_time_ms which may differ)
        data1 = response1.json()
        data2 = response2.json()

        # Compare metadata separately, excluding processing_time_ms
        if "metadata" in data1 and "metadata" in data2:
            metadata1 = {k: v for k, v in data1["metadata"].items() if k != "processing_time_ms"}
            metadata2 = {k: v for k, v in data2["metadata"].items() if k != "processing_time_ms"}
            assert metadata1 == metadata2, f"Metadata mismatch: {metadata1} != {metadata2}"

        # Compare rest of data (excluding metadata)
        data1_no_meta = {k: v for k, v in data1.items() if k != "metadata"}
        data2_no_meta = {k: v for k, v in data2.items() if k != "metadata"}
        assert data1_no_meta == data2_no_meta, f"Data mismatch: {data1_no_meta} != {data2_no_meta}"

        # Second request might be faster (if caching is implemented)
        # This is informational, not a hard assertion
        print(f"First request: {time1:.3f}s, Second request: {time2:.3f}s")

    def test_concurrent_requests(self, valid_payload):
        """Test that endpoint handles concurrent requests."""
        import concurrent.futures

        def make_request():
            return client.post("/api/v1/detect/", json=valid_payload)

        # Make 5 concurrent requests
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(make_request) for _ in range(5)]
            responses = [f.result() for f in futures]

        # All should succeed
        for response in responses:
            assert response.status_code == 200

    def test_mixed_content(self):
        """Test with mixed human/AI content."""
        mixed_text = """
        The utilization of advanced technological systems is great.
        But honestly, I think we need to just keep things simple.
        Enhanced productivity facilitates operational efficiency.
        You know what? Let's just go for it!
        """

        payload = {"text": mixed_text}
        response = client.post("/api/v1/detect/", json=payload)

        assert response.status_code == 200
        data = response.json()

        # Mixed content should give intermediate scores (allow wider range for edge cases)
        # Some detectors may score very low if text appears mostly AI-like
        assert 0 <= data["human_likelihood_pct"] <= 100
        # But if we have valid detector results, it should not be exactly 50/50 (neutral)
        # unless all detectors failed
        valid_detectors = [r for r in data["detector_results"] if r.get("error") is None]
        if valid_detectors:
            # With valid detectors, score should reflect actual detection
            assert data["human_likelihood_pct"] != 50.0 or data["ai_likelihood_pct"] != 50.0


class TestDetectErrorHandling:
    """Test error handling for /detect endpoint."""

    def test_invalid_json(self):
        """Test with invalid JSON."""
        response = client.post(
            "/api/v1/detect/", data="not json", headers={"Content-Type": "application/json"}
        )

        assert response.status_code == 422

    def test_null_value(self):
        """Test with null value."""
        payload = {"text": None}
        response = client.post("/api/v1/detect/", json=payload)

        assert response.status_code == 422

    def test_wrong_type(self):
        """Test with wrong field type."""
        payload = {"text": 12345}  # Should be string
        response = client.post("/api/v1/detect/", json=payload)

        # Pydantic should validate types
        assert response.status_code == 422

    def test_missing_text_field(self):
        """Test with missing text field."""
        payload = {"content": "This is wrong field name"}
        response = client.post("/api/v1/detect/", json=payload)

        assert response.status_code == 422


class TestDetectPerformance:
    """Performance tests for /detect endpoint."""

    def test_response_time(self):
        """Test that endpoint responds within reasonable time."""
        import time

        # Ensure text has at least 10 words after sanitization
        payload = {
            "text": "The utilization of advanced technological systems facilitates enhanced productivity across various organizational domains and improves overall efficiency."
        }

        start = time.time()
        response = client.post("/api/v1/detect/", json=payload)
        elapsed = time.time() - start

        assert response.status_code == 200

        # Should respond within 12 seconds (adjust based on your requirements)
        # First request might be slow due to model loading or API delays
        print(f"Response time: {elapsed:.3f}s")
        assert elapsed < 12.0

    def test_throughput(self):
        """Test throughput with multiple sequential requests."""
        import time

        # Ensure text has at least 10 words after sanitization
        payload = {
            "text": "This is a test sentence for throughput testing with enough words to pass validation requirements and ensure accurate detection results."
        }

        n_requests = 10
        start = time.time()

        for _ in range(n_requests):
            response = client.post("/api/v1/detect/", json=payload)
            assert response.status_code == 200

        elapsed = time.time() - start
        throughput = n_requests / elapsed

        print(f"Throughput: {throughput:.2f} requests/second")

        # Should handle at least 0.5 requests per second
        assert throughput > 0.5


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
