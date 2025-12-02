"use client";

import { Button } from "@humanize/ui/components/button";
import { Dialog, DialogContent } from "@humanize/ui/components/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@humanize/ui/components/popover";
import { Textarea } from "@humanize/ui/components/textarea";
import { MessageSquare, Paperclip, Send } from "lucide-react";
import type React from "react";
import { useState } from "react";

const EMOJI_REACTIONS = [
  { emoji: "😭", value: "very_sad" },
  { emoji: "😞", value: "sad" },
  { emoji: "😊", value: "happy" },
  { emoji: "🤩", value: "very_happy" },
];

type FeedbackPopoverProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  hideTrigger?: boolean;
};

export function FeedbackPopover({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
  hideTrigger = false,
}: FeedbackPopoverProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [topic, setTopic] = useState<string>("");
  const [feedback, setFeedback] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Use controlled or internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const handleSend = () => {
    if (!feedback.trim()) {
      return;
    }

    setLoading(true);
    try {
      // Handle feedback submission
      console.log("Feedback submitted:", {
        topic,
        feedback,
        emoji: selectedEmoji,
      });

      // Reset form
      setTopic("");
      setFeedback("");
      setSelectedEmoji(null);
      setOpen(false);
    } catch (error) {
      console.error("Error submitting feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  // Shared feedback form content
  const feedbackContent = (
    <>
      {/* Feedback Text Area */}
      <div className="mb-4">
        <Textarea
          className="min-h-textarea resize-none overflow-auto"
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Your feedback..."
          style={{ resize: "none" }}
          value={feedback}
        />
      </div>

      {/* Footer with attachment indicator and emoji reactions */}
      <div className="mb-4 flex items-center justify-between">
        {/* Attachment indicator */}
        <div className="flex items-center gap-1-5 text-muted-foreground text-xs">
          <Paperclip className="size-icon-sm" />
        </div>

        {/* Emoji Reactions */}
        <div className="flex items-center gap-2">
          {EMOJI_REACTIONS.map(({ emoji, value }) => (
            <button
              className={`text-lg transition-transform hover:scale-110 ${
                selectedEmoji === value ? "scale-125" : ""
              }`}
              key={value}
              onClick={() =>
                setSelectedEmoji(selectedEmoji === value ? null : value)
              }
              type="button"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Send Button */}
      <div className="flex justify-end">
        <Button
          className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={loading || !feedback.trim()}
          onClick={handleSend}
          size="sm"
        >
          {loading ? (
            "Sending..."
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send
            </>
          )}
        </Button>
      </div>
    </>
  );

  // Use Dialog when hideTrigger is true (opened from dropdown menu)
  if (hideTrigger) {
    return (
      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent
          className="w-feedback sm:max-w-feedback"
          showCloseButton={false}
        >
          {feedbackContent}
        </DialogContent>
      </Dialog>
    );
  }

  // Use Popover for normal button trigger
  return (
    <Popover onOpenChange={setOpen} open={open}>
      {trigger ? (
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      ) : (
        <PopoverTrigger asChild>
          <Button variant="outline">
            <MessageSquare />
            Feedback
          </Button>
        </PopoverTrigger>
      )}
      <PopoverContent
        align="end"
        className="w-feedback border-border bg-popover p-4"
        side="bottom"
        sideOffset={8}
      >
        {feedbackContent}
      </PopoverContent>
    </Popover>
  );
}
