import type React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function PageContainer({
  children,
  scrollable = false,
}: {
  children: React.ReactNode;
  scrollable?: boolean;
}) {
  return (
    <>
      {scrollable ? (
        <ScrollArea className="h-[calc(100dvh-64px)]">
          <div className="pl-8 pt-4">
            {children}
          </div>
        </ScrollArea>
      ) : (
        <div className="p-2">{children}</div>
      )}
    </>
  );
}
