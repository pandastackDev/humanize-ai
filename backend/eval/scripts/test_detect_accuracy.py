"""
Test /detect endpoint accuracy - verify detector works correctly on known AI/human texts.

Tests whether the detection system can accurately distinguish between:
- Pure AI text
- Pure human text
- Mixed/edited text
"""

import json
import sys
from datetime import datetime
from pathlib import Path

import httpx
import numpy as np

sys.path.append(str(Path(__file__).parent.parent))
from config import config


class DetectAccuracyTester:
    """Tests accuracy of the /detect endpoint."""

    def __init__(self):
        self.client = httpx.Client(timeout=60.0)

    def detect_text(self, text: str) -> dict | None:
        """Call the /detect endpoint."""
        url = f"{config.API_BASE_URL}{config.DETECT_ENDPOINT}"

        payload = {"text": text}

        try:
            response = self.client.post(url, json=payload)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"    ❌ Error calling /detect: {e}")
            return None

    def load_dataset(self, dataset_path: str) -> list[dict]:
        """Load test dataset."""
        with open(dataset_path, encoding="utf-8") as f:
            return json.load(f)

    def test_sample(self, sample: dict) -> dict:
        """Test detection on a single sample."""

        text = sample["text"]
        sample_id = sample["id"]
        ground_truth = sample["metadata"]["source"]  # "ai_generated" or "human_written"

        result = {"id": sample_id, "ground_truth": ground_truth, "success": False, "error": None}

        # Detect the text
        detection = self.detect_text(text)

        if not detection:
            result["error"] = "Failed to detect"
            return result

        result["human_likelihood"] = detection.get("human_likelihood_pct", 0)
        result["ai_likelihood"] = detection.get("ai_likelihood_pct", 100)
        result["confidence"] = detection.get("confidence", 0)

        # Determine predicted label
        # Threshold: >50% AI = "AI", >50% human = "human"
        if result["ai_likelihood"] > 50:
            result["predicted"] = "ai_generated"
        else:
            result["predicted"] = "human_written"

        # Check if correct
        result["correct"] = result["predicted"] == ground_truth
        result["success"] = True

        status = "✅" if result["correct"] else "❌"
        print(f"    Ground truth: {ground_truth}")
        print(
            f"    Detection: {result['human_likelihood']:.1f}% human, {result['ai_likelihood']:.1f}% AI"
        )
        print(f"    Predicted: {result['predicted']}")
        print(f"    {status} {'CORRECT' if result['correct'] else 'INCORRECT'}")

        return result

    def test_dataset(
        self, dataset_path: str, expected_source: str, max_samples: int | None = None
    ) -> dict:
        """
        Test detection accuracy on a dataset.

        Args:
            dataset_path: Path to dataset
            expected_source: "ai_generated" or "human_written" (for validation)
            max_samples: Limit number of samples
        """

        samples = self.load_dataset(dataset_path)

        if max_samples:
            samples = samples[:max_samples]

        print(f"\n{'=' * 80}")
        print(f"Testing: {dataset_path}")
        print(f"Expected source: {expected_source}")
        print(f"Samples: {len(samples)}")
        print(f"{'=' * 80}\n")

        results = {
            "dataset": dataset_path,
            "expected_source": expected_source,
            "total_samples": len(samples),
            "successful_tests": 0,
            "correct": 0,
            "incorrect": 0,
            "errors": 0,
            "human_likelihoods": [],
            "details": [],
        }

        for i, sample in enumerate(samples):
            print(f"[{i + 1}/{len(samples)}] Testing: {sample['id']}")

            sample_result = self.test_sample(sample)
            results["details"].append(sample_result)

            if sample_result.get("error"):
                results["errors"] += 1
            elif sample_result.get("success"):
                results["successful_tests"] += 1
                results["human_likelihoods"].append(sample_result["human_likelihood"])

                if sample_result["correct"]:
                    results["correct"] += 1
                else:
                    results["incorrect"] += 1

            print()

        # Calculate statistics
        if results["successful_tests"] > 0:
            results["accuracy"] = results["correct"] / results["successful_tests"]
            results["mean_human_likelihood"] = float(np.mean(results["human_likelihoods"]))
            results["median_human_likelihood"] = float(np.median(results["human_likelihoods"]))
            results["std_human_likelihood"] = float(np.std(results["human_likelihoods"]))

        return results

    def print_summary(self, results: dict):
        """Print test summary."""
        print(f"\n{'=' * 80}")
        print("DETECT ACCURACY TEST SUMMARY")
        print(f"{'=' * 80}")
        print(f"Dataset: {results['dataset']}")
        print(f"Expected source: {results['expected_source']}")
        print(f"Total samples: {results['total_samples']}")
        print(f"Successful tests: {results['successful_tests']}")
        print(f"Errors: {results['errors']}")
        print("\nAccuracy:")
        print(f"  Correct: {results.get('correct', 0)} ({results.get('accuracy', 0) * 100:.1f}%)")
        print(f"  Incorrect: {results.get('incorrect', 0)}")
        print("\nHuman Likelihood Statistics:")
        print(f"  Mean: {results.get('mean_human_likelihood', 0):.1f}%")
        print(f"  Median: {results.get('median_human_likelihood', 0):.1f}%")
        print(f"  Std Dev: {results.get('std_human_likelihood', 0):.1f}%")

        # Expectations based on source
        if results["expected_source"] == "ai_generated":
            # For AI texts, we expect LOW human likelihood (high AI detection)
            expected_behavior = "Low human likelihood (detect as AI)"
            good_performance = results.get("mean_human_likelihood", 100) < 30
        else:
            # For human texts, we expect HIGH human likelihood
            expected_behavior = "High human likelihood (detect as human)"
            good_performance = results.get("mean_human_likelihood", 0) > 70

        print(f"\nExpected behavior: {expected_behavior}")

        if results.get("accuracy", 0) >= 0.80 and good_performance:
            print("\n✅ TEST PASSED - Detection accuracy is good!")
        else:
            print("\n❌ TEST FAILED - Detection accuracy needs improvement")
        print(f"{'=' * 80}\n")

    def save_results(self, results: dict, output_file: str):
        """Save results to JSON."""
        output_path = Path(config.RESULTS_DIR) / output_file
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2)

        print(f"📊 Results saved to: {output_path}")


