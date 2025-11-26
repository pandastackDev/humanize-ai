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
              className="h-5 w-5 fill-yellow-400 text-yellow-400"
              key={`star-yellow-${starNum}`}
            />
          ))}
        </div>
        <p className="text-slate-600 text-sm dark:text-slate-400">
          4.8/5 based on 128,743 reviews
        </p>
      </div>

      {/* AI Detector Bypass Section */}
      <div className="rounded-lg border-2 border-green-500 bg-green-50 p-4 dark:border-green-600 dark:bg-green-900/20">
        <h3 className="mb-3 font-semibold text-green-900 text-sm dark:text-green-100">
          AI Humanizer can bypass these AI detectors
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {aiDetectors.map((detector) => (
            <div
              className="flex items-center gap-2 rounded-md bg-white p-2 shadow-sm dark:bg-[#141414]"
              key={detector.name}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                {detector.logo}
              </div>
              <span className="font-medium text-slate-700 text-xs dark:text-slate-300">
                {detector.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Metrics */}
      <div className="space-y-3">
        <div className="flex items-start gap-3 rounded-lg border-2 border-green-500 bg-white p-3 dark:border-green-600 dark:bg-[#141414]">
          <Check className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
          <div>
            <p className="font-semibold text-slate-900 text-sm dark:text-slate-100">
              Trusted by 12 Million+ Users
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border-2 border-green-500 bg-white p-3 dark:border-green-600 dark:bg-[#141414]">
          <FileText className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
          <div>
            <p className="font-semibold text-slate-900 text-sm dark:text-slate-100">
              1.46 Billion+ Words Humanized Monthly
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border-2 border-green-500 bg-white p-3 dark:border-green-600 dark:bg-[#141414]">
          <Check className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
          <div>
            <p className="font-semibold text-slate-900 text-sm dark:text-slate-100">
              99.54% Success Rate
            </p>
            <div className="mt-2 flex items-center gap-1">
              {[0, 1, 2, 3, 4].map((starNum) => (
                <Star
                  className="h-4 w-4 fill-green-500 text-green-500"
                  key={`star-green-${starNum}`}
                />
              ))}
            </div>
            <p className="mt-1 text-slate-600 text-xs dark:text-slate-400">
              5,936 reviews on Trustpilot
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
