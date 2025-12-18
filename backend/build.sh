#!/bin/bash
set -e

# Install uv if not available
if ! command -v uv &> /dev/null; then
    echo "Installing uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.cargo/bin:$PATH"
fi

# Install dependencies directly to the current Python environment (not in venv)
# This is required for Vercel's serverless functions
# Using --system flag to install to the system Python that Vercel uses
# -e . installs the package in editable mode and all its dependencies
echo "Installing dependencies with uv from pyproject.toml..."
uv pip install --system -e .

echo "Build complete!"
