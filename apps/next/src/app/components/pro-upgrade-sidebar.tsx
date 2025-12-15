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
import Link from "next/link";

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
  if (!proValue) {
    return null;
  }

  const config = proConfigs[proValue];
  if (!config) {
    return null;
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent
        className="w-full overflow-y-auto border-border/50 border-l bg-gradient-to-b from-background to-muted/40 px-0 sm:max-w-md"
        side="right"
      >
        <div className="flex h-full flex-col gap-6 px-5 py-6 sm:px-6">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <SheetTitle className="font-bold text-xl leading-tight">
                  {config.title}
                </SheetTitle>
                <p className="text-muted-foreground text-xs">
                  Upgrade to unlock this tailored mode
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary text-xs">
                PRO
              </span>
            </div>
            <SheetDescription className="sr-only">
              Upgrade to PRO to unlock {config.title} features
            </SheetDescription>
          </SheetHeader>

          {/* Uses Section */}
          <div className="space-y-3 rounded-xl border border-border/70 bg-background/80 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground text-sm">
                Best for
              </h3>
              <span className="text-muted-foreground text-xs">
                {config.uses.length} examples
              </span>
            </div>
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
          <div className="space-y-4 rounded-xl border border-border/70 bg-background/80 p-4 shadow-sm">
            <div className="space-y-2">
              <label className="font-medium text-muted-foreground text-xs">
                Input example
              </label>
              <div className="rounded-lg border border-border bg-muted/70 p-3">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {config.inputExample}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <ArrowDown className="h-5 w-5 text-primary" />
            </div>

            <div className="space-y-2">
              <label className="font-medium text-muted-foreground text-xs">
                Humanized output
              </label>
              <div className="rounded-lg border border-border bg-primary/5 p-3">
                <p className="text-foreground text-sm leading-relaxed">
                  {config.outputExample}
                </p>
              </div>
            </div>
          </div>

          {/* Unlock Button */}
          <div className="sticky bottom-4 mt-auto space-y-2 rounded-xl border border-border/70 bg-background/90 p-4 shadow-md backdrop-blur">
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span>Start a free trial</span>
              <span>Cancel anytime</span>
            </div>
            <Button
              asChild
              className="w-full px-6 py-5 font-semibold text-base shadow-sm"
            >
              <Link href="/pricing">Unlock With Free Trial</Link>
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
