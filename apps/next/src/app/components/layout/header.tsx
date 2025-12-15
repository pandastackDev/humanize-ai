import { Button } from "@humanize/ui/components/button";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { Settings } from "lucide-react";
import Link from "next/link";
import { workos } from "@/app/api/workos";
import { Logo } from "../logo";
import { SignInButton } from "../sign-in-button";
import { FeedbackPopover } from "./feedback-popover";
import { HelpPopover } from "./help-popover";
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
    <header
      className="sticky top-0 z-50 w-full border-b bg-background"
      style={{ borderBottomColor: "var(--color-background)" }}
    >
      <div className="container mx-auto flex h-16 items-center gap-3 overflow-visible bg-background px-4 md:px-6">
        {/* Left section: Logo and Navigation */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              className="-ml-2 md:-ml-4 flex items-center space-x-2 font-semibold text-lg transition-opacity hover:opacity-80"
              href="/"
            >
              <Logo />
            </Link>
          </div>

          {/* Navigation - Center, hidden on mobile */}
          <div className="hidden justify-start lg:flex">
            <MainNav />
          </div>
        </div>

        {/* Middle section: Balance button */}
        {user && (
          <div className="ml-8 flex items-center md:ml-48">
            <WordBalanceButton
              organizationId={organizationId}
              userId={user.id}
            />
          </div>
        )}

        {/* Right side controls */}
        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <div className="lg:hidden">
            <MobileNav user={user} />
          </div>
        </div>
      </div>

      {/* Right edge controls - positioned at absolute right */}
      {!user && (
        <div className="absolute top-0 right-8 flex h-16 items-center gap-2 md:gap-3">
          <div className="hidden sm:flex sm:items-center sm:gap-2">
            <SignInButton />
            <HelpPopover />
          </div>
        </div>
      )}

      {/* Right edge controls - positioned at absolute right */}
      {user && (
        <div className="absolute top-0 right-8 flex h-16 items-center gap-2 md:gap-3">
          <ProjectTeamDropdown
            currentProject="Vadym's Team"
            selectedTeamId="default"
          />

          {/* Feedback Popover */}
          <FeedbackPopover />

          <Button asChild size="icon" variant="outline">
            <Link href="/dashboard/settings">
              <Settings />
            </Link>
          </Button>

          <UserNav
            organizationName={organizationName}
            role={role}
            user={user}
          />
        </div>
      )}
    </header>
  );
}
