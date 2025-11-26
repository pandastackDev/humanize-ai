"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@humanize/ui/components/avatar";
import { Button } from "@humanize/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@humanize/ui/components/dropdown-menu";
import type { User } from "@workos-inc/node";
import {
  Cookie,
  HelpCircle,
  LogOut,
  MessageSquare,
  Monitor,
  Moon,
  Settings,
  Sun,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import signOut from "@/actions/signOut";
import { ManageCookiesDialog } from "./manage-cookies-dialog";

// Helper function to detect if it's night time (6 PM to 6 AM)
const getIsNightTime = (): boolean => {
  const now = new Date();
  const hours = now.getHours();
  // Night time: 6 PM (18:00) to 6 AM (06:00)
  return hours >= 18 || hours < 6;
};

export function UserNav({
  user,
}: {
  user: User;
  role?: string | undefined;
  organizationName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [cookiesDialogOpen, setCookiesDialogOpen] = useState(false);
  const { setTheme, theme } = useTheme();
  const [isSystemMode, setIsSystemMode] = useState(false);
  const [isNightTime, setIsNightTime] = useState(getIsNightTime());

  // Removed unused variables: isAdmin, isDashboard

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
      <DropdownMenuContent align="end" className="w-64" forceMount>
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
            <div className="flex items-center gap-1 rounded-md border border-border bg-muted p-0.5">
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
        </div>

        <DropdownMenuSeparator className="mx-[-4px]" />

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
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => {
              setOpen(false);
              setCookiesDialogOpen(true);
            }}
          >
            <Cookie className="mr-2 h-4 w-4" />
            Manage cookies
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="mx-[-4px]" />

        {/* Log Out */}
        <DropdownMenuItem
          className="mb-1 h-8 cursor-pointer px-2 py-1.5 text-sm"
          onClick={async () => {
            await signOut();
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>

        {/* Upgrade to Pro Button */}
        <div className="mx-[-4px] border-t px-2 pt-2 pb-2">
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
      <ManageCookiesDialog
        onOpenChange={setCookiesDialogOpen}
        open={cookiesDialogOpen}
      />
    </DropdownMenu>
  );
}
