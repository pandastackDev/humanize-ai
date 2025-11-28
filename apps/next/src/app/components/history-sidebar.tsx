"use client";

import { Button } from "@humanize/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@humanize/ui/components/dialog";
import { Input } from "@humanize/ui/components/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@humanize/ui/components/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@humanize/ui/components/tabs";
import {
  BarChart3,
  Clock,
  Copy,
  Download,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

export type HistoryItem = {
  id: string;
  originalText: string;
  humanizedText: string;
  timestamp: Date;
  wordCount: number;
  // Optional metadata
  readabilityLevel?: string;
  purpose?: string;
  language?: string;
  lengthMode?: string;
  humanScore?: number;
  detectionResult?: {
    humanLikelihoodPct: number;
    aiLikelihoodPct: number;
  };
};

type HistorySidebarProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: HistoryItem[];
  onSelectHistory: (item: HistoryItem) => void;
  onDeleteHistory: (id: string) => void;
};

export function HistorySidebar({
  open,
  onOpenChange,
  history,
  onSelectHistory,
  onDeleteHistory,
}: HistorySidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [detailViewOpen, setDetailViewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"input" | "humanized">("input");

  // Reset search when sidebar closes
  useEffect(() => {
    if (!open) {
      // Use setTimeout to avoid synchronous setState in effect
      const timeoutId = setTimeout(() => {
        setSearchQuery("");
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [open]);

  // Filter history based on search query
  const filteredHistory = history.filter((item) => {
    if (!searchQuery.trim()) {
      return true;
    }
    const query = searchQuery.toLowerCase().trim();
    return (
      item.originalText.toLowerCase().includes(query) ||
      item.humanizedText.toLowerCase().includes(query) ||
      item.wordCount.toString().includes(query)
    );
  });

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownloadText = (text: string, filename: string) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRestoreToEditor = (item: HistoryItem) => {
    onSelectHistory(item);
    setDetailViewOpen(false);
    onOpenChange(false);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days = Math.floor(diff / 86_400_000);

    if (minutes < 1) {
      return "Just now";
    }
    if (minutes < 60) {
      return `${minutes}m ago`;
    }
    if (hours < 24) {
      return `${hours}h ago`;
    }
    if (days < 7) {
      return `${days}d ago`;
    }
    return date.toLocaleDateString();
  };

  // Removed unused function: renderHistoryContent (replaced with inline IIFE)

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="w-full overflow-y-auto bg-background px-6 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>History</SheetTitle>
          <SheetDescription>
            View and restore your previous humanizations
          </SheetDescription>
        </SheetHeader>

        {/* Search Input */}
        {history.length > 0 && (
          <div className="mt-6">
            <div className="relative">
              <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="h-9 w-full border-input bg-background pr-9 pl-9 text-foreground placeholder:text-muted-foreground"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search history..."
                value={searchQuery}
              />
              {searchQuery && (
                <Button
                  className="-translate-y-1/2 absolute top-1/2 right-1 h-7 w-7 rounded p-0 hover:bg-muted"
                  onClick={() => setSearchQuery("")}
                  size="sm"
                  variant="ghost"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {(() => {
            if (history.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground text-sm">
                    No history yet. Your humanizations will appear here.
                  </p>
                </div>
              );
            }
            if (filteredHistory.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Search className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground text-sm">
                    No results found for &quot;{searchQuery}&quot;
                  </p>
                </div>
              );
            }
            return filteredHistory.map((item) => (
              <div
                className="group relative rounded-lg border border-border bg-card p-4 transition-all hover:border-border hover:shadow-sm"
                key={item.id}
              >
                <Button
                  className="absolute top-2 right-2 h-7 w-7 rounded p-0 text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteHistory(item.id);
                  }}
                  title="Delete"
                  variant="ghost"
                >
                  <X className="h-4 w-4" />
                </Button>
                <button
                  className="w-full cursor-pointer text-left"
                  onClick={() => {
                    setSelectedItem(item);
                    setDetailViewOpen(true);
                    setActiveTab("input");
                  }}
                  type="button"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium text-card-foreground text-xs">
                      {formatDate(item.timestamp)}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {item.wordCount} words
                    </span>
                  </div>
                  <p className="line-clamp-2 text-muted-foreground text-xs">
                    {item.originalText.substring(0, 150)}
                    {item.originalText.length > 150 ? "..." : ""}
                  </p>
                </button>
              </div>
            ));
          })()}
        </div>
      </SheetContent>

      {/* History Detail Dialog */}
      <Dialog
        onOpenChange={(isOpen) => {
          setDetailViewOpen(isOpen);
          if (!isOpen) {
            setSelectedItem(null);
          }
        }}
        open={detailViewOpen}
      >
        <DialogContent
          className="max-h-[90vh] max-w-6xl overflow-y-auto bg-background"
          showCloseButton={false}
        >
          {selectedItem && (
            <>
              <DialogHeader className="border-border border-b pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle>History command popup</DialogTitle>
                    <DialogDescription>
                      {formatDate(selectedItem.timestamp)} •{" "}
                      {selectedItem.wordCount} words
                    </DialogDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        onDeleteHistory(selectedItem.id);
                        setDetailViewOpen(false);
                        setSelectedItem(null);
                      }}
                      title="Delete"
                      variant="ghost"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      className="h-8 w-8 p-0"
                      onClick={() => setDetailViewOpen(false)}
                      title="Close"
                      variant="ghost"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              <div className="mt-6 space-y-6">
                {/* Tabs for Input Text and Humanized */}
                <Tabs
                  onValueChange={(value) =>
                    setActiveTab(value as "input" | "humanized")
                  }
                  value={activeTab}
                >
                  <TabsList className="grid w-full grid-cols-2 bg-muted">
                    <TabsTrigger
                      className="text-muted-foreground data-[state=active]:text-foreground"
                      value="input"
                    >
                      Input Text
                    </TabsTrigger>
                    <TabsTrigger
                      className="text-muted-foreground data-[state=active]:text-foreground"
                      value="humanized"
                    >
                      Humanized
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent className="mt-4" value="input">
                    <div className="rounded-lg border border-border bg-muted p-4">
                      <p className="whitespace-pre-wrap break-words text-foreground text-sm leading-relaxed">
                        {selectedItem.originalText}
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent className="mt-4" value="humanized">
                    <div className="rounded-lg border border-border bg-muted p-4">
                      <p className="whitespace-pre-wrap break-words text-foreground text-sm leading-relaxed">
                        {selectedItem.humanizedText}
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Settings Tags */}
                {(selectedItem.readabilityLevel ||
                  selectedItem.purpose ||
                  selectedItem.language ||
                  selectedItem.lengthMode) && (
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.readabilityLevel && (
                      <span className="rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-700 text-xs dark:bg-blue-900/30 dark:text-blue-400">
                        {selectedItem.readabilityLevel
                          .split("-")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(" ")}
                      </span>
                    )}
                    {selectedItem.purpose && (
                      <span className="rounded-full bg-purple-100 px-3 py-1 font-medium text-purple-700 text-xs dark:bg-purple-900/30 dark:text-purple-400">
                        {selectedItem.purpose
                          .split("-")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(" ")}
                      </span>
                    )}
                    {selectedItem.language && (
                      <span className="rounded-full bg-green-100 px-3 py-1 font-medium text-green-700 text-xs dark:bg-green-900/30 dark:text-green-400">
                        {selectedItem.language}
                      </span>
                    )}
                    {selectedItem.lengthMode &&
                      selectedItem.lengthMode !== "standard" && (
                        <span className="rounded-full bg-orange-100 px-3 py-1 font-medium text-orange-700 text-xs dark:bg-orange-900/30 dark:text-orange-400">
                          {selectedItem.lengthMode === "shorten"
                            ? "Make it shorter"
                            : "Make it longer"}
                        </span>
                      )}
                    {selectedItem.lengthMode === "standard" && (
                      <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700 text-xs dark:bg-gray-800 dark:text-gray-300">
                        Keep it as is
                      </span>
                    )}
                  </div>
                )}

                {/* Stats and Actions Row */}
                <div className="space-y-4 border-border border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      {selectedItem.humanScore && (
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground text-sm">
                            {selectedItem.humanScore}%
                          </span>
                          <span className="text-muted-foreground text-xs">
                            HUMAN WRITTEN
                          </span>
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground text-sm">
                          {selectedItem.wordCount}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          Words
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          const text =
                            activeTab === "input"
                              ? selectedItem.originalText
                              : selectedItem.humanizedText;
                          handleCopyText(text);
                        }}
                        title="Copy"
                        variant="ghost"
                      >
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          const text =
                            activeTab === "input"
                              ? selectedItem.originalText
                              : selectedItem.humanizedText;
                          const filename = `humanize-${selectedItem.id}-${
                            activeTab === "input" ? "input" : "humanized"
                          }.txt`;
                          handleDownloadText(text, filename);
                        }}
                        title="Download"
                        variant="ghost"
                      >
                        <Download className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 cursor-pointer"
                      onClick={() => {
                        handleRestoreToEditor(selectedItem);
                        // Trigger AI detection after restore
                        setTimeout(() => {
                          const detectButton = document.querySelector(
                            '[data-action="detect-ai"]'
                          ) as HTMLElement;
                          detectButton?.click();
                        }, 100);
                      }}
                      size="sm"
                      variant="outline"
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Check for AI
                    </Button>
                    <Button
                      className="flex-1 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => handleRestoreToEditor(selectedItem)}
                      size="sm"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Humanize
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
