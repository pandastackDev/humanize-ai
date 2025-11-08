"""
API v1 router initialization.
"""

from fastapi import APIRouter

from .endpoints import items, users

router = APIRouter()

# Include sub-routers
router.include_router(items.router, prefix="/items", tags=["Items"])
router.include_router(users.router, prefix="/users", tags=["Users"])
