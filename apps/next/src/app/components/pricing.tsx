import { CheckIcon } from "@radix-ui/react-icons";
import { Box, Card, Flex, Strong, Text } from "@radix-ui/themes";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { ModalDialog } from "./modal-dialog";

// Ideally this data would come from a database or API
const plans = [
  {
    name: "Basic",
    teamMembers: 3,
    price: 5,
    currency: "$",
    cadence: "monthly",
    features: ["Lorem ipsum", "Lorem ipsum", "Lorem ipsum", "Lorem ipsum"],
    highlight: false,
  },
  {
    name: "Standard",
    teamMembers: 10,
    price: 10,
    currency: "$",
    cadence: "monthly",
    features: ["Lorem ipsum", "Lorem ipsum", "Lorem ipsum", "Lorem ipsum"],
    highlight: false,
  },
  {
    name: "Enterprise",
    teamMembers: "Unlimited",
    price: 100,
    currency: "$",
    cadence: "yearly",
    features: ["Audit logs", "Lorem ipsum", "Lorem ipsum", "Lorem ipsum"],
    highlight: true,
  },
];

export async function Pricing() {
  const { user } = await withAuth();

  return (
    <Flex gap="5" minWidth="50vw">
      {plans.map((plan) => (
        <Box flexGrow="1" key={plan.name}>
          <Card
            size="3"
            style={plan.highlight ? { border: "1px solid blue" } : undefined}
          >
            <Flex direction="column" gap="4">
              <Flex direction="column" gap="0">
                <Text
                  as="p"
                  color={plan.highlight ? "blue" : undefined}
                  size="5"
                >
                  {plan.name}
                </Text>
                <Text color="gray" size="1">
                  {plan.teamMembers} team members
                </Text>
              </Flex>
              <Flex align="center" gap="2">
                <Text size="8">
                  <Strong>
                    {plan.currency}
                    {plan.price}
                  </Strong>
                </Text>
                <Flex direction="column">
                  <Text color="gray" size="1">
                    per month,
                  </Text>
                  <Text color="gray" size="1">
                    billed {plan.cadence}
                  </Text>
                </Flex>
              </Flex>
              <Flex direction="column" gap="2">
                {plan.features.map((feature) => (
                  <Flex align="center" gap="2" key={feature}>
                    <CheckIcon />
                    <Text size="1">{feature}</Text>
                  </Flex>
                ))}
              </Flex>
              {user && (
                <ModalDialog subscriptionLevel={plan.name} userId={user.id} />
              )}
            </Flex>
          </Card>
        </Box>
      ))}
    </Flex>
  );
}
