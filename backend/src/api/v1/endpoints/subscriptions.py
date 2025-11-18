"""
Subscription endpoints for checking subscription status and tracking usage.
"""

import logging
from datetime import datetime

import httpx
from fastapi import APIRouter, HTTPException

from api.config import settings
from api.models import (
    SubscriptionCheckRequest,
    SubscriptionInfo,
    SubscriptionPlan,
    SubscriptionStatus,
    UsageTrackingRequest,
    UsageTrackingResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter()


async def get_subscription_from_convex(
    user_id: str, organization_id: str | None
) -> dict | None:
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
        async with httpx.AsyncClient(timeout=5.0) as client:
            # Query Convex to get organization subscription info
            if organization_id:
                query_url = f"{settings.CONVEX_URL}/api/query"
                query_data = {
                    "path": "subscriptions:getByWorkosId",
                    "args": {"workos_id": organization_id},
                    "format": "json",
                }

                headers = {}
                if settings.CONVEX_DEPLOYMENT_KEY:
                    headers["Authorization"] = f"Bearer {settings.CONVEX_DEPLOYMENT_KEY}"

                response = await client.post(query_url, json=query_data, headers=headers)

                if response.status_code == 200:
                    org_data = response.json()
                    if org_data:
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


async def get_usage_from_convex(
    user_id: str, organization_id: str | None
) -> dict[str, int]:
    """
    Query Convex to get usage information for current month.

    Args:
        user_id: WorkOS user ID
        organization_id: WorkOS organization ID (optional)

    Returns:
        Dictionary with words_used and requests_count
    """
    if not settings.CONVEX_URL:
        return {"words_used": 0, "requests_count": 0}

    now = datetime.now()
    year = now.year
    month = now.month

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            query_url = f"{settings.CONVEX_URL}/api/query"
            if organization_id:
                query_data = {
                    "path": "usage:getByOrganizationMonth",
                    "args": {
                        "organization_id": organization_id,
                        "year": year,
                        "month": month,
                    },
                    "format": "json",
                }
            else:
                query_data = {
                    "path": "usage:getByUserMonth",
                    "args": {
                        "user_id": user_id,
                        "year": year,
                        "month": month,
                    },
                    "format": "json",
                }

            headers = {}
            if settings.CONVEX_DEPLOYMENT_KEY:
                headers["Authorization"] = f"Bearer {settings.CONVEX_DEPLOYMENT_KEY}"

            response = await client.post(query_url, json=query_data, headers=headers)

            if response.status_code == 200:
                usage_data = response.json()
                if usage_data:
                    return {
                        "words_used": usage_data.get("words_used", 0),
                        "requests_count": usage_data.get("requests_count", 0),
                    }
    except Exception as e:
        logger.error(f"Error querying Convex for usage: {e}")

    return {"words_used": 0, "requests_count": 0}


@router.post("/check", response_model=SubscriptionInfo)
async def check_subscription(
    request: SubscriptionCheckRequest,
) -> SubscriptionInfo:
    """
    Check subscription status and usage for a user/organization.

    Returns subscription plan, status, limits, and current usage.
    """
    try:
        # Get subscription info from Convex
        subscription_data = await get_subscription_from_convex(
            request.user_id, request.organization_id
        )

        # Default to free plan if no subscription found
        plan_name = (
            subscription_data.get("plan", "free") if subscription_data else "free"
        )
        plan = SubscriptionPlan(plan_name.lower())

        status_str = (
            subscription_data.get("status", "active") if subscription_data else "active"
        )
        try:
            status = SubscriptionStatus(status_str.lower())
        except ValueError:
            status = SubscriptionStatus.ACTIVE

        billing_period = (
            subscription_data.get("billing_period", "monthly")
            if subscription_data
            else "monthly"
        )

        # Get usage from Convex
        usage = await get_usage_from_convex(request.user_id, request.organization_id)

        # Get limits from config
        limits = settings.SUBSCRIPTION_LIMITS.get(plan.value, settings.SUBSCRIPTION_LIMITS["free"])
        word_limit = limits["words"]
        request_limit = limits["request_limit"]

        words_used = usage.get("words_used", 0)
        requests_used = usage.get("requests_count", 0)
        words_remaining = max(0, word_limit - words_used)

        return SubscriptionInfo(
            plan=plan,
            status=status,
            word_limit=word_limit,
            words_used=words_used,
            words_remaining=words_remaining,
            request_limit=request_limit,
            requests_used=requests_used,
            billing_period=billing_period,
            current_period_end=(
                datetime.fromtimestamp(subscription_data["current_period_end"]).isoformat()
                if subscription_data and subscription_data.get("current_period_end")
                else None
            ),
            stripe_customer_id=subscription_data.get("stripe_customer_id") if subscription_data else None,
            stripe_subscription_id=(
                subscription_data.get("stripe_subscription_id") if subscription_data else None
            ),
        )
    except Exception as e:
        logger.error(f"Error checking subscription: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to check subscription: {str(e)}") from e


@router.post("/usage", response_model=UsageTrackingResponse)
async def track_usage(request: UsageTrackingRequest) -> UsageTrackingResponse:
    """
    Track usage for a user/organization.

    This endpoint records word usage and returns remaining quota.
    """
    try:
        # Get current subscription info
        check_request = SubscriptionCheckRequest(
            user_id=request.user_id, organization_id=request.organization_id
        )
        subscription_info = await check_subscription(check_request)

        # Check if limit would be exceeded
        new_words_used = subscription_info.words_used + request.words
        limit_exceeded = new_words_used > subscription_info.word_limit

        if limit_exceeded:
            return UsageTrackingResponse(
                success=False,
                words_used=subscription_info.words_used,
                words_remaining=subscription_info.words_remaining,
                limit_exceeded=True,
            )

        # Update usage in Convex (this would be done via a mutation)
        # For now, we'll just return success - actual tracking should be done
        # via Convex mutations from the frontend or webhook handlers

        return UsageTrackingResponse(
            success=True,
            words_used=new_words_used,
            words_remaining=max(0, subscription_info.word_limit - new_words_used),
            limit_exceeded=False,
        )
    except Exception as e:
        logger.error(f"Error tracking usage: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to track usage: {str(e)}") from e

