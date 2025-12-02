import { ScrollArea } from "@humanize/ui/components/scroll-area";
import type React from "react";

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
        <ScrollArea className="h-page-container">
          <div className="pt-4 pl-8">{children}</div>
        </ScrollArea>
      ) : (
        <div className="p-2">{children}</div>
      )}
    </>
  );
}
