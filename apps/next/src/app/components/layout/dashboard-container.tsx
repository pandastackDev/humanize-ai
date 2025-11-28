"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function DashboardContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only apply theme-dependent classes after hydration to avoid mismatch
  // This is a valid use case for setState in effect (hydration pattern)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const bgColor = mounted && resolvedTheme === "light" ? "bg-background" : "";

  return (
    <div
      className={`flex flex-1 flex-col items-stretch rounded-lg border p-4 ${bgColor}`}
    >
      {children}
    </div>
  );
}
