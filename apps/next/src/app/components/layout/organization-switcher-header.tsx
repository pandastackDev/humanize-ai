"use client";

import { DropdownMenu } from "@radix-ui/themes";
import { OrganizationSwitcher, WorkOsWidgets } from "@workos-inc/widgets";
import { useState } from "react";
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
