"use client";

import { Button } from "@humanize/ui/components/button";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@humanize/ui/components/popover";
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
      setIsSystemMode(true);
      const isNight = getIsNightTime();
      setIsNightTime(isNight);
      setTheme(isNight ? "dark" : "light");
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
        setIsSystemMode(false);
      }
    }
  }, [theme]);

  // Compute system button active state class
  let systemButtonClass =
    "text-slate-500 hover:text-slate-900 dark:text-slate-400";
  if (isSystemMode) {
    systemButtonClass =
      "bg-slate-100 text-slate-900 dark:bg-[#282828] dark:text-white border border-slate-300 dark:border-[#3a3a3a]";
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          className="h-9 w-9 rounded-full border border-slate-200 bg-white p-0 text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-[#343434] dark:bg-[#1d1d1d] dark:text-slate-400 dark:hover:bg-[#282828] dark:hover:text-white"
          size="icon"
          variant="outline"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[240px] border-slate-200 bg-white p-3 dark:border-[#1d1d1d] dark:bg-[#1d1d1d]"
        side="bottom"
        sideOffset={8}
      >
        {/* Theme Toggle Section */}
        <div className="mb-3">
          <div className="flex items-center justify-center gap-1 rounded-md border border-slate-200 bg-slate-50 p-0.5 dark:border-[#343434] dark:bg-[#141414]">
            <button
              className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
                !isSystemMode && theme === "light"
                  ? "border border-slate-200 bg-white text-slate-900 shadow-sm dark:border-[#3a3a3a]"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
              onClick={() => {
                setIsSystemMode(false);
                localStorage.setItem("theme", "light");
                setTheme("light");
              }}
              type="button"
            >
              <Sun className="h-4 w-4" />
            </button>
            <button
              className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
                !isSystemMode && theme === "dark"
                  ? "border border-slate-200 bg-white text-slate-900 shadow-sm dark:border-[#3a3a3a] dark:bg-[#282828] dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
              onClick={() => {
                setIsSystemMode(false);
                localStorage.setItem("theme", "dark");
                setTheme("dark");
              }}
              type="button"
            >
              <Moon className="h-4 w-4" />
            </button>
            <button
              className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${systemButtonClass}`}
              onClick={() => {
                const isNight = getIsNightTime();
                setIsNightTime(isNight);
                setIsSystemMode(true);
                localStorage.setItem("theme", "system");
                setTheme(isNight ? "dark" : "light");
              }}
              type="button"
            >
              <Monitor className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Main Menu Items */}
        <div className="space-y-1">
          <Link
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-slate-600 text-sm transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#282828] dark:hover:text-white"
            href="/pricing"
            onClick={() => setOpen(false)}
          >
            <Hexagon className="h-4 w-4" />
            See plans and pricing
          </Link>
          <Link
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-slate-600 text-sm transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#282828] dark:hover:text-white"
            href="/support"
            onClick={() => setOpen(false)}
          >
            <Settings className="h-4 w-4" />
            Contact Support
          </Link>
        </div>

        {/* Secondary Menu Items */}
        <div className="mt-3 space-y-1 border-slate-200 border-t pt-3 dark:border-[#343434]">
          <Link
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-slate-600 text-sm transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#282828] dark:hover:text-white"
            href="/feedback"
            onClick={() => setOpen(false)}
          >
            <MessageSquare className="h-4 w-4" />
            Leave feedback
          </Link>
          <button
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-slate-600 text-sm transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#282828] dark:hover:text-white"
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
