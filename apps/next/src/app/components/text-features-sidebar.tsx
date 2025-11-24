"use client";

import { cn } from "@humanize/ui/lib/utils";
import { Info } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@humanize/ui/components/sheet";

type TextFeaturesSidebarProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enabledFeatures?: {
    changed?: boolean;
    structural?: boolean;
    unchanged?: boolean;
    thesaurus?: boolean;
  };
  onFeatureToggle?: (
    feature: "changed" | "structural" | "unchanged" | "thesaurus",
    enabled: boolean
  ) => void;
};

export function TextFeaturesSidebar({
  open,
  onOpenChange,
  enabledFeatures = {
    changed: true,
    structural: true,
    unchanged: true,
    thesaurus: false,
  },
  onFeatureToggle,
}: TextFeaturesSidebarProps) {
  const features = [
    {
      type: "changed" as const,
      label: "Changed Words",
      description:
        "Original words are swapped with synonyms to maintain the underlying meaning and concepts.",
      color: "bg-red-500",
      textColor: "text-red-600",
      bgColor: "bg-red-100",
      darkBgColor: "dark:bg-red-900/30",
      indicatorType: "dot" as const,
    },
    {
      type: "structural" as const,
      label: "Structural Changes",
      description:
        "Going a step further, the sentence structure is modified by rearranging and altering clauses.",
      color: "bg-yellow-500",
      textColor: "text-yellow-600",
      bgColor: "bg-yellow-100",
      darkBgColor: "dark:bg-yellow-900/30",
      indicatorType: "dash" as const,
    },
    {
      type: "unchanged" as const,
      label: "Longest Unchanged Words",
      description:
        "This is the longest set of words that remain unchanged between the original and paraphrased text.",
      color: "bg-blue-500",
      textColor: "text-blue-600",
      bgColor: "bg-blue-100",
      darkBgColor: "dark:bg-blue-900/30",
      indicatorType: "dot" as const,
    },
    {
      type: "thesaurus" as const,
      label: "Thesaurus",
      description:
        "Select a word or phrase with the same meaning (synonym) to enhance the sentence.",
      color: "bg-purple-500",
      textColor: "text-purple-600",
      bgColor: "bg-purple-100",
      darkBgColor: "dark:bg-purple-900/30",
      indicatorType: "dot" as const,
    },
  ];

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="w-full sm:max-w-md" side="right">
        <SheetHeader>
          <SheetTitle className="font-bold text-lg">Text Features</SheetTitle>
          <SheetDescription className="sr-only">
            Explanation of text highlighting features
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {features.map((feature) => {
            const isEnabled = enabledFeatures[feature.type] ?? true;
            // "changed", "structural", and "unchanged" are toggleable
            // "thesaurus" is always shown if present
            const isToggleable =
              feature.type === "changed" ||
              feature.type === "structural" ||
              feature.type === "unchanged";
            return (
              <div className="space-y-2" key={feature.type}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Visual Indicator */}
                    {feature.indicatorType === "dot" ? (
                      <div
                        aria-hidden="true"
                        className={cn(
                          "h-3 w-3 shrink-0 rounded-full",
                          feature.color
                        )}
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className={cn("h-0.5 w-4 shrink-0", feature.color)}
                      />
                    )}
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-slate-900 text-sm dark:text-slate-100">
                        {feature.label}
                      </h3>
                      <Info
                        aria-label={`Information about ${feature.label}`}
                        className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500"
                      />
                    </div>
                  </div>
                  {onFeatureToggle && isToggleable && (
                    <button
                      aria-checked={isEnabled}
                      aria-label={`Toggle ${feature.label}`}
                      className={cn(
                        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2",
                        isEnabled
                          ? "bg-[#0066ff] focus:ring-[#0066ff]"
                          : "bg-slate-200 focus:ring-slate-500 dark:bg-slate-700"
                      )}
                      onClick={() => onFeatureToggle(feature.type, !isEnabled)}
                      role="switch"
                      type="button"
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                          isEnabled ? "translate-x-5" : "translate-x-0"
                        )}
                      />
                    </button>
                  )}
                </div>
                <p className="text-slate-600 text-sm dark:text-slate-400">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-8 border-slate-200 border-t pt-4 dark:border-slate-700">
          <p className="text-slate-600 text-xs dark:text-slate-400">
            Toggle features on/off to customize which highlights are shown in
            the text.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
