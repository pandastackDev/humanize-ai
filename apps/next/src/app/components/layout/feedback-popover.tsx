"use client";

import { Button } from "@humanize/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@humanize/ui/components/popover";
import { Textarea } from "@humanize/ui/components/textarea";
import { MessageSquare, Paperclip, Send } from "lucide-react";
import { useState } from "react";

const EMOJI_REACTIONS = [
  { emoji: "😭", value: "very_sad" },
  { emoji: "😞", value: "sad" },
  { emoji: "😊", value: "happy" },
  { emoji: "🤩", value: "very_happy" },
];

export function FeedbackPopover() {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState<string>("");
  const [feedback, setFeedback] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <MessageSquare />
          Feedback
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[420px] border-border bg-popover p-4"
        side="bottom"
        sideOffset={8}
      >
        {/* Feedback Text Area */}
        <div className="mb-4">
          <Textarea
            className="min-h-[100px]"
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Your feedback..."
            value={feedback}
          />
        </div>

        {/* Footer with attachment indicator and emoji reactions */}
        <div className="mb-4 flex items-center justify-between">
          {/* Attachment indicator */}
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <Paperclip className="h-3.5 w-3.5" />
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
      </PopoverContent>
    </Popover>
  );
}
