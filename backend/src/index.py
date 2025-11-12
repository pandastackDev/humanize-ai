"""
Vercel handler entry point.

This module re-exports the FastAPI application from api.main
for Vercel serverless deployment.
"""

from api.main import app

# Re-export the app for Vercel to use as the handler
__all__ = ["app"]
