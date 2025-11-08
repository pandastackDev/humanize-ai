import { Box, Flex, Link, Text } from "@radix-ui/themes";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { Logo } from "../logo";
import { SignInButton } from "../sign-in-button";
import ThemeToggle from "./theme-toggle";
import { UserNav } from "./user-nav";

export async function Header() {
	const { user, role, organizationId } = await withAuth();

	// Fetch organization details if user has an organizationId
	let organizationName: string | undefined;
	if (organizationId) {
		try {
			const { workos } = await import("@/app/api/workos");
			const organization =
				await workos.organizations.getOrganization(organizationId);
			organizationName = organization.name;
		} catch (error) {
			console.error("Error fetching organization:", error);
		}
	}

	return (
		<Flex direction="row" justify="between" pb="4" pt="4">
			<Box pl="9">
				<Link href="/">
					<Logo />
				</Link>
			</Box>
			<Box pr="9">
				<Flex gap="3" align="center">
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
							<ThemeToggle />
							<UserNav
								user={user}
								role={role}
								organizationName={organizationName}
							/>
						</>
					)}
				</Flex>
			</Box>
		</Flex>
	);
}
