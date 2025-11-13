"use client";

/**
 * Example of a client component using the useAuth hook to get the current user session.
 */

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import signOut from "../../actions/signOut";

export function SignInButton({ large }: { large?: boolean }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
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
      <Link href="/login">Sign In {large && "with AuthKit"}</Link>
    </Button>
  );
}
