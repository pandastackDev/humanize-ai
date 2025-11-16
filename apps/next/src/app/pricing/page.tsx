import { Flex, Heading, Strong, Text } from "@radix-ui/themes";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { Pricing } from "../components/pricing";
import { SignInButton } from "../components/sign-in-button";

export default async function PricingPage() {
  const { user } = await withAuth();

  return (
    <Flex
      align="center"
      className="w-full px-4 py-8 sm:px-6"
      direction="column"
      flexGrow="1"
      gap="5"
      justify="center"
      p="4"
    >
      <Heading
        className="text-center text-4xl sm:text-6xl lg:text-8xl"
        size="9"
      >
        Pricing
      </Heading>
      <Text className="text-center text-sm sm:text-base" mb="6">
        Fair and transparent pricing for our services.
      </Text>
      <div className="w-full max-w-7xl px-4 sm:px-6">
        <Pricing />
      </div>
      {!user && (
        <Flex
          align="center"
          className="w-full px-4"
          direction="column"
          gap="3"
          mt="6"
        >
          <Text as="div" className="text-center text-xl sm:text-2xl" size="8">
            <Strong>Ready to get started?</Strong>
          </Text>
          <SignInButton large signUp />
        </Flex>
      )}
    </Flex>
  );
}
