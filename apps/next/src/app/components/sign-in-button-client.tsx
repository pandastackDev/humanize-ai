"use client";

/**
 * Client-side SignInButton component using the useAuth hook.
 * Use this when you need client-side reactivity or loading states.
 * For server components, use the server version from sign-in-button.tsx
 */

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import signOut from "../../actions/signOut";

export function SignInButtonClient({ large }: { large?: boolean }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Button disabled size={large ? "lg" : "default"}>
        Loading...
      </Button>
    );
  }

  if (user) {
    return (
      <div className="flex gap-3">
        <form action={signOut}>
          <Button size={large ? "lg" : "default"} type="submit">
            Sign Out
          </Button>
        </form>
      </div>
    );
  }

  return (
    <Button asChild size={large ? "lg" : "default"}>
      <Link href="/login">
        Sign In {large && "with AuthKit"}
      </Link>
    </Button>
  );
}
