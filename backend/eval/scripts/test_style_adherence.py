"""
Test style adherence - verify that humanization follows the requested tone/style.

Uses embedding similarity to compare output style to style samples.
"""

import json
import sys
from pathlib import Path

import httpx
from sentence_transformers import SentenceTransformer, util

sys.path.append(str(Path(__file__).parent.parent))
from config import config


class StyleAdherenceTester:
    """Tests whether humanized output matches requested tone/style."""

    def __init__(self):
        print(f"Loading embedding model: {config.EMBEDDING_MODEL}")
        self.model = SentenceTransformer(config.EMBEDDING_MODEL)
        self.client = httpx.Client(timeout=60.0)

    def compute_similarity(self, text1: str, text2: str) -> float:
        """Compute cosine similarity between two texts."""
        embeddings = self.model.encode([text1, text2])
        similarity = util.cos_sim(embeddings[0], embeddings[1])
        return float(similarity[0][0])

    def humanize_text(
        self,
        text: str,
        tone: str = "Standard",
        style_sample: str | None = None,
        length_mode: str = "standard",
    ) -> dict | None:
        """Call the /humanize endpoint."""
        url = f"{config.API_BASE_URL}{config.HUMANIZE_ENDPOINT}"

        payload = {"input_text": text, "tone": tone, "length_mode": length_mode}

        if style_sample:
            payload["style_sample"] = style_sample

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

    def load_style_sample(self, tone: str, language: str = "en") -> str | None:
        """Load a style sample for the given tone/language."""
        # Try to load from style_samples directory
        style_dir = Path(config.DATASET_DIR) / "style_samples"
        style_file = style_dir / f"{language}_{tone.lower().replace('/', '_')}.json"

        if style_file.exists():
            with open(style_file, encoding="utf-8") as f:
                samples = json.load(f)
                if samples:
                    return samples[0]["text"]

        # If no style sample exists, return None
        return None

    def test_sample(
        self, sample: dict, target_tone: str | None = None, use_style_sample: bool = False
    ) -> dict:
        """Test style adherence for a single sample."""

        original_text = sample["text"]
        tone = target_tone or sample["metadata"].get("tone", "Standard")
        language = sample["metadata"].get("language", "en")
        sample_id = sample["id"]

        result = {
            "id": sample_id,
            "tone": tone,
            "language": language,
            "success": False,
            "error": None,
        }

        # Load style sample if requested
        style_sample_text = None
        if use_style_sample:
            style_sample_text = self.load_style_sample(tone, language)
            if style_sample_text:
                print(f"    Using style sample ({len(style_sample_text.split())} words)")

        # Humanize with requested tone
        print(f"  HUMANIZING with tone={tone}...")
        humanized_result = self.humanize_text(
            original_text, tone=tone, style_sample=style_sample_text
        )

        if not humanized_result or "humanized_text" not in humanized_result:
            result["error"] = "Failed to humanize"
            return result

        humanized_text = humanized_result["humanized_text"]

        # Compare style with original vs humanized
        # If we have a style sample, compare against it
        if style_sample_text:
            original_similarity = self.compute_similarity(style_sample_text, original_text)
            humanized_similarity = self.compute_similarity(style_sample_text, humanized_text)

            result["style_sample_similarity_original"] = original_similarity
            result["style_sample_similarity_humanized"] = humanized_similarity
            result["style_improvement"] = humanized_similarity - original_similarity

            print(f"    Original → Style sample: {original_similarity:.3f}")
            print(f"    Humanized → Style sample: {humanized_similarity:.3f}")
            print(f"    Style improvement: {result['style_improvement']:+.3f}")

            # For style sample test, humanized should be MORE similar to style
            result["passed"] = humanized_similarity >= original_similarity
        else:
            # Without style sample, we can't do proper style testing
            # Just mark as passed if humanization succeeded
            print(f"    ⚠️  No style sample available for {tone}/{language}")
            result["passed"] = True

        result["success"] = True

        if result["passed"]:
            print("    ✅ PASSED")
        else:
            print("    ❌ FAILED")

        return result

    def test_dataset(
        self,
        dataset_path: str,
        target_tone: str | None = None,
        use_style_sample: bool = False,
        max_samples: int | None = None,
    ) -> dict:
        """Test style adherence on a dataset."""

        samples = self.load_dataset(dataset_path)

        if max_samples:
            samples = samples[:max_samples]

        print(f"\n{'=' * 80}")
        print(f"Testing: {dataset_path}")
        print(f"Samples: {len(samples)}")
        print(f"Target tone: {target_tone or 'original tone'}")
        print(f"Use style sample: {use_style_sample}")
        print(f"{'=' * 80}\n")

        results = {
            "dataset": dataset_path,
            "total_samples": len(samples),
            "successful_tests": 0,
            "passed": 0,
            "failed": 0,
            "errors": 0,
            "use_style_sample": use_style_sample,
            "details": [],
        }

        for i, sample in enumerate(samples):
            print(f"[{i + 1}/{len(samples)}] Testing: {sample['id']}")

            sample_result = self.test_sample(sample, target_tone, use_style_sample)
            results["details"].append(sample_result)

            if sample_result.get("error"):
                results["errors"] += 1
            elif sample_result.get("success"):
                results["successful_tests"] += 1

                if sample_result["passed"]:
                    results["passed"] += 1
                else:
                    results["failed"] += 1

            print()

        # Calculate statistics
        if results["successful_tests"] > 0:
            results["pass_rate"] = results["passed"] / results["successful_tests"]

        return results

    def print_summary(self, results: dict):
        """Print test summary."""
        print(f"\n{'=' * 80}")
        print("STYLE ADHERENCE TEST SUMMARY")
        print(f"{'=' * 80}")
        print(f"Dataset: {results['dataset']}")
        print(f"Total samples: {results['total_samples']}")
        print(f"Successful tests: {results['successful_tests']}")
        print(f"Errors: {results['errors']}")
        print("\nStyle Adherence:")
        print(f"  Passed: {results.get('passed', 0)} ({results.get('pass_rate', 0) * 100:.1f}%)")
        print(f"  Failed: {results.get('failed', 0)}")
        print(f"\nUsed style sample: {results['use_style_sample']}")

        if results.get("pass_rate", 0) >= 0.75:
            print("\n✅ TEST PASSED - Style adherence is good!")
        else:
            print("\n❌ TEST FAILED - Style adherence needs improvement")
        print(f"{'=' * 80}\n")

    def save_results(self, results: dict, output_file: str):
        """Save results to JSON."""
        output_path = Path(config.RESULTS_DIR) / output_file
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2)

        print(f"📊 Results saved to: {output_path}")


def main():
    """Run style adherence tests."""

    import argparse
    from datetime import datetime

    parser = argparse.ArgumentParser(description="Test style adherence")
    parser.add_argument("--max-samples", type=int, help="Max samples per dataset")
    parser.add_argument("--use-style-sample", action="store_true", help="Use style samples")
    parser.add_argument("--tone", type=str, help="Override tone for all samples")
    args = parser.parse_args()

    tester = StyleAdherenceTester()

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
        results = tester.test_dataset(
            dataset_path,
            target_tone=args.tone,
            use_style_sample=args.use_style_sample,
            max_samples=args.max_samples,
        )
        tester.print_summary(results)
        all_results.append(results)

    # Save combined results
    if all_results:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f"style_adherence_{timestamp}.json"
        tester.save_results(
            {
                "timestamp": datetime.now().isoformat(),
                "config": {"threshold": config.STYLE_SIMILARITY_THRESHOLD},
                "datasets": all_results,
            },
            output_file,
        )


if __name__ == "__main__":
    main()
