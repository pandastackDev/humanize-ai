"""
Test ensemble calibration for /detect endpoint.

Metrics:
- ROC-AUC (Receiver Operating Characteristic - Area Under Curve)
- PR-AUC (Precision-Recall - Area Under Curve)
- Brier Score (calibration metric)
- ECE (Expected Calibration Error)
- Confusion matrix analysis
"""

import json
import sys
from datetime import datetime
from pathlib import Path

import httpx
import numpy as np

sys.path.append(str(Path(__file__).parent.parent))
from config import config

try:
    from sklearn.metrics import (
        auc,
        brier_score_loss,
        classification_report,
        confusion_matrix,
        precision_recall_curve,
        roc_auc_score,
    )

    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    print("⚠️  Warning: scikit-learn not installed. Advanced metrics will be skipped.")
    print("   Install with: pip install scikit-learn")


class EnsembleCalibrationTester:
    """Tests calibration and performance metrics of the /detect endpoint."""

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

    def calculate_ece(self, y_true: np.ndarray, y_prob: np.ndarray, n_bins: int = 10) -> float:
        """
        Calculate Expected Calibration Error (ECE).

        ECE measures how well predicted probabilities match actual frequencies.
        Lower is better (0 = perfect calibration).
        """
        bin_edges = np.linspace(0, 1, n_bins + 1)
        bin_indices = np.digitize(y_prob, bin_edges[:-1]) - 1
        bin_indices = np.clip(bin_indices, 0, n_bins - 1)

        ece = 0.0
        for i in range(n_bins):
            mask = bin_indices == i
            if mask.sum() > 0:
                bin_acc = y_true[mask].mean()
                bin_conf = y_prob[mask].mean()
                bin_size = mask.sum()
                ece += (bin_size / len(y_true)) * abs(bin_acc - bin_conf)

        return ece

    def collect_predictions(
        self,
        ai_dataset_path: str | None = None,
        human_dataset_path: str | None = None,
        max_samples: int | None = None,
    ) -> dict:
        """
        Collect predictions from /detect on known AI and human texts.

        Returns:
            Dictionary with arrays of true labels and predicted probabilities.
        """

        y_true = []  # Ground truth: 0=AI, 1=Human
        y_prob = []  # Predicted probability of being human
        sample_ids = []
        sources = []

        print(f"\n{'=' * 80}")
        print("COLLECTING PREDICTIONS")
        print(f"{'=' * 80}\n")

        # Collect from AI dataset
        if ai_dataset_path and Path(ai_dataset_path).exists():
            print(f"Loading AI samples from: {ai_dataset_path}")
            ai_samples = self.load_dataset(ai_dataset_path)

            if max_samples:
                ai_samples = ai_samples[:max_samples]

            print(f"Processing {len(ai_samples)} AI samples...")

            for i, sample in enumerate(ai_samples):
                print(f"  [{i + 1}/{len(ai_samples)}] {sample['id']}", end="")

                detection = self.detect_text(sample["text"])

                if detection and "human_likelihood_pct" in detection:
                    y_true.append(0)  # AI = 0
                    y_prob.append(detection["human_likelihood_pct"] / 100.0)  # Convert to 0-1
                    sample_ids.append(sample["id"])
                    sources.append("ai")
                    print(f" → {detection['human_likelihood_pct']:.1f}% human")
                else:
                    print(" → FAILED")

            print()

        # Collect from Human dataset
        if human_dataset_path and Path(human_dataset_path).exists():
            print(f"Loading human samples from: {human_dataset_path}")
            human_samples = self.load_dataset(human_dataset_path)

            if max_samples:
                human_samples = human_samples[:max_samples]

            print(f"Processing {len(human_samples)} human samples...")

            for i, sample in enumerate(human_samples):
                print(f"  [{i + 1}/{len(human_samples)}] {sample['id']}", end="")

                detection = self.detect_text(sample["text"])

                if detection and "human_likelihood_pct" in detection:
                    y_true.append(1)  # Human = 1
                    y_prob.append(detection["human_likelihood_pct"] / 100.0)
                    sample_ids.append(sample["id"])
                    sources.append("human")
                    print(f" → {detection['human_likelihood_pct']:.1f}% human")
                else:
                    print(" → FAILED")

            print()

        return {
            "y_true": np.array(y_true),
            "y_prob": np.array(y_prob),
            "sample_ids": sample_ids,
            "sources": sources,
        }

    def calculate_metrics(self, data: dict) -> dict:
        """Calculate all calibration and performance metrics."""

        if not SKLEARN_AVAILABLE:
            return {
                "error": "scikit-learn not available",
                "basic_accuracy": self._calculate_basic_accuracy(data),
            }

        y_true = data["y_true"]
        y_prob = data["y_prob"]

        if len(y_true) == 0:
            return {"error": "No data collected"}

        # Convert probabilities to binary predictions (threshold=0.5)
        y_pred = (y_prob >= 0.5).astype(int)

        results: dict[str, int | float | None | dict] = {
            "n_samples": len(y_true),
            "n_ai": int((y_true == 0).sum()),
            "n_human": int((y_true == 1).sum()),
        }

        print("\nCalculating metrics...")
        print(f"  Total samples: {results['n_samples']}")
        print(f"  AI samples: {results['n_ai']}")
        print(f"  Human samples: {results['n_human']}")
        print()

        # Basic accuracy
        accuracy = (y_pred == y_true).mean()
        results["accuracy"] = float(accuracy)
        print(f"  Accuracy: {accuracy:.3f}")

        # ROC-AUC
        try:
            roc_auc = roc_auc_score(y_true, y_prob)
            results["roc_auc"] = float(roc_auc)
            print(f"  ROC-AUC: {roc_auc:.3f}")
        except Exception as e:
            results["roc_auc"] = None
            print(f"  ROC-AUC: Could not calculate ({e})")

        # Precision-Recall AUC
        try:
            precision, recall, _ = precision_recall_curve(y_true, y_prob)
            pr_auc = auc(recall, precision)
            results["pr_auc"] = float(pr_auc)
            print(f"  PR-AUC: {pr_auc:.3f}")
        except Exception as e:
            results["pr_auc"] = None
            print(f"  PR-AUC: Could not calculate ({e})")

        # Brier Score (lower is better)
        try:
            brier = brier_score_loss(y_true, y_prob)
            results["brier_score"] = float(brier)
            print(f"  Brier Score: {brier:.3f} (lower is better)")
        except Exception as e:
            results["brier_score"] = None
            print(f"  Brier Score: Could not calculate ({e})")

        # Expected Calibration Error
        try:
            ece = self.calculate_ece(y_true, y_prob)
            results["ece"] = float(ece)
            print(f"  ECE: {ece:.3f} (lower is better)")
        except Exception as e:
            results["ece"] = None
            print(f"  ECE: Could not calculate ({e})")

        # Confusion Matrix
        try:
            cm = confusion_matrix(y_true, y_pred)
            results["confusion_matrix"] = {
                "true_negative": int(cm[0, 0]),  # AI correctly identified as AI
                "false_positive": int(cm[0, 1]),  # AI incorrectly identified as Human
                "false_negative": int(cm[1, 0]),  # Human incorrectly identified as AI
                "true_positive": int(cm[1, 1]),  # Human correctly identified as Human
            }

            print("\n  Confusion Matrix:")
            print(f"    True Negative (AI→AI): {cm[0, 0]}")
            print(f"    False Positive (AI→Human): {cm[0, 1]}")
            print(f"    False Negative (Human→AI): {cm[1, 0]}")
            print(f"    True Positive (Human→Human): {cm[1, 1]}")
        except Exception as e:
            results["confusion_matrix"] = None
            print(f"\n  Confusion Matrix: Could not calculate ({e})")

        # Classification Report
        try:
            report = classification_report(
                y_true, y_pred, target_names=["AI", "Human"], output_dict=True, zero_division=0
            )
            results["classification_report"] = report

            print("\n  Per-Class Metrics:")
            print(
                f"    AI - Precision: {report['AI']['precision']:.3f}, "
                f"Recall: {report['AI']['recall']:.3f}, "
                f"F1: {report['AI']['f1-score']:.3f}"
            )
            print(
                f"    Human - Precision: {report['Human']['precision']:.3f}, "
                f"Recall: {report['Human']['recall']:.3f}, "
                f"F1: {report['Human']['f1-score']:.3f}"
            )
        except Exception as e:
            results["classification_report"] = None
            print(f"\n  Classification Report: Could not calculate ({e})")

        return results

    def _calculate_basic_accuracy(self, data: dict) -> float:
        """Calculate basic accuracy without sklearn."""
        y_true = data["y_true"]
        y_prob = data["y_prob"]

        if len(y_true) == 0:
            return 0.0

        y_pred = (y_prob >= 0.5).astype(int)
        accuracy = (y_pred == y_true).mean()

        return float(accuracy)

    def test_calibration(
        self,
        ai_dataset_path: str | None = None,
        human_dataset_path: str | None = None,
        max_samples: int | None = None,
    ) -> dict:
        """Run full calibration test suite."""

        print(f"\n{'=' * 80}")
        print("ENSEMBLE CALIBRATION TESTS")
        print(f"{'=' * 80}\n")

        # Collect predictions
        data = self.collect_predictions(
            ai_dataset_path=ai_dataset_path,
            human_dataset_path=human_dataset_path,
            max_samples=max_samples,
        )

        if len(data["y_true"]) == 0:
            print("❌ No predictions collected. Check datasets and API.")
            return {"error": "No predictions collected"}

        # Calculate metrics
        metrics = self.calculate_metrics(data)

        # Store full results
        results = {
            "timestamp": datetime.now().isoformat(),
            "datasets": {"ai": ai_dataset_path, "human": human_dataset_path},
            "metrics": metrics,
            "predictions": {
                "sample_ids": data["sample_ids"],
                "sources": data["sources"],
                "y_true": data["y_true"].tolist(),
                "y_prob": data["y_prob"].tolist(),
            },
        }

        return results

    def print_summary(self, results: dict):
        """Print test summary."""
        print(f"\n{'=' * 80}")
        print("ENSEMBLE CALIBRATION TEST SUMMARY")
        print(f"{'=' * 80}")

        if "error" in results:
            print(f"❌ Error: {results['error']}")
            return

        metrics = results.get("metrics", {})

        print("\nSample Size:")
        print(f"  Total: {metrics.get('n_samples', 0)}")
        print(f"  AI: {metrics.get('n_ai', 0)}")
        print(f"  Human: {metrics.get('n_human', 0)}")

        print("\nPerformance Metrics:")
        print(f"  Accuracy: {metrics.get('accuracy', 0):.3f}")
        print(f"  ROC-AUC: {metrics.get('roc_auc', 'N/A') if metrics.get('roc_auc') else 'N/A'}")
        print(f"  PR-AUC: {metrics.get('pr_auc', 'N/A') if metrics.get('pr_auc') else 'N/A'}")

        print("\nCalibration Metrics:")
        print(
            f"  Brier Score: {metrics.get('brier_score', 'N/A') if metrics.get('brier_score') else 'N/A'} (lower is better)"
        )
        print(
            f"  ECE: {metrics.get('ece', 'N/A') if metrics.get('ece') else 'N/A'} (lower is better)"
        )

        # Evaluation criteria
        accuracy = metrics.get("accuracy", 0)
        roc_auc = metrics.get("roc_auc", 0)
        brier = metrics.get("brier_score", 1.0)
        ece = metrics.get("ece", 1.0)

        print("\nSuccess Criteria:")
        print(f"  Accuracy ≥ 0.80: {'✅' if accuracy >= 0.80 else '❌'} ({accuracy:.3f})")

        if roc_auc:
            print(f"  ROC-AUC ≥ 0.85: {'✅' if roc_auc >= 0.85 else '❌'} ({roc_auc:.3f})")

        if brier is not None:
            print(f"  Brier Score ≤ 0.20: {'✅' if brier <= 0.20 else '❌'} ({brier:.3f})")

        if ece is not None:
            print(f"  ECE ≤ 0.15: {'✅' if ece <= 0.15 else '❌'} ({ece:.3f})")

        # Overall assessment
        passed = (
            accuracy >= 0.80
            and (not roc_auc or roc_auc >= 0.85)
            and (brier is None or brier <= 0.20)
            and (ece is None or ece <= 0.15)
        )

        if passed:
            print("\n✅ TEST PASSED - Ensemble is well-calibrated!")
        else:
            print("\n❌ TEST FAILED - Calibration needs improvement")

        print(f"{'=' * 80}\n")

    def save_results(self, results: dict, output_file: str):
        """Save results to JSON."""
        output_path = Path(config.RESULTS_DIR) / output_file
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2)

        print(f"📊 Results saved to: {output_path}")


def main():
    """Run ensemble calibration tests."""

    import argparse

    parser = argparse.ArgumentParser(description="Test ensemble calibration")
    parser.add_argument("--max-samples", type=int, help="Max samples per dataset")
    args = parser.parse_args()

    tester = EnsembleCalibrationTester()

    # Find datasets
    ai_dataset = "eval/datasets/ai_only/english_ai_long.json"
    human_dataset = "eval/datasets/human_only/english_academic_long.json"

    if not Path(ai_dataset).exists() and not Path(human_dataset).exists():
        print("❌ No datasets found. Please generate samples first.")
        return

    results = tester.test_calibration(
        ai_dataset_path=ai_dataset if Path(ai_dataset).exists() else None,
        human_dataset_path=human_dataset if Path(human_dataset).exists() else None,
        max_samples=args.max_samples,
    )

    tester.print_summary(results)

    # Save results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = f"ensemble_calibration_{timestamp}.json"
    tester.save_results(results, output_file)


if __name__ == "__main__":
    main()
