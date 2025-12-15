"use client";

import Image from "next/image";

const DETECTOR_LOGOS = [
  { name: "turnitin", image: "/logos/detector-tools/turnitin.webp" },
  { name: "copyleaks", image: "/logos/detector-tools/copyleaks.webp" },
  { name: "zerogpt", image: "/logos/detector-tools/zerogpt.webp" },
  { name: "quillbot", image: "/logos/detector-tools/quillbot.webp" },
  { name: "gptzero", image: "/logos/detector-tools/gptzero.webp" },
  { name: "writer", image: "/logos/detector-tools/writer.png" },
  { name: "grammarly", image: "/logos/detector-tools/grammarly.png" },
  { name: "originality", image: "/logos/detector-tools/originality.png" },
  { name: "scribbr", image: "/logos/detector-tools/scribbr.png" },
  { name: "crossplag", image: "/logos/detector-tools/crossplag.png" },
];

export function BypassDetectorsSection() {
  return (
    <div className="w-full bg-background py-12 sm:py-16 md:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="mb-6 font-semibold text-foreground text-xl sm:text-2xl md:text-3xl">
            Bypass AI content detectors
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 md:gap-10 lg:gap-12">
            {DETECTOR_LOGOS.map((logo) => (
              <div className="flex items-center justify-center" key={logo.name}>
                <div className="relative h-32 w-32 sm:h-36 sm:w-36 md:h-40 md:w-40 lg:h-44 lg:w-44">
                  <Image
                    alt={logo.name}
                    className="object-contain"
                    fill
                    sizes="(max-width: 640px) 128px, (max-width: 768px) 144px, (max-width: 1024px) 160px, 176px"
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
