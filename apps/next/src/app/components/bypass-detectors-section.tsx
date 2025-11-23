"use client";

import Image from "next/image";

const DETECTOR_LOGOS = [
  { name: "turnitin", image: "/logos/detector-tools/turnitin.webp" },
  { name: "copyleaks", image: "/logos/detector-tools/copyleaks.webp" },
  { name: "zerogpt", image: "/logos/detector-tools/zerogpt.webp" },
  { name: "quillbot", image: "/logos/detector-tools/quillbot.webp" },
  { name: "gptzero", image: "/logos/detector-tools/gptzero.webp" },
];

export function BypassDetectorsSection() {
  return (
    <div className="w-full bg-gradient-to-r from-yellow-50 via-white to-green-50 py-12 sm:py-16 md:py-20 dark:from-[#1a1a1a] dark:via-[#141414] dark:to-[#1a1a1a]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="mb-12 font-semibold text-slate-900 text-xl sm:text-2xl md:text-3xl dark:text-white">
            Bypass AI content detectors
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-12 sm:gap-14 md:gap-16 lg:gap-20 xl:gap-24">
            {DETECTOR_LOGOS.map((logo) => (
              <div className="flex items-center justify-center" key={logo.name}>
                <div className="relative h-32 w-32 sm:h-36 sm:w-36 md:h-40 md:w-40 lg:h-44 lg:w-44">
                  <Image
                    alt={logo.name}
                    className="object-contain"
                    fill
                    src={logo.image}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
