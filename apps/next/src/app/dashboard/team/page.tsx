import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Table,
  Text,
} from "@radix-ui/themes";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import { workos } from "@/app/api/workos";

export default async function TeamPage() {
  const { user, organizationId } = await withAuth();

  const isAuthenticated = user && organizationId;
  if (!isAuthenticated) {
    return redirect("/pricing");
  }

  // Get organization details
  const organization =
    await workos.organizations.getOrganization(organizationId);

  // Get all members of the organization
  const memberships = await workos.userManagement.listOrganizationMemberships({
    organizationId,
  });

  // Get pending invitations
  const invitations = await workos.userManagement.listInvitations({
    organizationId,
  });

  // Fetch user details for each membership
  const membersWithDetails = await Promise.all(
    memberships.data.map(async (membership) => {
      const memberUser = await workos.userManagement.getUser(membership.userId);
      return {
        ...membership,
        user: memberUser,
      };
    })
  );

  return (
    <Box
      style={{
        maxWidth: "1200px",
        width: "100%",
      }}
    >
      <Flex direction="column" gap="6">
        <Heading size="8">Team Management</Heading>

        <Card>
          <Flex direction="column" gap="3">
            <Heading size="5">Organization: {organization.name}</Heading>
            <Text color="gray">
              Manage your team members and invitations. In a Multiple Workspaces
              model, users can be members of multiple organizations
              simultaneously.
            </Text>
          </Flex>
        </Card>

        {/* Active Members */}
        <Card>
          <Flex direction="column" gap="4">
            <Flex align="center" justify="between">
              <Heading size="5">
                Team Members ({membersWithDetails.length})
              </Heading>
              <Button>Invite Member</Button>
            </Flex>

            <Table.Root variant="surface">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Role</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Joined</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {membersWithDetails.map((member) => (
                  <Table.Row key={member.id}>
                    <Table.Cell>
                      {member.user.firstName} {member.user.lastName}
                    </Table.Cell>
                    <Table.Cell>{member.user.email}</Table.Cell>
                    <Table.Cell>
                      <Text weight="medium">
                        {member.role?.name || "Member"}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text
                        color={member.status === "active" ? "green" : "orange"}
                        weight="medium"
                      >
                        {member.status}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      {new Date(member.createdAt).toLocaleDateString()}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Flex>
        </Card>

        {/* Pending Invitations */}
        {invitations.data.length > 0 && (
          <Card>
            <Flex direction="column" gap="4">
              <Heading size="5">
                Pending Invitations ({invitations.data.length})
              </Heading>

              <Table.Root variant="surface">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Expires</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Sent</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>

                <Table.Body>
                  {invitations.data.map((invitation) => (
                    <Table.Row key={invitation.id}>
                      <Table.Cell>{invitation.email}</Table.Cell>
                      <Table.Cell>
                        <Text color="orange" weight="medium">
                          {invitation.state}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        {new Date(invitation.expiresAt).toLocaleDateString()}
                      </Table.Cell>
                      <Table.Cell>
                        {new Date(invitation.createdAt).toLocaleDateString()}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Flex>
          </Card>
        )}

        {/* Info Card about Multiple Workspaces */}
        <Card>
          <Flex direction="column" gap="2">
            <Heading size="4">About Multiple Workspaces</Heading>
            <Text color="gray">
              This application uses a{" "}
              <Text weight="bold">Multiple Workspaces</Text> model. Users can:
            </Text>
            <ul style={{ marginLeft: "20px", color: "var(--gray-11)" }}>
              <li>Be members of multiple organizations simultaneously</li>
              <li>Create their own organizations/workspaces</li>
              <li>
                Switch between organizations using the organization switcher
              </li>
              <li>Invite others to join their organizations</li>
              <li>Accept invitations to join other organizations</li>
            </ul>
          </Flex>
        </Card>
      </Flex>
    </Box>
  );
}
