"""
Convex test endpoints for demonstrating queries, mutations, and actions.

These endpoints show how to interact with Convex from FastAPI using
the Python convex client with the organization schema.
"""

import logging
from datetime import datetime

from convex import ConvexClient
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from api.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================================================
# Request/Response Models
# ============================================================================


class ConvexHealthResponse(BaseModel):
    """Response model for Convex health check."""

    status: str
    convex_url: str
    convex_configured: bool
    message: str


class OrganizationQueryRequest(BaseModel):
    """Request model for querying organization by WorkOS ID."""

    workos_id: str = Field(..., description="WorkOS organization ID")


class OrganizationCreateRequest(BaseModel):
    """Request model for creating a new organization."""

    workos_id: str = Field(..., description="WorkOS organization ID")
    name: str = Field(..., description="Organization name")
    subscription_plan: str = Field(default="free", description="Subscription plan")
    subscription_status: str = Field(default="active", description="Subscription status")
    word_balance: int = Field(default=0, description="Word balance")


class OrganizationUpdateRequest(BaseModel):
    """Request model for updating an organization."""

    id: str = Field(..., description="Convex organization ID (_id)")
    subscription_plan: str | None = Field(None, description="New subscription plan")
    subscription_status: str | None = Field(None, description="New subscription status")
    billing_period: str | None = Field(None, description="Billing period (monthly/annual)")
    word_balance: int | None = Field(None, description="New word balance")
    current_period_end: int | None = Field(None, description="Unix timestamp for period end")


class OrganizationDeleteRequest(BaseModel):
    """Request model for deleting an organization."""

    id: str = Field(..., description="Convex organization ID (_id)")


class StripeWebhookTestRequest(BaseModel):
    """Request model for testing Stripe webhook verification action."""

    payload: str = Field(..., description="Stripe webhook payload (JSON string)")
    signature: str = Field(..., description="Stripe webhook signature")


class ConvexTestResult(BaseModel):
    """Generic response model for test results."""

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


@router.get("/health", response_model=ConvexHealthResponse)
async def convex_health() -> ConvexHealthResponse:
    """
    Check Convex connection health and configuration status.

    Returns connection status and whether Convex is properly configured.
    """
    convex_configured = bool(settings.CONVEX_URL)

    if not convex_configured:
        return ConvexHealthResponse(
            status="not_configured",
            convex_url="",
            convex_configured=False,
            message="CONVEX_URL is not set in environment variables",
        )

    try:
        # Try to create a client to verify connectivity
        client = ConvexClient(settings.CONVEX_URL)
        # Try a simple query to verify it works
        # This will fail gracefully if there's no data
        _ = client.query("organizations:getPublicByWorkOSId", {"workos_id": "health_check"})

        return ConvexHealthResponse(
            status="healthy",
            convex_url=settings.CONVEX_URL,
            convex_configured=True,
            message="Successfully connected to Convex",
        )
    except Exception as e:
        logger.warning(f"Convex health check failed: {e}")
        return ConvexHealthResponse(
            status="error",
            convex_url=settings.CONVEX_URL,
            convex_configured=True,
            message=f"Failed to connect to Convex: {str(e)}",
        )


@router.post("/query/organization", response_model=ConvexTestResult)
async def query_organization(request: OrganizationQueryRequest) -> ConvexTestResult:
    """
    Test Convex QUERY - Fetch organization by WorkOS ID.

    This demonstrates how to perform read-only queries from Convex.
    Queries are cached and reactive - they automatically update when data changes.
    """
    try:
        client = get_convex_client()

        organization = client.query(
            "organizations:getPublicByWorkOSId", {"workos_id": request.workos_id}
        )

        if organization:
            return ConvexTestResult(
                success=True,
                message=f"Organization found: {organization.get('name', 'N/A')}",
                data=organization,
            )
        else:
            return ConvexTestResult(
                success=False,
                message=f"No organization found with WorkOS ID: {request.workos_id}",
                data=None,
            )

    except Exception as e:
        logger.error(f"Error querying organization: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to query organization: {str(e)}"
        ) from e


@router.post("/mutation/organization/create", response_model=ConvexTestResult)
async def create_organization(request: OrganizationCreateRequest) -> ConvexTestResult:
    """
    Test Convex MUTATION - Create a new organization.

    This demonstrates how to perform write operations to Convex.
    Mutations run transactionally and return results immediately.
    """
    try:
        client = get_convex_client()

        org_data = {
            "workos_id": request.workos_id,
            "name": request.name,
            "subscription_plan": request.subscription_plan,
            "subscription_status": request.subscription_status,
            "word_balance": request.word_balance,
        }

        result = client.mutation("organizations:create", org_data)

        return ConvexTestResult(
            success=True,
            message=f"Organization created successfully with ID: {result}",
            data={"id": result, "created": org_data},
        )

    except Exception as e:
        logger.error(f"Error creating organization: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to create organization: {str(e)}"
        ) from e


