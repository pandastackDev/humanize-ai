import Image from "next/image";
import type React from "react";
import { getDetectorStyles } from "../utils";

type DetectorResult = {
  detector: string;
  ai_probability: number;
  human_probability: number;
  error?: string;
  confidence: number;
};

type DetectorCardProps = {
  detector: { name: string; image: string };
  result: DetectorResult | null;
  isDarkMode: boolean;
};

export function DetectorCard({
  detector,
  result,
  isDarkMode,
}: DetectorCardProps) {
  const hasError = Boolean(result?.error);
  const styles = getDetectorStyles(detector.name);

  const statusTextStyle: React.CSSProperties = {
    fontSize: "10px",
    lineHeight: "14px",
  };

  const getAIColor = () =>
    isDarkMode ? "rgb(248, 113, 113)" : "rgb(220, 38, 38)";

  const getHumanColor = () =>
    isDarkMode ? "rgb(34, 197, 94)" : "rgb(22, 163, 74)";

  const getErrorColor = () =>
    isDarkMode ? "rgb(248, 113, 113)" : "rgb(220, 38, 38)";

  const calculateDetectorStatus = (
    detectorAiScore: number,
    detectorHumanScore: number
  ) => {
    const isLikelyAI = detectorAiScore > detectorHumanScore + 0.5;
    const isLikelyHuman = detectorHumanScore > detectorAiScore + 0.5;

    if (isLikelyAI) {
      return {
        label: "AI",
        value: detectorAiScore.toFixed(0),
        color: getAIColor(),
      };
    }
    if (isLikelyHuman) {
      return {
        label: "H",
        value: detectorHumanScore.toFixed(0),
        color: getHumanColor(),
      };
    }
    return {
      label: "?",
      value: ((detectorAiScore + detectorHumanScore) / 2).toFixed(0),
      color: isDarkMode ? "rgb(234, 179, 8)" : "rgb(202, 138, 4)",
    };
  };

  const renderStatusText = (text: string, textColor: string) => (
    <span
      className="font-semibold"
      style={{
        ...statusTextStyle,
        color: textColor,
      }}
    >
      {text}
    </span>
  );

  const getStatusText = () => {
    if (hasError) {
      return renderStatusText("Error", getErrorColor());
    }
    if (result) {
      const detectorAiScore = result.ai_probability * 100;
      const detectorHumanScore = result.human_probability * 100;
      const status = calculateDetectorStatus(
        detectorAiScore,
        detectorHumanScore
      );
      return renderStatusText(`${status.value}% ${status.label}`, status.color);
    }
    return renderStatusText("N/A", "rgb(148, 163, 184)");
  };

  return (
    <div
      className="flex items-center gap-1.5 rounded-md bg-muted p-1.5 transition-all hover:bg-brand-primary/5 dark:bg-editor-bg dark:hover:bg-brand-primary/10"
      style={{
        boxShadow: "none",
        borderColor: styles.bgColor,
      }}
    >
      <div className="relative flex h-4 w-4 shrink-none items-center justify-center">
        <Image
          alt={detector.name}
          className="rounded-full object-contain"
          height={16}
          src={detector.image}
          width={16}
        />
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-between gap-1">
        <span className="truncate font-medium text-[10px] text-muted-foreground sm:text-xs dark:text-muted-foreground">
          {detector.name}
        </span>
        {(hasError || result) && (
          <div className="shrink-none">{getStatusText()}</div>
        )}
      </div>
    </div>
  );
}
