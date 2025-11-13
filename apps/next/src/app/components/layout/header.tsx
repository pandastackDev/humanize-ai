import { withAuth } from "@workos-inc/authkit-nextjs";
import Link from "next/link";
import { Logo } from "../logo";
import { SignInButton } from "../sign-in-button";
import { MainNav } from "./main-nav";
import { MobileNav } from "./mobile-nav";
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
    <header
      className="sticky top-0 z-50 w-full overflow-visible border-b backdrop-blur supports-backdrop-filter:bg-[var(--header-bg)]/80"
      style={{
        backgroundColor: "var(--header-bg)",
        borderColor: "var(--header-bg)",
      }}
    >
      <div className="container relative flex h-16 items-center justify-between overflow-visible px-4 md:px-6">
        <div className="flex items-center">
          <Link
            className="flex items-center space-x-2 transition-opacity hover:opacity-80"
            href="/"
          >
            <Logo />
          </Link>
        </div>
        <nav className="-translate-x-1/2 absolute left-1/2 hidden items-center overflow-visible md:flex">
          <MainNav />
        </nav>
        <div className="flex items-center gap-2 md:gap-3">
          {!user && (
            <>
              <div className="hidden sm:block">
                <SignInButton />
              </div>
              <ThemeToggle />
            </>
          )}
          {user && (
            <>
              <ThemeToggle />
              <UserNav
                organizationName={organizationName}
                role={role}
                user={user}
              />
            </>
          )}
          <MobileNav user={user} />
        </div>
      </div>
    </header>
  );
}
