"use client";

import type { User } from "@workos-inc/node";
import { CreditCard, Settings, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import signOut from "@/actions/signOut";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
  organizationName,
}: {
  user: User;
  role: string | undefined;
  organizationName?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

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
      <DropdownMenuContent align="end" className="w-56" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="font-medium text-sm leading-none">{user.firstName}</p>
            <p className="text-muted-foreground text-xs leading-none">
              {user.email}
            </p>
            {organizationName && (
              <div className="mt-2 space-y-1 border-t pt-2">
                <p className="font-medium text-sm leading-none">
                  {organizationName}
                </p>
                {role && (
                  <p className="text-muted-foreground text-xs capitalize leading-none">
                    {role}
                  </p>
                )}
              </div>
            )}
          </div>
        </DropdownMenuLabel>
        {!isDashboard && isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/dashboard" onClick={() => setOpen(false)}>
                  Dashboard
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/pricing" onClick={() => setOpen(false)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Pricing
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/profile" onClick={() => setOpen(false)}>
              <UserIcon className="mr-2 h-4 w-4" />
              Profile Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings" onClick={() => setOpen(false)}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <form action={signOut} className="w-full">
            <Button
              className="w-full justify-start"
              type="submit"
              variant="ghost"
            >
              Sign Out
            </Button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
