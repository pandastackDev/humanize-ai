"""
External detector abstraction layer with:
- Retry logic with exponential backoff
- Rate limit handling
- Error logging
- Result caching
- Timeout management
"""

import hashlib
import json
import time
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from pathlib import Path

import httpx


class DetectorCache:
    """Simple file-based cache for detector results."""

    def __init__(self, cache_dir: str = "eval/cache"):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _get_cache_key(self, text: str, detector_name: str) -> str:
        """Generate cache key from text and detector."""
        content = f"{detector_name}:{text}"
        return hashlib.sha256(content.encode()).hexdigest()

    def _get_cache_path(self, cache_key: str) -> Path:
        """Get path to cache file."""
        return self.cache_dir / f"{cache_key}.json"

    def get(self, text: str, detector_name: str, ttl_hours: int = 24) -> dict | None:
        """Get cached result if exists and not expired."""
        cache_key = self._get_cache_key(text, detector_name)
        cache_path = self._get_cache_path(cache_key)

        if not cache_path.exists():
            return None

        try:
            with open(cache_path, encoding="utf-8") as f:
                cached = json.load(f)

            # Check if expired
            cached_time = datetime.fromisoformat(cached["timestamp"])
            if datetime.now() - cached_time > timedelta(hours=ttl_hours):
                return None

            return cached["result"]
        except Exception as e:
            print(f"Warning: Cache read error: {e}")
            return None

    def set(self, text: str, detector_name: str, result: dict):
        """Cache a result."""
        cache_key = self._get_cache_key(text, detector_name)
        cache_path = self._get_cache_path(cache_key)

        try:
            cached = {
                "timestamp": datetime.now().isoformat(),
                "detector": detector_name,
                "result": result,
            }

            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump(cached, f, indent=2)
        except Exception as e:
            print(f"Warning: Cache write error: {e}")


class BaseDetector(ABC):
    """Base class for external detectors."""

    def __init__(
        self,
        api_key: str,
        name: str,
        timeout: int = 30,
        max_retries: int = 3,
        use_cache: bool = True,
    ):
        self.api_key = api_key
        self.name = name
        self.timeout = timeout
        self.max_retries = max_retries
        self.use_cache = use_cache
        self.cache = DetectorCache() if use_cache else None
        self.client = httpx.Client(timeout=timeout)

        # Rate limit tracking
        self.last_request_time = 0
        self.min_request_interval = 1.0  # Minimum seconds between requests

    @abstractmethod
    def _make_request(self, text: str) -> dict:
        """Make the actual API request. Must be implemented by subclass."""
        pass

    @abstractmethod
    def _parse_response(self, response: dict) -> dict:
        """Parse the API response into standard format. Must be implemented by subclass."""
        pass

    def _wait_for_rate_limit(self):
        """Wait if needed to respect rate limits."""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.min_request_interval:
            time.sleep(self.min_request_interval - elapsed)

    def detect(self, text: str) -> dict:
        """
        Detect text using this detector.

        Returns standard format:
        {
            "success": bool,
            "human_likelihood_pct": float (0-100),
            "ai_likelihood_pct": float (0-100),
            "confidence": float (0-1),
            "tool": str,
            "cached": bool,
            "error": str (if failed),
            "latency_ms": int
        }
        """

        # Check cache first
        if self.use_cache and self.cache:
            cached_result = self.cache.get(text, self.name)
            if cached_result:
                cached_result["cached"] = True
                return cached_result

        # Rate limit
        self._wait_for_rate_limit()

        # Retry logic
        last_error = None
        for attempt in range(self.max_retries):
            try:
                start_time = time.time()

                # Make request
                response = self._make_request(text)

                # Parse response
                result = self._parse_response(response)

                # Add metadata
                result.update(
                    {
                        "success": True,
                        "tool": self.name,
                        "cached": False,
                        "latency_ms": int((time.time() - start_time) * 1000),
                    }
                )

                # Cache result
                if self.use_cache and self.cache:
                    self.cache.set(text, self.name, result)

                self.last_request_time = time.time()
                return result

            except httpx.HTTPStatusError as e:
                last_error = f"HTTP {e.response.status_code}: {e.response.text[:200]}"

                # Don't retry on 4xx errors (except 429 rate limit)
                if 400 <= e.response.status_code < 500 and e.response.status_code != 429:
                    break

                # Exponential backoff
                if attempt < self.max_retries - 1:
                    wait_time = (2**attempt) * 1.0  # 1s, 2s, 4s
                    print(
                        f"  ⚠️  {self.name}: Retry {attempt + 1}/{self.max_retries} after {wait_time}s"
                    )
                    time.sleep(wait_time)

            except httpx.TimeoutException:
                last_error = f"Timeout after {self.timeout}s"

                if attempt < self.max_retries - 1:
                    wait_time = (2**attempt) * 1.0
                    print(f"  ⚠️  {self.name}: Timeout, retry {attempt + 1}/{self.max_retries}")
                    time.sleep(wait_time)

            except Exception as e:
                last_error = f"Unexpected error: {str(e)}"

                if attempt < self.max_retries - 1:
                    wait_time = (2**attempt) * 1.0
                    print(f"  ⚠️  {self.name}: Error, retry {attempt + 1}/{self.max_retries}")
                    time.sleep(wait_time)

        # All retries failed
        self.last_request_time = time.time()
        return {
            "success": False,
            "tool": self.name,
            "error": last_error,
            "cached": False,
            "human_likelihood_pct": None,
            "ai_likelihood_pct": None,
            "confidence": 0.0,
        }


