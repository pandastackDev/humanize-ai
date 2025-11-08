"use client";

import { Flex } from "@radix-ui/themes";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function DashboardContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  let color = "transparent";
  if (mounted) {
    color = resolvedTheme === "light" ? "white" : "transparent";
  }

  return (
    <Flex
      align="stretch"
      direction="column"
      flexGrow="1"
      p="4"
      style={{
        borderRadius: "var(--radius-3)",
        backgroundColor: color,
        border: "1px solid var(--gray-3)",
      }}
    >
      {children}
    </Flex>
  );
}
