"use client";

import { Button } from "@humanize/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@humanize/ui/components/dropdown-menu";
import { Check, ChevronDown, Plus, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { CreateTeamDialog } from "./create-team-dialog";
import { ManageTeamsDialog } from "./manage-teams-dialog";

type Team = {
  id: string;
  name: string;
};

type ProjectTeamDropdownProps = {
  currentProject?: string;
  teams?: Team[];
  selectedTeamId?: string;
  onTeamSelect?: (teamId: string) => void;
  onManageTeams?: () => void;
};

export function ProjectTeamDropdown({
  currentProject,
  teams = [
    { id: "default", name: "Vadym's Team" },
    { id: "finapp", name: "Finapp" },
  ],
  selectedTeamId = "default",
  onTeamSelect,
  onManageTeams,
}: ProjectTeamDropdownProps) {
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [manageTeamsOpen, setManageTeamsOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(selectedTeamId);
  const [localTeams, setLocalTeams] = useState(teams);

  // Sync local state with props
  useEffect(() => {
    setLocalTeams(teams);
  }, [teams]);

  useEffect(() => {
    setSelectedTeam(selectedTeamId);
  }, [selectedTeamId]);

  const handleTeamSelect = (teamId: string) => {
    setSelectedTeam(teamId);
    onTeamSelect?.(teamId);
    console.log("Team selected:", teamId);
    // Handle team selection - can add API call here
  };

  const handleManageTeams = () => {
    setManageTeamsOpen(true);
    onManageTeams?.();
    console.log("Manage teams clicked");
  };

  const handleTeamUpdate = (teamId: string, newName: string) => {
    setLocalTeams((prev) =>
      prev.map((team) =>
        team.id === teamId ? { ...team, name: newName } : team
      )
    );
    console.log("Team updated:", teamId, newName);
    // Handle team update - can add API call here
  };

  const handleTeamDelete = (teamId: string) => {
    if (selectedTeam === teamId && localTeams.length > 1) {
      const otherTeam = localTeams.find((t) => t.id !== teamId);
      if (otherTeam) {
        setSelectedTeam(otherTeam.id);
        onTeamSelect?.(otherTeam.id);
      }
    }
    setLocalTeams((prev) => prev.filter((team) => team.id !== teamId));
    console.log("Team deleted:", teamId);
    // Handle team delete - can add API call here
  };

  const handleCreateTeamFromManage = () => {
    setManageTeamsOpen(false);
    setCreateTeamOpen(true);
  };

  const handleCreateTeam = (teamName: string) => {
    const newTeam = {
      id: `team-${Date.now()}`,
      name: teamName,
    };
    setLocalTeams((prev) => [...prev, newTeam]);
    console.log("Team created:", newTeam);
    // Handle team creation - can add API call here
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            {currentProject}
            <ChevronDown className="opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[240px] border-border bg-popover"
        >
          {/* TEAMS Section */}
          <div className="px-2 py-1.5">
            <div className="mb-2 px-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
              TEAMS
            </div>
            <div className="space-y-0.5">
              {localTeams.map((team) => (
                <DropdownMenuItem
                  className="cursor-pointer rounded-md px-2 py-1.5 text-popover-foreground hover:bg-accent focus:bg-accent"
                  key={team.id}
                  onClick={() => handleTeamSelect(team.id)}
                >
                  <div className="flex w-full items-center gap-2">
                    {selectedTeam === team.id && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                    {selectedTeam !== team.id && <div className="h-4 w-4" />}
                    <span className="flex-1 text-popover-foreground text-sm">
                      {team.name}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          </div>

          <DropdownMenuSeparator />

          {/* Create Team */}
          <DropdownMenuItem
            className="cursor-pointer rounded-md px-2 py-1.5 text-popover-foreground hover:bg-accent focus:bg-accent"
            onClick={() => setCreateTeamOpen(true)}
          >
            <div className="flex w-full items-center gap-2">
              <Plus className="h-4 w-4 text-popover-foreground" />
              <span className="text-popover-foreground text-sm">
                Create team
              </span>
            </div>
          </DropdownMenuItem>

          {/* Manage Teams */}
          <DropdownMenuItem
            className="cursor-pointer rounded-md px-2 py-1.5 text-popover-foreground hover:bg-accent focus:bg-accent"
            onClick={handleManageTeams}
          >
            <div className="flex w-full items-center gap-2">
              <Settings className="h-4 w-4 text-popover-foreground" />
              <span className="text-popover-foreground text-sm">
                Manage teams
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateTeamDialog
        onCreateTeam={handleCreateTeam}
        onOpenChange={setCreateTeamOpen}
        open={createTeamOpen}
      />

      <ManageTeamsDialog
        onCreateTeam={handleCreateTeamFromManage}
        onOpenChange={setManageTeamsOpen}
        onTeamDelete={handleTeamDelete}
        onTeamSelect={handleTeamSelect}
        onTeamUpdate={handleTeamUpdate}
        open={manageTeamsOpen}
        selectedTeamId={selectedTeam}
        teams={localTeams}
      />
    </>
  );
}
