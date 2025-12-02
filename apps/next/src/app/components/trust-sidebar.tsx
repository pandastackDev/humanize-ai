"use client";

import { Check, FileText, Star } from "lucide-react";

export function TrustSidebar() {
  const aiDetectors = [
    { name: "Turnitin", logo: "T" },
    { name: "Gptzero", logo: "G" },
    { name: "Copyleak", logo: "C" },
    { name: "Zerogpt", logo: "Z" },
    { name: "Quillbot", logo: "Q" },
    { name: "Writer", logo: "W" },
    { name: "Sapling", logo: "S" },
    { name: "Originality", logo: "O" },
  ];

  return (
    <div className="hidden w-80 flex-col gap-6 lg:flex">
      {/* User Reviews */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1">
          {[0, 1, 2, 3, 4].map((starNum) => (
            <Star
              className="h-5 w-5 fill-star text-star"
              key={`star-yellow-${starNum}`}
            />
          ))}
        </div>
        <p className="text-muted-foreground text-sm dark:text-muted-foreground">
          4.8/5 based on 128,743 reviews
        </p>
      </div>

      {/* AI Detector Bypass Section */}
      <div className="rounded-lg border-2 border-success bg-success-bg p-4 dark:border-success dark:bg-success-muted">
        <h3 className="mb-3 font-semibold text-sm text-success dark:text-success">
          AI Humanizer can bypass these AI detectors
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {aiDetectors.map((detector) => (
            <div
              className="flex items-center gap-2 rounded-md bg-card p-2 shadow-sm dark:bg-card"
              key={detector.name}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-info-bg font-bold text-info dark:bg-info-muted dark:text-info">
                {detector.logo}
              </div>
              <span className="font-medium text-foreground text-xs dark:text-foreground">
                {detector.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Metrics */}
      <div className="space-y-3">
        <div className="flex items-start gap-3 rounded-lg border-2 border-success bg-card p-3 dark:border-success dark:bg-card">
          <Check className="h-5 w-5 shrink-0 text-success dark:text-success" />
          <div>
            <p className="font-semibold text-foreground text-sm dark:text-foreground">
              Trusted by 12 Million+ Users
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border-2 border-success bg-card p-3 dark:border-success dark:bg-card">
          <FileText className="h-5 w-5 shrink-0 text-success dark:text-success" />
          <div>
            <p className="font-semibold text-foreground text-sm dark:text-foreground">
              1.46 Billion+ Words Humanized Monthly
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border-2 border-success bg-card p-3 dark:border-success dark:bg-card">
          <Check className="h-5 w-5 shrink-0 text-success dark:text-success" />
          <div>
            <p className="font-semibold text-foreground text-sm dark:text-foreground">
              99.54% Success Rate
            </p>

            <p className="mt-1 text-muted-foreground text-xs dark:text-muted-foreground">
              5,936 reviews on Trustpilot
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
