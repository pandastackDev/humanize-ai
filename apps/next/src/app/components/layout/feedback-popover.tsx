"use client";

import { Button } from "@humanize/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@humanize/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@humanize/ui/components/select";
import { Textarea } from "@humanize/ui/components/textarea";
import { MessageSquare, Paperclip, Send } from "lucide-react";
import { useState } from "react";

const EMOJI_REACTIONS = [
  { emoji: "😭", value: "very_sad" },
  { emoji: "😞", value: "sad" },
  { emoji: "😊", value: "happy" },
  { emoji: "🤩", value: "very_happy" },
];

const FEEDBACK_TOPICS = [
  "Bug Report",
  "Feature Request",
  "General Feedback",
  "Question",
  "Other",
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
        <Button
          className="h-9 cursor-pointer bg-black text-white hover:bg-slate-800 dark:bg-[#282828] dark:text-white"
          size="sm"
          variant="default"
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Feedback
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[420px] border-slate-200 bg-white p-4 dark:border-[#1d1d1d] dark:bg-[#1d1d1d]"
        side="bottom"
        sideOffset={8}
      >
        {/* Title */}
        <div className="mb-4">
          <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
            Feedback
          </h3>
        </div>

        {/* Topic Selection */}
        <div className="mb-4">
          <Select onValueChange={setTopic} value={topic}>
            <SelectTrigger className="w-full border-slate-200 bg-white text-slate-900 dark:border-[#1f1f1f] dark:bg-[#1f1f1f] dark:text-white">
              <SelectValue placeholder="Select a topic..." />
            </SelectTrigger>
            <SelectContent className="border-slate-200 bg-white dark:border-[#1f1f1f] dark:bg-[#1f1f1f]">
              {FEEDBACK_TOPICS.map((feedbackTopic) => (
                <SelectItem
                  className="text-slate-900 dark:text-white"
                  key={feedbackTopic}
                  value={feedbackTopic.toLowerCase().replace(/\s+/g, "_")}
                >
                  {feedbackTopic}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Feedback Text Area */}
        <div className="mb-4">
          <Textarea
            className="min-h-[120px] resize-none border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 dark:border-[#1f1f1f] dark:bg-[#1f1f1f] dark:text-white dark:placeholder:text-slate-400"
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Your feedback..."
            value={feedback}
          />
        </div>

        {/* Footer with attachment indicator and emoji reactions */}
        <div className="mb-4 flex items-center justify-between">
          {/* Attachment indicator */}
          <div className="flex items-center gap-1.5 text-slate-500 text-xs dark:text-slate-400">
            <Paperclip className="h-3.5 w-3.5" />
            <span>supported.</span>
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
            className="cursor-pointer bg-slate-900 text-white hover:bg-slate-800 dark:bg-[#282828] dark:text-white dark:hover:bg-[#343434]"
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
