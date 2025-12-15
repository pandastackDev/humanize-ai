import { refreshSession, withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { workos } from "../api/workos";

export const GET = async (request: NextRequest) => {
  let auth = await withAuth();

  if (!auth.user) {
    return redirect("/pricing");
  }

  // Get the user's organization memberships
  const oms = await workos.userManagement.listOrganizationMemberships({
    userId: auth.user.id,
  });

  // If user has no organizations and no active session org, redirect to pricing
  // They'll need to subscribe to create their first organization
  if (oms.data.length === 0 && !auth.organizationId) {
    return redirect("/pricing");
  }

  // If user has organizations but no current organization context, switch to the first one
  // This handles Multiple Workspaces: user can be in many orgs, we pick their first one
  const hasNoOrgId = !auth.organizationId;
  const hasNoRole = !auth.role;
  const needsOrgContext = hasNoOrgId || hasNoRole;
  const hasOrganizations = oms.data.length > 0;
  const shouldSwitchOrg = auth.user && needsOrgContext && hasOrganizations;

  if (shouldSwitchOrg && oms.data[0]) {
    auth = await refreshSession({
      organizationId: oms.data[0].organizationId,
      ensureSignedIn: true,
    });
  }

  if (auth.organizationId) {
    // Create a new audit log entry
    await workos.auditLogs.createEvent(auth.organizationId, {
      action: "user.logged_in",
      occurredAt: new Date(),
      actor: {
        type: "user",
        id: auth.user.id,
        name: `${auth.user.firstName} ${auth.user.lastName}`,
        metadata: {
          role: auth.role as string,
        },
      },
      targets: [
        {
          type: "user",
          id: auth.user.id,
          name: `${auth.user.firstName} ${auth.user.lastName}`,
        },
      ],
      context: {
        location:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown",
      },
      metadata: {},
    });
  }

  const role = auth.role;

  // Redirect based on the user's role
  switch (role) {
    case "admin":
      return redirect("/");

    case "member":
      return redirect("/");

    default:
      // If there's no role that means the user hasn't subscribed yet, so redirect them to the pricing page
      return redirect("/pricing");
  }
};
