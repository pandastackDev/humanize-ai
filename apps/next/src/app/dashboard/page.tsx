import { Box, Flex, Heading, Text } from "@radix-ui/themes";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { DashboardContainer } from "../components/layout/dashboard-container";

export default async function DashboardPage() {
  const session = await withAuth({ ensureSignedIn: true });

  return (
    <Flex direction="column" gap="3" width="100%">
      <Box>
        <Heading>Dashboard</Heading>
        {session.role === "admin" && (
          <Text color="gray" size="2">
            Admin View
          </Text>
        )}
      </Box>
      <DashboardContainer>
        <Text>
          Welcome to your dashboard!
          {session.role === "admin"
            ? " You have full admin access to all features."
            : " Enjoy your premium features."}
        </Text>
      </DashboardContainer>
    </Flex>
  );
}
