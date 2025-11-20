#!/bin/bash

# Backend code quality check script
set -e  # Exit on any error

cd backend

echo "🔧 Activating virtual environment..."
source .venv/bin/activate

echo "🔒 Checking lock file..."
uv lock --locked

echo "🔍 Running ruff check with auto-fix..."
uv run ruff check --fix

echo "📝 Checking code formatting..."
uv run ruff format --check .

echo "🔎 Running type checks with pyright..."
uv run pyright .

echo "📦 Building package..."
uv build

echo "✅ All checks passed!"

