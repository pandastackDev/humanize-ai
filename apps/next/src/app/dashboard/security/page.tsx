import { Box, Card, Flex, Heading, Text } from "@radix-ui/themes";
import { withAuth } from "@workos-inc/authkit-nextjs";

import { UserSecurity, WorkOsWidgets } from "@workos-inc/widgets";
import { workos } from "@/app/api/workos";
import { DashboardContainer } from "@/app/components/layout/dashboard-container";

export default async function Security() {
	const { user, organizationId } = await withAuth({ ensureSignedIn: true });

	if (!organizationId) {
		return (
			<Flex direction="column" gap="3" width="100%">
				<Box>
					<Heading>User Security</Heading>
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
				<Heading>User Security</Heading>
			</Box>
			<DashboardContainer>
				<WorkOsWidgets>
					<UserSecurity authToken={authToken} />
				</WorkOsWidgets>
			</DashboardContainer>
		</Flex>
	);
}