class GPTZeroDetector(BaseDetector):
    """GPTZero detector implementation."""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key, "GPTZero", **kwargs)
        self.api_url = "https://api.gptzero.me/v2/predict/text"

    def _make_request(self, text: str) -> dict:
        """Make request to GPTZero API."""
        headers = {"X-Api-Key": self.api_key, "Content-Type": "application/json"}

        payload = {"document": text}

        response = self.client.post(self.api_url, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()

    def _parse_response(self, response: dict) -> dict:
        """Parse GPTZero response."""
        # GPTZero returns probability of being AI
        ai_prob = response.get("completely_generated_prob", 0.5)

        return {
            "human_likelihood_pct": (1 - ai_prob) * 100,
            "ai_likelihood_pct": ai_prob * 100,
            "confidence": abs(ai_prob - 0.5) * 2,  # 0.5 confidence when uncertain
        }


class OriginalityAIDetector(BaseDetector):
    """Originality.ai detector implementation."""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key, "Originality.AI", **kwargs)
        self.api_url = "https://api.originality.ai/api/v1/scan/ai"

    def _make_request(self, text: str) -> dict:
        """Make request to Originality.ai API."""
        headers = {"X-OAI-API-KEY": self.api_key, "Content-Type": "application/json"}

        payload = {
            "content": text,
            "aiModelVersion": "1",  # Or "2" for newer model
        }

        response = self.client.post(self.api_url, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()

    def _parse_response(self, response: dict) -> dict:
        """Parse Originality.ai response."""
        # Originality.ai returns scores
        ai_score = response.get("score", {}).get("ai", 0.5)
        original_score = response.get("score", {}).get("original", 0.5)

        return {
            "human_likelihood_pct": original_score * 100,
            "ai_likelihood_pct": ai_score * 100,
            "confidence": max(ai_score, original_score),
        }


class ZeroGPTDetector(BaseDetector):
    """ZeroGPT detector implementation."""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key, "ZeroGPT", **kwargs)
        self.api_url = "https://api.zerogpt.com/api/v1/detectText"

    def _make_request(self, text: str) -> dict:
        """Make request to ZeroGPT API."""
        headers = {"ApiKey": self.api_key, "Content-Type": "application/json"}

        payload = {"input_text": text}

        response = self.client.post(self.api_url, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()

    def _parse_response(self, response: dict) -> dict:
        """Parse ZeroGPT response."""
        # ZeroGPT returns percentage of AI content
        ai_percentage = response.get("data", {}).get("fakePercentage", 50)

        return {
            "human_likelihood_pct": 100 - ai_percentage,
            "ai_likelihood_pct": ai_percentage,
            "confidence": abs(ai_percentage - 50) / 50,  # 0 at 50%, 1 at 0% or 100%
        }


class WriterDetector(BaseDetector):
    """Writer.com AI detector implementation."""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key, "Writer", **kwargs)
        self.api_url = "https://api.writer.com/v1/ai-content-detector"

    def _make_request(self, text: str) -> dict:
        """Make request to Writer API."""
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}

        payload = {"content": text}

        response = self.client.post(self.api_url, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()

    def _parse_response(self, response: dict) -> dict:
        """Parse Writer response."""
        # Writer returns score (0-1 scale, higher = more AI)
        ai_score = response.get("score", 0.5)

        return {
            "human_likelihood_pct": (1 - ai_score) * 100,
            "ai_likelihood_pct": ai_score * 100,
            "confidence": abs(ai_score - 0.5) * 2,
        }


class SaplingDetector(BaseDetector):
    """Sapling.ai detector implementation."""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key, "Sapling", **kwargs)
        self.api_url = "https://api.sapling.ai/api/v1/aidetect"

    def _make_request(self, text: str) -> dict:
        """Make request to Sapling API."""
        headers = {"Content-Type": "application/json"}

        payload = {"key": self.api_key, "text": text}

        response = self.client.post(self.api_url, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()

    def _parse_response(self, response: dict) -> dict:
        """Parse Sapling response."""
        # Sapling returns score (0-1 scale)
        ai_score = response.get("score", 0.5)

        return {
            "human_likelihood_pct": (1 - ai_score) * 100,
            "ai_likelihood_pct": ai_score * 100,
            "confidence": abs(ai_score - 0.5) * 2,
        }


class DetectorManager:
    """Manages multiple external detectors."""

    def __init__(self, config: dict):
        """
        Initialize detector manager with API keys from config.

        Args:
            config: Dictionary with detector API keys
        """
        self.detectors = []

        # Initialize available detectors
        if config.get("GPTZERO_API_KEY"):
            self.detectors.append(GPTZeroDetector(config["GPTZERO_API_KEY"]))

        if config.get("ORIGINALITY_API_KEY"):
            self.detectors.append(OriginalityAIDetector(config["ORIGINALITY_API_KEY"]))

        if config.get("ZEROGPT_API_KEY"):
            self.detectors.append(ZeroGPTDetector(config["ZEROGPT_API_KEY"]))

        if config.get("WRITER_API_KEY"):
            self.detectors.append(WriterDetector(config["WRITER_API_KEY"]))

        if config.get("SAPLING_API_KEY"):
            self.detectors.append(SaplingDetector(config["SAPLING_API_KEY"]))

    def detect_all(self, text: str, parallel: bool = False) -> dict:
        """
        Run text through all available detectors.

        Args:
            text: Text to detect
            parallel: If True, run detectors in parallel (future enhancement)

        Returns:
            Dictionary with individual results and ensemble prediction
        """
        results = {
            "timestamp": datetime.now().isoformat(),
            "text_length": len(text),
            "detectors": [],
            "successful_detectors": 0,
            "failed_detectors": 0,
        }

        # Run each detector
        for detector in self.detectors:
            print(f"  Running {detector.name}...", end=" ")

            result = detector.detect(text)
            results["detectors"].append(result)

            if result["success"]:
                results["successful_detectors"] += 1
                status = (
                    "✅ cached" if result.get("cached") else f"✅ {result.get('latency_ms', 0)}ms"
                )
                print(status)
            else:
                results["failed_detectors"] += 1
                print(f"❌ {result.get('error', 'Unknown error')}")

        # Calculate ensemble prediction
        successful_results = [r for r in results["detectors"] if r["success"]]

        if successful_results:
            # Average human likelihood across all successful detectors
            avg_human = sum(r["human_likelihood_pct"] for r in successful_results) / len(
                successful_results
            )

            # Weighted by confidence
            total_confidence = sum(r["confidence"] for r in successful_results)
            if total_confidence > 0:
                weighted_human = (
                    sum(r["human_likelihood_pct"] * r["confidence"] for r in successful_results)
                    / total_confidence
                )
            else:
                weighted_human = avg_human

            results["ensemble"] = {
                "human_likelihood_pct": weighted_human,
                "ai_likelihood_pct": 100 - weighted_human,
                "confidence": total_confidence / len(successful_results),
                "method": "weighted_average",
            }
        else:
            results["ensemble"] = {
                "human_likelihood_pct": None,
                "ai_likelihood_pct": None,
                "confidence": 0.0,
                "method": "no_successful_detectors",
            }

        return results


# Example usage
if __name__ == "__main__":
    import os

    from dotenv import load_dotenv

    load_dotenv()

    config = {
        "GPTZERO_API_KEY": os.getenv("GPTZERO_API_KEY", ""),
        "ORIGINALITY_API_KEY": os.getenv("ORIGINALITY_API_KEY", ""),
        "ZEROGPT_API_KEY": os.getenv("ZEROGPT_API_KEY", ""),
        "WRITER_API_KEY": os.getenv("WRITER_API_KEY", ""),
        "SAPLING_API_KEY": os.getenv("SAPLING_API_KEY", ""),
    }

    manager = DetectorManager(config)

    print(f"Initialized {len(manager.detectors)} detectors")

    # Test text
    test_text = """
    The utilization of advanced technological systems facilitates enhanced productivity
    and operational efficiency across various organizational domains.
    """

    print("\nTesting detection on sample text...")
    results = manager.detect_all(test_text)

    print("\nResults:")
    print(f"  Successful: {results['successful_detectors']}")
    print(f"  Failed: {results['failed_detectors']}")

    if results["ensemble"]["human_likelihood_pct"] is not None:
        print("\nEnsemble Prediction:")
        print(f"  Human: {results['ensemble']['human_likelihood_pct']:.1f}%")
        print(f"  AI: {results['ensemble']['ai_likelihood_pct']:.1f}%")
