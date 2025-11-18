"use client";

import { DropdownMenu } from "@radix-ui/themes";
import { OrganizationSwitcher, WorkOsWidgets } from "@workos-inc/widgets";
import { useEffect, useState } from "react";
import { AddTeamModal } from "./add-team-modal";

type OrganizationSwitcherHeaderProps = {
  authToken: string;
  onSwitchOrganization: (params: { organizationId: string }) => Promise<void>;
  onCreateTeam: (name: string) => Promise<void>;
};

export function OrganizationSwitcherHeader({
  authToken,
  onSwitchOrganization,
  onCreateTeam,
}: OrganizationSwitcherHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Hide any "Loading..." text from WorkOS widgets in the header
  useEffect(() => {
    const hideLoadingText = () => {
      const header = document.querySelector("header");
      if (!header) return;

      // Only search within the header for better performance
      const allElements = header.querySelectorAll("*");
      allElements.forEach((element) => {
        const text = element.textContent?.trim();
        if (text === "Loading..." || text === "Loading") {
          // Hide the element if it's a button or within a WorkOS widget
          const isButton = element.tagName === "BUTTON" || element.closest("button");
          const isWorkOSWidget = 
            element.closest("[data-workos-widget]") ||
            element.closest("[class*='workos']") ||
            element.closest("[class*='WorkOS']");
          
          if (isButton || isWorkOSWidget) {
            (element as HTMLElement).style.display = "none";
          }
        }
      });
    };

    // Run immediately
    hideLoadingText();
    
    // Observe for DOM changes only within the header
    const header = document.querySelector("header");
    if (header) {
      const observer = new MutationObserver(hideLoadingText);
      observer.observe(header, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      return () => {
        observer.disconnect();
      };
    }
  }, []);

  return (
    <>
      <WorkOsWidgets>
        <OrganizationSwitcher
          authToken={authToken}
          organizationLabel="Teams"
          switchToOrganization={onSwitchOrganization}
        >
          <DropdownMenu.Separator />
          <DropdownMenu.Group>
            <DropdownMenu.Item onClick={() => setIsModalOpen(true)}>
              Add new team
            </DropdownMenu.Item>
          </DropdownMenu.Group>
        </OrganizationSwitcher>
      </WorkOsWidgets>

      <AddTeamModal
        onCreateTeam={onCreateTeam}
        onOpenChange={setIsModalOpen}
        open={isModalOpen}
      />
    </>
  );
}
