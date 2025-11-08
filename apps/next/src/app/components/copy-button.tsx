"use client";

import { CheckIcon, CopyIcon } from "@radix-ui/react-icons";
import { Box, Button, Tooltip } from "@radix-ui/themes";
import { useTheme } from "next-themes";
import { type ReactNode, useEffect, useState } from "react";

export default function CopyButton({
  children,
  copyValue,
}: {
  children: ReactNode;
  copyValue: string;
}) {
  const [copied, setCopied] = useState(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const copyToClipboard = async () => {
    setCopied(true);

    try {
      await navigator.clipboard.writeText(copyValue);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  let color: "gray" | "blue" = "blue";
  if (mounted) {
    color = resolvedTheme === "dark" ? "gray" : "blue";
  }

  return (
    <Box>
      <Button
        color={color}
        onClick={copyToClipboard}
        size="3"
        style={{ cursor: "pointer" }}
        variant="surface"
      >
        {children}
        <Tooltip content={copied ? "Copied" : "Copy"}>
          {copied ? <CheckIcon /> : <CopyIcon />}
        </Tooltip>
      </Button>
    </Box>
  );
}
