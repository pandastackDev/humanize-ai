import { getSignInUrl, withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import { workos } from "../api/workos";

export const GET = async () => {
  // Check if user has a previous session with an organization
  let organizationId: string | undefined;
  try {
    const auth = await withAuth();
    if (auth.user) {
      // Get the user's organization memberships
      const oms = await workos.userManagement.listOrganizationMemberships({
        userId: auth.user.id,
      });
      // Use the first organization if available
      if (oms.data.length > 0) {
        organizationId = oms.data[0].organizationId;
      }
    }
  } catch (error) {
    // If there's no session, that's fine - we'll just sign in normally
    console.error("Error checking for existing organization:", error);
  }

  // Pass organizationId to skip organization selection if we have one
  const signInUrl = await getSignInUrl({
    ...(organizationId && { organizationId }),
  });

  return redirect(signInUrl);
};
