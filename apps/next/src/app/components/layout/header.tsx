import { withAuth } from "@workos-inc/authkit-nextjs";
import Link from "next/link";
import { Logo } from "../logo";
import { SignInButton } from "../sign-in-button";
import { MainNav } from "./main-nav";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";
import { UserNav } from "./user-nav";
import { WordBalanceButton } from "./word-balance-button";

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
    <header className="sticky top-0 z-50 w-full overflow-visible">
      <div className="container grid h-16 grid-cols-[auto_1fr_auto] items-center gap-3 overflow-visible px-4 md:px-6 lg:grid-cols-[1fr_auto_1fr]">
        {/* Logo - Left side */}
        <div className="flex items-center">
          <Link
            className="flex items-center space-x-2 font-semibold text-lg transition-opacity hover:opacity-80"
            href="/"
          >
            <Logo />
          </Link>
        </div>

        {/* Navigation - Centered on desktop, hidden on mobile */}
        <div className="hidden justify-center lg:flex">
          <MainNav />
        </div>

        {/* Right side controls */}
        <div className="flex items-center justify-end gap-2 md:gap-3">
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
              <WordBalanceButton
                organizationId={organizationId}
                userId={user.id}
              />
              <ThemeToggle />
              <UserNav
                organizationName={organizationName}
                role={role}
                user={user}
              />
            </>
          )}
          <div className="lg:hidden">
            <MobileNav user={user} />
          </div>
        </div>
      </div>
    </header>
  );
}
