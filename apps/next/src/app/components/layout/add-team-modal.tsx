"use client";

import { Button, Dialog, Flex, Text, TextField } from "@radix-ui/themes";
import type React from "react";
import { useState } from "react";

export function AddTeamModal({
  open,
  onOpenChange,
  onCreateTeam,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTeam: (name: string) => Promise<void>;
}) {
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamName.trim()) {
      setError("Please enter a team name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onCreateTeam(teamName);
      setTeamName("");
      setLoading(false);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create team");
      setLoading(false);
    }
  };

  return (
    <Dialog.Root onOpenChange={onOpenChange} open={open}>
      <Dialog.Content maxWidth="450px">
        <Dialog.Title>Create New Team</Dialog.Title>
        <Dialog.Description mb="4" size="2">
          Enter a name for your new team.
        </Dialog.Description>

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3">
            <label>
              <Text as="div" mb="1" size="2" weight="bold">
                Team Name
              </Text>
              <TextField.Root
                disabled={loading}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name"
                value={teamName}
              />
            </label>

            {error && (
              <Text color="red" size="2">
                {error}
              </Text>
            )}

            <Flex gap="3" justify="end" mt="4">
              <Dialog.Close>
                <Button color="gray" disabled={loading} variant="soft">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button disabled={loading} type="submit">
                {loading ? "Creating..." : "Create Team"}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