def main():
    """Run detect accuracy tests."""

    import argparse

    parser = argparse.ArgumentParser(description="Test /detect accuracy")
    parser.add_argument("--max-samples", type=int, help="Max samples per dataset")
    args = parser.parse_args()

    tester = DetectAccuracyTester()

    # Test both AI and human datasets
    test_configs = []

    # AI-generated texts (should be detected as AI)
    ai_long = Path("eval/datasets/ai_only/english_ai_long.json")
    if ai_long.exists():
        test_configs.append((str(ai_long), "ai_generated"))

    # Human-written texts (should be detected as human)
    human_long = Path("eval/datasets/human_only/english_academic_long.json")
    if human_long.exists():
        test_configs.append((str(human_long), "human_written"))

    if not test_configs:
        print("❌ No datasets found. Please generate samples first.")
        return

    all_results = []

    for dataset_path, expected_source in test_configs:
        results = tester.test_dataset(dataset_path, expected_source, max_samples=args.max_samples)
        tester.print_summary(results)
        all_results.append(results)

    # Save combined results
    if all_results:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f"detect_accuracy_{timestamp}.json"
        tester.save_results(
            {"timestamp": datetime.now().isoformat(), "datasets": all_results}, output_file
        )

    # Print overall summary
    print(f"\n{'=' * 80}")
    print("OVERALL DETECT ACCURACY")
    print(f"{'=' * 80}")

    total_correct = sum(r.get("correct", 0) for r in all_results)
    total_tests = sum(r.get("successful_tests", 0) for r in all_results)

    if total_tests > 0:
        overall_accuracy = total_correct / total_tests
        print(f"Overall accuracy: {overall_accuracy * 100:.1f}% ({total_correct}/{total_tests})")

        if overall_accuracy >= 0.80:
            print("\n✅ OVERALL TEST PASSED")
        else:
            print("\n❌ OVERALL TEST FAILED")

    print(f"{'=' * 80}\n")


if __name__ == "__main__":
    main()
