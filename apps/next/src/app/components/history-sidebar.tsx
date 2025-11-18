"use client";

import { Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export interface HistoryItem {
  id: string;
  originalText: string;
  humanizedText: string;
  timestamp: Date;
  wordCount: number;
}

interface HistorySidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: HistoryItem[];
  onSelectHistory: (item: HistoryItem) => void;
  onDeleteHistory: (id: string) => void;
}

export function HistorySidebar({
  open,
  onOpenChange,
  history,
  onSelectHistory,
  onDeleteHistory,
}: HistorySidebarProps) {
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>History</SheetTitle>
          <SheetDescription>
            View and restore your previous humanizations
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-3">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="mb-4 h-12 w-12 text-slate-400" />
              <p className="text-slate-600 text-sm dark:text-slate-400">
                No history yet. Your humanizations will appear here.
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-lg border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-[#141414]"
              >
                <Button
                  className="absolute top-2 right-2 h-6 w-6 rounded p-0 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteHistory(item.id);
                  }}
                  variant="ghost"
                >
                  <X className="h-3 w-3" />
                </Button>
                <div
                  className="cursor-pointer"
                  onClick={() => {
                    onSelectHistory(item);
                    onOpenChange(false);
                  }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium text-slate-900 text-xs dark:text-slate-100">
                      {formatDate(item.timestamp)}
                    </span>
                    <span className="text-slate-500 text-xs">
                      {item.wordCount} words
                    </span>
                  </div>
                  <p className="line-clamp-2 text-slate-600 text-xs dark:text-slate-400">
                    {item.originalText.substring(0, 150)}
                    {item.originalText.length > 150 ? "..." : ""}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

