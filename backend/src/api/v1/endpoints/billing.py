"""
Billing status endpoint for frontend to query subscription information.
"""

import logging

from fastapi import APIRouter, HTTPException

from api.config import settings
from api.services.convex_client import query_convex

logger = logging.getLogger(__name__)

router = APIRouter()


# Detector access by plan
DETECTOR_ACCESS = {
    "free": ["turnitin", "gptzero", "quillbot"],
    "basic": ["turnitin", "gptzero", "quillbot"],
    "pro": ["turnitin", "gptzero", "quillbot", "zerogpt", "originality", "copyleaks"],
    "ultra": [
        "turnitin",
        "gptzero",
        "quillbot",
        "zerogpt",
        "originality",
        "copyleaks",
    ],
}


async def get_organization_from_convex(organization_id: str | None) -> dict | None:
    """
    Query Convex to get organization information including word balance.

    Args:
        organization_id: WorkOS organization ID

    Returns:
        Dictionary with organization info or None if not found
    """
    if not settings.CONVEX_URL or not organization_id:
        return None

    try:
        # Query Convex using Python client
        result = await query_convex(
            "organizations:getPublicByWorkOSId", {"workos_id": organization_id}
        )
        return result if isinstance(result, dict) else None
    except Exception as e:
        logger.error(f"Error querying Convex for organization: {e}")

    return None


async def get_subscription_from_convex(user_id: str, organization_id: str | None) -> dict | None:
    """
    Query Convex to get subscription information.

    Args:
        user_id: WorkOS user ID
        organization_id: WorkOS organization ID (optional)

    Returns:
        Dictionary with subscription info or None if not found
    """
    if not settings.CONVEX_URL:
        logger.warning("CONVEX_URL not configured, using free tier by default")
        return None

    try:
        if organization_id:
            # Query Convex using Python client
            org_data = await query_convex(
                "subscriptions:getByWorkosId", {"workos_id": organization_id}
            )

            if org_data and isinstance(org_data, dict):
                return {
                    "plan": org_data.get("subscription_plan", "free"),
                    "status": org_data.get("subscription_status", "active"),
                    "billing_period": org_data.get("billing_period", "monthly"),
                    "stripe_customer_id": org_data.get("stripe_customer_id"),
                    "stripe_subscription_id": org_data.get("stripe_subscription_id"),
                    "current_period_end": org_data.get("current_period_end"),
                }
    except Exception as e:
        logger.error(f"Error querying Convex for subscription: {e}")

    return None


@router.get("/status")
async def get_billing_status(user_id: str | None = None, organization_id: str | None = None):
    """
    Get billing status for frontend.

    Returns subscription plan, limits, detector access, and status.

    Args:
        user_id: WorkOS user ID (query parameter)
        organization_id: WorkOS organization ID (query parameter, optional)

    Returns:
        Dictionary with billing status information
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id query parameter is required")

    try:
        # Get subscription info from Convex
        subscription_data = await get_subscription_from_convex(user_id, organization_id)

        # Default to free plan if no subscription found
        plan_name = subscription_data.get("plan", "free") if subscription_data else "free"
        plan = plan_name.lower()

        status_str = subscription_data.get("status", "active") if subscription_data else "active"
        status = status_str.lower()

        # Check if subscription is active
        active = status == "active" and plan != "free"

        # Get limits from config
        limits = settings.SUBSCRIPTION_LIMITS.get(plan, settings.SUBSCRIPTION_LIMITS["free"])
        monthly_limit = limits["words"]
        max_request_size = settings.REQUEST_LIMITS.get(plan, settings.REQUEST_LIMITS["free"])

        # Get detector access
        detectors = DETECTOR_ACCESS.get(plan, DETECTOR_ACCESS["free"])

        # Get current period end
        current_period_end = None
        if subscription_data and subscription_data.get("current_period_end"):
            current_period_end = subscription_data["current_period_end"]

        return {
            "active": active,
            "plan": plan,
            "status": status,
            "monthly_limit": monthly_limit,
            "max_request_size": max_request_size,
            "detectors": detectors,
            "current_period_end": current_period_end,
            "billing_period": subscription_data.get("billing_period", "monthly")
            if subscription_data
            else "monthly",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting billing status: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get billing status: {str(e)}"
        ) from e


@router.get("/word-balance")
async def get_word_balance(organization_id: str | None = None):
    """
    Get word balance for an organization.

    Returns the one-time purchased word balance.

    Args:
        organization_id: WorkOS organization ID (query parameter, required)

    Returns:
        Dictionary with word balance information
    """
    if not organization_id:
        raise HTTPException(status_code=400, detail="organization_id query parameter is required")

    try:
        # Get organization info from Convex
        org_data = await get_organization_from_convex(organization_id)

        if not org_data:
            # Return 0 if organization not found
            return {
                "word_balance": 0,
                "organization_id": organization_id,
            }

        word_balance = org_data.get("word_balance", 0) or 0

        return {
            "word_balance": word_balance,
            "organization_id": organization_id,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting word balance: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get word balance: {str(e)}") from e
