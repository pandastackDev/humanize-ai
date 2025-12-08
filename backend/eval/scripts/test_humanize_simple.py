"""
Simple /humanize endpoint test - no heavy dependencies required.

Tests the /humanize endpoint with sample data to verify it's working.
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
        HUMANIZE_ENDPOINT = "/api/v1/humanize/"

    config = SimpleConfig()


def test_humanize_endpoint():
    """Test the /humanize endpoint with sample text."""

    print("=" * 80)
    print("SIMPLE /HUMANIZE ENDPOINT TEST")
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
    original_text = sample["text"]

    print(f"Testing sample: {sample['id']}")
    print(f"Original tone: {sample['metadata']['tone']}")
    print(f"Original length: {len(original_text.split())} words")
    print()

    # Test different tones
    tones_to_test = ["Academic", "Professional", "Casual"]

    client = httpx.Client(timeout=120.0)
    url = f"{config.API_BASE_URL}{config.HUMANIZE_ENDPOINT}"

    for tone in tones_to_test:
        print(f"Testing tone: {tone}")
        print("-" * 80)

        try:
            payload = {
                "input_text": original_text[:1000],  # Use first 1000 chars for faster testing
                "tone": tone,
                "length_mode": "standard",
            }

            print(f"Calling: POST {url}")
            response = client.post(url, json=payload)
            response.raise_for_status()
            result = response.json()

            if "humanized_text" in result:
                humanized_text = result["humanized_text"]
                original_words = len(original_text[:1000].split())
                humanized_words = len(humanized_text.split())

                print("✅ SUCCESS!")
                print(f"  Original words: {original_words}")
                print(f"  Humanized words: {humanized_words}")
                print(f"  Length ratio: {humanized_words / original_words:.2f}x")
                print(f"  Preview: {humanized_text[:150]}...")

                # Basic validation
                if 0.8 <= humanized_words / original_words <= 1.2:
                    print("  ✅ Length is reasonable (within 0.8-1.2x)")
                else:
                    print("  ⚠️  Length changed significantly")

            else:
                print("  ⚠️  No 'humanized_text' field in response")
                print(f"  Response keys: {list(result.keys())}")

        except httpx.HTTPStatusError as e:
            print(f"❌ HTTP Error: {e.response.status_code}")
            print(f"Response: {e.response.text[:200]}")
        except httpx.ConnectError:
            print(f"❌ Connection Error: Could not connect to {config.API_BASE_URL}")
            print("\nMake sure your backend is running:")
            print("  cd backend")
            print("  uv run uvicorn src.index:app --reload --host 0.0.0.0 --port 8000")
            return
        except Exception as e:
            print(f"❌ Error: {e}")

        print()

    print("=" * 80)
    print("TEST COMPLETE")
    print("=" * 80)


if __name__ == "__main__":
    test_humanize_endpoint()
