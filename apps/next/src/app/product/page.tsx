import { ArrowRightIcon } from "@radix-ui/react-icons";
import {
  Box,
  Button,
  Flex,
  Heading,
  Separator,
  Strong,
  Text,
} from "@radix-ui/themes";
import Image from "next/image";

/**
 * Product page, this is where you'd put your company's product.
 * This page is only accessible to signed-in users.
 */
export default function ProductPage() {
  return (
    <Flex
      align="start"
      gap="9"
      height="inherit"
      justify="center"
      ml="9"
      mr="9"
      pb="9"
      pt="7"
      style={{ borderTop: "1px solid lightgray" }}
    >
      <Flex
        align="start"
        direction="column"
        flexGrow="1"
        gap="5"
        justify="center"
        width="50%"
      >
        <Text color="gray" size="1">
          Products / Blankets
        </Text>
        <Heading size="8">Enterprise Ready Blanket</Heading>
        <Text size="6">
          <Strong>$200</Strong>
        </Text>
        <Text color="gray" size="3">
          Introducing the Enterprise Ready Blanket—your cozy companion for
          conquering boardrooms and binge-watching marathons alike!
        </Text>
        <Text color="gray" size="3">
          With enough warmth to make you feel like you’re wrapped in a cloud and
          pockets for remote controls, snacks, and maybe even a cat, this
          blanket is designed to keep you comfy while you tackle the day (or
          night). Whether you’re in a meeting or on the couch, this blanket has
          you covered—literally!
        </Text>
        <Separator size="4" />
        <Text size="3">
          <Strong>Features</Strong>
        </Text>
        <Flex direction="column" gap="2">
          <Flex align="center" gap="3">
            <ArrowRightIcon color="gray" />
            <Text>
              A layer of warmth that feels as secure as a well-guarded password
            </Text>
          </Flex>
          <Flex align="center" gap="3">
            <ArrowRightIcon color="gray" />
            <Text>
              Strategically placed pockets, giving you access to all your
              essentials
            </Text>
          </Flex>
          <Flex align="center" gap="3">
            <ArrowRightIcon color="gray" />
            <Text>
              Expandable and designed to grow with you and your business
            </Text>
          </Flex>
        </Flex>
        <Separator size="4" />
        <Flex align="center" justify="center" width="100%">
          <Button size="4" style={{ flexGrow: 1 }}>
            Add to cart
          </Button>
        </Flex>
      </Flex>
      <Box
        flexGrow="1"
        height="75vh"
        position="relative"
        style={{
          borderRadius: "var(--radius-3)",
          backgroundColor: "var(--gray-3)",
        }}
        width="50%"
      >
        <Image
          alt="Enterprise Ready Blanket"
          fill
          objectFit="contain"
          src="/product/enterprise_blanket.png"
          style={{ padding: "2em" }}
        />
      </Box>
    </Flex>
  );
}
