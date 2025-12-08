import { Check, FileText, Star } from "lucide-react";
import Image from "next/image";
import { AI_DETECTORS } from "./constants";

export function MarketingInner() {
  return (
    <>
      {/* Rating Card */}
      <div className="w-full rounded-lg bg-background p-2 shadow-none">
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-0-5">
            {[1, 2, 3, 4, 5].map((starNum) => (
              <Star
                className="h-4 w-4 fill-star text-star"
                key={`rating-star-${starNum}`}
              />
            ))}
          </div>
          <p className="text-center text-card-foreground text-sm">
            <span className="font-bold">4.8</span>/5 based on{" "}
            <span className="font-bold">128,743</span> reviews
          </p>
        </div>
      </div>

      {/* AI Detector Bypass Section */}
      <div className="w-full rounded-lg bg-background p-2.5 shadow-none">
        <h3 className="mb-1.5 font-semibold text-card-foreground text-xs">
          AI Humanizer can bypass these AI detectors
        </h3>
        <div className="flex flex-col gap-1.5">
          {/* First group: Turnitin through Originality */}
          <div className="grid grid-cols-2 gap-1-5 sm:grid-cols-4">
            {AI_DETECTORS.slice(0, 8).map((detector) => (
              <div
                className="flex items-center gap-1-5 rounded-md bg-muted p-1-5 transition-all hover:bg-brand-primary/5 dark:bg-editor-bg dark:hover:bg-brand-primary/10"
                key={detector.name}
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
                <span className="font-medium text-muted-foreground text-xs dark:text-muted-foreground">
                  {detector.name}
                </span>
              </div>
            ))}
          </div>

          {/* Second group: Grammarly, Scribbr, CrossPlag - centered */}
          <div className="flex flex-wrap justify-center gap-1-5">
            {AI_DETECTORS.slice(8).map((detector) => (
              <div
                className="flex w-[calc(50%-0.375rem)] items-center gap-1-5 rounded-md bg-muted p-1-5 transition-all hover:bg-brand-primary/5 sm:w-[calc(25%-0.5625rem)] dark:bg-editor-bg dark:hover:bg-brand-primary/10"
                key={detector.name}
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
                <span className="font-medium text-muted-foreground text-xs dark:text-muted-foreground">
                  {detector.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trust Metrics */}
      <div className="w-full space-y-1.5">
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          <div className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-brand-primary/10 to-brand-primary/5 p-2 shadow-none dark:from-brand-primary/20 dark:to-brand-primary/10">
            <div className="flex h-6 w-6 shrink-none items-center justify-center rounded-full bg-brand-primary/20 dark:bg-brand-primary/30">
              <Check className="size-icon-sm text-brand-primary" />
            </div>
            <div>
              <p className="font-bold text-brand-primary text-xs">
                12 Million+
              </p>
              <p className="text-muted-foreground text-xs dark:text-muted-foreground">
                Trusted Users
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-brand-primary/10 to-brand-primary/5 p-2 shadow-none dark:from-brand-primary/20 dark:to-brand-primary/10">
            <div className="flex h-6 w-6 shrink-none items-center justify-center rounded-full bg-brand-primary/20 dark:bg-brand-primary/30">
              <FileText className="size-icon-sm text-brand-primary" />
            </div>
            <div>
              <p className="font-bold text-brand-primary text-xs">
                1.46 Billion+
              </p>
              <p className="text-muted-foreground text-xs dark:text-muted-foreground">
                Words Monthly
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
          {/* Success Rate */}
          <div className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-green-50 to-green-50/50 px-2.5 py-1.5 shadow-none dark:from-green-950/30 dark:to-green-950/10">
            <div className="flex h-4 w-4 shrink-none items-center justify-center rounded-full bg-success-bg dark:bg-success-muted">
              <Check className="size-icon-xs text-success dark:text-success" />
            </div>
            <p className="font-bold text-success text-xs dark:text-success">
              99.54% Success Rate
            </p>
          </div>

          {/* Trustpilot Reviews */}
          <div className="flex flex-1 items-center gap-1-5 rounded-lg bg-card px-2.5 py-1.5 shadow-none dark:bg-editor-bg/50">
            <Image
              alt="4.5 stars on Trustpilot"
              className="h-3.5 w-auto"
              height={14}
              src="https://cdn.trustpilot.net/brand-assets/4.1.0/stars/stars-4.5.svg"
              unoptimized
              width={70}
            />
            <span className="flex items-center gap-1 text-muted-foreground text-xs dark:text-muted-foreground">
              <span className="font-medium underline">5,936 reviews on</span>
              <Image
                alt="Trustpilot"
                className="size-icon-xs"
                height={12}
                src="/logos/trustpilot-star.png"
                width={12}
              />
              <span className="font-semibold">Trustpilot</span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
