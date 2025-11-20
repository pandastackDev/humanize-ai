#!/bin/bash

set -e  # Exit on any error

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: node is not installed. Please install it first."
    echo "Visit: https://github.com/Schniz/fnm#readme"
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ Error: pnpm is not installed. Please install it first."
    echo "Visit: https://pnpm.io/installation"
    exit 1
fi

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "❌ Error: uv is not installed. Please install it first."
    echo "Visit: https://docs.astral.sh/uv/getting-started/installation/"
    exit 1
fi

echo "============================================================"
echo "📦 Installing dependencies..."
echo "============================================================"
pnpm i

echo ""
echo "============================================================"
echo "🎨 Running Biome checks..."
echo "============================================================"
pnpm biome check --write --unsafe

echo ""
echo "============================================================"
echo "🔍 Running ESLint & Oxlint checks..."
echo "============================================================"
pnpm turbo lint

echo ""
echo "============================================================"
echo "📝 Checking TypeScript types..."
echo "============================================================"
pnpm check-types

cd backend

echo ""
echo "============================================================"
echo "🔒 Checking lock file..."
echo "============================================================"
uv sync
uv sync --dev
uv lock --locked

echo ""
echo "============================================================"
echo "🔍 Running ruff check with auto-fix..."
echo "============================================================"
uv run ruff check --fix

echo ""
echo "============================================================"
echo "📝 Checking code formatting..."
echo "============================================================"
uv run ruff format

echo ""
echo "============================================================"
echo "🔎 Running type checks with pyright..."
echo "============================================================"
uv run pyright .

echo ""
echo "============================================================"
echo "📦 Building package..."
echo "============================================================"
uv build

echo ""
echo "============================================================"
echo "✅ All checks passed!"
echo "  Node:   $(node --version)"
echo "  pnpm:   $(pnpm --version)"
echo "  Python: $(uv run python --version | cut -d' ' -f2)"
echo "  uv:     $(uv --version | cut -d' ' -f2)"
echo "============================================================"
