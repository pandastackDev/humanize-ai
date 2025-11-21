"""
History endpoints for managing humanization history in Convex.

These endpoints allow creating, querying, and deleting history entries
stored in the Convex database.
"""

import logging

from convex import ConvexClient
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from api.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================================================
# Request/Response Models
# ============================================================================


class HistoryCreateRequest(BaseModel):
    """Request model for creating a new history entry."""

    user_id: str = Field(..., description="WorkOS user ID")
    organization_id: str | None = Field(None, description="WorkOS organization ID (optional)")
    original_text: str = Field(..., description="Original text before humanization")
    humanized_text: str = Field(..., description="Humanized text")
    word_count: int = Field(..., description="Word count of the original text")
    language: str | None = Field(None, description="Language code (optional)")
    readability_level: str | None = Field(None, description="Readability level used (optional)")
    purpose: str | None = Field(None, description="Purpose/tone used (optional)")
    length_mode: str | None = Field(None, description="Length mode used (optional)")


class HistoryQueryRequest(BaseModel):
    """Request model for querying history by user ID."""

    user_id: str = Field(..., description="WorkOS user ID")


class HistoryDeleteRequest(BaseModel):
    """Request model for deleting a history entry."""

    id: str = Field(..., description="Convex history entry ID (_id)")


class HistoryQueryByOrganizationRequest(BaseModel):
    """Request model for querying history by organization ID."""

    organization_id: str = Field(..., description="WorkOS organization ID")


class HistoryResult(BaseModel):
    """Response model for history operations."""

    success: bool
    message: str
    data: dict | list | str | None = None


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
                "Convex is not configured. Please set CONVEX_URL in your environment variables."
            ),
        )

    try:
        return ConvexClient(settings.CONVEX_URL)
    except Exception as e:
        logger.error(f"Failed to create Convex client: {e}")
        raise HTTPException(status_code=503, detail=f"Failed to connect to Convex: {str(e)}") from e


# ============================================================================
# ENDPOINTS
# ============================================================================


@router.post("/create", response_model=HistoryResult)
async def create_history(request: HistoryCreateRequest) -> HistoryResult:
    """
    Create a new history entry in Convex.

    This stores a humanization result for later retrieval.
    """
    try:
        client = get_convex_client()

        history_data = {
            "user_id": request.user_id,
            "organization_id": request.organization_id,
            "original_text": request.original_text,
            "humanized_text": request.humanized_text,
            "word_count": request.word_count,
            "language": request.language,
            "readability_level": request.readability_level,
            "purpose": request.purpose,
            "length_mode": request.length_mode,
        }

        # Remove None values to match Convex schema
        history_data = {k: v for k, v in history_data.items() if v is not None}

        history_id = client.mutation("history:create", history_data)

        return HistoryResult(
            success=True,
            message=f"History entry created successfully with ID: {history_id}",
            data={"id": history_id, "created": history_data},
        )

    except Exception as e:
        logger.error(f"Error creating history entry: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to create history entry: {str(e)}"
        ) from e


@router.post("/query", response_model=HistoryResult)
async def query_history(request: HistoryQueryRequest) -> HistoryResult:
    """
    Query all history entries for a user.

    Returns all humanization history entries for the specified user,
    ordered by creation time (newest first).
    """
    try:
        client = get_convex_client()

        history_entries = client.query("history:getByUserId", {"user_id": request.user_id})

        if history_entries:
            return HistoryResult(
                success=True,
                message=f"Found {len(history_entries)} history entries",
                data=history_entries,
            )
        else:
            return HistoryResult(
                success=True,
                message="No history entries found",
                data=[],
            )

    except Exception as e:
        logger.error(f"Error querying history: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to query history: {str(e)}") from e


@router.post("/query/organization", response_model=HistoryResult)
async def query_history_by_organization(
    request: HistoryQueryByOrganizationRequest,
) -> HistoryResult:
    """
    Query all history entries for an organization.

    Returns all humanization history entries for the specified organization,
    ordered by creation time (newest first).
    """
    try:
        client = get_convex_client()

        history_entries = client.query(
            "history:getByOrganizationId", {"organization_id": request.organization_id}
        )

        if history_entries:
            return HistoryResult(
                success=True,
                message=f"Found {len(history_entries)} history entries",
                data=history_entries,
            )
        else:
            return HistoryResult(
                success=True,
                message="No history entries found",
                data=[],
            )

    except Exception as e:
        logger.error(f"Error querying history by organization: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to query history: {str(e)}") from e


@router.post("/delete", response_model=HistoryResult)
async def delete_history(request: HistoryDeleteRequest) -> HistoryResult:
    """
    Delete a history entry by ID.

    Permanently removes a history entry from the database.
    """
    try:
        client = get_convex_client()

        # Convex IDs are passed as strings, the mutation will handle the conversion
        client.mutation("history:destroy", {"id": request.id})

        return HistoryResult(
            success=True,
            message=f"History entry {request.id} deleted successfully",
            data={"id": request.id},
        )

    except Exception as e:
        logger.error(f"Error deleting history entry: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to delete history entry: {str(e)}"
        ) from e


@router.post("/test/full-cycle", response_model=HistoryResult)
async def full_cycle_test(user_id: str = "test_user_123") -> HistoryResult:
    """
    Run a complete test cycle: Create → Query → Delete.

    This endpoint demonstrates the full lifecycle of history operations:
    1. Create a test history entry (mutation)
    2. Query it back (query)
    3. Delete it (mutation)

    Returns a summary of all operations performed.
    """
    try:
        client = get_convex_client()
        results = []

        # Step 1: Create
        test_data = {
            "user_id": user_id,
            "organization_id": None,
            "original_text": "This is a test original text for history testing.",
            "humanized_text": "This is a test humanized text for history testing.",
            "word_count": 10,
            "language": "en",
            "readability_level": "university",
            "purpose": "academic",
            "length_mode": "standard",
        }

        results.append({"step": 1, "action": "CREATE", "status": "starting"})
        history_id = client.mutation("history:create", test_data)
        results[-1]["status"] = "success"
        results[-1]["history_id"] = history_id

        # Step 2: Query
        results.append({"step": 2, "action": "QUERY", "status": "starting"})
        history_entries = client.query("history:getByUserId", {"user_id": user_id})
        results[-1]["status"] = "success"
        results[-1]["count"] = len(history_entries) if history_entries else 0
        results[-1]["found_entry"] = (
            any(entry.get("_id") == history_id for entry in (history_entries or []))
            if history_entries
            else False
        )

        # Step 3: Delete (cleanup)
        results.append({"step": 3, "action": "DELETE", "status": "starting"})
        client.mutation("history:destroy", {"id": history_id})
        results[-1]["status"] = "success"

        return HistoryResult(
            success=True,
            message="Full test cycle completed successfully! ✅",
            data={
                "test_user_id": user_id,
                "history_id": history_id,
                "steps": results,
                "summary": {
                    "created": test_data,
                    "queried_count": len(history_entries) if history_entries else 0,
                    "deleted": True,
                },
            },
        )

    except Exception as e:
        logger.error(f"Error in full cycle test: {e}")
        raise HTTPException(status_code=500, detail=f"Full cycle test failed: {str(e)}") from e
