"""
Vercel serverless function entry point for FastAPI backend.

This file is required by Vercel to run Python serverless functions.
It imports the FastAPI app from the backend and exports it as 'handler'.
"""
import sys
import os
from pathlib import Path

# Add backend/src to Python path so we can import the FastAPI app
backend_src = Path(__file__).parent.parent / "backend" / "src"
backend_src_str = str(backend_src.resolve())
if backend_src_str not in sys.path:
    sys.path.insert(0, backend_src_str)

# Import the FastAPI app from backend/src/index.py
# The app variable is exported from that file
from index import app

# Export handler for Vercel
# Vercel expects a 'handler' variable that is the ASGI application
handler = app
