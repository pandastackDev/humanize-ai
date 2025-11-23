import { Box, Button, Card, Flex, Heading, Text } from "@radix-ui/themes";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { GeneratePortalLinkIntent } from "@workos-inc/node";
import Link from "next/link";
import { workos } from "@/app/api/workos";
import { DashboardContainer } from "@/app/components/layout/dashboard-container";
import { UpgradeButton } from "@/app/components/upgrade-button";

export default async function SettingsPage() {
  const { organizationId } = await withAuth({ ensureSignedIn: true });

  if (!organizationId) {
    return (
      <Flex direction="column" gap="3" width="100%">
        <Box>
          <Heading>Settings</Heading>
        </Box>
        <Card>
          <Text>No organization found</Text>
        </Card>
      </Flex>
    );
  }

  const { link: workOSAdminPortalLink } = await workos.portal.generateLink({
    organization: organizationId,
    intent: GeneratePortalLinkIntent.SSO,
  });

  return (
    <Flex
      direction="column"
      gap="3"
      style={{ width: "100%", maxWidth: "1200px" }}
    >
      <Box>
        <Heading>Settings</Heading>
      </Box>
      <DashboardContainer>
        <Text size="4">Single Sign-On</Text>
        <Text color="gray" size="2">
          Setup or modify an existing SSO connection
        </Text>
        <Box>
          <Button style={{ cursor: "pointer" }} variant="soft">
            <Link href={workOSAdminPortalLink}>Configure</Link>
          </Button>
        </Box>

        <Text size="2">
          The Admin Portal provides a guided configuration experience for IT
          admins to set up and manage Single Sign-On (SSO), Directory Sync, and
          more.
        </Text>
        <Button asChild>
          <a
            href={workOSAdminPortalLink}
            rel="noopener noreferrer"
            target="_blank"
          >
            Open Admin Portal
          </a>
        </Button>
      </DashboardContainer>
      <DashboardContainer>
        <Text size="4">Payments & Subscriptions</Text>
        <Text color="gray" size="2">
          Update payment method or change plans
        </Text>
        <Box>
          <UpgradeButton path="settings">Configure</UpgradeButton>
        </Box>
      </DashboardContainer>
    </Flex>
  );
}
