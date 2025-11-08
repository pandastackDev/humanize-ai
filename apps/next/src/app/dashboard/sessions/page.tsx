import { Box, Card, Flex, Heading, Text } from "@radix-ui/themes";
import { withAuth } from "@workos-inc/authkit-nextjs";

import { UserSessions, WorkOsWidgets } from "@workos-inc/widgets";
import { workos } from "@/app/api/workos";
import { DashboardContainer } from "@/app/components/layout/dashboard-container";

export default async function Sessions() {
  const { user, organizationId, sessionId } = await withAuth({
    ensureSignedIn: true,
  });

  if (!organizationId) {
    return (
      <Flex direction="column" gap="3" width="100%">
        <Box>
          <Heading>User Sessions</Heading>
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
    scopes: [],
  });

  return (
    <Flex direction="column" gap="3" width="100%">
      <Box>
        <Heading>User Sessions</Heading>
      </Box>
      <DashboardContainer>
        <WorkOsWidgets>
          <UserSessions authToken={authToken} currentSessionId={sessionId} />
        </WorkOsWidgets>
      </DashboardContainer>
    </Flex>
  );
}
