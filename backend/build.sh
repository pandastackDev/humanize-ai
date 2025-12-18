#!/bin/bash
set -e

echo "Starting build process..."

# Install uv if not available
if ! command -v uv &> /dev/null; then
    echo "Installing uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.cargo/bin:$PATH"
fi

# Verify uv is available
if ! command -v uv &> /dev/null; then
    echo "ERROR: uv is not available after installation"
    exit 1
fi

echo "Using uv version: $(uv --version)"

# Generate requirements.txt from pyproject.toml for Vercel compatibility
echo "Generating requirements.txt from pyproject.toml..."
uv pip compile pyproject.toml -o requirements.txt --no-emit-package backend || {
    echo "Warning: Could not generate requirements.txt, will install directly"
}

# Install dependencies
# Vercel's Python runtime should have dependencies available at /var/task
# Try multiple methods to ensure dependencies are installed
if [ -f requirements.txt ]; then
    echo "Installing dependencies from requirements.txt..."
    # Try uv first, fallback to pip
    uv pip install --no-cache -r requirements.txt || {
        echo "uv failed, trying pip..."
        pip install --no-cache-dir -r requirements.txt
    }
else
    echo "Installing dependencies directly from pyproject.toml..."
    # Try uv first, fallback to pip
    uv pip install --no-cache . || {
        echo "uv failed, trying pip with pyproject.toml..."
        pip install --no-cache-dir .
    }
fi

echo "Verifying FastAPI installation..."
python3 -c "import fastapi; print(f'FastAPI version: {fastapi.__version__}')" || {
    echo "ERROR: FastAPI not found after installation"
    echo "Python path:"
    python3 -c "import sys; [print(p) for p in sys.path]"
    echo "Installed packages:"
    python3 -m pip list | grep -i fastapi || echo "FastAPI not in pip list"
    exit 1
}

echo "Build complete!"
