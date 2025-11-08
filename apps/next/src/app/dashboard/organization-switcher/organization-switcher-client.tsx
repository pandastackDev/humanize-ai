"use client";

import { OrganizationSwitcher, WorkOsWidgets } from "@workos-inc/widgets";

interface OrganizationSwitcherClientProps {
	authToken: string;
}

export function OrganizationSwitcherClient({
	authToken,
}: OrganizationSwitcherClientProps) {
	return (
		<WorkOsWidgets>
			<OrganizationSwitcher
				authToken={authToken}
				switchToOrganization={() => {
					alert("switchToOrganization");
				}}
			/>
		</WorkOsWidgets>
	);
}
