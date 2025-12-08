import { Button } from "@humanize/ui/components/button";
import { LoadingSpinner } from "@humanize/ui/components/loading-spinner";
import { TextDiffViewer } from "../../text-diff-viewer";
import { MarketingInner } from "../marketing-inner";
import type { EnabledFeatures, PresentFeatures } from "../types";

type HumanizeOutputProps = {
  error: string | null;
  isLoading: boolean;
  hasOutputText: boolean;
  outputText: string;
  inputText: string;
  enabledFeatures: EnabledFeatures;
  onRetry: () => void;
  onFeaturesDetected: (features: PresentFeatures) => void;
  onWordSelect: (
    word: string,
    position: { start: number; end: number }
  ) => void;
};

export function HumanizeOutput({
  error,
  isLoading,
  hasOutputText,
  outputText,
  inputText,
  enabledFeatures,
  onRetry,
  onFeaturesDetected,
  onWordSelect,
}: HumanizeOutputProps) {
  // TEMPORARY: Force loading screen for development
  const forceLoading = false;

  if (error && !forceLoading) {
    return (
      <div className="flex h-editor-sm w-full flex-col items-center justify-center px-3 py-4 sm:h-editor-md sm:px-4 md:h-editor-lg md:px-6 md:py-5">
        <div className="w-full max-w-md rounded-lg border border-destructive/30 bg-destructive/10 p-4 dark:border-destructive/50 dark:bg-destructive/20">
          <p className="mb-2 font-semibold text-destructive text-sm dark:text-destructive">
            Error
          </p>
          <p className="text-destructive text-xs dark:text-destructive">
            {error}
          </p>
          <Button
            className="mt-3 h-8 w-full text-xs"
            onClick={onRetry}
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || forceLoading) {
    return (
      <div className="flex h-editor-sm w-full flex-col items-center gap-2.5 overflow-hidden px-3 py-2 sm:h-editor-md sm:px-4 sm:py-2.5 md:h-editor-lg md:px-6 md:py-3">
        {/* Loading Spinner with Gradient Background */}
        <div className="flex w-full flex-col items-center justify-center gap-2-5 rounded-lg bg-gradient-to-br from-brand-primary/5 via-purple-500/5 to-brand-primary/5 p-2 dark:from-brand-primary/10 dark:via-purple-500/10 dark:to-brand-primary/10">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse rounded-full bg-brand-primary/20 blur-lg" />
            <LoadingSpinner className="relative" size="md" />
          </div>
          <div className="flex flex-col items-center gap-0-5">
            <p className="bg-gradient-to-r from-brand-primary to-purple-600 bg-clip-text font-semibold text-sm text-transparent">
              Humanizing your text...
            </p>
            <p className="text-muted-foreground text-xs dark:text-muted-foreground">
              This may take a few seconds
            </p>
          </div>
        </div>
        <MarketingInner />
      </div>
    );
  }

  if (hasOutputText) {
    return (
      <div className="h-editor-sm overflow-y-auto px-3 py-3 text-sm sm:h-editor-md sm:px-4 sm:py-4 md:h-editor-lg md:px-6 md:py-5">
        <TextDiffViewer
          enabledFeatures={enabledFeatures}
          humanizedText={outputText}
          onFeaturesDetected={onFeaturesDetected}
          onWordSelect={onWordSelect}
          originalText={inputText}
        />
      </div>
    );
  }

  return (
    <div className="flex h-editor-sm w-full flex-col items-center justify-center gap-2.5 overflow-hidden px-3 py-2 sm:h-editor-md sm:px-4 sm:py-2.5 md:h-editor-lg md:px-6 md:py-3">
      <MarketingInner />
    </div>
  );
}
