"use client";

import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { DropdownMenu, IconButton } from "@radix-ui/themes";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  let Icon = SunIcon;
  if (mounted) {
    Icon = resolvedTheme === "light" ? SunIcon : MoonIcon;
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <IconButton style={{ cursor: "pointer" }} variant="ghost">
          <Icon
            style={{ height: "1.2rem", width: "1.2rem", transition: "all" }}
          />
        </IconButton>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end">
        <DropdownMenu.Item onClick={() => setTheme("light")}>
          Light
        </DropdownMenu.Item>
        <DropdownMenu.Item onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenu.Item>
        <DropdownMenu.Item onClick={() => setTheme("system")}>
          System
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
