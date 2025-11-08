import { Box, Flex, Heading, Text, TextField } from "@radix-ui/themes";
import { withAuth } from "@workos-inc/authkit-nextjs";

export default async function AccountPage() {
  const { user, role, permissions } = await withAuth({ ensureSignedIn: true });

  const userFields = [
    ["First name", user?.firstName],
    ["Last name", user?.lastName],
    ["Email", user?.email],
    role ? ["Role", role] : [],
    permissions ? ["Permissions", permissions] : [],
    ["Id", user?.id],
  ].filter((arr) => arr.length > 0);

  return (
    <>
      <Flex direction="column" gap="2" mb="7">
        <Heading align="center" size="8">
          Account details
        </Heading>
        <Text align="center" color="gray" size="5">
          Below are your account details
        </Text>
      </Flex>

      {userFields && (
        <Flex direction="column" gap="3" justify="center" width="400px">
          {userFields.map(([label, value]) => (
            <Flex align="center" gap="6" key={String(value)}>
              <Text size="3" style={{ width: 100 }} weight="bold">
                {label}
              </Text>

              <Box flexGrow="1">
                <TextField.Root readOnly value={String(value) || ""} />
              </Box>
            </Flex>
          ))}
        </Flex>
      )}
    </>
  );
}
