"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function Logo() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Image
        alt="SuperApp logo"
        className="logo"
        height={24}
        src="/logos/superapp_logo.svg"
        width={144}
      />
    );
  }

  return (
    <Image
      alt="SuperApp logo"
      className="logo"
      height={24}
      src={
        resolvedTheme === "dark"
          ? "/logos/superapp_logo_dark.svg"
          : "/logos/superapp_logo.svg"
      }
      width={144}
    />
  );
}
