import { withAuth } from "@workos-inc/authkit-nextjs";
import Link from "next/link";
import { workos } from "@/app/api/workos";
import { Logo } from "../logo";
import { SignInButton } from "../sign-in-button";
import { FeedbackPopover } from "./feedback-popover";
import { MainNav } from "./main-nav";
import { MobileNav } from "./mobile-nav";
import { ProjectTeamDropdown } from "./project-team-dropdown";
import { UserNav } from "./user-nav";
import { WordBalanceButton } from "./word-balance-button";

export async function Header() {
  const {
    user,
    role,
    organizationId: sessionOrganizationId,
  } = await withAuth();

  // If user is logged in but doesn't have organizationId in session,
  // try to get it from their organization memberships
  let organizationId = sessionOrganizationId;
  let organizationName: string | undefined;

  // Debug logging
  console.log("[Header] Auth state:", {
    hasUser: !!user,
    userId: user?.id,
    sessionOrganizationId,
    role,
  });

  if (user && !organizationId) {
    try {
      console.log(
        "[Header] Fetching organization memberships for user:",
        user.id
      );
      // Get the user's organization memberships
      const memberships =
        await workos.userManagement.listOrganizationMemberships({
          userId: user.id,
        });

      console.log("[Header] Organization memberships:", {
        count: memberships.data.length,
        memberships: memberships.data.map((m) => ({
          organizationId: m.organizationId,
          role: m.role?.slug,
        })),
      });

      // Use the first organization if available
      if (memberships.data.length > 0 && memberships.data[0]) {
        organizationId = memberships.data[0].organizationId;
        console.log(
          "[Header] Using organizationId from memberships:",
          organizationId
        );
      } else {
        console.warn("[Header] No organization memberships found for user");
      }
    } catch (error) {
      console.error("[Header] Error fetching organization memberships:", error);
    }
  }

  console.log("[Header] Final organizationId:", organizationId);

  // Fetch organization details if we have an organizationId
  if (organizationId) {
    try {
      const organization =
        await workos.organizations.getOrganization(organizationId);
      organizationName = organization.name;
    } catch (error) {
      console.error("Error fetching organization:", error);
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full overflow-visible">
      <div className="container grid h-16 grid-cols-[auto_1fr_auto] items-center gap-3 overflow-visible px-4 md:px-6 lg:grid-cols-[auto_auto_1fr]">
        {/* Logo - Left side */}
        <div className="flex items-center">
          <Link
            className="flex items-center space-x-2 font-semibold text-lg transition-opacity hover:opacity-80"
            href="/"
          >
            <Logo />
          </Link>
        </div>

        {/* Navigation - Left of center, hidden on mobile */}
        <div className="hidden justify-start lg:flex lg:pl-20 xl:pl-28">
          <MainNav />
        </div>

        {/* Right side controls */}
        <div className="flex items-center justify-end gap-2 md:gap-3">
          {!user && (
            <div className="hidden sm:block">
              <SignInButton />
            </div>
          )}
          {user && (
            <>
              {/* {organizationId && (
                <WordBalanceButton
                  organizationId={organizationId}
                  userId={user.id}
                />
              )} */}

              <WordBalanceButton
                organizationId={organizationId}
                userId={user.id}
              />
              {/* Default Project Dropdown */}
              <ProjectTeamDropdown
                currentProject="Default project"
                selectedTeamId="default"
              />

              {/* Feedback Popover */}
              <FeedbackPopover />

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
