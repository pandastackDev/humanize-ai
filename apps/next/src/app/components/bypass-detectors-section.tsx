"use client";

import Image from "next/image";

const DETECTOR_LOGOS = [
  { name: "turnitin", image: "/logos/humanization-logos/turnitin.png" },
  { name: "copyleaks", image: "/logos/humanization-logos/copyleaks.png" },
  { name: "zerogpt", image: "/logos/humanization-logos/zerogpt.png" },
  { name: "quillbot", image: "/logos/humanization-logos/quillbot.png" },
  { name: "gptzero", image: "/logos/humanization-logos/gptzero.png" },
  { name: "originality", image: "/logos/humanization-logos/originality.png" },
];

export function BypassDetectorsSection() {
  return (
    <div className="w-full bg-gradient-to-r from-yellow-50 via-white to-green-50 py-12 sm:py-16 md:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="mb-12 font-semibold text-slate-900 text-xl sm:text-2xl md:text-3xl">
            Bypass AI content detectors
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 md:gap-10 lg:gap-12">
            {DETECTOR_LOGOS.map((logo) => (
              <div
                className="flex flex-col items-center justify-center gap-3"
                key={logo.name}
              >
                <div className="relative h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24">
                  <Image
                    alt={logo.name}
                    className="object-contain transition-transform hover:scale-110"
                    fill
                    src={logo.image}
                  />
                </div>
                <span className="font-medium text-slate-700 text-xs capitalize sm:text-sm md:text-base">
                  {logo.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
