"""
Test detector pass-rate - verify that humanization reduces AI detection scores.

This is the PRIMARY business metric. Tests whether humanized text
successfully evades AI detectors.
"""

import json
import sys
from datetime import datetime
from pathlib import Path

import httpx

sys.path.append(str(Path(__file__).parent.parent))
from config import config


class DetectorPassRateTester:
    """Tests AI detector evasion after humanization."""

    def __init__(self):
        self.client = httpx.Client(timeout=120.0)  # Detectors can be slow
        self.cache = {}  # Cache detector results to save API costs

    def detect_text(self, text: str) -> dict | None:
        """Call the /detect endpoint."""

        # Check cache first
        cache_key = hash(text)
        if config.CACHE_DETECTOR_RESULTS and cache_key in self.cache:
            print("    (using cached result)")
            return self.cache[cache_key]

        url = f"{config.API_BASE_URL}{config.DETECT_ENDPOINT}"

        payload = {"text": text}

        try:
            response = self.client.post(url, json=payload)
            response.raise_for_status()
            result = response.json()

            # Cache the result
            if config.CACHE_DETECTOR_RESULTS:
                self.cache[cache_key] = result

            return result
        except Exception as e:
            print(f"    ❌ Error calling /detect: {e}")
            return None

    def humanize_text(
        self, text: str, tone: str = "Standard", length_mode: str = "standard"
    ) -> dict | None:
        """Call the /humanize endpoint."""
        url = f"{config.API_BASE_URL}{config.HUMANIZE_ENDPOINT}"

        payload = {"input_text": text, "tone": tone, "length_mode": length_mode}

        try:
            response = self.client.post(url, json=payload)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"    ❌ Error calling /humanize: {e}")
            return None

    def load_dataset(self, dataset_path: str) -> list[dict]:
        """Load test dataset."""
        with open(dataset_path, encoding="utf-8") as f:
            return json.load(f)

    def test_sample(self, sample: dict, tone: str | None = None) -> dict:
        """Test a single sample through the humanization + detection pipeline."""

        original_text = sample["text"]
        sample_tone = tone or sample["metadata"].get("tone", "Standard")
        sample_id = sample["id"]

        result = {"id": sample_id, "tone": sample_tone, "success": False, "error": None}

        # Step 1: Detect original text
        print("  Detecting ORIGINAL text...")
        original_detection = self.detect_text(original_text)

        if not original_detection:
            result["error"] = "Failed to detect original"
            return result

        result["original_human_likelihood"] = original_detection.get("human_likelihood_pct", 0)
        result["original_ai_likelihood"] = original_detection.get("ai_likelihood_pct", 100)

        print(
            f"    Original: {result['original_human_likelihood']:.1f}% human, "
            f"{result['original_ai_likelihood']:.1f}% AI"
        )

        # Step 2: Humanize the text
        print(f"  HUMANIZING text with tone={sample_tone}...")
        humanized_result = self.humanize_text(original_text, tone=sample_tone)

        if not humanized_result or "humanized_text" not in humanized_result:
            result["error"] = "Failed to humanize"
            return result

        humanized_text = humanized_result["humanized_text"]

        # Step 3: Detect humanized text
        print("  Detecting HUMANIZED text...")
        humanized_detection = self.detect_text(humanized_text)

        if not humanized_detection:
            result["error"] = "Failed to detect humanized"
            return result

        result["humanized_human_likelihood"] = humanized_detection.get("human_likelihood_pct", 0)
        result["humanized_ai_likelihood"] = humanized_detection.get("ai_likelihood_pct", 100)

        print(
            f"    Humanized: {result['humanized_human_likelihood']:.1f}% human, "
            f"{result['humanized_ai_likelihood']:.1f}% AI"
        )

        # Calculate improvement
        result["delta_human_likelihood"] = (
            result["humanized_human_likelihood"] - result["original_human_likelihood"]
        )

        print(f"    Δ Human likelihood: {result['delta_human_likelihood']:+.1f}%")

        # Check if passes threshold
        threshold = config.DETECTOR_PASS_THRESHOLD * 100  # Convert to percentage
        result["passed_threshold"] = result["humanized_human_likelihood"] >= threshold
        result["success"] = True

        if result["passed_threshold"]:
            print(f"    ✅ PASSED threshold ({threshold}%)")
        else:
            print(f"    ❌ FAILED threshold ({threshold}%)")

        return result

    def test_dataset(
        self, dataset_path: str, tone: str | None = None, max_samples: int | None = None
    ) -> dict:
        """Test detector pass-rate on a dataset."""

        samples = self.load_dataset(dataset_path)

        if max_samples:
            samples = samples[:max_samples]

        print(f"\n{'=' * 80}")
        print(f"Testing: {dataset_path}")
        print(f"Samples: {len(samples)}")
        print(f"{'=' * 80}\n")

        results = {
            "dataset": dataset_path,
            "total_samples": len(samples),
            "successful_tests": 0,
            "passed_threshold": 0,
            "failed_threshold": 0,
            "errors": 0,
            "improvements": [],
            "details": [],
        }

        for i, sample in enumerate(samples):
            print(f"[{i + 1}/{len(samples)}] Testing: {sample['id']}")

            sample_result = self.test_sample(sample, tone)
            results["details"].append(sample_result)

            if sample_result.get("error"):
                results["errors"] += 1
            elif sample_result.get("success"):
                results["successful_tests"] += 1
                results["improvements"].append(sample_result["delta_human_likelihood"])

                if sample_result["passed_threshold"]:
                    results["passed_threshold"] += 1
                else:
                    results["failed_threshold"] += 1

            print()

        # Calculate statistics
        if results["successful_tests"] > 0:
            import numpy as np

            results["pass_rate"] = results["passed_threshold"] / results["successful_tests"]
            results["mean_improvement"] = float(np.mean(results["improvements"]))
            results["median_improvement"] = float(np.median(results["improvements"]))
            results["min_improvement"] = float(np.min(results["improvements"]))
            results["max_improvement"] = float(np.max(results["improvements"]))

        return results

    def print_summary(self, results: dict):
        """Print test summary."""
        print(f"\n{'=' * 80}")
        print("DETECTOR PASS-RATE TEST SUMMARY")
        print(f"{'=' * 80}")
        print(f"Dataset: {results['dataset']}")
        print(f"Total samples: {results['total_samples']}")
        print(f"Successful tests: {results['successful_tests']}")
        print(f"Errors: {results['errors']}")
        print("\nDetector Evasion:")
        print(
            f"  Passed threshold: {results.get('passed_threshold', 0)} "
            f"({results.get('pass_rate', 0) * 100:.1f}%)"
        )
        print(f"  Failed threshold: {results.get('failed_threshold', 0)}")
        print("\nImprovement Statistics:")
        print(f"  Mean Δ: {results.get('mean_improvement', 0):+.1f}%")
        print(f"  Median Δ: {results.get('median_improvement', 0):+.1f}%")
        print(f"  Min Δ: {results.get('min_improvement', 0):+.1f}%")
        print(f"  Max Δ: {results.get('max_improvement', 0):+.1f}%")
        print(f"\nThreshold: {config.DETECTOR_PASS_THRESHOLD * 100}% human likelihood")
        print(f"Success criteria: ≥{config.DETECTOR_SUCCESS_RATE * 100}% pass rate")

        if results.get("pass_rate", 0) >= config.DETECTOR_SUCCESS_RATE:
            print("\n✅ TEST PASSED - Detector evasion is working!")
        else:
            print("\n❌ TEST FAILED - Pass rate below success criteria")
        print(f"{'=' * 80}\n")

    def save_results(self, results: dict, output_file: str):
        """Save results to JSON."""
        output_path = Path(config.RESULTS_DIR) / output_file
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2)

        print(f"📊 Results saved to: {output_path}")