@router.post("/mutation/organization/update", response_model=ConvexTestResult)
async def update_organization(request: OrganizationUpdateRequest) -> ConvexTestResult:
    """
    Test Convex MUTATION - Update an existing organization.

    This demonstrates how to update data in Convex using mutations.
    """
    try:
        client = get_convex_client()

        # Build patch object with only provided fields
        patch = {}
        if request.subscription_plan is not None:
            patch["subscription_plan"] = request.subscription_plan
        if request.subscription_status is not None:
            patch["subscription_status"] = request.subscription_status
        if request.billing_period is not None:
            patch["billing_period"] = request.billing_period
        if request.word_balance is not None:
            patch["word_balance"] = request.word_balance
        if request.current_period_end is not None:
            patch["current_period_end"] = request.current_period_end

        update_data = {"id": request.id, "patch": patch}

        client.mutation("organizations:update", update_data)

        return ConvexTestResult(
            success=True,
            message=f"Organization {request.id} updated successfully",
            data={"id": request.id, "updated_fields": patch},
        )

    except Exception as e:
        logger.error(f"Error updating organization: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to update organization: {str(e)}"
        ) from e


@router.post("/mutation/organization/delete", response_model=ConvexTestResult)
async def delete_organization(request: OrganizationDeleteRequest) -> ConvexTestResult:
    """
    Test Convex MUTATION - Delete an organization.

    This demonstrates how to delete data from Convex using mutations.
    """
    try:
        client = get_convex_client()

        client.mutation("organizations:destroy", {"id": request.id})

        return ConvexTestResult(
            success=True,
            message=f"Organization {request.id} deleted successfully",
            data={"id": request.id},
        )

    except Exception as e:
        logger.error(f"Error deleting organization: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to delete organization: {str(e)}"
        ) from e


@router.post("/action/stripe-webhook", response_model=ConvexTestResult)
async def stripe_webhook_action(request: StripeWebhookTestRequest) -> ConvexTestResult:
    """
    Test Convex ACTION - Verify Stripe webhook signature.

    This demonstrates how to call Convex actions from FastAPI.
    Actions run in Node.js and can perform external API calls or side effects.

    Note: This will likely fail without proper Stripe configuration,
    but it demonstrates the pattern for calling actions.
    """
    try:
        client = get_convex_client()

        result = client.action(
            "stripe:verifyStripeWebhook",
            {"payload": request.payload, "signature": request.signature},
        )

        return ConvexTestResult(
            success=True,
            message="Stripe webhook verified successfully",
            data=result,
        )

    except Exception as e:
        # This is expected to fail without proper Stripe configuration
        logger.warning(f"Stripe webhook verification failed (expected): {e}")
        error_msg = str(e)[:200]  # Truncate long errors

        return ConvexTestResult(
            success=False,
            message=f"Action failed (may be expected without Stripe config): {error_msg}",
            data={"error": str(e), "note": "This is normal if Stripe is not configured"},
        )


@router.post("/test/full-cycle", response_model=ConvexTestResult)
async def full_cycle_test() -> ConvexTestResult:
    """
    Run a complete test cycle: Create → Query → Update → Query → Delete.

    This endpoint demonstrates the full lifecycle of Convex operations:
    1. Create a test organization (mutation)
    2. Query it back (query)
    3. Update it (mutation)
    4. Query it again (query)
    5. Delete it (mutation)

    Returns a summary of all operations performed.
    """
    try:
        client = get_convex_client()
        results = []

        # Step 1: Create
        test_workos_id = f"org_test_api_{int(datetime.now().timestamp())}"
        results.append({"step": 1, "action": "CREATE", "status": "starting"})

        create_data = {
            "workos_id": test_workos_id,
            "name": "API Test Organization",
            "subscription_plan": "free",
            "subscription_status": "active",
            "word_balance": 1000,
        }

        org_id = client.mutation("organizations:create", create_data)
        results[-1]["status"] = "success"
        results[-1]["org_id"] = org_id

        # Step 2: Query (first time)
        results.append({"step": 2, "action": "QUERY", "status": "starting"})

        org = client.query("organizations:getPublicByWorkOSId", {"workos_id": test_workos_id})
        results[-1]["status"] = "success"
        results[-1]["data"] = org

        # Step 3: Update
        results.append({"step": 3, "action": "UPDATE", "status": "starting"})

        update_data = {
            "id": org_id,
            "patch": {"subscription_plan": "pro", "word_balance": 5000},
        }

        client.mutation("organizations:update", update_data)
        results[-1]["status"] = "success"

        # Step 4: Query (second time to verify update)
        results.append({"step": 4, "action": "QUERY_VERIFY", "status": "starting"})

        updated_org = client.query(
            "organizations:getPublicByWorkOSId", {"workos_id": test_workos_id}
        )
        results[-1]["status"] = "success"
        results[-1]["data"] = updated_org

        # Step 5: Delete (cleanup)
        results.append({"step": 5, "action": "DELETE", "status": "starting"})

        client.mutation("organizations:destroy", {"id": org_id})
        results[-1]["status"] = "success"

        return ConvexTestResult(
            success=True,
            message="Full test cycle completed successfully! ✅",
            data={
                "test_workos_id": test_workos_id,
                "org_id": org_id,
                "steps": results,
                "summary": {
                    "created": create_data,
                    "initial_query": org,
                    "updated": update_data["patch"],
                    "updated_query": updated_org,
                    "deleted": True,
                },
            },
        )

    except Exception as e:
        logger.error(f"Error in full cycle test: {e}")
        raise HTTPException(status_code=500, detail=f"Full cycle test failed: {str(e)}") from e
