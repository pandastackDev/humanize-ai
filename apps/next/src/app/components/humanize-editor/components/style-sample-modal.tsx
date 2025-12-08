import { Button } from "@humanize/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@humanize/ui/components/dialog";
import { Textarea } from "@humanize/ui/components/textarea";
import { Pencil } from "lucide-react";
import { EXAMPLE_TEXT, WORD_COUNT_REGEX } from "../constants";

type StyleSampleModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tempStyleSample: string;
  setTempStyleSample: (value: string) => void;
  styleSampleError: string | null;
  setStyleSampleError: (value: string | null) => void;
  onSave: () => void;
};

export function StyleSampleModal({
  open,
  onOpenChange,
  tempStyleSample,
  setTempStyleSample,
  styleSampleError,
  setStyleSampleError,
  onSave,
}: StyleSampleModalProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-card-foreground" />
            <DialogTitle className="text-left">My Writing Style</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            This feature helps generate content that matches your writing style.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Textarea
              className={`h-sidebar-content resize-none overflow-y-auto border-2 bg-card text-sm focus:ring-0 dark:bg-editor-bg ${
                tempStyleSample.trim().length > 0
                  ? "border-brand-primary focus:border-brand-primary"
                  : "border-border focus:border-brand-primary"
              }`}
              onChange={(e) => {
                const value = e.target.value;
                setTempStyleSample(value);
                if (styleSampleError) {
                  const wc = value
                    .trim()
                    .split(WORD_COUNT_REGEX)
                    .filter(Boolean).length;
                  if (wc >= 150) {
                    setStyleSampleError(null);
                  }
                }
              }}
              placeholder="Add your real text, min 150 words"
              value={tempStyleSample}
            />
            {styleSampleError && (
              <p className="text-destructive text-xs dark:text-destructive">
                {styleSampleError}
              </p>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground text-sm dark:text-muted-foreground">
                  {
                    tempStyleSample
                      .trim()
                      .split(WORD_COUNT_REGEX)
                      .filter(Boolean).length
                  }{" "}
                  / 30,000 Words
                </span>
              </div>
              <button
                className="font-medium text-brand-primary text-sm hover:text-brand-primary/90 dark:text-brand-primary dark:hover:text-brand-primary/90"
                onClick={() => {
                  setTempStyleSample(EXAMPLE_TEXT);
                }}
                type="button"
              >
                Show me an example
              </button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            className="border-border bg-card text-card-foreground hover:bg-muted"
            onClick={() => {
              onOpenChange(false);
              setTempStyleSample("");
            }}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            className="bg-brand-primary text-white hover:bg-brand-primary/90"
            onClick={onSave}
            type="button"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
