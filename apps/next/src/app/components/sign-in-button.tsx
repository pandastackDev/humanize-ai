import { Avatar, Button, Flex, Link } from "@radix-ui/themes";
import {
	getSignInUrl,
	getSignUpUrl,
	withAuth,
} from "@workos-inc/authkit-nextjs";
import signOut from "@/actions/signOut";

export async function SignInButton({
	large,
	signUp,
}: {
	large?: boolean;
	signUp?: boolean;
}) {
	const { user } = await withAuth();
	const authorizationUrl = signUp ? await getSignUpUrl() : await getSignInUrl();

	if (user) {
		return (
			<Flex gap="3" align="center">
				<form action={signOut}>
					<Button type="submit" size={large ? "3" : "2"}>
						Sign Out
					</Button>
				</form>
				<a href="/dashboard">
					<Avatar
						size="2"
						src={user.profilePictureUrl as string}
						fallback={user.firstName?.[0] || ""}
					/>
				</a>
			</Flex>
		);
	}

	return (
		<Button asChild size={large ? "3" : "2"}>
			<Link href={authorizationUrl}>{signUp ? "Sign Up" : "Sign In"}</Link>
		</Button>
	);
}
