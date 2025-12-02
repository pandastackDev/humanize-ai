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
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ManageCookiesDialog } from "./manage-cookies-dialog";
import { ThemeToggleButtons } from "./theme-toggle-buttons";

export function HelpPopover() {
  const [open, setOpen] = useState(false);
  const [cookiesDialogOpen, setCookiesDialogOpen] = useState(false);

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
        className="w-popover border-border bg-popover p-3"
        side="bottom"
        sideOffset={8}
      >
        {/* Theme Toggle Section */}
        <div className="mb-3 flex items-center justify-center">
          <ThemeToggleButtons />
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
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-black text-sm transition-colors hover:bg-muted hover:text-foreground dark:text-white dark:hover:bg-select-hover"
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
