"""
Simple /detect endpoint test - no heavy dependencies required.

Tests the /detect endpoint with sample data to verify it's working.
"""

import json
import sys
from pathlib import Path

import httpx

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

try:
    from config import config
except ImportError:
    # Fallback if config can't be imported
    class SimpleConfig:
        API_BASE_URL = "http://localhost:8000"
        DETECT_ENDPOINT = "/api/v1/detect/"

    config = SimpleConfig()


def test_detect_endpoint():
    """Test the /detect endpoint with sample text."""

    print("=" * 80)
    print("SIMPLE /DETECT ENDPOINT TEST")
    print("=" * 80)
    print(f"API URL: {config.API_BASE_URL}")
    print()

    # Load the WWII sample
    dataset_path = Path("eval/datasets/human_only/english_academic_long.json")

    if not dataset_path.exists():
        print(f"❌ Dataset not found: {dataset_path}")
        print("\nPlease run this from the backend/ directory:")
        print("  cd backend")
        print(f"  uv run python eval/scripts/{Path(__file__).name}")
        return

    with open(dataset_path, encoding="utf-8") as f:
        samples = json.load(f)

    if not samples:
        print("❌ No samples found in dataset")
        return

    sample = samples[0]
    text = sample["text"]

    print(f"Testing sample: {sample['id']}")
    print(f"Ground truth: {sample['metadata']['source']}")
    print(f"Text length: {len(text)} characters, {len(text.split())} words")
    print()

    # Call /detect endpoint
    client = httpx.Client(timeout=60.0)
    url = f"{config.API_BASE_URL}{config.DETECT_ENDPOINT}"

    print(f"Calling: POST {url}")
    print()

    try:
        response = client.post(url, json={"text": text})
        response.raise_for_status()
        result = response.json()

        print("✅ SUCCESS!")
        print()
        print("Response:")
        print("-" * 80)
        print(f"Human likelihood: {result.get('human_likelihood_pct', 'N/A')}%")
        print(f"AI likelihood: {result.get('ai_likelihood_pct', 'N/A')}%")
        print(f"Confidence: {result.get('confidence', 'N/A')}")
        print()

        if "detector_results" in result:
            print(f"Detectors used: {len(result['detector_results'])}")
            for detector in result["detector_results"][:3]:  # Show first 3
                print(
                    f"  - {detector.get('tool', 'Unknown')}: {detector.get('human_likelihood_pct', 'N/A')}% human"
                )

        print("-" * 80)
        print()

        # Basic validation
        expected_source = sample["metadata"]["source"]
        human_likelihood = result.get("human_likelihood_pct", 0)

        if expected_source == "human_written":
            # Should detect as mostly human
            if human_likelihood >= 60:
                print("✅ PASSED - Correctly identified as mostly human")
            else:
                print(
                    f"⚠️  WARNING - Human text detected as {human_likelihood}% human (expected >=60%)"
                )
        else:
            # Should detect as mostly AI
            if human_likelihood <= 40:
                print("✅ PASSED - Correctly identified as mostly AI")
            else:
                print(
                    f"⚠️  WARNING - AI text detected as {human_likelihood}% human (expected <=40%)"
                )

        print()
        print("=" * 80)
        print("TEST COMPLETE")
        print("=" * 80)

    except httpx.HTTPStatusError as e:
        print(f"❌ HTTP Error: {e.response.status_code}")
        print(f"Response: {e.response.text}")
    except httpx.ConnectError:
        print(f"❌ Connection Error: Could not connect to {config.API_BASE_URL}")
        print("\nMake sure your backend is running:")
        print("  cd backend")
        print("  uv run uvicorn src.index:app --reload --host 0.0.0.0 --port 8000")
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    test_detect_endpoint()
