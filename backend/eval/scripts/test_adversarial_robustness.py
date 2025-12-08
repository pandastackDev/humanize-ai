"""
Test adversarial & robustness - verify system handles edge cases correctly.

Tests:
1. Humanized AI → Detect (should still sometimes catch it)
2. Human → Humanize → Detect (should still be mostly human)
3. Multiple rounds of humanization
4. Edge cases: very short, very long, mixed languages, etc.
"""

import json
import sys
from datetime import datetime
from pathlib import Path

import httpx

sys.path.append(str(Path(__file__).parent.parent))
from config import config


class AdversarialRobustnessTester:
    """Tests robustness and adversarial scenarios."""

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
            print(f"    ❌ Error calling /humanize: {e}")
            return None

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

    def test_humanized_ai_detection(self, sample: dict) -> dict:
        """
        Test: AI → Humanize → Detect

        Goal: After humanization, AI text should:
        - Ideally pass as human (≥70% human likelihood)
        - But detector may still catch some patterns

        We track how often it fully evades vs partially evades.
        """

        original_text = sample["text"]
        sample_id = sample["id"]

        result = {
            "id": sample_id,
            "test": "humanized_ai_detection",
            "success": False,
            "error": None,
        }

        # Step 1: Detect original AI text
        print("  Step 1: Detecting ORIGINAL AI text...")
        original_detection = self.detect_text(original_text)

        if not original_detection:
            result["error"] = "Failed to detect original"
            return result

        result["original_human_likelihood"] = original_detection.get("human_likelihood_pct", 0)
        print(f"    Original: {result['original_human_likelihood']:.1f}% human")

        # Step 2: Humanize
        print("  Step 2: HUMANIZING...")
        humanized_result = self.humanize_text(original_text)

        if not humanized_result or "humanized_text" not in humanized_result:
            result["error"] = "Failed to humanize"
            return result

        humanized_text = humanized_result["humanized_text"]

        # Step 3: Detect humanized text
        print("  Step 3: Detecting HUMANIZED text...")
        humanized_detection = self.detect_text(humanized_text)

        if not humanized_detection:
            result["error"] = "Failed to detect humanized"
            return result

        result["humanized_human_likelihood"] = humanized_detection.get("human_likelihood_pct", 0)
        result["delta"] = result["humanized_human_likelihood"] - result["original_human_likelihood"]

        print(f"    Humanized: {result['humanized_human_likelihood']:.1f}% human")
        print(f"    Δ: {result['delta']:+.1f}%")

        # Categorize result
        if result["humanized_human_likelihood"] >= 70:
            result["category"] = "fully_evaded"
            print("    ✅ Fully evaded detection")
        elif result["humanized_human_likelihood"] >= 50:
            result["category"] = "partially_evaded"
            print("    🟡 Partially evaded detection")
        else:
            result["category"] = "still_detected"
            print("    🔴 Still detected as AI")

        result["success"] = True
        return result

    def test_human_preservation(self, sample: dict) -> dict:
        """
        Test: Human → Humanize → Detect

        Goal: Human text should remain human after humanization.
        Success: Human likelihood stays ≥60% (allowing some variation).
        """

        original_text = sample["text"]
        sample_id = sample["id"]

        result = {"id": sample_id, "test": "human_preservation", "success": False, "error": None}

        # Step 1: Detect original human text
        print("  Step 1: Detecting ORIGINAL human text...")
        original_detection = self.detect_text(original_text)

        if not original_detection:
            result["error"] = "Failed to detect original"
            return result

        result["original_human_likelihood"] = original_detection.get("human_likelihood_pct", 0)
        print(f"    Original: {result['original_human_likelihood']:.1f}% human")

        # Step 2: Humanize
        print("  Step 2: HUMANIZING...")
        humanized_result = self.humanize_text(original_text)

        if not humanized_result or "humanized_text" not in humanized_result:
            result["error"] = "Failed to humanize"
            return result

        humanized_text = humanized_result["humanized_text"]

        # Step 3: Detect humanized text
        print("  Step 3: Detecting HUMANIZED text...")
        humanized_detection = self.detect_text(humanized_text)

        if not humanized_detection:
            result["error"] = "Failed to detect humanized"
            return result

        result["humanized_human_likelihood"] = humanized_detection.get("human_likelihood_pct", 0)
        result["delta"] = result["humanized_human_likelihood"] - result["original_human_likelihood"]

        print(f"    Humanized: {result['humanized_human_likelihood']:.1f}% human")
        print(f"    Δ: {result['delta']:+.1f}%")

        # Check if human nature is preserved
        result["preserved"] = result["humanized_human_likelihood"] >= 60

        if result["preserved"]:
            print("    ✅ Human nature preserved")
        else:
            print("    ❌ Human text became too AI-like")

        result["success"] = True
        return result

    def test_multiple_rounds(self, sample: dict, rounds: int = 3) -> dict:
        """
        Test: Text → Humanize → Humanize → Humanize

        Goal: Multiple rounds shouldn't degrade quality excessively.
        """

        original_text = sample["text"]
        sample_id = sample["id"]

        result = {
            "id": sample_id,
            "test": "multiple_rounds",
            "rounds": rounds,
            "success": False,
            "error": None,
            "round_results": [],
        }

        current_text = original_text
        original_words = len(original_text.split())

        print(f"  Original: {original_words} words")

        for round_num in range(1, rounds + 1):
            print(f"\n  Round {round_num}:")

            # Humanize
            humanized_result = self.humanize_text(current_text)

            if not humanized_result or "humanized_text" not in humanized_result:
                result["error"] = f"Failed at round {round_num}"
                return result

            humanized_text = humanized_result["humanized_text"]
            humanized_words = len(humanized_text.split())

            # Detect
            detection = self.detect_text(humanized_text)
            human_likelihood = detection.get("human_likelihood_pct", 0) if detection else 0

            round_result = {
                "round": round_num,
                "word_count": humanized_words,
                "human_likelihood": human_likelihood,
            }
            result["round_results"].append(round_result)

            print(f"    Words: {humanized_words} ({humanized_words / original_words:.2f}x)")
            print(f"    Human likelihood: {human_likelihood:.1f}%")

            current_text = humanized_text

        # Check if quality degrades too much
        final_words = result["round_results"][-1]["word_count"]
        final_likelihood = result["round_results"][-1]["human_likelihood"]

        # Quality should not degrade beyond acceptable bounds
        length_ok = 0.5 <= (final_words / original_words) <= 2.0  # Within 50-200%
        likelihood_ok = final_likelihood >= 40  # Still somewhat human-like

        result["quality_maintained"] = length_ok and likelihood_ok
        result["success"] = True

        if result["quality_maintained"]:
            print(f"\n    ✅ Quality maintained after {rounds} rounds")
        else:
            print(f"\n    ⚠️  Quality degraded after {rounds} rounds")

        return result

    def test_edge_cases(self) -> dict:
        """Test edge cases like very short text, empty text, special characters."""

        edge_cases = [
            {"id": "edge_very_short", "text": "Hello world.", "expected": "should_handle"},
            {"id": "edge_single_word", "text": "Hello", "expected": "should_handle_or_reject"},
            {
                "id": "edge_special_chars",
                "text": "This text has special chars: @#$% and emojis 😀🎉",
                "expected": "should_handle",
            },
            {
                "id": "edge_numbers",
                "text": "The year is 2024 and the price is $99.99 for 5 items.",
                "expected": "should_handle",
            },
        ]

        results = {
            "test": "edge_cases",
            "total": len(edge_cases),
            "handled": 0,
            "failed": 0,
            "details": [],
        }

        print(f"\n{'=' * 80}")
        print("TESTING EDGE CASES")
        print(f"{'=' * 80}\n")

        for case in edge_cases:
            print(f"Testing: {case['id']}")
            print(f"  Text: {case['text']}")

            humanized_result = self.humanize_text(case["text"])

            case_result = {"id": case["id"], "handled": False, "error": None}

            if humanized_result and "humanized_text" in humanized_result:
                case_result["handled"] = True
                results["handled"] += 1
                print("  ✅ Handled successfully")
                print(f"  Output: {humanized_result['humanized_text'][:100]}...")
            else:
                results["failed"] += 1
                case_result["error"] = "Failed to humanize"
                print("  ⚠️  Failed or rejected")

            results["details"].append(case_result)
            print()

        return results

    def test_dataset(
        self,
        ai_dataset_path: str | None = None,
        human_dataset_path: str | None = None,
        max_samples: int | None = None,
    ) -> dict:
        """Run all robustness tests."""

        print(f"\n{'=' * 80}")
        print("ADVERSARIAL & ROBUSTNESS TESTS")
        print(f"{'=' * 80}\n")

        results = {"timestamp": datetime.now().isoformat(), "tests": {}}

        # Test 1: Humanized AI Detection
        if ai_dataset_path and Path(ai_dataset_path).exists():
            print(f"\n{'=' * 80}")
            print("TEST 1: HUMANIZED AI DETECTION")
            print(f"{'=' * 80}\n")

            ai_samples = self.load_dataset(ai_dataset_path)
            if max_samples:
                ai_samples = ai_samples[:max_samples]

            test1_results = {
                "total": len(ai_samples),
                "successful": 0,
                "fully_evaded": 0,
                "partially_evaded": 0,
                "still_detected": 0,
                "details": [],
            }

            for i, sample in enumerate(ai_samples):
                print(f"[{i + 1}/{len(ai_samples)}] Testing: {sample['id']}")

                sample_result = self.test_humanized_ai_detection(sample)
                test1_results["details"].append(sample_result)

                if sample_result.get("success"):
                    test1_results["successful"] += 1
                    category = sample_result.get("category", "unknown")
                    test1_results[category] = test1_results.get(category, 0) + 1

                print()

            # Calculate rates
            if test1_results["successful"] > 0:
                test1_results["evasion_rate"] = (
                    test1_results["fully_evaded"] / test1_results["successful"]
                )

            results["tests"]["humanized_ai_detection"] = test1_results

        # Test 2: Human Preservation
        if human_dataset_path and Path(human_dataset_path).exists():
            print(f"\n{'=' * 80}")
            print("TEST 2: HUMAN TEXT PRESERVATION")
            print(f"{'=' * 80}\n")

            human_samples = self.load_dataset(human_dataset_path)
            if max_samples:
                human_samples = human_samples[:max_samples]

            test2_results = {
                "total": len(human_samples),
                "successful": 0,
                "preserved": 0,
                "degraded": 0,
                "details": [],
            }

            for i, sample in enumerate(human_samples):
                print(f"[{i + 1}/{len(human_samples)}] Testing: {sample['id']}")

                sample_result = self.test_human_preservation(sample)
                test2_results["details"].append(sample_result)

                if sample_result.get("success"):
                    test2_results["successful"] += 1
                    if sample_result.get("preserved"):
                        test2_results["preserved"] += 1
                    else:
                        test2_results["degraded"] += 1

                print()

            # Calculate preservation rate
            if test2_results["successful"] > 0:
                test2_results["preservation_rate"] = (
                    test2_results["preserved"] / test2_results["successful"]
                )

            results["tests"]["human_preservation"] = test2_results

        # Test 3: Multiple Rounds (use first AI sample)
        if ai_dataset_path and Path(ai_dataset_path).exists():
            print(f"\n{'=' * 80}")
            print("TEST 3: MULTIPLE ROUNDS OF HUMANIZATION")
            print(f"{'=' * 80}\n")

            ai_samples = self.load_dataset(ai_dataset_path)
            sample = ai_samples[0]

            print(f"Testing: {sample['id']}")
            test3_result = self.test_multiple_rounds(sample, rounds=3)

            results["tests"]["multiple_rounds"] = test3_result
            print()

        # Test 4: Edge Cases
        test4_result = self.test_edge_cases()
        results["tests"]["edge_cases"] = test4_result

        return results

    def print_summary(self, results: dict):
        """Print test summary."""
        print(f"\n{'=' * 80}")
        print("ADVERSARIAL & ROBUSTNESS TEST SUMMARY")
        print(f"{'=' * 80}")

        # Test 1: Humanized AI Detection
        if "humanized_ai_detection" in results["tests"]:
            test1 = results["tests"]["humanized_ai_detection"]
            print("\nTest 1: Humanized AI Detection")
            print(f"  Total: {test1['total']}")
            print(f"  Successful: {test1['successful']}")
            print(
                f"  Fully evaded: {test1.get('fully_evaded', 0)} ({test1.get('evasion_rate', 0) * 100:.1f}%)"
            )
            print(f"  Partially evaded: {test1.get('partially_evaded', 0)}")
            print(f"  Still detected: {test1.get('still_detected', 0)}")

        # Test 2: Human Preservation
        if "human_preservation" in results["tests"]:
            test2 = results["tests"]["human_preservation"]
            print("\nTest 2: Human Text Preservation")
            print(f"  Total: {test2['total']}")
            print(f"  Successful: {test2['successful']}")
            print(
                f"  Preserved: {test2.get('preserved', 0)} ({test2.get('preservation_rate', 0) * 100:.1f}%)"
            )
            print(f"  Degraded: {test2.get('degraded', 0)}")

        # Test 3: Multiple Rounds
        if "multiple_rounds" in results["tests"]:
            test3 = results["tests"]["multiple_rounds"]
            print("\nTest 3: Multiple Rounds")
            print(
                f"  Quality maintained: {'✅ Yes' if test3.get('quality_maintained') else '❌ No'}"
            )

        # Test 4: Edge Cases
        if "edge_cases" in results["tests"]:
            test4 = results["tests"]["edge_cases"]
            print("\nTest 4: Edge Cases")
            print(f"  Total: {test4['total']}")
            print(f"  Handled: {test4['handled']}")
            print(f"  Failed: {test4['failed']}")

        print(f"\n{'=' * 80}\n")

    def save_results(self, results: dict, output_file: str):
        """Save results to JSON."""
        output_path = Path(config.RESULTS_DIR) / output_file
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2)

        print(f"📊 Results saved to: {output_path}")


def main():
    """Run adversarial and robustness tests."""

    import argparse

    parser = argparse.ArgumentParser(description="Test adversarial robustness")
    parser.add_argument("--max-samples", type=int, help="Max samples per test")
    args = parser.parse_args()

    tester = AdversarialRobustnessTester()

    # Find datasets
    ai_dataset = "eval/datasets/ai_only/english_ai_long.json"
    human_dataset = "eval/datasets/human_only/english_academic_long.json"

    if not Path(ai_dataset).exists() and not Path(human_dataset).exists():
        print("❌ No datasets found. Please generate samples first.")
        return

    results = tester.test_dataset(
        ai_dataset_path=ai_dataset if Path(ai_dataset).exists() else None,
        human_dataset_path=human_dataset if Path(human_dataset).exists() else None,
        max_samples=args.max_samples,
    )

    tester.print_summary(results)

    # Save results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = f"adversarial_robustness_{timestamp}.json"
    tester.save_results(results, output_file)


if __name__ == "__main__":
    main()
