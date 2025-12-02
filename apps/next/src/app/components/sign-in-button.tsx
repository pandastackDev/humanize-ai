import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@humanize/ui/components/avatar";
import { Button } from "@humanize/ui/components/button";
import {
  getSignInUrl,
  getSignUpUrl,
  withAuth,
} from "@workos-inc/authkit-nextjs";
import Link from "next/link";
import signOut from "@/actions/signOut";

export async function SignInButton({ large }: { large?: boolean }) {
  const { user } = await withAuth();
  const signInUrl = await getSignInUrl();
  const signUpUrl = await getSignUpUrl();

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
    <div className="flex items-center gap-2">
      <Button
        asChild
        className="border-border bg-background font-semibold text-foreground hover:bg-muted dark:border-select-bg dark:bg-select-bg dark:text-foreground"
        size={large ? "lg" : "default"}
        variant="outline"
      >
        <Link href={signInUrl}>Log in</Link>
      </Button>
      <Button
        asChild
        className="bg-brand-primary font-semibold text-white hover:bg-brand-primary/90"
        size={large ? "lg" : "default"}
      >
        <Link href={signUpUrl}>Sign up for free</Link>
      </Button>
    </div>
  );
}
