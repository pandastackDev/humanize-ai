"""
Multi-language test matrix runner.

Tests all combinations of:
- Languages (Tier 1: EN, ES, ZH, HI, AR)
- Tones (all 8 supported tones)
- Length modes (standard, shorten, expand)

Provides comprehensive coverage across the test matrix.
"""

import json
import sys
from datetime import datetime
from pathlib import Path

import httpx

sys.path.append(str(Path(__file__).parent.parent))
from config import config


class MultiLanguageMatrixTester:
    """Tests all language/tone/length_mode combinations."""

    def __init__(self):
        self.client = httpx.Client(timeout=120.0)

        # Test matrix dimensions
        self.tier1_languages = config.TIER1_LANGUAGES
        self.tones = config.SUPPORTED_TONES
        self.length_modes = ["standard", "shorten", "expand"]

        # Calculate total test cases
        self.total_combinations = (
            len(self.tier1_languages) * len(self.tones) * len(self.length_modes)
        )

    def humanize_text(
        self, text: str, tone: str = "Standard", length_mode: str = "standard"
    ) -> dict:
        """Call the /humanize endpoint."""
        url = f"{config.API_BASE_URL}{config.HUMANIZE_ENDPOINT}"

        payload = {"input_text": text, "tone": tone, "length_mode": length_mode}

        try:
            response = self.client.post(url, json=payload)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"error": str(e)}

    def detect_text(self, text: str) -> dict:
        """Call the /detect endpoint."""
        url = f"{config.API_BASE_URL}{config.DETECT_ENDPOINT}"

        payload = {"text": text}

        try:
            response = self.client.post(url, json=payload)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"error": str(e)}

    def count_words(self, text: str) -> int:
        """Count words in text."""
        return len(text.split())

    def load_dataset(self, dataset_path: str) -> list[dict]:
        """Load test dataset."""
        with open(dataset_path, encoding="utf-8") as f:
            return json.load(f)

    def test_combination(
        self, text: str, language: str, tone: str, length_mode: str, test_detect: bool = True
    ) -> dict:
        """
        Test a single combination of language/tone/length_mode.

        Returns test result with metrics.
        """

        result = {
            "language": language,
            "tone": tone,
            "length_mode": length_mode,
            "success": False,
            "humanize_success": False,
            "detect_success": False,
            "errors": [],
        }

        original_words = self.count_words(text)

        # Step 1: Humanize
        humanized_result = self.humanize_text(text, tone, length_mode)

        if "error" in humanized_result:
            result["errors"].append(f"Humanize failed: {humanized_result['error']}")
            return result

        if "humanized_text" not in humanized_result:
            result["errors"].append("No humanized_text in response")
            return result

        humanized_text = humanized_result["humanized_text"]
        humanized_words = self.count_words(humanized_text)

        result["humanize_success"] = True
        result["original_words"] = original_words
        result["humanized_words"] = humanized_words
        result["length_ratio"] = humanized_words / original_words if original_words > 0 else 0

        # Check length constraint
        if length_mode == "shorten":
            expected_max = config.LENGTH_SHORTEN_MAX
            result["length_constraint_met"] = result["length_ratio"] <= expected_max
        elif length_mode == "expand":
            expected_min = config.LENGTH_EXPAND_MIN
            result["length_constraint_met"] = result["length_ratio"] >= expected_min
        else:  # standard
            expected_min = config.LENGTH_STANDARD_MIN
            expected_max = config.LENGTH_STANDARD_MAX
            result["length_constraint_met"] = expected_min <= result["length_ratio"] <= expected_max

        # Step 2: Detect (if requested)
        if test_detect:
            original_detection = self.detect_text(text)

            if "error" in original_detection:
                result["errors"].append(f"Detect original failed: {original_detection['error']}")
            else:
                result["original_human_likelihood"] = original_detection.get(
                    "human_likelihood_pct", 0
                )

                # Detect humanized
                humanized_detection = self.detect_text(humanized_text)

                if "error" in humanized_detection:
                    result["errors"].append(
                        f"Detect humanized failed: {humanized_detection['error']}"
                    )
                else:
                    result["humanized_human_likelihood"] = humanized_detection.get(
                        "human_likelihood_pct", 0
                    )
                    result["detect_delta"] = (
                        result["humanized_human_likelihood"] - result["original_human_likelihood"]
                    )
                    result["detect_success"] = True

        # Overall success
        result["success"] = result["humanize_success"] and (
            not test_detect or result["detect_success"]
        )

        return result

    def run_matrix_test(
        self,
        samples_per_language: dict[str, str] | None = None,
        test_detect: bool = False,  # Detect is slow, optional
        sample_tones: list[str] | None = None,
        sample_length_modes: list[str] | None = None,
    ) -> dict:
        """
        Run full matrix test.

        Args:
            samples_per_language: Dict mapping language code to dataset path
            test_detect: Whether to test detection (slow)
            sample_tones: Subset of tones to test (None = all)
            sample_length_modes: Subset of length modes to test (None = all)
        """

        print(f"\n{'=' * 80}")
        print("MULTI-LANGUAGE TEST MATRIX")
        print(f"{'=' * 80}\n")

        # Use provided samples or defaults
        if samples_per_language is None:
            samples_per_language = self._get_default_samples()

        tones_to_test = sample_tones or self.tones
        length_modes_to_test = sample_length_modes or self.length_modes

        total_tests = len(samples_per_language) * len(tones_to_test) * len(length_modes_to_test)

        print(f"Languages: {len(samples_per_language)}")
        print(f"Tones: {len(tones_to_test)}")
        print(f"Length modes: {len(length_modes_to_test)}")
        print(f"Total combinations: {total_tests}")
        print(f"Detection testing: {'enabled' if test_detect else 'DISABLED'}")
        print()

        results = {
            "timestamp": datetime.now().isoformat(),
            "matrix_dimensions": {
                "languages": list(samples_per_language.keys()),
                "tones": tones_to_test,
                "length_modes": length_modes_to_test,
            },
            "total_tests": total_tests,
            "successful_tests": 0,
            "failed_tests": 0,
            "test_results": [],
            "summary_by_language": {},
            "summary_by_tone": {},
            "summary_by_length_mode": {},
        }

        test_num = 0

        # Iterate through matrix
        for language, dataset_path in samples_per_language.items():
            print(f"\n{'=' * 80}")
            print(f"LANGUAGE: {language.upper()}")
            print(f"{'=' * 80}\n")

            # Load sample for this language
            if not Path(dataset_path).exists():
                print(f"⚠️  Dataset not found: {dataset_path}")
                continue

            samples = self.load_dataset(dataset_path)
            if not samples:
                print("⚠️  No samples in dataset")
                continue

            # Use first sample
            sample = samples[0]
            text = sample["text"]

            lang_results = {"total": 0, "successful": 0, "failed": 0, "length_constraint_met": 0}

            for tone in tones_to_test:
                for length_mode in length_modes_to_test:
                    test_num += 1

                    print(f"[{test_num}/{total_tests}] {language}/{tone}/{length_mode}...", end=" ")

                    test_result = self.test_combination(
                        text=text,
                        language=language,
                        tone=tone,
                        length_mode=length_mode,
                        test_detect=test_detect,
                    )

                    results["test_results"].append(test_result)
                    lang_results["total"] += 1

                    if test_result["success"]:
                        results["successful_tests"] += 1
                        lang_results["successful"] += 1

                        if test_result.get("length_constraint_met"):
                            lang_results["length_constraint_met"] += 1

                        # Print summary
                        ratio = test_result.get("length_ratio", 0)
                        print(f"✅ {ratio:.2f}x", end="")

                        if test_detect and "detect_delta" in test_result:
                            delta = test_result["detect_delta"]
                            print(f", Δ{delta:+.1f}%", end="")

                        print()
                    else:
                        results["failed_tests"] += 1
                        lang_results["failed"] += 1
                        errors = ", ".join(test_result.get("errors", ["Unknown"]))
                        print(f"❌ {errors}")

            results["summary_by_language"][language] = lang_results
            print(
                f"\nLanguage {language} summary: {lang_results['successful']}/{lang_results['total']} successful"
            )

        # Aggregate by tone and length_mode
        for result in results["test_results"]:
            tone = result["tone"]
            length_mode = result["length_mode"]

            if tone not in results["summary_by_tone"]:
                results["summary_by_tone"][tone] = {"total": 0, "successful": 0}
            results["summary_by_tone"][tone]["total"] += 1
            if result["success"]:
                results["summary_by_tone"][tone]["successful"] += 1

            if length_mode not in results["summary_by_length_mode"]:
                results["summary_by_length_mode"][length_mode] = {"total": 0, "successful": 0}
            results["summary_by_length_mode"][length_mode]["total"] += 1
            if result["success"]:
                results["summary_by_length_mode"][length_mode]["successful"] += 1

        return results

    def _get_default_samples(self) -> dict[str, str]:
        """Get default sample paths for each tier 1 language."""
        samples = {}

        language_map = {
            "en": "english_academic_long.json",
            "es": "spanish_academic_long.json",
            "zh": "chinese_academic_long.json",
            "hi": "hindi_academic_long.json",
            "ar": "arabic_academic_long.json",
        }

        for lang_code, filename in language_map.items():
            # Try AI dataset first, then human
            ai_path = f"eval/datasets/ai_only/{filename}"
            human_path = f"eval/datasets/human_only/{filename}"

            if Path(ai_path).exists():
                samples[lang_code] = ai_path
            elif Path(human_path).exists():
                samples[lang_code] = human_path

        return samples

    def print_summary(self, results: dict):
        """Print test summary."""
        print(f"\n{'=' * 80}")
        print("MULTI-LANGUAGE MATRIX TEST SUMMARY")
        print(f"{'=' * 80}")

        print("\nOverall Results:")
        print(f"  Total tests: {results['total_tests']}")
        print(f"  Successful: {results['successful_tests']}")
        print(f"  Failed: {results['failed_tests']}")

        if results["total_tests"] > 0:
            success_rate = results["successful_tests"] / results["total_tests"]
            print(f"  Success rate: {success_rate * 100:.1f}%")

        print("\nBy Language:")
        for language, stats in results["summary_by_language"].items():
            success_rate = stats["successful"] / stats["total"] if stats["total"] > 0 else 0
            constraint_rate = (
                stats["length_constraint_met"] / stats["successful"]
                if stats["successful"] > 0
                else 0
            )
            print(
                f"  {language.upper()}: {stats['successful']}/{stats['total']} "
                f"({success_rate * 100:.1f}% success, {constraint_rate * 100:.1f}% constraints met)"
            )

        print("\nBy Tone:")
        for tone, stats in results["summary_by_tone"].items():
            success_rate = stats["successful"] / stats["total"] if stats["total"] > 0 else 0
            print(f"  {tone}: {stats['successful']}/{stats['total']} ({success_rate * 100:.1f}%)")

        print("\nBy Length Mode:")
        for mode, stats in results["summary_by_length_mode"].items():
            success_rate = stats["successful"] / stats["total"] if stats["total"] > 0 else 0
            print(f"  {mode}: {stats['successful']}/{stats['total']} ({success_rate * 100:.1f}%)")

        # Overall assessment
        overall_success_rate = (
            results["successful_tests"] / results["total_tests"]
            if results["total_tests"] > 0
            else 0
        )

        print("\nSuccess Criteria: ≥85% overall success rate")

        if overall_success_rate >= 0.85:
            print("\n✅ TEST PASSED - Matrix coverage is good!")
        else:
            print("\n❌ TEST FAILED - Too many failures in matrix")

        print(f"{'=' * 80}\n")

    def save_results(self, results: dict, output_file: str):
        """Save results to JSON."""
        output_path = Path(config.RESULTS_DIR) / output_file
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2)

        print(f"📊 Results saved to: {output_path}")


def main():
    """Run multi-language matrix tests."""

    import argparse

    parser = argparse.ArgumentParser(description="Run multi-language test matrix")
    parser.add_argument("--test-detect", action="store_true", help="Also test detection (slow)")
    parser.add_argument("--sample-tones", nargs="+", help="Sample specific tones (default: all)")
    parser.add_argument(
        "--sample-modes",
        nargs="+",
        choices=["standard", "shorten", "expand"],
        help="Sample specific length modes (default: all)",
    )
    args = parser.parse_args()

    tester = MultiLanguageMatrixTester()

    # Run matrix test
    results = tester.run_matrix_test(
        test_detect=args.test_detect,
        sample_tones=args.sample_tones,
        sample_length_modes=args.sample_modes,
    )

    tester.print_summary(results)

    # Save results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = f"multi_language_matrix_{timestamp}.json"
    tester.save_results(results, output_file)


if __name__ == "__main__":
    main()
