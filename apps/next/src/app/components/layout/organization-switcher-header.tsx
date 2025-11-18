"use client";

import { DropdownMenu } from "@radix-ui/themes";
import { OrganizationSwitcher, WorkOsWidgets } from "@workos-inc/widgets";
import { useEffect, useRef, useState } from "react";
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
  const [widgetReady, setWidgetReady] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Hide any "Loading..." text from WorkOS widgets in the header
  useEffect(() => {
    if (!widgetRef.current) {
      return;
    }

    const isWidgetLoaded = () => {
      const text = widgetRef.current?.innerText?.trim().toLowerCase();
      if (text && !text.startsWith("loading")) {
        setWidgetReady(true);
        return true;
      }
      return false;
    };

    if (isWidgetLoaded()) {
      return;
    }

    const observer = new MutationObserver(() => {
      if (isWidgetLoaded()) {
        observer.disconnect();
      }
    });
    observer.observe(widgetRef.current, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div
        className={
          widgetReady ? "transition-opacity" : "pointer-events-none opacity-0"
        }
        ref={widgetRef}
      >
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
      </div>

      <AddTeamModal
        onCreateTeam={onCreateTeam}
        onOpenChange={setIsModalOpen}
        open={isModalOpen}
      />
    </>
  );
}
