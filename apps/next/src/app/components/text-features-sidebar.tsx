"use client";

import { Button } from "@humanize/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@humanize/ui/components/popover";
import { cn } from "@humanize/ui/lib/utils";
import { Info } from "lucide-react";

type TextFeaturesSidebarProps = {
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
      color: "bg-destructive",
      textColor: "text-destructive",
      bgColor: "bg-destructive/10",
      darkBgColor: "dark:bg-destructive/30",
      indicatorType: "dot" as const,
    },
    {
      type: "structural" as const,
      label: "Structural Changes",
      description:
        "Going a step further, the sentence structure is modified by rearranging and altering clauses.",
      color: "bg-warning",
      textColor: "text-warning",
      bgColor: "bg-warning-bg",
      darkBgColor: "dark:bg-warning-muted",
      indicatorType: "dash" as const,
    },
    {
      type: "unchanged" as const,
      label: "Longest Unchanged Words",
      description:
        "This is the longest set of words that remain unchanged between the original and paraphrased text.",
      color: "bg-info",
      textColor: "text-info",
      bgColor: "bg-info-bg",
      darkBgColor: "dark:bg-info-muted",
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
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className="h-8 w-8 rounded-lg p-0 transition-all hover:bg-muted dark:hover:bg-select-hover"
          title="Text features"
          type="button"
          variant="ghost"
        >
          <Info className="h-4 w-4 text-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 max-w-sm sm:w-96" side="top">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold text-base text-foreground dark:text-foreground">
              Text Features
            </h2>
          </div>
          <div className="space-y-4">
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
                        <h3 className="font-semibold text-foreground text-sm dark:text-foreground">
                          {feature.label}
                        </h3>
                      </div>
                    </div>
                    {onFeatureToggle && isToggleable && (
                      <button
                        aria-checked={isEnabled}
                        aria-label={`Toggle ${feature.label}`}
                        className={cn(
                          "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2",
                          isEnabled
                            ? "bg-brand-primary focus:ring-brand-primary"
                            : "bg-muted focus:ring-muted-foreground dark:bg-muted"
                        )}
                        onClick={() =>
                          onFeatureToggle(feature.type, !isEnabled)
                        }
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
                  <p className="text-muted-foreground text-xs dark:text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="border-border border-t pt-3 dark:border-border">
            <p className="text-muted-foreground text-xs dark:text-muted-foreground">
              Toggle features on/off to customize which highlights are shown in
              the text.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
