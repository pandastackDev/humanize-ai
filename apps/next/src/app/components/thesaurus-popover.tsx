"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ThesaurusPopoverProps = {
  word: string;
  onSelectSynonym: (synonym: string) => void;
  children: React.ReactNode;
};

// Mock thesaurus data - in production, this would call an API
const getSynonyms = async (word: string): Promise<string[]> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Mock synonyms based on common words
  const mockSynonyms: Record<string, string[]> = {
    beautiful: ["gorgeous", "stunning", "lovely", "attractive", "pretty"],
    good: ["excellent", "great", "fine", "nice", "wonderful"],
    big: ["large", "huge", "enormous", "massive", "gigantic"],
    small: ["tiny", "little", "mini", "compact", "miniature"],
    happy: ["joyful", "cheerful", "glad", "pleased", "delighted"],
    sad: ["unhappy", "depressed", "melancholy", "sorrowful", "down"],
    fast: ["quick", "rapid", "swift", "speedy", "hasty"],
    slow: ["sluggish", "leisurely", "gradual", "unhurried", "delayed"],
    smart: ["intelligent", "clever", "bright", "brilliant", "wise"],
    old: ["ancient", "aged", "elderly", "mature", "vintage"],
  };

  const lowerWord = word.toLowerCase();
  return (
    mockSynonyms[lowerWord] || [
      `${word}ly`,
      `${word}ful`,
      `${word}ing`,
      `more ${word}`,
      `very ${word}`,
    ]
  );
};

export function ThesaurusPopover({
  word,
  onSelectSynonym,
  children,
}: ThesaurusPopoverProps) {
  const [synonyms, setSynonyms] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleOpenChange = async (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && synonyms.length === 0) {
      setIsLoading(true);
      try {
        const results = await getSynonyms(word);
        setSynonyms(results);
      } catch (error) {
        console.error("Failed to fetch synonyms:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSelect = (synonym: string) => {
    onSelectSynonym(synonym);
    setOpen(false);
  };

  return (
    <DropdownMenu onOpenChange={handleOpenChange} open={open}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 p-3">
        <div className="mb-2">
          <p className="font-semibold text-slate-900 text-sm dark:text-slate-100">
            Synonyms for "{word}"
          </p>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {synonyms.map((synonym) => (
              <Button
                className="h-7 rounded-md px-2 font-normal text-xs"
                key={synonym}
                onClick={() => handleSelect(synonym)}
                variant="outline"
              >
                {synonym}
              </Button>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
