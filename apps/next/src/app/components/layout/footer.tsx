import { Box, Text } from "@radix-ui/themes";

export function Footer() {
  return (
    <Box>
      <Box as="div" bottom="5" left="9" position="absolute">
        <Text>Copyright © 2025 Humanize. All rights reserved.</Text>
      </Box>
      <Box as="div" bottom="5" position="absolute" right="9">
        social media links
      </Box>
    </Box>
  );
}
