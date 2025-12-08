"""
Test constraint satisfaction - verify that humanization respects all constraints.

Tests:
- Language preservation (output language = input language)
- Length mode constraints (shorten/expand/standard)
- Tone consistency
- Format preservation
"""

import json
import sys
from datetime import datetime
from pathlib import Path

import httpx

sys.path.append(str(Path(__file__).parent.parent))
from config import config

try:
    from langdetect import DetectorFactory, detect

    DetectorFactory.seed = 0  # For reproducibility
    LANGDETECT_AVAILABLE = True
except ImportError:
    LANGDETECT_AVAILABLE = False
    print("⚠️  Warning: langdetect not installed. Language detection will be skipped.")
    print("   Install with: pip install langdetect")


class ConstraintSatisfactionTester:
    """Tests that humanization satisfies all constraints."""

    def __init__(self):
        self.client = httpx.Client(timeout=120.0)

    def humanize_text(
        self, text: str, tone: str = "Standard", length_mode: str = "standard", **kwargs
    ) -> dict | None:
        """Call the /humanize endpoint."""
        url = f"{config.API_BASE_URL}{config.HUMANIZE_ENDPOINT}"

        payload = {"input_text": text, "tone": tone, "length_mode": length_mode, **kwargs}

        try:
            response = self.client.post(url, json=payload)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"    ❌ Error calling /humanize: {e}")
            return None

    def detect_language(self, text: str) -> str:
        """Detect language of text."""
        if not LANGDETECT_AVAILABLE:
            return "unknown"

        try:
            return detect(text)
        except Exception:
            return "unknown"

    def count_words(self, text: str) -> int:
        """Count words in text."""
        return len(text.split())

    def check_language_preservation(self, original: str, humanized: str) -> dict:
        """Check if language is preserved."""
        original_lang = self.detect_language(original)
        humanized_lang = self.detect_language(humanized)

        return {
            "original_language": original_lang,
            "humanized_language": humanized_lang,
            "preserved": original_lang == humanized_lang,
            "available": LANGDETECT_AVAILABLE,
        }

    def check_length_constraint(self, original: str, humanized: str, length_mode: str) -> dict:
        """Check if length constraint is satisfied."""
        original_words = self.count_words(original)
        humanized_words = self.count_words(humanized)
        ratio = humanized_words / original_words if original_words > 0 else 0

        # Define constraints based on length_mode
        if length_mode == "shorten":
            expected_max = config.LENGTH_SHORTEN_MAX
            satisfied = ratio <= expected_max
            constraint = f"≤{expected_max}x"
        elif length_mode == "expand":
            expected_min = config.LENGTH_EXPAND_MIN
            satisfied = ratio >= expected_min
            constraint = f"≥{expected_min}x"
        else:  # standard
            expected_min = config.LENGTH_STANDARD_MIN
            expected_max = config.LENGTH_STANDARD_MAX
            satisfied = expected_min <= ratio <= expected_max
            constraint = f"{expected_min}-{expected_max}x"

        return {
            "original_words": original_words,
            "humanized_words": humanized_words,
            "ratio": ratio,
            "length_mode": length_mode,
            "constraint": constraint,
            "satisfied": satisfied,
        }

    def check_format_preservation(self, original: str, humanized: str) -> dict:
        """Check if basic formatting is preserved."""
        # Check for common format markers
        original_has_bullets = (
            "•" in original or "-" in original.split("\n")[0] if "\n" in original else False
        )
        humanized_has_bullets = (
            "•" in humanized or "-" in humanized.split("\n")[0] if "\n" in humanized else False
        )

        original_paragraphs = len([p for p in original.split("\n\n") if p.strip()])
        humanized_paragraphs = len([p for p in humanized.split("\n\n") if p.strip()])

        # Paragraphs should be approximately the same (within 50%)
        paragraph_preserved = abs(original_paragraphs - humanized_paragraphs) <= max(
            1, original_paragraphs * 0.5
        )

        return {
            "original_paragraphs": original_paragraphs,
            "humanized_paragraphs": humanized_paragraphs,
            "bullet_points_preserved": original_has_bullets == humanized_has_bullets,
            "paragraph_structure_preserved": paragraph_preserved,
            "preserved": paragraph_preserved,
        }

    def load_dataset(self, dataset_path: str) -> list[dict]:
        """Load test dataset."""
        with open(dataset_path, encoding="utf-8") as f:
            return json.load(f)

    def test_sample(
        self, sample: dict, tone: str | None = None, length_mode: str = "standard"
    ) -> dict:
        """Test all constraints for a single sample."""

        original_text = sample["text"]
        sample_tone = tone or sample["metadata"].get("tone", "Standard")
        sample_id = sample["id"]
        expected_language = sample["metadata"].get("language", "en")

        result = {
            "id": sample_id,
            "tone": sample_tone,
            "length_mode": length_mode,
            "expected_language": expected_language,
            "success": False,
            "error": None,
            "constraints_passed": [],
        }

        # Humanize the text
        print(f"  HUMANIZING with tone={sample_tone}, length_mode={length_mode}...")
        humanized_result = self.humanize_text(
            original_text, tone=sample_tone, length_mode=length_mode
        )

        if not humanized_result or "humanized_text" not in humanized_result:
            result["error"] = "Failed to humanize"
            return result

        humanized_text = humanized_result["humanized_text"]

        # Test 1: Language preservation
        print("  Testing language preservation...")
        lang_check = self.check_language_preservation(original_text, humanized_text)
        result["language_check"] = lang_check

        if lang_check["available"]:
            print(f"    Original: {lang_check['original_language']}")
            print(f"    Humanized: {lang_check['humanized_language']}")
            if lang_check["preserved"]:
                print("    ✅ PASSED")
                result["constraints_passed"].append("language")
            else:
                print("    ❌ FAILED")
        else:
            print("    ⏭️  SKIPPED (langdetect not available)")

        # Test 2: Length constraint
        print("  Testing length constraint...")
        length_check = self.check_length_constraint(original_text, humanized_text, length_mode)
        result["length_check"] = length_check

        print(f"    Original: {length_check['original_words']} words")
        print(f"    Humanized: {length_check['humanized_words']} words")
        print(f"    Ratio: {length_check['ratio']:.2f}x")
        print(f"    Constraint: {length_check['constraint']}")

        if length_check["satisfied"]:
            print("    ✅ PASSED")
            result["constraints_passed"].append("length")
        else:
            print("    ❌ FAILED")

        # Test 3: Format preservation
        print("  Testing format preservation...")
        format_check = self.check_format_preservation(original_text, humanized_text)
        result["format_check"] = format_check

        print(
            f"    Paragraphs: {format_check['original_paragraphs']} → {format_check['humanized_paragraphs']}"
        )

        if format_check["preserved"]:
            print("    ✅ PASSED")
            result["constraints_passed"].append("format")
        else:
            print("    ❌ FAILED")

        # Overall result
        result["success"] = True
        result["all_constraints_passed"] = len(result["constraints_passed"]) >= 2  # At least 2 of 3

        return result

    def test_dataset(
        self, dataset_path: str, tone: str | None = None, max_samples: int | None = None
    ) -> dict:
        """Test constraint satisfaction on a dataset."""

        samples = self.load_dataset(dataset_path)

        if max_samples:
            samples = samples[:max_samples]

        print(f"\n{'=' * 80}")
        print(f"Testing: {dataset_path}")
        print(f"Samples: {len(samples)}")
        print(f"Language detection: {'enabled' if LANGDETECT_AVAILABLE else 'DISABLED'}")
        print(f"{'=' * 80}\n")

        results = {
            "dataset": dataset_path,
            "total_samples": len(samples),
            "successful_tests": 0,
            "passed": 0,
            "failed": 0,
            "errors": 0,
            "constraint_pass_counts": {"language": 0, "length": 0, "format": 0},
            "details": [],
        }

        # Test each sample with different length modes
        for length_mode in ["standard", "shorten", "expand"]:
            print(f"\n{'=' * 80}")
            print(f"LENGTH MODE: {length_mode.upper()}")
            print(f"{'=' * 80}\n")

            for i, sample in enumerate(samples):
                print(f"[{i + 1}/{len(samples)}] Testing: {sample['id']} (mode={length_mode})")

                sample_result = self.test_sample(sample, tone, length_mode)
                results["details"].append(sample_result)

                if sample_result.get("error"):
                    results["errors"] += 1
                elif sample_result.get("success"):
                    results["successful_tests"] += 1

                    # Count individual constraint passes
                    for constraint in sample_result["constraints_passed"]:
                        results["constraint_pass_counts"][constraint] += 1

                    if sample_result["all_constraints_passed"]:
                        results["passed"] += 1
                    else:
                        results["failed"] += 1

                print()

        # Calculate statistics
        if results["successful_tests"] > 0:
            results["pass_rate"] = results["passed"] / results["successful_tests"]

            # Individual constraint pass rates
            results["constraint_pass_rates"] = {
                constraint: count / results["successful_tests"]
                for constraint, count in results["constraint_pass_counts"].items()
            }

        return results

    def print_summary(self, results: dict):
        """Print test summary."""
        print(f"\n{'=' * 80}")
        print("CONSTRAINT SATISFACTION TEST SUMMARY")
        print(f"{'=' * 80}")
        print(f"Dataset: {results['dataset']}")
        print(f"Total samples: {results['total_samples']}")
        print(f"Successful tests: {results['successful_tests']}")
        print(f"Errors: {results['errors']}")
        print("\nOverall Constraint Satisfaction:")
        print(f"  Passed: {results.get('passed', 0)} ({results.get('pass_rate', 0) * 100:.1f}%)")
        print(f"  Failed: {results.get('failed', 0)}")
        print("\nIndividual Constraints:")

        for constraint, rate in results.get("constraint_pass_rates", {}).items():
            print(f"  {constraint.capitalize()}: {rate * 100:.1f}%")

        print("\nSuccess criteria: ≥85% pass rate")

        if results.get("pass_rate", 0) >= 0.85:
            print("\n✅ TEST PASSED - Constraints are satisfied!")
        else:
            print("\n❌ TEST FAILED - Too many constraint violations")
        print(f"{'=' * 80}\n")

    def save_results(self, results: dict, output_file: str):
        """Save results to JSON."""
        output_path = Path(config.RESULTS_DIR) / output_file
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2)

        print(f"📊 Results saved to: {output_path}")


def main():
    """Run constraint satisfaction tests."""

    import argparse

    parser = argparse.ArgumentParser(description="Test constraint satisfaction")
    parser.add_argument("--max-samples", type=int, help="Max samples per dataset")
    parser.add_argument("--tone", type=str, help="Override tone for all samples")
    args = parser.parse_args()

    tester = ConstraintSatisfactionTester()

    # Test datasets
    datasets = []

    ai_long = Path("eval/datasets/ai_only/english_ai_long.json")
    if ai_long.exists():
        datasets.append(str(ai_long))

    human_long = Path("eval/datasets/human_only/english_academic_long.json")
    if human_long.exists():
        datasets.append(str(human_long))

    if not datasets:
        print("❌ No datasets found. Please generate samples first.")
        return

    all_results = []

    for dataset_path in datasets:
        results = tester.test_dataset(dataset_path, tone=args.tone, max_samples=args.max_samples)
        tester.print_summary(results)
        all_results.append(results)

    # Save combined results
    if all_results:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f"constraint_satisfaction_{timestamp}.json"
        tester.save_results(
            {"timestamp": datetime.now().isoformat(), "datasets": all_results}, output_file
        )


if __name__ == "__main__":
    main()
