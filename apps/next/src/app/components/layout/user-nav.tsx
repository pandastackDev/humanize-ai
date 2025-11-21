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
import { useState } from "react";
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

  const isAdmin = role === "admin";
  const isDashboard = pathname.startsWith("/dashboard");

  return (
    <DropdownMenu onOpenChange={setOpen} open={open}>
      <DropdownMenuTrigger asChild>
        <Button className="relative h-10 w-10 rounded-full" variant="ghost">
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
            <div className="flex items-center gap-1 rounded-md border p-0.5">
              <button
                className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
                  theme === "light"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                onClick={() => setTheme("light")}
                type="button"
              >
                <Sun className="h-4 w-4" />
              </button>
              <button
                className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
                  theme === "dark"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                onClick={() => setTheme("dark")}
                type="button"
              >
                <Moon className="h-4 w-4" />
              </button>
              <button
                className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
                  theme === "system"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                onClick={() => setTheme("system")}
                type="button"
              >
                <Monitor className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Menu Items */}
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings" onClick={() => setOpen(false)}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/support" onClick={() => setOpen(false)}>
              <HelpCircle className="mr-2 h-4 w-4" />
              Contact Support
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/feedback" onClick={() => setOpen(false)}>
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
            className="w-full"
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
