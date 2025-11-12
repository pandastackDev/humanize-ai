import { Box, Flex, Link, Text } from "@radix-ui/themes";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { createOrganization } from "@/actions/createOrganization";
import { switchToOrganization } from "@/actions/switchToOrganization";
import { Logo } from "../logo";
import { SignInButton } from "../sign-in-button";
import { OrganizationSwitcherHeader } from "./organization-switcher-header";
import ThemeToggle from "./theme-toggle";
import { UserNav } from "./user-nav";

export async function Header() {
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

  return (
    <Flex direction="row" justify="between" pb="4" pt="4">
      <Box pl="9">
        <Link href="/">
          <Logo />
        </Link>
      </Box>
      <Box pr="9">
        <Flex align="center" gap="3">
          {!user && (
            <>
              <Link href="/pricing">
                <Text>Pricing</Text>
              </Link>
              <SignInButton />
              <ThemeToggle />
            </>
          )}
          {user && (
            <>
              {!role && (
                <Link href="/pricing">
                  <Text>Pricing</Text>
                </Link>
              )}
              {authToken && organizationId && (
                <OrganizationSwitcherHeader
                  authToken={authToken}
                  onCreateTeam={handleCreateTeam}
                  onSwitchOrganization={handleSwitchOrganization}
                />
              )}
              <ThemeToggle />
              <UserNav
                organizationName={organizationName}
                role={role}
                user={user}
              />
            </>
          )}
        </Flex>
      </Box>
    </Flex>
  );
}
