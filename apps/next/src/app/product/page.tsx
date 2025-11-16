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
      className="w-full sm:flex-row sm:gap-9 sm:px-9"
      direction="column"
      gap="6"
      height="inherit"
      justify="center"
      pb="9"
      pt="7"
      px="4"
      style={{ borderTop: "1px solid lightgray" }}
    >
      <Flex
        align="start"
        className="sm:w-1/2"
        direction="column"
        flexGrow="1"
        gap="5"
        justify="center"
        width="100%"
      >
        <Text className="text-xs" color="gray" size="1">
          Products / Blankets
        </Text>
        <Heading className="text-3xl sm:text-4xl lg:text-5xl" size="8">
          Enterprise Ready Blanket
        </Heading>
        <Text className="text-2xl sm:text-3xl" size="6">
          <Strong>$200</Strong>
        </Text>
        <Text className="text-sm sm:text-base" color="gray" size="3">
          Introducing the Enterprise Ready Blanket—your cozy companion for
          conquering boardrooms and binge-watching marathons alike!
        </Text>
        <Text className="text-sm sm:text-base" color="gray" size="3">
          With enough warmth to make you feel like you're wrapped in a cloud and
          pockets for remote controls, snacks, and maybe even a cat, this
          blanket is designed to keep you comfy while you tackle the day (or
          night). Whether you're in a meeting or on the couch, this blanket has
          you covered—literally!
        </Text>
        <Separator size="4" />
        <Text className="font-semibold text-base" size="3">
          <Strong>Features</Strong>
        </Text>
        <Flex direction="column" gap="2">
          <Flex align="center" gap="3">
            <ArrowRightIcon className="shrink-0" color="gray" />
            <Text className="text-sm sm:text-base">
              A layer of warmth that feels as secure as a well-guarded password
            </Text>
          </Flex>
          <Flex align="center" gap="3">
            <ArrowRightIcon className="shrink-0" color="gray" />
            <Text className="text-sm sm:text-base">
              Strategically placed pockets, giving you access to all your
              essentials
            </Text>
          </Flex>
          <Flex align="center" gap="3">
            <ArrowRightIcon className="shrink-0" color="gray" />
            <Text className="text-sm sm:text-base">
              Expandable and designed to grow with you and your business
            </Text>
          </Flex>
        </Flex>
        <Separator size="4" />
        <Flex align="center" justify="center" width="100%">
          <Button className="w-full sm:w-auto" size="4" style={{ flexGrow: 1 }}>
            Add to cart
          </Button>
        </Flex>
      </Flex>
      <Box
        className="sm:h-[75vh] sm:w-1/2"
        flexGrow="1"
        height="50vh"
        position="relative"
        style={{
          borderRadius: "var(--radius-3)",
          backgroundColor: "var(--gray-3)",
        }}
        width="100%"
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
