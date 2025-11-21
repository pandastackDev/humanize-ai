"use server";

import { withAuth, signOut as workosSignOut } from "@workos-inc/authkit-nextjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/env";
import { workos } from "../app/api/workos";

export default async function authkitSignOut() {
  const { organizationId, role, user } = await withAuth();

  // get headers from next request
  const requestHeaders = await headers();

  // Create an audit log entry if the user is in an organization
  if (organizationId) {
    try {
      await workos.auditLogs.createEvent(organizationId, {
        action: "user.logged_out",
        occurredAt: new Date(),
        actor: {
          type: "user",
          id: user?.id,
          name: `${user?.firstName} ${user?.lastName}`,
          metadata: {
            role: role || "",
          },
        },
        targets: [
          {
            type: "user",
            id: user?.id,
            metadata: {},
          },
        ],
        context: {
          location:
            requestHeaders.get("x-forwarded-for") ||
            requestHeaders.get("x-real-ip") ||
            "unknown",
        },
        metadata: {},
      });
    } catch (error) {
      // Log error but don't fail sign out if audit log fails
      console.error("Failed to create audit log entry:", error);
    }
  }

  // Sign out with return URL to home page
  // This prevents the "app-homepage-url-not-found" error
  await workosSignOut({
    returnTo: env.NEXT_PUBLIC_BASE_URL,
  });

  // Redirect to home page after sign out
  redirect("/");
}
