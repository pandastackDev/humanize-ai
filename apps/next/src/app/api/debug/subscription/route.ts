import { withAuth } from "@workos-inc/authkit-nextjs";
import { NextResponse } from "next/server";
import { env } from "@/env";

type DebugInfo = Record<string, unknown>;

/**
 * Fetch organization data from Convex
 */
async function fetchConvexOrganization(
  organizationId: string,
  debugInfo: DebugInfo
): Promise<void> {
  if (!env.NEXT_PUBLIC_CONVEX_URL) {
    debugInfo.convex_check_skipped = "CONVEX_URL not configured";
    return;
  }

  try {
    const queryUrl = `${env.NEXT_PUBLIC_CONVEX_URL}/api/query`;
    const orgResponse = await fetch(queryUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(env.CONVEX_DEPLOYMENT && {
          Authorization: `Bearer ${env.CONVEX_DEPLOYMENT}`,
        }),
      },
      body: JSON.stringify({
        path: "subscriptions:getByWorkosId",
        args: { workos_id: organizationId },
        format: "json",
      }),
    });

    if (orgResponse.ok) {
      const orgData = await orgResponse.json();
      debugInfo.convex_organization = orgData || "NOT_FOUND";
    } else {
      debugInfo.convex_organization_error = `HTTP ${orgResponse.status}: ${await orgResponse.text()}`;
    }
  } catch (error) {
    debugInfo.convex_query_error =
      error instanceof Error ? error.message : String(error);
  }
}

/**
 * Fetch subscription data from backend API
 */
async function fetchBackendSubscription(
  userId: string,
  organizationId: string | undefined,
  debugInfo: DebugInfo
): Promise<void> {
  if (!env.NEXT_PUBLIC_PYTHON_API_URL) {
    debugInfo.backend_check_skipped = "PYTHON_API_URL not configured";
    return;
  }

  try {
    const backendUrl = `${env.NEXT_PUBLIC_PYTHON_API_URL}/api/v1/subscriptions/check`;
    const backendResponse = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        organization_id: organizationId,
      }),
    });

    if (backendResponse.ok) {
      const subscriptionData = await backendResponse.json();
      debugInfo.backend_subscription = subscriptionData;
    } else {
      debugInfo.backend_subscription_error = `HTTP ${backendResponse.status}: ${await backendResponse.text()}`;
    }
  } catch (error) {
    debugInfo.backend_check_error =
      error instanceof Error ? error.message : String(error);
  }
}

/**
 * Fetch WorkOS organization details
 */
async function fetchWorkOSOrganization(
  organizationId: string,
  debugInfo: DebugInfo
): Promise<void> {
  try {
    const { workos } = await import("@/app/api/workos");
    const org = await workos.organizations.getOrganization(organizationId);
    debugInfo.workos_organization = {
      id: org.id,
      name: org.name,
      created_at: org.createdAt,
    };
  } catch (error) {
    debugInfo.workos_organization_error =
      error instanceof Error ? error.message : String(error);
  }
}

/**
 * Debug endpoint to check organization subscription status in Convex
 *
 * Usage: GET /api/debug/subscription
 */
export async function GET() {
  try {
    const { user, organizationId } = await withAuth();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const debugInfo: DebugInfo = {
      user_id: user.id,
      organization_id: organizationId,
      timestamp: new Date().toISOString(),
    };

    // Check Convex for organization data
    if (organizationId) {
      await fetchConvexOrganization(organizationId, debugInfo);
    } else {
      debugInfo.convex_check_skipped = "No organization ID";
    }

    // Check backend subscription API
    await fetchBackendSubscription(user.id, organizationId, debugInfo);

    // Get WorkOS organization details
    if (organizationId) {
      await fetchWorkOSOrganization(organizationId, debugInfo);
    }

    return NextResponse.json(debugInfo, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
