"use client";

import { User as UserIcon } from "lucide-react";
import type { User } from "@workos-inc/node";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import signOut from "@/actions/signOut";

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
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.profilePictureUrl as string} alt={user.firstName || ""} />
            <AvatarFallback>
              {user.firstName?.[0] || <UserIcon className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.firstName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            {organizationName && (
              <div className="mt-2 space-y-1 border-t pt-2">
                <p className="text-sm font-medium leading-none">
                  {organizationName}
                </p>
                {role && (
                  <p className="text-xs leading-none text-muted-foreground capitalize">
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
        {isDashboard && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/product" onClick={() => setOpen(false)}>
                  Product
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <form action={signOut} className="w-full">
            <Button type="submit" variant="ghost" className="w-full justify-start">
              Sign Out
            </Button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
