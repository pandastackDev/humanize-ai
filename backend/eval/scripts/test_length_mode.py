"""
Test length_mode constraint satisfaction.

Validates that /humanize respects length_mode parameter:
- shorten: output ≤ 0.8 × input
- expand: output ≥ 1.2 × input
- standard: 0.9-1.1 × input
"""

import json
import sys
from pathlib import Path

import httpx

sys.path.append(str(Path(__file__).parent.parent))
from config import config


class LengthModeTester:
    """Tests length_mode constraint satisfaction."""

    def __init__(self):
        self.client = httpx.Client(timeout=120.0)

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
            print(f"    ❌ Error: {e}")
            return None

    def count_words(self, text: str) -> int:
        """Count words in text."""
        return len(text.split())

    def test_length_mode(self, sample: dict, length_mode: str) -> dict:
        """Test a specific length_mode on a sample."""

        original_text = sample["text"]
        sample_id = sample["id"]
        language = sample["metadata"]["language"]

        original_words = self.count_words(original_text)

        print(f"  Testing: {sample_id}")
        print(f"  Length mode: {length_mode}")
        print(f"  Original: {original_words} words")

        result = {
            "id": sample_id,
            "language": language,
            "length_mode": length_mode,
            "original_words": original_words,
            "success": False,
        }

        # Humanize
        humanized = self.humanize_text(original_text, length_mode=length_mode)

        if not humanized or "humanized_text" not in humanized:
            result["error"] = "Failed to humanize"
            print("    ❌ Failed to humanize")
            return result

        humanized_text = humanized["humanized_text"]
        humanized_words = self.count_words(humanized_text)

        result["humanized_words"] = humanized_words
        result["ratio"] = humanized_words / original_words
        result["success"] = True

        print(f"  Humanized: {humanized_words} words")
        print(f"  Ratio: {result['ratio']:.2f}x")

        # Check constraints
        if length_mode == "shorten":
            expected_max = config.LENGTH_SHORTEN_MAX
            result["constraint_met"] = result["ratio"] <= expected_max
            print(f"  Constraint: ≤{expected_max}x")
        elif length_mode == "expand":
            expected_min = config.LENGTH_EXPAND_MIN
            result["constraint_met"] = result["ratio"] >= expected_min
            print(f"  Constraint: ≥{expected_min}x")
        else:  # standard
            expected_min = config.LENGTH_STANDARD_MIN
            expected_max = config.LENGTH_STANDARD_MAX
            result["constraint_met"] = expected_min <= result["ratio"] <= expected_max
            print(f"  Constraint: {expected_min}-{expected_max}x")

        if result["constraint_met"]:
            print("    ✅ PASSED")
        else:
            print("    ❌ FAILED - constraint not met")

        return result

    def test_all_modes(self, dataset_path: str, max_samples: int | None = None) -> dict:
        """Test all length modes on a dataset."""

        with open(dataset_path, encoding="utf-8") as f:
            samples = json.load(f)

        if max_samples:
            samples = samples[:max_samples]

        print(f"\n{'=' * 80}")
        print(f"Testing: {dataset_path}")
        print(f"Samples: {len(samples)}")
        print(f"{'=' * 80}\n")

        results = {
            "dataset": dataset_path,
            "length_modes": {},
            "total_tests": 0,
            "passed": 0,
            "failed": 0,
        }

        for length_mode in ["standard", "shorten", "expand"]:
            print(f"\n{'=' * 80}")
            print(f"LENGTH MODE: {length_mode.upper()}")
            print(f"{'=' * 80}\n")

            mode_results = {"tests": 0, "passed": 0, "failed": 0, "ratios": [], "details": []}

            for i, sample in enumerate(samples):
                print(f"[{i + 1}/{len(samples)}]")

                test_result = self.test_length_mode(sample, length_mode)
                mode_results["details"].append(test_result)

                if test_result.get("success"):
                    mode_results["tests"] += 1
                    results["total_tests"] += 1

                    if test_result.get("ratio"):
                        mode_results["ratios"].append(test_result["ratio"])

                    if test_result.get("constraint_met"):
                        mode_results["passed"] += 1
                        results["passed"] += 1
                    else:
                        mode_results["failed"] += 1
                        results["failed"] += 1

                print()

            # Calculate statistics
            if mode_results["ratios"]:
                import numpy as np

                mode_results["mean_ratio"] = float(np.mean(mode_results["ratios"]))
                mode_results["median_ratio"] = float(np.median(mode_results["ratios"]))
                mode_results["pass_rate"] = mode_results["passed"] / mode_results["tests"]

            results["length_modes"][length_mode] = mode_results

        return results

    def print_summary(self, results: dict):
        """Print test summary."""
        print(f"\n{'=' * 80}")
        print("LENGTH MODE TEST SUMMARY")
        print(f"{'=' * 80}")
        print(f"Dataset: {results['dataset']}")
        print(f"Total tests: {results['total_tests']}")
        print(f"Overall passed: {results['passed']}")
        print(f"Overall failed: {results['failed']}")
