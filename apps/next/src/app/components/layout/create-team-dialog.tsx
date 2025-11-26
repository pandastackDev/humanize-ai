"use client";

import { Button } from "@humanize/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@humanize/ui/components/dialog";
import { Input } from "@humanize/ui/components/input";
import { Label } from "@humanize/ui/components/label";
import { useState } from "react";

type CreateTeamDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTeam?: (teamName: string) => void;
};

export function CreateTeamDialog({
  open,
  onOpenChange,
  onCreateTeam,
}: CreateTeamDialogProps) {
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!teamName.trim()) {
      return;
    }

    setLoading(true);
    try {
      await onCreateTeam?.(teamName.trim());
      setTeamName("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating team:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setTeamName("");
    onOpenChange(false);
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="border-border bg-card text-left">
        <DialogHeader className="text-left">
          <DialogTitle className="font-semibold text-card-foreground text-xl">
            Create a new team
          </DialogTitle>
          <DialogDescription className="mt-2 text-muted-foreground text-sm leading-relaxed">
            Teams are shared environments where members can collaborate and
            share API resources. You can set custom rate limits and manage
            access to resources.{" "}
            <button
              className="text-card-foreground underline hover:text-primary"
              onClick={(e) => {
                e.preventDefault();
                // Handle learn more click
              }}
              type="button"
            >
              Learn more
            </button>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label
              className="font-semibold text-card-foreground text-sm"
              htmlFor="team-name"
            >
              Name
            </Label>
            <p className="text-muted-foreground text-xs">
              Human-friendly label for your team, shown in user interfaces and
              on exports
            </p>
            <Input
              className="border-border bg-background text-card-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary"
              id="team-name"
              onChange={(e) => setTeamName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && teamName.trim()) {
                  handleCreate();
                }
              }}
              placeholder="Team name"
              value={teamName}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            className="border-border bg-background text-card-foreground hover:bg-muted"
            disabled={loading}
            onClick={handleCancel}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={loading || !teamName.trim()}
            onClick={handleCreate}
            type="button"
          >
            {loading ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
