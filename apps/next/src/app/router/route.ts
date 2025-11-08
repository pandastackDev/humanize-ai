import { refreshSession, withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { workos } from "../api/workos";

export const GET = async (request: NextRequest) => {
  let auth = await withAuth();

  if (!auth.user) {
    return redirect("/pricing");
  }

  // If this is a new user who just subscribed, their role won't have been updated
  // so we need to refresh the session to get the updated role
  if (auth.user && !auth.role) {
    // Get the user's organization memberships so we can extract the org ID
    const oms = await workos.userManagement.listOrganizationMemberships({
      userId: auth.user.id,
    });

    if (oms.data.length > 0) {
      auth = await refreshSession({
        organizationId: oms.data[0].organizationId,
        ensureSignedIn: true,
      });
    }
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
      return redirect("/dashboard");

    case "member":
      return redirect("/product");

    default:
      // If there's no role that means the user hasn't subscribed yet, so redirect them to the pricing page
      return redirect("/pricing");
  }
};
