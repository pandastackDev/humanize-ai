import { Button, Code, Flex, Heading, Text } from "@radix-ui/themes";
import { withAuth } from "@workos-inc/authkit-nextjs";
import NextLink from "next/link";
import CopyButton from "./components/copy-button";
import { SignInButton } from "./components/sign-in-button2";

export default async function Home() {
  const { user } = await withAuth();

  return (
    <Flex align="center" flexGrow="1" justify="center">
      <Flex
        align="center"
        direction="column"
        gap="9"
        justify="center"
        maxWidth="75vw"
      >
        <Flex
          align="center"
          direction="column"
          gap="5"
          justify="center"
          maxWidth="50vw"
        >
          <Heading align="center" size="9">
            Humanize
          </Heading>
          <Text align="center" size="7">
            Humanize is a platform for ...
          </Text>
          <CopyButton copyValue="test copy">
            <Code size="4" variant="ghost">
              test copy
            </Code>
          </CopyButton>

          <Flex align="center" direction="column" gap="2">
            {user ? (
              <>
                <Heading size="8">
                  Welcome back{user?.firstName && `, ${user?.firstName}`}
                </Heading>
                <Text color="gray" size="5">
                  You are now authenticated into the application
                </Text>
                <Flex align="center" gap="3" mt="4">
                  <Button asChild size="3" variant="soft">
                    <NextLink href="/account">View account</NextLink>
                  </Button>
                  <SignInButton large />
                </Flex>
              </>
            ) : (
              <>
                <Heading size="8">AuthKit authentication example</Heading>
                <Text color="gray" mb="4" size="5">
                  Sign in to view your account details
                </Text>
                <SignInButton large />
              </>
            )}
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}
