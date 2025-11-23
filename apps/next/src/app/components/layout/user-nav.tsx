"use client";

import { Button } from "@humanize/ui/components/button";
import type { User } from "@workos-inc/node";
import {
  HelpCircle,
  MessageSquare,
  Monitor,
  Moon,
  Settings,
  Sun,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import signOut from "@/actions/signOut";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Helper function to detect if it's night time (6 PM to 6 AM)
const getIsNightTime = (): boolean => {
  const now = new Date();
  const hours = now.getHours();
  // Night time: 6 PM (18:00) to 6 AM (06:00)
  return hours >= 18 || hours < 6;
};

export function UserNav({
  user,
  role,
}: {
  user: User;
  role: string | undefined;
  organizationName?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { setTheme, theme } = useTheme();
  const [isSystemMode, setIsSystemMode] = useState(false);
  const [isNightTime, setIsNightTime] = useState(getIsNightTime());

  const isAdmin = role === "admin";
  const isDashboard = pathname.startsWith("/dashboard");

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
  let systemButtonClass = "text-slate-500 hover:text-slate-900";
  if (isSystemMode) {
    systemButtonClass = isNightTime
      ? "bg-slate-100 text-slate-900 dark:bg-[#282828] dark:text-white"
      : "bg-slate-100 text-slate-900 dark:bg-[#282828] dark:text-white";
  }

  return (
    <DropdownMenu onOpenChange={setOpen} open={open}>
      <DropdownMenuTrigger asChild>
        <Button
          className="relative h-10 w-10 cursor-pointer rounded-full"
          variant="ghost"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage
              alt={user.firstName || ""}
              src={user.profilePictureUrl as string}
            />
            <AvatarFallback>
              {user.firstName?.[0] || <UserIcon className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64 dark:bg-[#1d1d1d]"
        forceMount
      >
        {/* User Info Section - Simple like third image */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-0.5">
            <p className="font-semibold text-base leading-none">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-muted-foreground text-sm leading-none">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>

        {/* Theme Toggle Section */}
        <div className="px-2 py-1">
          <div className="flex items-center justify-between">
            {/* <span className="text-muted-foreground text-sm">Theme</span> */}
            <div className="flex items-center gap-1 rounded-md border p-0.5 dark:border-[#343434] dark:bg-[#343434]">
              <button
                className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
                  !isSystemMode && theme === "light"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                onClick={() => {
                  setIsSystemMode(false);
                  setTheme("light");
                }}
                type="button"
              >
                <Sun className="h-5 w-5 cursor-pointer dark:text-[#7a7a7a]" />
              </button>
              <button
                className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
                  !isSystemMode && theme === "dark"
                    ? "bg-slate-100 text-slate-900 dark:bg-[#282828] dark:text-white"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                onClick={() => {
                  setIsSystemMode(false);
                  setTheme("dark");
                }}
                type="button"
              >
                <Moon className="h-5 w-5 cursor-pointer dark:text-white" />
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
                <Monitor className="h-5 w-5 cursor-pointer dark:text-[#7a7a7a]" />
              </button>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Menu Items */}
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link
              className="cursor-pointer"
              href="/dashboard/settings"
              onClick={() => setOpen(false)}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              className="cursor-pointer"
              href="/support"
              onClick={() => setOpen(false)}
            >
              <HelpCircle className="mr-2 h-4 w-4" />
              Contact Support
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              className="cursor-pointer"
              href="/feedback"
              onClick={() => setOpen(false)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Leave feedback
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Log Out */}
        <DropdownMenuItem
          className="h-8 cursor-pointer px-2 py-1.5 text-sm"
          onClick={async () => {
            await signOut();
          }}
        >
          Log out
        </DropdownMenuItem>

        {/* Upgrade to Pro Button */}
        <div className="border-t p-2">
          <Button
            className="w-full cursor-pointer"
            onClick={() => {
              setOpen(false);
              window.location.href = "/pricing";
            }}
            variant="outline"
          >
            Upgrade to Pro
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
