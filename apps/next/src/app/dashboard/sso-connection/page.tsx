import { Box, Card, Flex, Heading, Text } from "@radix-ui/themes";
import { withAuth } from "@workos-inc/authkit-nextjs";

import { AdminPortalSsoConnection, WorkOsWidgets } from "@workos-inc/widgets";
import { workos } from "@/app/api/workos";
import { DashboardContainer } from "@/app/components/layout/dashboard-container";

export default async function SSOConnection() {
  const { user, organizationId } = await withAuth({ ensureSignedIn: true });

  if (!organizationId) {
    return (
      <Flex direction="column" gap="3" width="100%">
        <Box>
          <Heading>SSO Connection</Heading>
        </Box>
        <Card>
          <Text>No organization found</Text>
        </Card>
      </Flex>
    );
  }

  const authToken = await workos.widgets.getToken({
    organizationId,
    userId: user.id,
    scopes: ["widgets:sso:manage"],
  });

  return (
    <Flex direction="column" gap="3" width="100%">
      <Box>
        <Heading>SSO Connection</Heading>
      </Box>
      <DashboardContainer>
        <WorkOsWidgets>
          <AdminPortalSsoConnection authToken={authToken} />
        </WorkOsWidgets>
      </DashboardContainer>
    </Flex>
  );
}
