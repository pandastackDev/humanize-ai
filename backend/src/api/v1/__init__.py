"""
API v1 router initialization.
"""

from fastapi import APIRouter

from .endpoints import (
    billing,
    convex_test,
    detect,
    history,
    humanize,
    items,
    parse_file,
    subscriptions,
    users,
    webhooks,
)

router = APIRouter()

# Include sub-routers
router.include_router(items.router, prefix="/items", tags=["Items"])
router.include_router(users.router, prefix="/users", tags=["Users"])
router.include_router(humanize.router, prefix="/humanize", tags=["Humanize"])
router.include_router(detect.router, prefix="/detect", tags=["Detection"])
router.include_router(subscriptions.router, prefix="/subscriptions", tags=["Subscriptions"])
router.include_router(billing.router, prefix="/billing", tags=["Billing"])
router.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])
router.include_router(convex_test.router, prefix="/convex", tags=["Convex Test"])
router.include_router(history.router, prefix="/history", tags=["History"])
router.include_router(parse_file.router, prefix="/parse-file", tags=["File Parsing"])
