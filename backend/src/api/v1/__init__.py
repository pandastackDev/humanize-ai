"""
API v1 router initialization.
"""

from fastapi import APIRouter

from .endpoints import billing, humanize, items, subscriptions, users, webhooks

router = APIRouter()

# Include sub-routers
router.include_router(items.router, prefix="/items", tags=["Items"])
router.include_router(users.router, prefix="/users", tags=["Users"])
router.include_router(humanize.router, prefix="/humanize", tags=["Humanize"])
router.include_router(subscriptions.router, prefix="/subscriptions", tags=["Subscriptions"])
router.include_router(billing.router, prefix="/billing", tags=["Billing"])
router.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])
