import { Box, ScrollArea } from "@radix-ui/themes";
import type React from "react";

export default function PageContainer({
  children,
  scrollable = false,
}: {
  children: React.ReactNode;
  scrollable?: boolean;
}) {
  return (
    <>
      {scrollable ? (
        <ScrollArea type="always">
          <Box height="calc(100dvh-64px)" pl="8" pt="4">
            {children}
          </Box>
        </ScrollArea>
      ) : (
        <Box p="2">{children}</Box>
      )}
    </>
  );
}
