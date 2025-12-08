"""
Run all evaluation tests in sequence.

This is the main entry point for running the complete evaluation suite.
"""

import sys
from datetime import datetime
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

# Import test modules
from test_detect_accuracy import DetectAccuracyTester
from test_detector_passrate import DetectorPassRateTester
from test_semantic_preservation import SemanticPreservationTester
from test_style_adherence import StyleAdherenceTester

# Import new test modules
try:
    from test_fluency_readability import (
        FluencyReadabilityTester,  # type: ignore[reportAttributeAccessIssue]
    )

    FLUENCY_AVAILABLE = True
except ImportError:
    FLUENCY_AVAILABLE = False
    print("⚠️  Fluency tests not available (missing dependencies)")

try:
    from test_constraint_satisfaction import ConstraintSatisfactionTester

    CONSTRAINT_AVAILABLE = True
except ImportError:
    CONSTRAINT_AVAILABLE = False
    print("⚠️  Constraint tests not available (missing dependencies)")

try:
    from test_adversarial_robustness import AdversarialRobustnessTester

    ADVERSARIAL_AVAILABLE = True
except ImportError:
    ADVERSARIAL_AVAILABLE = False
    print("⚠️  Adversarial tests not available")

try:
    from test_ensemble_calibration import EnsembleCalibrationTester

    ENSEMBLE_AVAILABLE = True
except ImportError:
    ENSEMBLE_AVAILABLE = False
    print("⚠️  Ensemble calibration tests not available (missing scikit-learn)")


def print_header(title: str):
    """Print a formatted header."""
    print(f"\n{'=' * 80}")
    print(f"{title:^80}")
    print(f"{'=' * 80}\n")


