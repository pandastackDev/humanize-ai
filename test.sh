#!/bin/bash

set -e  # Exit on any error

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "❌ Error: uv is not installed. Please install it first."
    echo "Visit: https://docs.astral.sh/uv/getting-started/installation/"
    exit 1
fi

cd backend

echo "============================================================"
echo "🧪 Running pytest unit tests..."
echo "============================================================"
uv run pytest -v

echo ""
echo "============================================================"
echo "📊 Running evaluation tests..."
echo "============================================================"
# Run evaluation tests if they exist
if [ -f "eval/scripts/run_all_tests.py" ]; then
    uv run python eval/scripts/run_all_tests.py
else
    echo "⚠️  Evaluation tests not found, skipping..."
fi

echo ""
echo "============================================================"
echo "✅ All tests completed!"
echo "============================================================"
