"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useLayoutEffect, useState } from "react";

export function ThemeToggleButtons() {
  const { setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Track the actual theme preference (light, dark, or system)
  const [themePreference, setThemePreference] = useState<
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
        setThemePreference(storedTheme);
      });
    } else {
      // Default to system if not set
      localStorage.setItem("theme", "system");
      setTheme("system");
      requestAnimationFrame(() => {
        setThemePreference("system");
      });
    }

    requestAnimationFrame(() => {
      setMounted(true);
    });
  }, [setTheme]);

  // Sync theme preference with localStorage on mount and when theme changes externally
  useEffect(() => {
    if (!mounted) {
      return;
    }

    // Only sync if localStorage doesn't match current preference
    // This prevents interference when we're managing the theme ourselves
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "light" && themePreference !== "light") {
      requestAnimationFrame(() => {
        setThemePreference("light");
      });
    } else if (storedTheme === "dark" && themePreference !== "dark") {
      requestAnimationFrame(() => {
        setThemePreference("dark");
      });
    } else if (storedTheme === "system" && themePreference !== "system") {
      requestAnimationFrame(() => {
        setThemePreference("system");
      });
    }
  }, [mounted, themePreference]);

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
          themePreference === "light"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
        onClick={() => {
          setThemePreference("light");
          localStorage.setItem("theme", "light");
          setTheme("light");
        }}
        type="button"
      >
        <Sun
          className={`h-5 w-5 cursor-pointer ${
            themePreference === "light"
              ? "text-foreground"
              : "text-muted-foreground"
          }`}
        />
      </button>
      <button
        className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
          themePreference === "dark"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
        onClick={() => {
          setThemePreference("dark");
          localStorage.setItem("theme", "dark");
          setTheme("dark");
        }}
        type="button"
      >
        <Moon
          className={`h-5 w-5 cursor-pointer ${
            themePreference === "dark"
              ? "text-foreground"
              : "text-muted-foreground"
          }`}
        />
      </button>
      <button
        className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
          themePreference === "system"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
        onClick={() => {
          // Set preference to system and save to localStorage
          setThemePreference("system");
          localStorage.setItem("theme", "system");
          // Let next-themes handle system theme (uses OS preference)
          setTheme("system");
        }}
        type="button"
      >
        <Monitor
          className={`h-5 w-5 cursor-pointer ${
            themePreference === "system"
              ? "text-foreground"
              : "text-muted-foreground"
          }`}
        />
      </button>
    </div>
  );
}
