"use client";

import { Button } from "@humanize/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@humanize/ui/components/sheet";
import { ArrowDown } from "lucide-react";
import { useRouter } from "next/navigation";

type ProUpgradeSidebarProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proType: "readability" | "purpose" | null;
  proValue: string | null;
};

// PRO item configurations
const proConfigs: Record<
  string,
  {
    title: string;
    uses: string[];
    inputExample: string;
    outputExample: string;
  }
> = {
  // Readability levels
  doctorate: {
    title: "Doctorate",
    uses: ["Academic papers", "Research publications", "Dissertations"],
    inputExample:
      "The research methodology employed quantitative analysis techniques.",
    outputExample:
      "The study utilized quantitative analysis methods to examine the data.",
  },
  journalist: {
    title: "Journalist",
    uses: ["News stories", "Features", "Investigations"],
    inputExample: "Officials gave a statement about the project.",
    outputExample: "Officials made a statement concerning the project.",
  },
  marketing: {
    title: "Marketing",
    uses: ["Ad copy", "Product descriptions", "Campaigns"],
    inputExample: "Our product offers amazing features for users.",
    outputExample: "Our product delivers exceptional features for customers.",
  },
  // Purpose types
  article: {
    title: "Article",
    uses: ["Blog posts", "Editorials", "Opinion pieces"],
    inputExample: "The topic has been discussed extensively in recent studies.",
    outputExample: "Recent research has explored this topic in great detail.",
  },
  story: {
    title: "Story",
    uses: ["Narratives", "Creative writing", "Fiction"],
    inputExample: "The character walked through the dark forest.",
    outputExample: "The character journeyed through the shadowy woodland.",
  },
  "cover-letter": {
    title: "Cover Letter",
    uses: [
      "Job applications",
      "Professional introductions",
      "Career documents",
    ],
    inputExample: "I am writing to express my interest in the position.",
    outputExample: "I'm reaching out to convey my enthusiasm for this role.",
  },
  report: {
    title: "Report",
    uses: ["Business reports", "Analytical documents", "Summaries"],
    inputExample: "The data indicates a significant increase in performance.",
    outputExample: "The findings reveal a substantial improvement in results.",
  },
  business: {
    title: "Business Material",
    uses: ["Proposals", "Presentations", "Communications"],
    inputExample: "We need to implement the new strategy immediately.",
    outputExample: "We should execute the updated approach right away.",
  },
  legal: {
    title: "Legal Material",
    uses: ["Contracts", "Legal documents", "Compliance"],
    inputExample: "The agreement specifies the terms and conditions.",
    outputExample: "The contract outlines the stipulated terms and provisions.",
  },
};

export function ProUpgradeSidebar({
  open,
  onOpenChange,
  proValue,
}: ProUpgradeSidebarProps) {
  const router = useRouter();

  if (!proValue) {
    return null;
  }

  const config = proConfigs[proValue];
  if (!config) {
    return null;
  }

  const handleUnlock = () => {
    router.push("/pricing");
  };

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md" side="right">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="font-bold text-xl">
              {config.title}
            </SheetTitle>
          </div>
          <SheetDescription className="sr-only">
            Upgrade to PRO to unlock {config.title} features
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Uses Section */}
          <div>
            <h3 className="mb-3 font-semibold text-foreground text-sm">Uses</h3>
            <div className="flex flex-wrap gap-2">
              {config.uses.map((use) => (
                <span
                  className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary text-xs dark:bg-primary/20"
                  key={use}
                >
                  {use}
                </span>
              ))}
            </div>
          </div>

          {/* Examples Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="font-medium text-muted-foreground text-xs">
                Input Example
              </label>
              <div className="rounded-lg border border-border bg-muted p-3">
                <p className="text-muted-foreground text-sm">
                  {config.inputExample}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <ArrowDown className="h-5 w-5 text-primary" />
            </div>

            <div className="space-y-2">
              <label className="font-medium text-muted-foreground text-xs">
                Humanized Output
              </label>
              <div className="rounded-lg border border-border bg-muted p-3">
                <p className="text-muted-foreground text-sm">
                  {config.outputExample}
                </p>
              </div>
            </div>
          </div>

          {/* Unlock Button */}
          <div className="space-y-2">
            <Button
              className="w-full px-6 py-6 font-semibold text-base"
              onClick={handleUnlock}
            >
              Unlock With Free Trial
            </Button>
            <p className="text-center text-muted-foreground text-xs">
              3 day refund guarantee
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
