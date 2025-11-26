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
        className="border border-slate-200 bg-white font-semibold text-slate-900 hover:bg-slate-50 dark:border-[#343434] dark:bg-[#343434] dark:text-white"
        size={large ? "lg" : "default"}
        variant="outline"
      >
        <Link href={signInUrl}>Log in</Link>
      </Button>
      <Button
        asChild
        className="bg-blue-600 font-semibold text-white hover:bg-blue-700"
        size={large ? "lg" : "default"}
      >
        <Link href={signUpUrl}>Sign up for free</Link>
      </Button>
    </div>
  );
}
