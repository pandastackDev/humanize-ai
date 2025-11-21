"use client";

import { Button } from "@humanize/ui/components/button";
import { Check, ChevronDown, Plus, RefreshCw, Settings } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateTeamDialog } from "./create-team-dialog";

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
  currentProject = "Default project",
  teams = [
    { id: "default", name: "Default team" },
    { id: "finapp", name: "Finapp" },
  ],
  selectedTeamId = "default",
  onTeamSelect,
  onManageTeams,
}: ProjectTeamDropdownProps) {
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(selectedTeamId);

  const handleTeamSelect = (teamId: string) => {
    setSelectedTeam(teamId);
    onTeamSelect?.(teamId);
    console.log("Team selected:", teamId);
    // Handle team selection - can add API call here
  };

  const handleManageTeams = () => {
    onManageTeams?.();
    console.log("Manage teams clicked");
    // Handle manage teams - can navigate or open modal here
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="h-9 w-[140px] cursor-pointer border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
            variant="outline"
          >
            <span className="flex-1 text-left">{currentProject}</span>
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[240px] border-slate-200 bg-white"
        >
          {/* Header with title and refresh icon */}
          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-900 text-sm">
                {currentProject}
              </span>
              <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            </div>
          </div>

          <DropdownMenuSeparator className="bg-slate-200" />

          {/* TEAMS Section */}
          <div className="px-2 py-1.5">
            <div className="mb-2 px-2 font-semibold text-slate-500 text-xs uppercase tracking-wider">
              TEAMS
            </div>
            <div className="space-y-0.5">
              {teams.map((team) => (
                <DropdownMenuItem
                  className="cursor-pointer rounded-md px-2 py-1.5 text-slate-900 hover:bg-slate-100 focus:bg-slate-100"
                  key={team.id}
                  onClick={() => handleTeamSelect(team.id)}
                >
                  <div className="flex w-full items-center gap-2">
                    {selectedTeam === team.id && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                    {selectedTeam !== team.id && <div className="h-4 w-4" />}
                    <span className="flex-1 text-sm">{team.name}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          </div>

          <DropdownMenuSeparator className="bg-slate-200" />

          {/* Create Team */}
          <DropdownMenuItem
            className="cursor-pointer rounded-md px-2 py-1.5 text-slate-900 hover:bg-slate-100 focus:bg-slate-100"
            onClick={() => setCreateTeamOpen(true)}
          >
            <div className="flex w-full items-center gap-2">
              <Plus className="h-4 w-4" />
              <span className="text-sm">Create team</span>
            </div>
          </DropdownMenuItem>

          {/* Manage Teams */}
          <DropdownMenuItem
            className="cursor-pointer rounded-md px-2 py-1.5 text-slate-900 hover:bg-slate-100 focus:bg-slate-100"
            onClick={handleManageTeams}
          >
            <div className="flex w-full items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="text-sm">Manage teams</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateTeamDialog
        onOpenChange={setCreateTeamOpen}
        open={createTeamOpen}
      />
    </>
  );
}
