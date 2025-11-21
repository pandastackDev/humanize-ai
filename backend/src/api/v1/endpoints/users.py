"""
Users endpoints - User management operations with Convex integration.
"""

import logging
from typing import Any

from convex import ConvexClient
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from api.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================================================
# Request/Response Models
# ============================================================================


class UserCreateConvexRequest(BaseModel):
    """Request model for creating a user in Convex."""

    email: EmailStr = Field(..., description="User email address")
    workos_id: str = Field(..., description="WorkOS user ID")


class UserUpdateConvexRequest(BaseModel):
    """Request model for updating a user in Convex."""

    id: str = Field(..., description="Convex user ID (_id)")
    email: EmailStr | None = Field(None, description="Updated email address")
    workos_id: str | None = Field(None, description="Updated WorkOS user ID")


class UserQueryRequest(BaseModel):
    """Request model for querying user by WorkOS ID."""

    workos_id: str = Field(..., description="WorkOS user ID")


class UserResult(BaseModel):
    """Response model for user operations."""

    success: bool
    message: str
    data: dict | str | None = None


# ============================================================================
# Helper Functions
# ============================================================================


def get_convex_client() -> ConvexClient:
    """
    Get a configured Convex client instance.

    Raises:
        HTTPException: If CONVEX_URL is not configured
    """
    if not settings.CONVEX_URL:
        raise HTTPException(
            status_code=503,
            detail=(
                "Convex is not configured. Please set CONVEX_URL in your environment variables. "
                "Expected: CONVEX_URL=https://humanize-03d19.convex.cloud"
            ),
        )

    try:
        return ConvexClient(settings.CONVEX_URL)
    except Exception as e:
        logger.error(f"Failed to create Convex client: {e}")
        raise HTTPException(status_code=503, detail=f"Failed to connect to Convex: {str(e)}") from e


# ============================================================================
# Endpoints
# ============================================================================


@router.post("/convex/create", response_model=UserResult, status_code=status.HTTP_201_CREATED)
def create_user_in_convex(request: UserCreateConvexRequest) -> UserResult:
    """
    Create a user in Convex database.

    This saves a user with email and workos_id to the Convex users table.
    """
    try:
        client = get_convex_client()

        user_data: dict[str, Any] = {
            "email": str(request.email),
            "workos_id": request.workos_id,
        }

        # Check if user already exists
        try:
            existing_user = client.query(
                "users:getPublicByWorkOSId", {"workos_id": request.workos_id}
            )

            if existing_user:
                logger.warning(f"User with workos_id {request.workos_id} already exists in Convex")
                return UserResult(
                    success=False,
                    message=f"User with workos_id {request.workos_id} already exists",
                    data={"existing_user": existing_user},
                )
        except Exception as query_error:
            # If query fails, continue with creation attempt
            logger.warning(
                f"Could not check existing user: {query_error}. Proceeding with creation."
            )

        # Create user in Convex
        user_id = client.mutation("users:create", user_data)

        logger.info(f"Successfully created user in Convex: {user_id}")

        return UserResult(
            success=True,
            message=f"User created successfully in Convex with ID: {user_id}",
            data={"id": user_id, "created": user_data},
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating user in Convex: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to create user in Convex: {str(e)}"
        ) from e


@router.post("/convex/query", response_model=UserResult)
def query_user_by_workos_id(request: UserQueryRequest) -> UserResult:
    """
    Query a user from Convex by WorkOS ID.

    Uses the public query function `users:getPublicByWorkOSId` to retrieve
    user data from Convex database.

    Returns the user if found, None otherwise.
    """
    try:
        client = get_convex_client()

        user = client.query("users:getPublicByWorkOSId", {"workos_id": request.workos_id})

        if not user:
            return UserResult(
                success=False,
                message=f"User with workos_id {request.workos_id} not found",
                data=None,
            )

        return UserResult(
            success=True,
            message="User found",
            data=user,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying user from Convex: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to query user from Convex: {str(e)}"
        ) from e


@router.post("/convex/update", response_model=UserResult)
def update_user_in_convex(request: UserUpdateConvexRequest) -> UserResult:
    """
    Update a user in Convex database.

    Updates the specified fields for the user with the given ID.
    """
    try:
        client = get_convex_client()

        # Build patch object with only provided fields
        patch: dict[str, Any] = {}
        if request.email is not None:
            patch["email"] = str(request.email)
        if request.workos_id is not None:
            patch["workos_id"] = request.workos_id

        if not patch:
            return UserResult(
                success=False,
                message="No fields to update",
                data=None,
            )

        # Update user in Convex
        client.mutation("users:update", {"id": request.id, "patch": patch})

        logger.info(f"Successfully updated user in Convex: {request.id}")

        return UserResult(
            success=True,
            message="User updated successfully",
            data={"id": request.id, "updated": patch},
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user in Convex: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to update user in Convex: {str(e)}"
        ) from e
