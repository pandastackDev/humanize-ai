"""
Convex client service for interacting with Convex backend.

Uses the official Convex Python client library instead of direct HTTP calls.
"""

import asyncio
import logging
from typing import Any

from convex import ConvexClient

from api.config import settings

logger = logging.getLogger(__name__)

# Global Convex client instance
_convex_client: ConvexClient | None = None


def get_convex_client() -> ConvexClient | None:
    """
    Get or create Convex client instance.

    Returns:
        ConvexClient instance or None if CONVEX_URL not configured
    """
    global _convex_client

    if not settings.CONVEX_URL:
        return None

    if _convex_client is None:
        try:
            # Create client with deployment URL
            _convex_client = ConvexClient(settings.CONVEX_URL)

            # If access token is provided, use it for admin authentication
            if settings.CONVEX_ACCESS_TOKEN:
                # Use Team Access Token for admin authentication
                _convex_client.set_admin_auth(settings.CONVEX_ACCESS_TOKEN)
                logger.info(
                    f"Initialized Convex client for {settings.CONVEX_URL} with admin auth token"
                )
            else:
                logger.info(f"Initialized Convex client for {settings.CONVEX_URL}")
        except Exception as e:
            logger.error(f"Failed to initialize Convex client: {e}")
            return None

    return _convex_client


async def query_convex(function_path: str, args: dict[str, Any] | None = None) -> Any | None:
    """
    Query Convex function (async wrapper for sync Convex client).

    Args:
        function_path: Path to Convex function (e.g., "organizations:getPublicByWorkOSId")
        args: Arguments to pass to the function

    Returns:
        Query result or None if error
    """
    client = get_convex_client()
    if not client:
        logger.warning("Convex client not available, skipping query")
        return None

    try:
        args = args or {}
        # Run sync Convex client call in thread to avoid blocking
        result = await asyncio.to_thread(client.query, function_path, args)
        return result
    except Exception as e:
        logger.error(f"Error querying Convex function {function_path}: {e}")
        return None


async def mutate_convex(function_path: str, args: dict[str, Any] | None = None) -> Any | None:
    """
    Call Convex mutation function (async wrapper for sync Convex client).

    Args:
        function_path: Path to Convex mutation (e.g., "organizations:create")
        args: Arguments to pass to the mutation

    Returns:
        Mutation result or None if error
    """
    client = get_convex_client()
    if not client:
        logger.warning("Convex client not available, skipping mutation")
        return None

    try:
        args = args or {}
        # Run sync Convex client call in thread to avoid blocking
        result = await asyncio.to_thread(client.mutation, function_path, args)
        return result
    except Exception as e:
        logger.error(f"Error calling Convex mutation {function_path}: {e}")
        return None
