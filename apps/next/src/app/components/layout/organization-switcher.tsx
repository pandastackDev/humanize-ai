import { withAuth } from "@workos-inc/authkit-nextjs";
import { createOrganization } from "@/actions/createOrganization";
import { switchToOrganization } from "@/actions/switchToOrganization";
import { OrganizationSwitcherHeader } from "./organization-switcher-header";

export async function OrganizationSwitcher() {
  const { user, role, organizationId } = await withAuth();

  // Fetch organization details and auth token if user has an organizationId
  let organizationName: string | undefined;
  let authToken: string | undefined;

  if (organizationId && user) {
    try {
      const { workos } = await import("@/app/api/workos");
      const organization =
        await workos.organizations.getOrganization(organizationId);
      organizationName = organization.name;

      // Get auth token for organization switcher widget
      authToken = await workos.widgets.getToken({
        organizationId,
        userId: user.id,
        scopes: [],
      });
    } catch (error) {
      console.error("Error fetching organization:", error);
    }
  }

  // Server action to handle organization switching
  async function handleSwitchOrganization({
    organizationId: targetOrganizationId,
  }: {
    organizationId: string;
  }) {
    "use server";

    // Get the current pathname - we'll redirect back to home for simplicity
    await switchToOrganization({
      organizationId: targetOrganizationId,
      pathname: "/",
    });
  }

  // Server action to handle creating a new team
  async function handleCreateTeam(name: string) {
    "use server";

    await createOrganization({
      name,
      pathname: "/",
    });
  }

  if (!(user && authToken && organizationId)) {
    return null;
  }

  return (
    <OrganizationSwitcherHeader
      authToken={authToken}
      onCreateTeam={handleCreateTeam}
      onSwitchOrganization={handleSwitchOrganization}
    />
  );
}
