"""
Vercel serverless function entry point.

This file imports the FastAPI app from src/index.py to satisfy
Vercel's requirement that Python functions be in the api/ directory.
"""

import os
import sys

# Add the backend directory to Python path so we can import from src
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Import the FastAPI app from src/index.py
from src.index import app  # noqa: E402

# Export the app for Vercel
__all__ = ["app"]
