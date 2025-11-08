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
      <Flex align="center" gap="3">
        <form action={signOut}>
          <Button size={large ? "3" : "2"} type="submit">
            Sign Out
          </Button>
        </form>
        <a href="/dashboard">
          <Avatar
            fallback={user.firstName?.[0] || ""}
            size="2"
            src={user.profilePictureUrl as string}
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
