"""
Stripe webhook endpoints for handling subscription events.
"""

import logging

from fastapi import APIRouter, Header, HTTPException, Request
import httpx

from api.config import settings

logger = logging.getLogger(__name__)

# Optional stripe import - allows server to start even if stripe isn't installed
try:
    import stripe
    STRIPE_AVAILABLE = True
except ImportError:
    stripe = None
    STRIPE_AVAILABLE = False
    logger.warning("stripe module not installed. Stripe webhook endpoints will not work.")

router = APIRouter()

# Initialize Stripe if API key is configured
stripe_client = None
if STRIPE_AVAILABLE and settings.STRIPE_API_KEY:
    stripe.api_key = settings.STRIPE_API_KEY
    stripe_client = stripe


def verify_stripe_signature(payload: bytes, signature: str, secret: str) -> bool:
    """
    Verify Stripe webhook signature.
    
    Args:
        payload: Raw request body
        signature: Stripe signature from header
        secret: Stripe webhook secret
        
    Returns:
        True if signature is valid
    """
    if not STRIPE_AVAILABLE:
        logger.error("Stripe is not available")
        return False
    try:
        stripe.Webhook.construct_event(payload, signature, secret)
        return True
    except ValueError as e:
        logger.error(f"Invalid payload: {e}")
        return False
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid signature: {e}")
        return False


async def update_subscription_in_convex(
    organization_id: str, subscription_data: dict
) -> bool:
    """
    Update subscription in Convex via mutation.
    
    Args:
        organization_id: WorkOS organization ID
        subscription_data: Dictionary with subscription fields to update
        
    Returns:
        True if successful
    """
    if not settings.CONVEX_URL:
        logger.warning("CONVEX_URL not configured, cannot update subscription")
        return False

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            mutation_url = f"{settings.CONVEX_URL}/api/mutation"
            mutation_data = {
                "path": "subscriptions:updateSubscription",
                "args": {
                    "organization_id": organization_id,
                    **subscription_data,
                },
                "format": "json",
            }

            headers = {}
            if settings.CONVEX_DEPLOYMENT_KEY:
                headers["Authorization"] = f"Bearer {settings.CONVEX_DEPLOYMENT_KEY}"

            response = await client.post(
                mutation_url, json=mutation_data, headers=headers
            )

            if response.status_code == 200:
                logger.info(f"Successfully updated subscription in Convex for {organization_id}")
                return True
            else:
                logger.error(
                    f"Failed to update subscription in Convex: {response.status_code} - {response.text}"
                )
                return False
    except Exception as e:
        logger.error(f"Error updating subscription in Convex: {e}")
        return False


def extract_plan_from_price_lookup_key(lookup_key: str | None) -> str:
    """
    Extract plan name from Stripe price lookup key.
    
    Examples:
        basic-monthly -> basic
        pro-annual -> pro
        ultra-monthly -> ultra
    """
    if not lookup_key:
        return "free"
    
    lookup_lower = lookup_key.lower()
    if "basic" in lookup_lower:
        return "basic"
    elif "pro" in lookup_lower:
        return "pro"
    elif "ultra" in lookup_lower:
        return "ultra"
    else:
        return "free"


def map_stripe_status_to_subscription_status(stripe_status: str) -> str:
    """
    Map Stripe subscription status to our subscription status.
    """
    status_map = {
        "active": "active",
        "past_due": "past_due",
        "canceled": "cancelled",
        "unpaid": "unpaid",
        "trialing": "trialing",
        "incomplete": "past_due",
        "incomplete_expired": "cancelled",
        "paused": "past_due",
    }
    return status_map.get(stripe_status.lower(), "active")


