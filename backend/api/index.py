"""
Vercel serverless function entry point for FastAPI.

This file is required by Vercel to locate Python serverless functions.
It imports the FastAPI app from src/index.py.
"""

import os
import sys
from pathlib import Path

# Add backend/src directory to Python path so src/index.py can find its modules
backend_dir = Path(__file__).parent.parent
src_dir = backend_dir / "src"

# Add both backend and src directories to path
for dir_path in [str(backend_dir), str(src_dir)]:
    if dir_path not in sys.path:
        sys.path.insert(0, dir_path)

# Change working directory to backend for relative imports
os.chdir(str(backend_dir))

# Import the FastAPI app from src/index.py
# Path setup must happen before import, so we suppress E402
from src.index import app  # noqa: E402

# Vercel expects the app to be available as 'app'
__all__ = ["app"]
