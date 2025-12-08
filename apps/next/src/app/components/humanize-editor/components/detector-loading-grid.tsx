import { Loader2 } from "lucide-react";
import Image from "next/image";
import { AI_DETECTORS } from "../constants";
import { getDetectorStyles } from "../utils";

export function DetectorLoadingGrid() {
  return (
    <div className="flex h-editor-sm w-full flex-col items-center justify-center overflow-hidden px-2 py-2 sm:h-editor-md sm:px-3 md:h-editor-lg md:px-4">
      <div className="flex w-full max-w-3xl flex-col items-center justify-center">
        <h2 className="mb-0.5 text-center font-bold text-purple-600 text-xs sm:text-sm dark:text-purple-400">
          Analyzing your text through all major AI detectors
        </h2>

        <p className="mb-2 max-w-2xl text-center text-[10px] text-muted-foreground leading-tight sm:text-xs dark:text-muted-foreground">
          This may take a few seconds as we cross-verify results across multiple
          platforms for maximum accuracy.
        </p>

        <div className="flex flex-col gap-1.5">
          {/* First group: Turnitin through Originality */}
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {AI_DETECTORS.slice(0, 8).map((detector, index) => {
              const styles = getDetectorStyles(detector.name);

              return (
                <div
                  className="flex items-center gap-1.5 rounded-md bg-muted p-1.5 transition-all hover:bg-brand-primary/5 dark:bg-editor-bg dark:hover:bg-brand-primary/10"
                  key={detector.name}
                  style={{
                    boxShadow: "none",
                    borderColor: styles.bgColor,
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  <div className="relative flex h-4 w-4 shrink-none items-center justify-center">
                    <Image
                      alt={detector.name}
                      className="object-contain"
                      height={16}
                      src={detector.image}
                      width={16}
                    />
                  </div>

                  <span className="font-medium text-[10px] text-muted-foreground sm:text-xs dark:text-muted-foreground">
                    {detector.name}
                  </span>

                  <div className="ml-auto shrink-none">
                    <Loader2 className="h-3 w-3 animate-spin text-purple-500 dark:text-purple-400" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Second group: Grammarly, Scribbr, CrossPlag - centered */}
          <div className="flex flex-wrap justify-center gap-1.5">
            {AI_DETECTORS.slice(8).map((detector, index) => {
              const styles = getDetectorStyles(detector.name);

              return (
                <div
                  className="flex w-[calc(50%-0.375rem)] items-center gap-1.5 rounded-md bg-muted p-1.5 transition-all hover:bg-brand-primary/5 sm:w-[calc(25%-0.5625rem)] dark:bg-editor-bg dark:hover:bg-brand-primary/10"
                  key={detector.name}
                  style={{
                    boxShadow: "none",
                    borderColor: styles.bgColor,
                    animationDelay: `${(index + 8) * 50}ms`,
                  }}
                >
                  <div className="relative flex h-4 w-4 shrink-none items-center justify-center">
                    <Image
                      alt={detector.name}
                      className="object-contain"
                      height={16}
                      src={detector.image}
                      width={16}
                    />
                  </div>

                  <span className="font-medium text-[10px] text-muted-foreground sm:text-xs dark:text-muted-foreground">
                    {detector.name}
                  </span>

                  <div className="ml-auto shrink-none">
                    <Loader2 className="h-3 w-3 animate-spin text-purple-500 dark:text-purple-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
