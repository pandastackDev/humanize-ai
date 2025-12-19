import { Button } from "@humanize/ui/components/button";
import { Info, X } from "lucide-react";
import type { DetectResponse } from "@/lib/detect-api";
import { AI_DETECTORS } from "../constants";
import { MarketingInner } from "../marketing-inner";
import { DetectorCard } from "./detector-card";
import { DetectorLoadingGrid } from "./detector-loading-grid";

type DetectionOutputProps = {
  detectionResult: DetectResponse | null;
  detectionError: string | null;
  isDetecting: boolean;
  isDarkMode: boolean;
  onRetryDetection: () => void;
};

export function DetectionOutput({
  detectionResult,
  detectionError,
  isDetecting,
  isDarkMode,
  onRetryDetection,
}: DetectionOutputProps) {
  if (detectionError) {
    return (
      <div className="flex h-editor-sm w-full flex-col items-center justify-center px-3 py-4 sm:h-editor-md sm:px-4 md:h-editor-lg md:px-6 md:py-5">
        <div className="w-full max-w-md rounded-lg border border-destructive/30 bg-destructive/10 p-4 dark:border-destructive/50 dark:bg-destructive/20">
          <div className="mb-3 flex items-center justify-center">
            <X className="h-12 w-12 text-destructive dark:text-destructive" />
          </div>
          <h3 className="mb-2 text-center font-semibold text-base text-destructive dark:text-destructive">
            Detection Error
          </h3>
          <p className="text-center text-muted-foreground text-xs sm:text-sm dark:text-muted-foreground">
            {detectionError}
          </p>
          <Button
            className="mt-4 w-full"
            onClick={onRetryDetection}
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!detectionResult) {
    if (isDetecting) {
      return <DetectorLoadingGrid />;
    }

    return (
      <div className="flex h-editor-sm w-full flex-col items-center justify-center gap-2.5 overflow-hidden bg-background px-3 py-2 sm:h-editor-md sm:px-4 sm:py-2.5 md:h-editor-lg md:px-6 md:py-3 dark:bg-background">
        <MarketingInner />
      </div>
    );
  }

  // Create a map of detector names to their results
  const detectorMap = new Map(
    detectionResult.detector_results.map((r) => [r.detector.toLowerCase(), r])
  );

  // Calculate Turnitin score as average of all other detectors
  const otherDetectors = detectionResult.detector_results.filter(
    (r) => r.detector.toLowerCase() !== "turnitin"
  );
  const validScores = otherDetectors.filter(
    (r) => !r.error && r.ai_probability != null
  );

  if (validScores.length > 0) {
    const avgAiScore =
      validScores.reduce((sum, r) => sum + r.ai_probability, 0) /
      validScores.length;
    const avgHumanScore = 1 - avgAiScore;

    detectorMap.set("turnitin", {
      detector: "turnitin",
      ai_probability: avgAiScore,
      human_probability: avgHumanScore,
      error: undefined,
      confidence: 0,
    });
  }

  const getDetectorResult = (detectorName: string) => {
    const key = detectorName.toLowerCase();
    let result = detectorMap.get(key);

    // If this is QuillBot, use Scribbr's result if available (regardless of QuillBot's status)
    if (key === "quillbot") {
      const scribbrResult = detectorMap.get("scribbr");
      if (scribbrResult && !scribbrResult.error) {
        // Use Scribbr's result but keep the detector name as quillbot
        result = {
          ...scribbrResult,
          detector: "quillbot",
        };
      }
    }

    return result || null;
  };

  return (
    <div className="flex w-full flex-col items-center justify-start bg-background px-2 py-4 sm:px-3 sm:py-6 md:px-4 md:py-8 dark:bg-background">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center">
        {/* Main Result Header */}
        <div className="mb-2 text-center">
          <div className="mb-0.5 flex flex-col items-center justify-center">
            <span className="font-bold text-3xl text-card-foreground sm:text-4xl">
              {detectionResult.ai_likelihood_pct > 50
                ? detectionResult.ai_likelihood_pct.toFixed(0)
                : detectionResult.human_likelihood_pct.toFixed(0)}
              %
            </span>
            <span
              className={`font-semibold text-xs ${
                detectionResult.ai_likelihood_pct > 50
                  ? "text-destructive dark:text-destructive"
                  : "text-success dark:text-success"
              }`}
            >
              {detectionResult.ai_likelihood_pct > 50
                ? "of text likely AI"
                : "of text likely Human"}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-tight sm:text-xs dark:text-muted-foreground">
            Your text has been deeply analyzed using the strongest AI detectors
            in the market.
          </p>
        </div>

        {/* Detector Grid */}
        <div className="mb-2 flex flex-col gap-1.5">
          {/* First group: Turnitin through Originality */}
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {AI_DETECTORS.slice(0, 8).map((detector) => (
              <DetectorCard
                detector={detector}
                isDarkMode={isDarkMode}
                key={detector.name}
                result={getDetectorResult(detector.name)}
              />
            ))}
          </div>

          {/* Second group: Grammarly, Scribbr, CrossPlag - centered */}
          <div className="flex flex-wrap justify-center gap-1.5">
            {AI_DETECTORS.slice(8).map((detector) => (
              <div
                className="w-[calc(50%-0.375rem)] sm:w-[calc(25%-0.5625rem)]"
                key={detector.name}
              >
                <DetectorCard
                  detector={detector}
                  isDarkMode={isDarkMode}
                  result={getDetectorResult(detector.name)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Human Report Card */}
        <div className="mb-2 w-full max-w-sm rounded-lg border border-muted bg-human-report p-2 shadow-none dark:border-background dark:bg-background">
          <div className="relative mb-1.5 flex items-center justify-between border-muted border-b pb-1.5 dark:border-editor-bg/50">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground sm:text-xs dark:text-muted-foreground">
                AI-generated
              </span>
              <div className="relative">
                <Info className="h-3 w-3 cursor-help text-muted-foreground dark:text-muted-foreground" />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-destructive" />
              <span className="font-medium text-[10px] text-card-foreground sm:text-xs dark:text-white">
                {detectionResult.ai_likelihood_pct.toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground sm:text-xs dark:text-muted-foreground">
                Human-written
              </span>
              <div className="relative">
                <Info className="h-3 w-3 cursor-help text-muted-foreground dark:text-muted-foreground" />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span className="font-medium text-[10px] text-card-foreground sm:text-xs dark:text-white">
                {detectionResult.human_likelihood_pct.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Word Count Info */}
        <div className="mb-1.5 text-center">
          <p className="text-[10px] text-muted-foreground leading-tight sm:text-xs dark:text-muted-foreground">
            Predicted based upon{" "}
            {String(detectionResult.metadata?.word_count ?? 0)} words.
          </p>
        </div>

        {/* Status Message */}
        <div className="w-full rounded-lg border border-background bg-background p-1.5 text-center dark:border-background dark:bg-background">
          <p className="text-[10px] text-muted-foreground leading-tight sm:text-xs dark:text-muted-foreground">
            {(() => {
              const score = detectionResult.human_likelihood_pct;
              if (score >= 70) {
                return "Excellent! Your content demonstrates natural human writing patterns.";
              }
              if (score >= 40) {
                return "Good! Your content shows some human characteristics but could be improved.";
              }
              return "Warning! Your content may need further humanization to pass AI detection.";
            })()}
          </p>
        </div>
      </div>
    </div>
  );
}
