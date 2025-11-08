import { Flex, Heading, Strong, Text } from "@radix-ui/themes";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { Pricing } from "../components/pricing";
import { SignInButton } from "../components/sign-in-button";

export default async function PricingPage() {
  const { user } = await withAuth();

  return (
    <Flex
      align="center"
      direction="column"
      flexGrow="1"
      gap="5"
      justify="center"
    >
      <Heading size="9">Pricing</Heading>
      <Text mb="6">Fair and transparent pricing for our services.</Text>
      <Pricing />
      {!user && (
        <Flex align="center" direction="column" gap="3" mt="6">
          <Text as="div" size="8">
            <Strong>Ready to get started?</Strong>
          </Text>
          <SignInButton large signUp />
        </Flex>
      )}
    </Flex>
  );
}
