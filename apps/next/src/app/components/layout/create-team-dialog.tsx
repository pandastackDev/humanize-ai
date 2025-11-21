"use client";

import { Button } from "@humanize/ui/components/button";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
      <DialogContent className="border-slate-200 bg-white text-left">
        <DialogHeader className="text-left">
          <DialogTitle className="font-semibold text-slate-900 text-xl">
            Create a new project
          </DialogTitle>
          <DialogDescription className="mt-2 text-slate-600 text-sm leading-relaxed">
            Projects are shared environments where teams can collaborate and
            share API resources. You can set custom rate limits and manage
            access to resources.{" "}
            <button
              className="text-slate-900 underline hover:text-slate-700"
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
              className="font-semibold text-slate-900 text-sm"
              htmlFor="team-name"
            >
              Name
            </Label>
            <p className="text-slate-500 text-xs">
              Human-friendly label for your project, shown in user interfaces
              and on exports
            </p>
            <Input
              className="border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:border-slate-400 focus-visible:ring-slate-400"
              id="team-name"
              onChange={(e) => setTeamName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && teamName.trim()) {
                  handleCreate();
                }
              }}
              placeholder="Project name"
              value={teamName}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            className="border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
            disabled={loading}
            onClick={handleCancel}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            className="bg-slate-900 text-white hover:bg-slate-800"
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
