"use server";

import { withAuth } from "@workos-inc/authkit-nextjs";
import { workos } from "@/app/api/workos";

/**
 * Get all organizations that the current user is a member of
 * This is essential for the Multiple Workspaces model where users can be in many organizations
 */
export async function getUserOrganizations() {
  const { user } = await withAuth({ ensureSignedIn: true });

  if (!user) {
    throw new Error("User not authenticated");
  }

  // Get all organization memberships for the user
  const memberships = await workos.userManagement.listOrganizationMemberships({
    userId: user.id,
  });

  // Fetch organization details for each membership
  const organizations = await Promise.all(
    memberships.data.map(async (membership) => {
      const org = await workos.organizations.getOrganization(
        membership.organizationId
      );
      return {
        id: org.id,
        name: org.name,
        role: membership.role?.name,
        roleSlug: membership.role?.slug,
        status: membership.status,
        createdAt: org.createdAt,
      };
    })
  );

  return organizations;
}

/**
 * Get the user's active memberships with detailed information
 */
export async function getUserMemberships() {
  const { user } = await withAuth({ ensureSignedIn: true });

  if (!user) {
    throw new Error("User not authenticated");
  }

  const memberships = await workos.userManagement.listOrganizationMemberships({
    userId: user.id,
  });

  return memberships.data.map((membership) => ({
    id: membership.id,
    organizationId: membership.organizationId,
    userId: membership.userId,
    role: membership.role?.name,
    roleSlug: membership.role?.slug,
    status: membership.status,
    createdAt: membership.createdAt,
    updatedAt: membership.updatedAt,
  }));
}

/**
 * Check if user has access to a specific organization
 */
export async function userHasOrganizationAccess(
  organizationId: string
): Promise<boolean> {
  const { user } = await withAuth({ ensureSignedIn: true });

  if (!user) {
    return false;
  }

  const memberships = await workos.userManagement.listOrganizationMemberships({
    userId: user.id,
    organizationId,
  });

  return memberships.data.length > 0 && memberships.data[0].status === "active";
}
