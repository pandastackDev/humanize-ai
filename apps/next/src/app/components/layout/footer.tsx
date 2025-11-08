import { Box, Text } from "@radix-ui/themes";

export function Footer() {
	return (
		<Box>
			<Box as="div" position="absolute" left="9" bottom="5">
				<Text>Copyright © 2025 Humanize. All rights reserved.</Text>
			</Box>
			<Box as="div" position="absolute" right="9" bottom="5">
				social media links
			</Box>
		</Box>
	);
}
