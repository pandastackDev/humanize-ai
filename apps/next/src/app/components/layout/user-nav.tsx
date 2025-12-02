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
  Settings,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import signOut from "@/actions/signOut";
import { FeedbackPopover } from "./feedback-popover";
import { ManageCookiesDialog } from "./manage-cookies-dialog";
import { ThemeToggleButtons } from "./theme-toggle-buttons";

export function UserNav({
  user,
}: {
  user: User;
  role?: string | undefined;
  organizationName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [cookiesDialogOpen, setCookiesDialogOpen] = useState(false);
  const [feedbackPopoverOpen, setFeedbackPopoverOpen] = useState(false);

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
            <ThemeToggleButtons />
          </div>
        </div>

        <DropdownMenuSeparator className="mx-negative-sm" />

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
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => {
              setOpen(false);
              setFeedbackPopoverOpen(true);
            }}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Leave feedback
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

        <DropdownMenuSeparator className="mx-negative-sm" />

        {/* Log Out */}
        <DropdownMenuItem
          className="mb-1 h-8 cursor-pointer px-2 py-1-5 text-sm"
          onClick={async () => {
            await signOut();
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>

        {/* Upgrade to Pro Button */}
        <div className="mx-negative-sm border-t px-2 pt-2 pb-2">
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
      <FeedbackPopover
        hideTrigger
        onOpenChange={setFeedbackPopoverOpen}
        open={feedbackPopoverOpen}
      />
    </DropdownMenu>
  );
}
