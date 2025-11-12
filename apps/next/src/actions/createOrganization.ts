"use server";

import { withAuth } from "@workos-inc/authkit-nextjs";
import { workos } from "@/app/api/workos";
import { switchToOrganization } from "./switchToOrganization";

export async function createOrganization({
  name,
  pathname,
}: {
  name: string;
  pathname: string;
}) {
  const { user } = await withAuth({ ensureSignedIn: true });

  if (!user) {
    throw new Error("User not authenticated");
  }

  // Create the organization
  const organization = await workos.organizations.createOrganization({
    name,
  });

  // Add the current user as an admin of the organization
  await workos.userManagement.createOrganizationMembership({
    organizationId: organization.id,
    userId: user.id,
    roleSlug: "admin",
  });

  // Switch to the newly created organization
  await switchToOrganization({
    organizationId: organization.id,
    pathname,
  });
}
