"""
Test semantic preservation - verify that humanization maintains meaning.

Uses multilingual embeddings to compute cosine similarity between
original and humanized text.
"""

import json
import sys
from pathlib import Path

import httpx
import numpy as np
from sentence_transformers import SentenceTransformer, util

sys.path.append(str(Path(__file__).parent.parent))
from config import config


class SemanticPreservationTester:
    """Tests semantic similarity between original and humanized text."""

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
            print(f"❌ Error calling /humanize: {e}")
            return None

    def load_dataset(self, dataset_path: str) -> list[dict]:
        """Load test dataset."""
        with open(dataset_path, encoding="utf-8") as f:
            return json.load(f)

    def test_dataset(self, dataset_path: str, tone: str | None = None) -> dict:
        """Test semantic preservation on a dataset."""

        samples = self.load_dataset(dataset_path)
        print(f"\n{'=' * 80}")
        print(f"Testing: {dataset_path}")
        print(f"Samples: {len(samples)}")
        print(f"{'=' * 80}\n")

        results = {
            "dataset": dataset_path,
            "total_samples": len(samples),
            "passed": 0,
            "failed": 0,
            "similarities": [],
            "details": [],
        }

        for i, sample in enumerate(samples):
            original_text = sample["text"]
            sample_tone = tone or sample["metadata"].get("tone", "Standard")
            sample_id = sample["id"]

            print(f"[{i + 1}/{len(samples)}] Testing: {sample_id}")
            print(f"  Tone: {sample_tone}")
            print(f"  Original words: {sample['metadata']['word_count']}")

            # Humanize the text
            result = self.humanize_text(original_text, tone=sample_tone)

            if not result or "humanized_text" not in result:
                print("  ❌ Failed to humanize")
                results["failed"] += 1
                continue

            humanized_text = result["humanized_text"]
            humanized_words = len(humanized_text.split())

            # Compute semantic similarity
            similarity = self.compute_similarity(original_text, humanized_text)
            results["similarities"].append(similarity)

            # Check if passes threshold
            threshold = config.SEMANTIC_SIMILARITY_THRESHOLD
            passed = similarity >= threshold

            if passed:
                results["passed"] += 1
                status = "✅ PASS"
            else:
                results["failed"] += 1
                status = "❌ FAIL"

            print(f"  Humanized words: {humanized_words}")
            print(f"  Semantic similarity: {similarity:.3f}")
            print(f"  {status} (threshold: {threshold})")
            print()

            results["details"].append(
                {
                    "id": sample_id,
                    "similarity": similarity,
                    "passed": passed,
                    "original_words": sample["metadata"]["word_count"],
                    "humanized_words": humanized_words,
                }
            )

        # Calculate statistics
        if results["similarities"]:
            results["mean_similarity"] = np.mean(results["similarities"])
            results["median_similarity"] = np.median(results["similarities"])
            results["min_similarity"] = np.min(results["similarities"])
            results["max_similarity"] = np.max(results["similarities"])
            results["pass_rate"] = results["passed"] / results["total_samples"]

        return results

    def print_summary(self, results: dict):
        """Print test summary."""
        print(f"\n{'=' * 80}")
        print("SEMANTIC PRESERVATION TEST SUMMARY")
        print(f"{'=' * 80}")
        print(f"Dataset: {results['dataset']}")
        print(f"Total samples: {results['total_samples']}")
        print(f"Passed: {results['passed']} ({results['pass_rate'] * 100:.1f}%)")
        print(f"Failed: {results['failed']}")
        print("\nSimilarity Statistics:")
        print(f"  Mean: {results.get('mean_similarity', 0):.3f}")
        print(f"  Median: {results.get('median_similarity', 0):.3f}")
        print(f"  Min: {results.get('min_similarity', 0):.3f}")
        print(f"  Max: {results.get('max_similarity', 0):.3f}")
        print(f"\nThreshold: {config.SEMANTIC_SIMILARITY_THRESHOLD}")

        if results["pass_rate"] >= 0.85:
            print("\n✅ TEST PASSED - Semantic preservation is good!")
        else:
            print("\n❌ TEST FAILED - Too many samples below threshold")
        print(f"{'=' * 80}\n")

    def save_results(self, results: dict, output_file: str):
        """Save results to JSON."""
        output_path = Path(config.RESULTS_DIR) / output_file
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2)

        print(f"📊 Results saved to: {output_path}")


def main():
    """Run semantic preservation tests."""

    tester = SemanticPreservationTester()

    # Test datasets
    datasets = [
        "eval/datasets/human_only/english_academic_long.json",
        # Add more datasets as they're created
    ]

    # Check if AI samples exist
    ai_long = Path("eval/datasets/ai_only/english_ai_long.json")
    if ai_long.exists():
        datasets.append(str(ai_long))

    all_results = []

    for dataset_path in datasets:
        if not Path(dataset_path).exists():
            print(f"⚠️  Dataset not found: {dataset_path}")
            continue

        results = tester.test_dataset(dataset_path)
        tester.print_summary(results)
        all_results.append(results)

    # Save combined results
    if all_results:
        output_file = f"semantic_preservation_{Path(__file__).stem}.json"
        tester.save_results(
            {
                "timestamp": np.datetime64("now").astype(str),
                "config": {
                    "threshold": config.SEMANTIC_SIMILARITY_THRESHOLD,
                    "embedding_model": config.EMBEDDING_MODEL,
                },
                "datasets": all_results,
            },
            output_file,
        )


if __name__ == "__main__":
    main()
