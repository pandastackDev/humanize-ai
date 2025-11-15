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
      p="4"
      className="w-full px-4 py-8 sm:px-6"
    >
      <Heading size="9" className="text-center text-4xl sm:text-6xl lg:text-8xl">Pricing</Heading>
      <Text mb="6" className="text-center text-sm sm:text-base">Fair and transparent pricing for our services.</Text>
      <div className="w-full max-w-7xl px-4 sm:px-6">
        <Pricing />
      </div>
      {!user && (
        <Flex align="center" direction="column" gap="3" mt="6" className="w-full px-4">
          <Text as="div" size="8" className="text-center text-xl sm:text-2xl">
            <Strong>Ready to get started?</Strong>
          </Text>
          <SignInButton large signUp />
        </Flex>
      )}
    </Flex>
  );
}