@router.post("/stripe")
async def handle_stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    """
    Handle Stripe webhook events.
    
    Supported events:
    - checkout.session.completed
    - customer.subscription.created
    - customer.subscription.updated
    - customer.subscription.deleted
    - invoice.payment_succeeded
    
    Args:
        request: FastAPI request object
        stripe_signature: Stripe signature header for verification
        
    Returns:
        JSON response with status
    """
    if not STRIPE_AVAILABLE:
        raise HTTPException(
            status_code=500, detail="Stripe module is not installed"
        )
    
    if not stripe_client:
        raise HTTPException(
            status_code=500, detail="Stripe is not configured"
        )

    if not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=500, detail="Stripe webhook secret is not configured"
        )

    # Get raw body
    body = await request.body()

    # Verify signature
    try:
        event = stripe.Webhook.construct_event(
            body, stripe_signature, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        logger.error(f"Invalid payload: {e}")
        raise HTTPException(status_code=400, detail="Invalid payload") from e
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid signature: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature") from e

    # Handle different event types
    event_type = event["type"]
    data = event["data"]["object"]

    logger.info(f"Received Stripe webhook: {event_type}")

    try:
        if event_type == "checkout.session.completed":
            # Get customer and subscription IDs from checkout session
            customer_id = data.get("customer")
            subscription_id = data.get("subscription")

            if not customer_id or not subscription_id:
                logger.warning("Checkout session missing customer or subscription ID")
                return {"status": "success", "message": "Event processed (no action needed)"}

            # Get subscription details to extract plan
            subscription = stripe.Subscription.retrieve(subscription_id)
            price_lookup_key = (
                subscription.items.data[0].price.lookup_key
                if subscription.items.data and subscription.items.data[0].price.lookup_key
                else None
            )
            plan = extract_plan_from_price_lookup_key(price_lookup_key)
            billing_period = "annual" if "annual" in (price_lookup_key or "").lower() else "monthly"

            # Get organization from checkout session metadata first, then customer metadata
            organization_id = data.get("metadata", {}).get("workOSOrganizationId")
            if not organization_id:
                customer = stripe.Customer.retrieve(customer_id)
                organization_id = customer.metadata.get("workOSOrganizationId")

            if organization_id:
                await update_subscription_in_convex(
                    organization_id,
                    {
                        "subscription_plan": plan,
                        "subscription_status": "active",
                        "billing_period": billing_period,
                        "stripe_customer_id": customer_id,
                        "stripe_subscription_id": subscription_id,
                        "current_period_end": subscription.current_period_end,
                    },
                )

        elif event_type == "customer.subscription.created":
            customer_id = data.get("customer")
            subscription_id = data.get("id")

            price_lookup_key = (
                data.get("items", {}).get("data", [{}])[0]
                .get("price", {})
                .get("lookup_key")
            )
            plan = extract_plan_from_price_lookup_key(price_lookup_key)
            billing_period = "annual" if "annual" in (price_lookup_key or "").lower() else "monthly"

            customer = stripe.Customer.retrieve(customer_id)
            organization_id = customer.metadata.get("workOSOrganizationId")

            if organization_id:
                await update_subscription_in_convex(
                    organization_id,
                    {
                        "subscription_plan": plan,
                        "subscription_status": "active",
                        "billing_period": billing_period,
                        "stripe_customer_id": customer_id,
                        "stripe_subscription_id": subscription_id,
                        "current_period_end": data.get("current_period_end"),
                    },
                )

        elif event_type == "customer.subscription.updated":
            customer_id = data.get("customer")
            subscription_id = data.get("id")

            price_lookup_key = (
                data.get("items", {}).get("data", [{}])[0]
                .get("price", {})
                .get("lookup_key")
            )
            plan = extract_plan_from_price_lookup_key(price_lookup_key)
            billing_period = "annual" if "annual" in (price_lookup_key or "").lower() else "monthly"
            stripe_status = data.get("status")
            status = map_stripe_status_to_subscription_status(stripe_status)

            customer = stripe.Customer.retrieve(customer_id)
            organization_id = customer.metadata.get("workOSOrganizationId")

            if organization_id:
                await update_subscription_in_convex(
                    organization_id,
                    {
                        "subscription_plan": plan,
                        "subscription_status": status,
                        "billing_period": billing_period,
                        "stripe_subscription_id": subscription_id,
                        "current_period_end": data.get("current_period_end"),
                    },
                )

        elif event_type == "customer.subscription.deleted":
            customer_id = data.get("customer")
            subscription_id = data.get("id")

            customer = stripe.Customer.retrieve(customer_id)
            organization_id = customer.metadata.get("workOSOrganizationId")

            if organization_id:
                await update_subscription_in_convex(
                    organization_id,
                    {
                        "subscription_status": "cancelled",
                    },
                )

        elif event_type == "invoice.payment_succeeded":
            # Payment succeeded - subscription is active
            customer_id = data.get("customer")
            subscription_id = data.get("subscription")

            if subscription_id:
                subscription = stripe.Subscription.retrieve(subscription_id)
                customer = stripe.Customer.retrieve(customer_id)
                organization_id = customer.metadata.get("workOSOrganizationId")

                if organization_id:
                    price_lookup_key = (
                        subscription.items.data[0].price.lookup_key
                        if subscription.items.data and subscription.items.data[0].price.lookup_key
                        else None
                    )
                    plan = extract_plan_from_price_lookup_key(price_lookup_key)
                    billing_period = "annual" if "annual" in (price_lookup_key or "").lower() else "monthly"

                    await update_subscription_in_convex(
                        organization_id,
                        {
                            "subscription_plan": plan,
                            "subscription_status": "active",
                            "billing_period": billing_period,
                            "current_period_end": subscription.current_period_end,
                        },
                    )

        else:
            logger.info(f"Unhandled event type: {event_type}")

        return {"status": "success", "event": event_type}

    except Exception as e:
        logger.error(f"Error handling Stripe webhook {event_type}: {e}", exc_info=True)
        # Return 200 to prevent Stripe from retrying
        # The error is logged for debugging
        return {"status": "error", "message": str(e)}

