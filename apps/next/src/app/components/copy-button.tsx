"use client";

import { Button } from "@humanize/ui/components/button";
import { Check, Copy } from "lucide-react";
import { type ReactNode, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@humanize/ui/components/tooltip";

export default function CopyButton({
  children,
  copyValue,
}: {
  children: ReactNode;
  copyValue: string;
}) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    setCopied(true);

    try {
      await navigator.clipboard.writeText(copyValue);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
      setCopied(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="cursor-pointer gap-2"
            onClick={copyToClipboard}
            size="lg"
            variant="outline"
          >
            {children}
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{copied ? "Copied!" : "Copy to clipboard"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
