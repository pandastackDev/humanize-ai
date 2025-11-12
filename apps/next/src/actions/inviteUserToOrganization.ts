"use server";

import { withAuth } from "@workos-inc/authkit-nextjs";
import { workos } from "@/app/api/workos";

/**
 * Invite a user to join an organization
 * This is key for Multiple Workspaces - allows users to be added to multiple organizations
 */
export async function inviteUserToOrganization({
  organizationId,
  email,
  roleSlug = "member",
}: {
  organizationId: string;
  email: string;
  roleSlug?: string;
}) {
  const { user, organizationId: currentOrgId } = await withAuth({
    ensureSignedIn: true,
  });

  if (!user) {
    throw new Error("User not authenticated");
  }

  // Verify the user has permission to invite to this organization
  if (currentOrgId !== organizationId) {
    // Check if user has access to the organization they're inviting to
    const memberships = await workos.userManagement.listOrganizationMemberships(
      {
        userId: user.id,
        organizationId,
      }
    );

    const userMembership = memberships.data.find(
      (m) => m.organizationId === organizationId && m.status === "active"
    );

    if (
      !userMembership ||
      (userMembership.role?.slug !== "admin" &&
        userMembership.role?.slug !== "owner")
    ) {
      throw new Error(
        "You don't have permission to invite users to this organization"
      );
    }
  }

  // Create an invitation
  const invitation = await workos.userManagement.createInvitation({
    organizationId,
    email,
    roleSlug,
    inviterUserId: user.id,
  });

  return {
    id: invitation.id,
    email: invitation.email,
    organizationId: invitation.organizationId,
    status: invitation.state,
    expiresAt: invitation.expiresAt,
  };
}

/**
 * List pending invitations for an organization
 */
export async function listOrganizationInvitations(organizationId: string) {
  const { user } = await withAuth({ ensureSignedIn: true });

  if (!user) {
    throw new Error("User not authenticated");
  }

  const invitations = await workos.userManagement.listInvitations({
    organizationId,
  });

  return invitations.data.map((invitation) => ({
    id: invitation.id,
    email: invitation.email,
    organizationId: invitation.organizationId,
    status: invitation.state,
    expiresAt: invitation.expiresAt,
    createdAt: invitation.createdAt,
  }));
}

/**
 * Revoke an invitation
 */
export async function revokeInvitation(invitationId: string) {
  const { user } = await withAuth({ ensureSignedIn: true });

  if (!user) {
    throw new Error("User not authenticated");
  }

  await workos.userManagement.revokeInvitation(invitationId);

  return { success: true };
}
