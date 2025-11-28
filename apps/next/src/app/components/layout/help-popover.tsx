"use client";

import { Button } from "@humanize/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@humanize/ui/components/popover";
import {
  Cookie,
  HelpCircle,
  Hexagon,
  MessageSquare,
  Monitor,
  Moon,
  Settings,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { ManageCookiesDialog } from "./manage-cookies-dialog";

// Helper function to detect if it's night time (6 PM to 6 AM)
const getIsNightTime = (): boolean => {
  const now = new Date();
  const hours = now.getHours();
  // Night time: 6 PM (18:00) to 6 AM (06:00)
  return hours >= 18 || hours < 6;
};

export function HelpPopover() {
  const [open, setOpen] = useState(false);
  const [cookiesDialogOpen, setCookiesDialogOpen] = useState(false);
  const { setTheme, theme } = useTheme();
  const [isSystemMode, setIsSystemMode] = useState(false);
  const [isNightTime, setIsNightTime] = useState(getIsNightTime());

  // Check if system mode is active on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "system") {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setIsSystemMode(true);
        const isNight = getIsNightTime();
        setIsNightTime(isNight);
        setTheme(isNight ? "dark" : "light");
      }, 0);
    }
  }, [setTheme]);

  // Update theme based on time when system mode is active
  useEffect(() => {
    if (isSystemMode) {
      const checkTime = () => {
        const isNight = getIsNightTime();
        setIsNightTime(isNight);
        setTheme(isNight ? "dark" : "light");
      };

      // Check immediately
      checkTime();

      // Check every minute to catch time changes
      const interval = setInterval(checkTime, 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [isSystemMode, setTheme]);

  // Reset system mode when user manually selects light or dark
  useEffect(() => {
    if (theme === "light" || theme === "dark") {
      const storedTheme = localStorage.getItem("theme");
      if (storedTheme !== "system") {
        // Use setTimeout to avoid synchronous setState in effect
        setTimeout(() => {
          setIsSystemMode(false);
        }, 0);
      }
    }
  }, [theme]);

  // Compute system button active state class
  let systemButtonClass = "text-muted-foreground hover:text-foreground";
  if (isSystemMode) {
    systemButtonClass = isNightTime
      ? "bg-muted text-foreground"
      : "bg-muted text-foreground";
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          className="h-9 w-9 rounded-full border border-input bg-background p-0 text-muted-foreground hover:bg-accent hover:text-foreground"
          size="icon"
          variant="outline"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[240px] border-border bg-popover p-3"
        side="bottom"
        sideOffset={8}
      >
        {/* Theme Toggle Section */}
        <div className="mb-3">
          <div className="flex items-center justify-center gap-1 rounded-md border border-border bg-muted p-0.5">
            <button
              className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
                !isSystemMode && theme === "light"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => {
                setIsSystemMode(false);
                setTheme("light");
              }}
              type="button"
            >
              <Sun
                className={`h-5 w-5 cursor-pointer ${
                  !isSystemMode && theme === "light"
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              />
            </button>
            <button
              className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
                !isSystemMode && theme === "dark"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => {
                setIsSystemMode(false);
                setTheme("dark");
              }}
              type="button"
            >
              <Moon
                className={`h-5 w-5 cursor-pointer ${
                  !isSystemMode && theme === "dark"
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              />
            </button>
            <button
              className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${systemButtonClass}`}
              onClick={() => {
                const isNight = getIsNightTime();
                setIsNightTime(isNight);
                setIsSystemMode(true);
                // Store preference as system
                localStorage.setItem("theme", "system");
                // Apply time-based theme immediately
                setTheme(isNight ? "dark" : "light");
              }}
              type="button"
            >
              <Monitor
                className={`h-5 w-5 cursor-pointer ${
                  isSystemMode ? "text-foreground" : "text-muted-foreground"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Main Menu Items */}
        <div className="space-y-1">
          <Link
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-black text-sm transition-colors hover:bg-accent hover:text-foreground dark:text-white"
            href="/pricing"
            onClick={() => setOpen(false)}
          >
            <Hexagon className="h-4 w-4" />
            See plans and pricing
          </Link>
          <Link
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-black text-sm transition-colors hover:bg-accent hover:text-foreground dark:text-white"
            href="/support"
            onClick={() => setOpen(false)}
          >
            <Settings className="h-4 w-4" />
            Contact Support
          </Link>
        </div>

        {/* Secondary Menu Items */}
        <div className="mt-3 space-y-1 border-border border-t pt-3">
          <Link
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-black text-sm transition-colors hover:bg-accent hover:text-foreground dark:text-white"
            href="/feedback"
            onClick={() => setOpen(false)}
          >
            <MessageSquare className="h-4 w-4" />
            Leave feedback
          </Link>
          <button
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-black text-sm transition-colors hover:bg-muted hover:text-foreground dark:text-white dark:hover:bg-[var(--color-select-hover)]"
            onClick={() => {
              setOpen(false);
              setCookiesDialogOpen(true);
            }}
            type="button"
          >
            <Cookie className="h-4 w-4" />
            Manage cookies
          </button>
        </div>
      </PopoverContent>

      <ManageCookiesDialog
        onOpenChange={setCookiesDialogOpen}
        open={cookiesDialogOpen}
      />
    </Popover>
  );
}
