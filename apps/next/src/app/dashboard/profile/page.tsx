import { Box, Card, Flex, Heading, Text } from "@radix-ui/themes";
import { withAuth } from "@workos-inc/authkit-nextjs";

import { UserProfile, WorkOsWidgets } from "@workos-inc/widgets";
import { workos } from "@/app/api/workos";
import { DashboardContainer } from "@/app/components/layout/dashboard-container";

export default async function Profile() {
	const { user, organizationId } = await withAuth({ ensureSignedIn: true });

	if (!organizationId) {
		return (
			<Flex direction="column" gap="3" width="100%">
				<Box>
					<Heading>User Profile</Heading>
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
		// export type WidgetScope = 'widgets:users-table:manage' | 'widgets:sso:manage' | 'widgets:domain-verification:manage' | 'widgets:api-keys:manage'
		scopes: [],
	});

	return (
		<Flex direction="column" gap="3" width="100%">
			<Box>
				<Heading>User Profile</Heading>
			</Box>
			<DashboardContainer>
				<WorkOsWidgets>
					<UserProfile authToken={authToken} />
				</WorkOsWidgets>
			</DashboardContainer>
		</Flex>
	);
}
