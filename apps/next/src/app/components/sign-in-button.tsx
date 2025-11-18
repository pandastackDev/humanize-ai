import {
  getSignInUrl,
  getSignUpUrl,
  withAuth,
} from "@workos-inc/authkit-nextjs";
import Link from "next/link";
import signOut from "@/actions/signOut";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

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
      <div className="flex items-center gap-3">
        <form action={signOut}>
          <Button size={large ? "lg" : "default"} type="submit">
            Sign Out
          </Button>
        </form>
        <Link href="/dashboard">
          <Avatar className="h-8 w-8">
            <AvatarImage
              alt={user.firstName || ""}
              src={user.profilePictureUrl as string}
            />
            <AvatarFallback>{user.firstName?.[0] || ""}</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    );
  }

  return (
    <Button
      asChild
      className="font-[900] text-[14px] text-white"
      size={large ? "lg" : "default"}
    >
      <Link href={authorizationUrl}>{signUp ? "Sign Up" : "Sign In"}</Link>
    </Button>
  );
}
