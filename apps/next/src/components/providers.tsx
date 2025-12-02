"use client";

import { Toaster } from "@humanize/ui/components/sonner";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";
import { useEffect } from "react";

// Component to prevent flash of wrong theme on page load
function ThemeCleanup() {
  // Prevent flash by applying theme from theme immediately
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Get theme preference from our custom key
    const storedTheme = localStorage.getItem("theme");
    if (
      storedTheme === "light" ||
      storedTheme === "dark" ||
      storedTheme === "system"
    ) {
      // Apply theme immediately to prevent flash
      const html = document.documentElement;
      if (storedTheme === "system") {
        // For system, check OS preference
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        html.classList.remove("light", "dark");
        html.classList.add(prefersDark ? "dark" : "light");
      } else {
        html.classList.remove("light", "dark");
        html.classList.add(storedTheme);
      }
    }
  }, []);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
      enableColorScheme
      enableSystem
    >
      <ThemeCleanup />
      {children}
      <Toaster />
    </NextThemesProvider>
  );
}
