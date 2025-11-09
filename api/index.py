"""
Vercel serverless function entry point for FastAPI backend.
This file proxies requests to the FastAPI app in backend/src/api/main.py
"""

import sys
from pathlib import Path

# Add backend/src to Python path so imports work
backend_src = Path(__file__).parent.parent / "backend" / "src"
sys.path.insert(0, str(backend_src))

# Import must come after path modification
from api.main import app  # noqa: E402

# Export the FastAPI app for Vercel
handler = app