def main():
    """Run all evaluation tests."""

    import argparse

    parser = argparse.ArgumentParser(description="Run all evaluation tests")
    parser.add_argument("--max-samples", type=int, help="Max samples per dataset")
    parser.add_argument(
        "--skip-detector-passrate",
        action="store_true",
        help="Skip detector pass-rate test (saves API calls)",
    )
    parser.add_argument(
        "--extended",
        action="store_true",
        help="Run extended test suite (fluency, constraints, adversarial, ensemble)",
    )
    args = parser.parse_args()

    start_time = datetime.now()

    print_header("HUMANIZE/DETECT EVALUATION SUITE")
    print(f"Started at: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Max samples per dataset: {args.max_samples or 'unlimited'}\n")

    results_summary = {"timestamp": start_time.isoformat(), "tests": []}

    # Check if datasets exist
    ai_dataset = Path("eval/datasets/ai_only/english_ai_long.json")
    human_dataset = Path("eval/datasets/human_only/english_academic_long.json")

    if not ai_dataset.exists() and not human_dataset.exists():
        print("❌ ERROR: No datasets found!")
        print("\nPlease run one of the following first:")
        print("  1. python eval/scripts/generate_ai_samples.py")
        print("  2. Or ensure datasets exist in eval/datasets/")
        return

    # Test 1: /detect Accuracy
    print_header("TEST 1: /detect ACCURACY")
    print("Testing whether /detect correctly identifies AI vs human text\n")

    try:
        detect_tester = DetectAccuracyTester()

        test_configs = []
        if ai_dataset.exists():
            test_configs.append((str(ai_dataset), "ai_generated"))
        if human_dataset.exists():
            test_configs.append((str(human_dataset), "human_written"))

        detect_results = []
        for dataset_path, expected_source in test_configs:
            result = detect_tester.test_dataset(
                dataset_path, expected_source, max_samples=args.max_samples
            )
            detect_tester.print_summary(result)
            detect_results.append(result)

        # Calculate overall accuracy
        total_correct = sum(r.get("correct", 0) for r in detect_results)
        total_tests = sum(r.get("successful_tests", 0) for r in detect_results)
        overall_accuracy = total_correct / total_tests if total_tests > 0 else 0

        results_summary["tests"].append(
            {
                "name": "detect_accuracy",
                "status": "passed" if overall_accuracy >= 0.80 else "failed",
                "accuracy": overall_accuracy,
                "details": detect_results,
            }
        )

    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        results_summary["tests"].append(
            {"name": "detect_accuracy", "status": "error", "error": str(e)}
        )

    # Test 2: Semantic Preservation
    print_header("TEST 2: SEMANTIC PRESERVATION")
    print("Testing whether /humanize preserves meaning\n")

    try:
        semantic_tester = SemanticPreservationTester()

        datasets = []
        if human_dataset.exists():
            datasets.append(str(human_dataset))
        if ai_dataset.exists():
            datasets.append(str(ai_dataset))

        semantic_results = []
        for dataset_path in datasets:
            result = semantic_tester.test_dataset(dataset_path)
            semantic_tester.print_summary(result)
            semantic_results.append(result)

        # Calculate overall pass rate
        total_passed = sum(r.get("passed", 0) for r in semantic_results)
        total_tests = sum(r.get("total_samples", 0) for r in semantic_results)
        overall_pass_rate = total_passed / total_tests if total_tests > 0 else 0

        results_summary["tests"].append(
            {
                "name": "semantic_preservation",
                "status": "passed" if overall_pass_rate >= 0.85 else "failed",
                "pass_rate": overall_pass_rate,
                "details": semantic_results,
            }
        )

    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        results_summary["tests"].append(
            {"name": "semantic_preservation", "status": "error", "error": str(e)}
        )

    # Test 3: Style Adherence
    print_header("TEST 3: STYLE ADHERENCE")
    print("Testing whether /humanize follows requested tone/style\n")

    try:
        style_tester = StyleAdherenceTester()

        datasets = []
        if ai_dataset.exists():
            datasets.append(str(ai_dataset))
        if human_dataset.exists():
            datasets.append(str(human_dataset))

        style_results = []
        for dataset_path in datasets:
            result = style_tester.test_dataset(
                dataset_path,
                use_style_sample=False,  # Can enable if style samples exist
                max_samples=args.max_samples,
            )
            style_tester.print_summary(result)
            style_results.append(result)

        # Calculate overall pass rate
        total_passed = sum(r.get("passed", 0) for r in style_results)
        total_tests = sum(r.get("successful_tests", 0) for r in style_results)
        overall_pass_rate = total_passed / total_tests if total_tests > 0 else 0

        results_summary["tests"].append(
            {
                "name": "style_adherence",
                "status": "passed" if overall_pass_rate >= 0.75 else "failed",
                "pass_rate": overall_pass_rate,
                "details": style_results,
            }
        )

    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        results_summary["tests"].append(
            {"name": "style_adherence", "status": "error", "error": str(e)}
        )

    # Test 4: Detector Pass-Rate (can be slow/expensive)
    if not args.skip_detector_passrate:
        print_header("TEST 4: DETECTOR PASS-RATE")
        print("Testing whether humanization reduces AI detection scores\n")
        print("⚠️  WARNING: This test makes external API calls and may be slow/expensive\n")

        try:
            passrate_tester = DetectorPassRateTester()

            datasets = []
            if ai_dataset.exists():
                datasets.append(str(ai_dataset))

            passrate_results = []
            for dataset_path in datasets:
                result = passrate_tester.test_dataset(
                    dataset_path,
                    max_samples=args.max_samples or 3,  # Default to 3 for cost control
                )
                passrate_tester.print_summary(result)
                passrate_results.append(result)

            # Calculate overall pass rate
            total_passed = sum(r.get("passed_threshold", 0) for r in passrate_results)
            total_tests = sum(r.get("successful_tests", 0) for r in passrate_results)
            overall_pass_rate = total_passed / total_tests if total_tests > 0 else 0

            results_summary["tests"].append(
                {
                    "name": "detector_passrate",
                    "status": "passed" if overall_pass_rate >= 0.75 else "failed",
                    "pass_rate": overall_pass_rate,
                    "details": passrate_results,
                }
            )

        except Exception as e:
            print(f"❌ Test failed with error: {e}")
            results_summary["tests"].append(
                {"name": "detector_passrate", "status": "error", "error": str(e)}
            )
    else:
        print_header("TEST 4: DETECTOR PASS-RATE")
        print("⏭️  SKIPPED (use --skip-detector-passrate=false to run)\n")
        results_summary["tests"].append({"name": "detector_passrate", "status": "skipped"})

    # Extended Tests (if requested)
    if args.extended:
        # Test 5: Fluency & Readability
        if FLUENCY_AVAILABLE:
            print_header("TEST 5: FLUENCY & READABILITY")
            print("Testing grammar and readability preservation\n")

            try:
                # Type ignore: FLUENCY_AVAILABLE ensures FluencyReadabilityTester is available
                fluency_tester = FluencyReadabilityTester()  # type: ignore[reportOptionalCall]

                datasets = []
                if ai_dataset.exists():
                    datasets.append(str(ai_dataset))
                if human_dataset.exists():
                    datasets.append(str(human_dataset))

                fluency_results = []
                for dataset_path in datasets:
                    result = fluency_tester.test_dataset(dataset_path, max_samples=args.max_samples)
                    fluency_tester.print_summary(result)
                    fluency_results.append(result)

                total_passed = sum(r.get("passed", 0) for r in fluency_results)
                total_tests = sum(r.get("successful_tests", 0) for r in fluency_results)
                overall_pass_rate = total_passed / total_tests if total_tests > 0 else 0

                results_summary["tests"].append(
                    {
                        "name": "fluency_readability",
                        "status": "passed" if overall_pass_rate >= 0.85 else "failed",
                        "pass_rate": overall_pass_rate,
                        "details": fluency_results,
                    }
                )

            except Exception as e:
                print(f"❌ Test failed with error: {e}")
                results_summary["tests"].append(
                    {"name": "fluency_readability", "status": "error", "error": str(e)}
                )

        # Test 6: Constraint Satisfaction
        if CONSTRAINT_AVAILABLE:
            print_header("TEST 6: CONSTRAINT SATISFACTION")
            print("Testing language preservation and constraint adherence\n")

            try:
                constraint_tester = ConstraintSatisfactionTester()

                datasets = []
                if ai_dataset.exists():
                    datasets.append(str(ai_dataset))
                if human_dataset.exists():
                    datasets.append(str(human_dataset))

                constraint_results = []
                for dataset_path in datasets:
                    result = constraint_tester.test_dataset(
                        dataset_path,
                        max_samples=args.max_samples or 2,  # Fewer samples for constraint tests
                    )
                    constraint_tester.print_summary(result)
                    constraint_results.append(result)

                total_passed = sum(r.get("passed", 0) for r in constraint_results)
                total_tests = sum(r.get("successful_tests", 0) for r in constraint_results)
                overall_pass_rate = total_passed / total_tests if total_tests > 0 else 0

                results_summary["tests"].append(
                    {
                        "name": "constraint_satisfaction",
                        "status": "passed" if overall_pass_rate >= 0.85 else "failed",
                        "pass_rate": overall_pass_rate,
                        "details": constraint_results,
                    }
                )

            except Exception as e:
                print(f"❌ Test failed with error: {e}")
                results_summary["tests"].append(
                    {"name": "constraint_satisfaction", "status": "error", "error": str(e)}
                )

        # Test 7: Adversarial & Robustness
        if ADVERSARIAL_AVAILABLE:
            print_header("TEST 7: ADVERSARIAL & ROBUSTNESS")
            print("Testing edge cases and adversarial scenarios\n")

            try:
                adversarial_tester = AdversarialRobustnessTester()

                result = adversarial_tester.test_dataset(
                    ai_dataset_path=str(ai_dataset) if ai_dataset.exists() else None,
                    human_dataset_path=str(human_dataset) if human_dataset.exists() else None,
                    max_samples=args.max_samples or 2,
                )
                adversarial_tester.print_summary(result)

                # Check if tests passed based on results
                tests = result.get("tests", {})
                humanized_ai = tests.get("humanized_ai_detection", {})
                human_pres = tests.get("human_preservation", {})

                evasion_rate = humanized_ai.get("evasion_rate", 0)
                preservation_rate = human_pres.get("preservation_rate", 0)

                passed = evasion_rate >= 0.60 and preservation_rate >= 0.80

                results_summary["tests"].append(
                    {
                        "name": "adversarial_robustness",
                        "status": "passed" if passed else "failed",
                        "evasion_rate": evasion_rate,
                        "preservation_rate": preservation_rate,
                        "details": result,
                    }
                )

            except Exception as e:
                print(f"❌ Test failed with error: {e}")
                results_summary["tests"].append(
                    {"name": "adversarial_robustness", "status": "error", "error": str(e)}
                )

        # Test 8: Ensemble Calibration
        if ENSEMBLE_AVAILABLE:
            print_header("TEST 8: ENSEMBLE CALIBRATION")
            print("Testing /detect calibration metrics\n")

            try:
                ensemble_tester = EnsembleCalibrationTester()

                result = ensemble_tester.test_calibration(
                    ai_dataset_path=str(ai_dataset) if ai_dataset.exists() else None,
                    human_dataset_path=str(human_dataset) if human_dataset.exists() else None,
                    max_samples=args.max_samples,
                )
                ensemble_tester.print_summary(result)

                # Check if calibration is good
                metrics = result.get("metrics", {})
                accuracy = metrics.get("accuracy", 0)
                roc_auc = metrics.get("roc_auc", 0)

                passed = accuracy >= 0.80 and (not roc_auc or roc_auc >= 0.85)

                results_summary["tests"].append(
                    {
                        "name": "ensemble_calibration",
                        "status": "passed" if passed else "failed",
                        "accuracy": accuracy,
                        "roc_auc": roc_auc,
                        "details": result,
                    }
                )

            except Exception as e:
                print(f"❌ Test failed with error: {e}")
                results_summary["tests"].append(
                    {"name": "ensemble_calibration", "status": "error", "error": str(e)}
                )

    # Final Summary
    end_time = datetime.now()
    duration = end_time - start_time

    print_header("FINAL SUMMARY")
    print(f"Completed at: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Duration: {duration.total_seconds():.1f} seconds\n")

    passed_tests = sum(1 for t in results_summary["tests"] if t["status"] == "passed")
    failed_tests = sum(1 for t in results_summary["tests"] if t["status"] == "failed")
    error_tests = sum(1 for t in results_summary["tests"] if t["status"] == "error")
    skipped_tests = sum(1 for t in results_summary["tests"] if t["status"] == "skipped")

    print("Test Results:")
    for test in results_summary["tests"]:
        status_emoji = {"passed": "✅", "failed": "❌", "error": "🔴", "skipped": "⏭️"}[
            test["status"]
        ]

        print(f"  {status_emoji} {test['name']}: {test['status'].upper()}")
        if "pass_rate" in test:
            print(f"      Pass rate: {test['pass_rate'] * 100:.1f}%")
        elif "accuracy" in test:
            print(f"      Accuracy: {test['accuracy'] * 100:.1f}%")

    print(
        f"\nOverall: {passed_tests} passed, {failed_tests} failed, {error_tests} errors, {skipped_tests} skipped"
    )

    # Save results
    import json

    from config import config

    output_path = (
        Path(config.RESULTS_DIR) / f"full_eval_{start_time.strftime('%Y%m%d_%H%M%S')}.json"
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results_summary, f, indent=2)

    print(f"\n📊 Full results saved to: {output_path}")

    # Exit code
    if failed_tests > 0 or error_tests > 0:
        print("\n❌ SOME TESTS FAILED")
        sys.exit(1)
    else:
        print("\n✅ ALL TESTS PASSED")
        sys.exit(0)


if __name__ == "__main__":
    main()
