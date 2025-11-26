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
import { Check, Edit2, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

type Team = {
  id: string;
  name: string;
};

type ManageTeamsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teams?: Team[];
  selectedTeamId?: string;
  onTeamSelect?: (teamId: string) => void;
  onTeamUpdate?: (teamId: string, newName: string) => void;
  onTeamDelete?: (teamId: string) => void;
  onCreateTeam?: () => void;
};

export function ManageTeamsDialog({
  open,
  onOpenChange,
  teams = [],
  selectedTeamId,
  onTeamSelect,
  onTeamUpdate,
  onTeamDelete,
  onCreateTeam,
}: ManageTeamsDialogProps) {
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleStartEdit = (team: Team) => {
    setEditingTeamId(team.id);
    setEditName(team.name);
  };

  const handleCancelEdit = () => {
    setEditingTeamId(null);
    setEditName("");
  };

  const handleSaveEdit = (teamId: string) => {
    if (
      !editName.trim() ||
      editName.trim() === teams.find((t) => t.id === teamId)?.name
    ) {
      handleCancelEdit();
      return;
    }

    setLoading(true);
    try {
      onTeamUpdate?.(teamId, editName.trim());
      setEditingTeamId(null);
      setEditName("");
    } catch (error) {
      console.error("Error updating team:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (teamId: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${teams.find((t) => t.id === teamId)?.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      onTeamDelete?.(teamId);
    } catch (error) {
      console.error("Error deleting team:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = () => {
    onOpenChange(false);
    onCreateTeam?.();
  };

  const handleTeamSelect = (teamId: string) => {
    onTeamSelect?.(teamId);
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="border-border bg-background text-left dark:border-[var(--color-editor-border)] dark:bg-[var(--color-editor-bg)]">
        <DialogHeader className="text-left">
          <DialogTitle className="font-semibold text-foreground text-xl dark:text-foreground">
            Manage teams
          </DialogTitle>
          <DialogDescription className="mt-2 text-muted-foreground text-sm leading-relaxed dark:text-muted-foreground">
            View, edit, and manage your teams. Teams are shared environments
            where members can collaborate and share API resources.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Teams List */}
          <div className="space-y-2">
            {teams.length === 0 ? (
              <div className="rounded-md border border-border bg-muted p-8 text-center dark:border-border dark:bg-card">
                <p className="text-muted-foreground text-sm dark:text-muted-foreground">
                  No teams yet. Create your first team to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {teams.map((team) => (
                  <div
                    className="group flex items-center gap-2 rounded-md border border-border bg-card p-3 transition-all hover:border-border hover:shadow-sm dark:border-border dark:bg-card dark:hover:border-border/50"
                    key={team.id}
                  >
                    {editingTeamId === team.id ? (
                      <>
                        <Input
                          className="flex-1 border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:border-border focus-visible:ring-ring dark:border-border dark:bg-[var(--color-editor-bg)] dark:text-foreground dark:focus-visible:border-border dark:focus-visible:ring-ring dark:placeholder:text-muted-foreground"
                          disabled={loading}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSaveEdit(team.id);
                            } else if (e.key === "Escape") {
                              handleCancelEdit();
                            }
                          }}
                          value={editName}
                        />
                        <Button
                          className="h-8 w-8 rounded p-0"
                          disabled={loading}
                          onClick={() => handleSaveEdit(team.id)}
                          size="sm"
                          variant="ghost"
                        >
                          <Check className="h-4 w-4 text-green-600 dark:text-green-500" />
                        </Button>
                        <Button
                          className="h-8 w-8 rounded p-0"
                          disabled={loading}
                          onClick={handleCancelEdit}
                          size="sm"
                          variant="ghost"
                        >
                          <X className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="flex flex-1 items-center gap-2">
                          {selectedTeamId === team.id && (
                            <Check className="h-4 w-4 text-green-600 dark:text-green-500" />
                          )}
                          <button
                            className="flex-1 cursor-pointer text-left font-medium text-foreground text-sm dark:text-foreground"
                            onClick={() => handleTeamSelect(team.id)}
                            type="button"
                          >
                            {team.name}
                          </button>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            className="h-8 w-8 rounded p-0 hover:bg-muted dark:hover:bg-muted"
                            disabled={loading}
                            onClick={() => handleStartEdit(team)}
                            size="sm"
                            variant="ghost"
                          >
                            <Edit2 className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                          </Button>
                          <Button
                            className="h-8 w-8 rounded p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                            disabled={loading || teams.length === 1}
                            onClick={() => handleDelete(team.id)}
                            size="sm"
                            title={
                              teams.length === 1
                                ? "Cannot delete the last team"
                                : "Delete team"
                            }
                            variant="ghost"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create Team Button */}
          <Button
            className="w-full border-border bg-background text-foreground hover:bg-muted dark:border-border dark:bg-[var(--color-editor-bg)] dark:text-foreground dark:hover:bg-muted"
            onClick={handleCreateTeam}
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create new team
          </Button>
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            className="border-border bg-background text-foreground hover:bg-muted dark:border-border dark:bg-[var(--color-editor-bg)] dark:text-foreground dark:hover:bg-muted"
            disabled={loading}
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
