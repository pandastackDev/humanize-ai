"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { memo, useCallback, useLayoutEffect, useState } from "react";

function ThemeToggleButtonsComponent() {
  const { setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Local in-memory selection so we don't rely only on localStorage
  const [selectedTheme, setSelectedTheme] = useState<
    "light" | "dark" | "system"
  >("system");

  // Initialize theme preference from localStorage on mount
  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Get theme from localStorage
    const storedTheme = localStorage.getItem("theme");

    // Set initial theme preference
    if (
      storedTheme === "light" ||
      storedTheme === "dark" ||
      storedTheme === "system"
    ) {
      // Apply the theme immediately to prevent flash
      setTheme(storedTheme);
      // Use a callback to set state after theme is applied
      requestAnimationFrame(() => {
        setSelectedTheme((prev) =>
          prev === storedTheme ? prev : (storedTheme as typeof prev)
        );
      });
    } else {
      // Default to system if not set
      localStorage.setItem("theme", "system");
      setTheme("system");
      requestAnimationFrame(() => {
        setSelectedTheme("system");
      });
    }

    requestAnimationFrame(() => {
      setMounted(true);
    });
  }, [setTheme]);

  const handleThemeChange = useCallback(
    (next: "light" | "dark" | "system") => {
      if (selectedTheme === next) {
        return;
      }
      setSelectedTheme(next);
      localStorage.setItem("theme", next);
      setTheme(next);
    },
    [selectedTheme, setTheme]
  );

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="flex items-center gap-1 rounded-md border border-muted bg-muted p-0.5">
        <div className="h-7 w-7" />
        <div className="h-7 w-7" />
        <div className="h-7 w-7" />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 rounded-md border border-muted bg-muted p-0.5">
      <button
        className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
          selectedTheme === "light"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
        onClick={() => handleThemeChange("light")}
        type="button"
      >
        <Sun
          className={`h-5 w-5 cursor-pointer ${
            selectedTheme === "light"
              ? "text-foreground"
              : "text-muted-foreground"
          }`}
        />
      </button>
      <button
        className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
          selectedTheme === "dark"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
        onClick={() => handleThemeChange("dark")}
        type="button"
      >
        <Moon
          className={`h-5 w-5 cursor-pointer ${
            selectedTheme === "dark"
              ? "text-foreground"
              : "text-muted-foreground"
          }`}
        />
      </button>
      <button
        className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
          selectedTheme === "system"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
        onClick={() => handleThemeChange("system")}
        type="button"
      >
        <Monitor
          className={`h-5 w-5 cursor-pointer ${
            selectedTheme === "system"
              ? "text-foreground"
              : "text-muted-foreground"
          }`}
        />
      </button>
    </div>
  );
}

export const ThemeToggleButtons = memo(ThemeToggleButtonsComponent);
