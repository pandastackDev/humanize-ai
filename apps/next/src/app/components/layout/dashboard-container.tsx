"use client";

import { useTheme } from "next-themes";

export function DashboardContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const { resolvedTheme } = useTheme();
  const bgColor = resolvedTheme === "light" ? "bg-background" : "";

  return (
    <div
      className={`flex flex-1 flex-col items-stretch rounded-lg border p-4 ${bgColor}`}
    >
      {children}
    </div>
  );
}