def main():
    """Run detector pass-rate tests."""

    import argparse

    parser = argparse.ArgumentParser(description="Test detector pass-rate")
    parser.add_argument("--max-samples", type=int, help="Max samples per dataset")
    args = parser.parse_args()

    tester = DetectorPassRateTester()

    # Test AI-generated samples (most important)
    datasets = []

    ai_long = Path("eval/datasets/ai_only/english_ai_long.json")
    if ai_long.exists():
        datasets.append(str(ai_long))

    # Also test human samples to ensure we don't break them
    human_long = Path("eval/datasets/human_only/english_academic_long.json")
    if human_long.exists():
        datasets.append(str(human_long))

    if not datasets:
        print("❌ No datasets found. Please generate samples first.")
        return

    all_results = []

    for dataset_path in datasets:
        results = tester.test_dataset(dataset_path, max_samples=args.max_samples)
        tester.print_summary(results)
        all_results.append(results)

    # Save combined results
    if all_results:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f"detector_passrate_{timestamp}.json"
        tester.save_results(
            {
                "timestamp": datetime.now().isoformat(),
                "config": {
                    "pass_threshold": config.DETECTOR_PASS_THRESHOLD,
                    "success_rate": config.DETECTOR_SUCCESS_RATE,
                },
                "datasets": all_results,
            },
            output_file,
        )


if __name__ == "__main__":
    main()
