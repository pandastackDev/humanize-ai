"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export type TextFeatureType =
  | "changed"
  | "structural"
  | "unchanged"
  | "thesaurus"
  | "plain";

// Regex patterns defined at top level for performance
const WORD_SPLIT_REGEX = /\s+/;
const SPACE_REGEX = /\s/;

export type TextSegment = {
  type: TextFeatureType;
  text: string;
  start: number;
  end: number;
  originalWord?: string;
};

type TextDiffViewerProps = {
  originalText: string;
  humanizedText: string;
  className?: string;
  enabledFeatures?: {
    changed?: boolean;
    structural?: boolean;
    unchanged?: boolean;
    thesaurus?: boolean;
  };
  onWordSelect?: (
    word: string,
    position: { start: number; end: number }
  ) => void;
  onFeaturesDetected?: (features: {
    changed: boolean;
    structural: boolean;
    unchanged: boolean;
    thesaurus: boolean;
  }) => void;
};

/**
 * Extract trailing whitespace after a word, preserving newlines and formatting.
 */
function extractTrailingWhitespace(text: string, startPos: number): string {
  let whitespace = "";
  let j = startPos;
  while (j < text.length) {
    const char = text[j];
    if (char && SPACE_REGEX.test(char)) {
      whitespace += char;
      j++;
    } else {
      break;
    }
  }
  return whitespace;
}

/**
 * Determine the segment type based on unchanged status and structural analysis.
 */
function determineSegmentType(
  isUnchanged: boolean,
  isStructural: boolean
): TextFeatureType {
  if (isUnchanged && !isStructural) {
    return "unchanged";
  }
  if (isStructural) {
    return "structural";
  }
  return "changed";
}

/**
 * Simplified diff algorithm to identify text features
 */
function computeTextFeatures(
  original: string,
  humanized: string
): TextSegment[] {
  const segments: TextSegment[] = [];

  const origNormalized = original.trim();
  const humanNormalized = humanized.trim();

  if (origNormalized.length === 0 || humanNormalized.length === 0) {
    return segments;
  }

  // Split into words
  const origWords = origNormalized.split(WORD_SPLIT_REGEX).filter(Boolean);
  const humanWords = humanNormalized.split(WORD_SPLIT_REGEX).filter(Boolean);

  // Find longest common subsequence for unchanged words
  const lcs = findLCS(origWords, humanWords);
  const unchangedSet = new Set(lcs.map((w) => w.toLowerCase()));

  // Build segments from humanized text
  let currentPos = 0;
  const humanText = humanNormalized;

  for (let i = 0; i < humanWords.length; i++) {
    const word = humanWords[i];
    if (!word) {
      continue;
    }

    const wordLower = word.toLowerCase();
    const wordIndex = humanText.indexOf(word, currentPos);

    if (wordIndex === -1) {
      continue;
    }

    const wordStart = wordIndex;
    const wordEnd = wordIndex + word.length;

    // Extract trailing whitespace to preserve formatting
    const spaceAfter = extractTrailingWhitespace(humanText, wordEnd);

    // Check if word is in longest unchanged sequence
    const isUnchanged = unchangedSet.has(wordLower);

    // Check if surrounding context suggests structural change
    const isStructural = checkStructuralChange(
      origWords,
      humanWords,
      i,
      unchangedSet
    );

    const segmentType = determineSegmentType(isUnchanged, isStructural);

    segments.push({
      type: segmentType,
      text: word + spaceAfter,
      start: wordStart,
      end: wordEnd,
    });

    currentPos = wordEnd + spaceAfter.length;
  }

  return segments;
}

/**
 * Build LCS DP table
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: LCS algorithm requires nested loops
function buildLCSTable(words1: string[], words2: string[]): number[][] {
  const m = words1.length;
  const n = words2.length;
  const dp: number[][] = new Array(m + 1)
    .fill(null)
    .map(() => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const word1 = words1[i - 1];
      const word2 = words2[j - 1];

      if (word1 && word2 && word1.toLowerCase() === word2.toLowerCase()) {
        const prev = dp[i - 1]?.[j - 1] ?? 0;
        const current = dp[i];
        if (current) {
          current[j] = prev + 1;
        }
      } else {
        const prevI = dp[i - 1]?.[j] ?? 0;
        const prevJ = dp[i]?.[j - 1] ?? 0;
        const current = dp[i];
        if (current) {
          current[j] = Math.max(prevI, prevJ);
        }
      }
    }
  }

  return dp;
}

/**
 * Reconstruct LCS from DP table
 */
function reconstructLCS(
  words1: string[],
  words2: string[],
  dp: number[][]
): string[] {
  const lcs: string[] = [];
  let i = words1.length;
  let j = words2.length;

  while (i > 0 && j > 0) {
    const word1 = words1[i - 1];
    const word2 = words2[j - 1];

    if (word1 && word2 && word1.toLowerCase() === word2.toLowerCase()) {
      lcs.unshift(word1.toLowerCase());
      i--;
      j--;
    } else {
      const prevI = dp[i - 1]?.[j] ?? 0;
      const prevJ = dp[i]?.[j - 1] ?? 0;
      if (prevI > prevJ) {
        i--;
      } else {
        j--;
      }
    }
  }

  return lcs;
}

/**
 * Find Longest Common Subsequence of words (case-insensitive)
 */
function findLCS(words1: string[], words2: string[]): string[] {
  const dp = buildLCSTable(words1, words2);
  return reconstructLCS(words1, words2, dp);
}

function countWindowChanges(
  humanWords: string[],
  start: number,
  end: number,
  unchangedSet: Set<string>
): { changes: number; matches: number } {
  let changes = 0;
  let matches = 0;

  for (let i = start; i < end; i++) {
    const word = humanWords[i];
    if (word) {
      if (unchangedSet.has(word.toLowerCase())) {
        matches++;
      } else {
        changes++;
      }
    }
  }

  return { changes, matches };
}

function checkStructuralChange(
  _origWords: string[],
  humanWords: string[],
  index: number,
  unchangedSet: Set<string>
): boolean {
  const window = 3;
  const start = Math.max(0, index - window);
  const end = Math.min(humanWords.length, index + window + 1);

  const { changes, matches } = countWindowChanges(
    humanWords,
    start,
    end,
    unchangedSet
  );

  // If many changes relative to matches, likely structural
  return changes >= 2 && changes > matches;
}

export function TextDiffViewer({
  originalText,
  humanizedText,
  className,
  enabledFeatures = {
    changed: true,
    structural: true,
    unchanged: true,
    thesaurus: false,
  },
  onWordSelect,
  onFeaturesDetected,
}: TextDiffViewerProps) {
  const [selectedWord, setSelectedWord] = useState<{
    start: number;
    end: number;
  } | null>(null);

  const segments = useMemo(() => {
    const trimmedOriginal = originalText?.trim() ?? "";
    const trimmedHumanized = humanizedText?.trim() ?? "";

    if (trimmedOriginal.length === 0 || trimmedHumanized.length === 0) {
      return [];
    }
    return computeTextFeatures(originalText, humanizedText);
  }, [originalText, humanizedText]);

  // Detect which features are actually present in the output
  // Note: "thesaurus" is not automatically detected - it's only an interactive feature
  const presentFeatures = useMemo(() => {
    const features = {
      changed: false,
      structural: false,
      unchanged: false,
      thesaurus: false, // Always false - thesaurus is interactive only, not auto-detected
    };

    for (const segment of segments) {
      if (segment.type === "changed") {
        features.changed = true;
      } else if (segment.type === "structural") {
        features.structural = true;
      } else if (segment.type === "unchanged") {
        features.unchanged = true;
      }
      // "thesaurus" is never auto-detected - it's only available as an interactive feature
    }

    return features;
  }, [segments]);

  // Notify parent component about detected features
  useEffect(() => {
    if (onFeaturesDetected) {
      onFeaturesDetected(presentFeatures);
    }
  }, [presentFeatures, onFeaturesDetected]);

  const hasText = Boolean(humanizedText);

  // Group consecutive segments of the same type
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Segment grouping requires iteration logic
  const groupedSegments = useMemo(() => {
    if (!hasText) {
      return [];
    }

    if (segments.length === 0) {
      return [
        {
          type: "unchanged" as TextFeatureType,
          text: humanizedText,
          start: 0,
          end: humanizedText.length,
        },
      ];
    }

    const grouped: Array<{
      type: TextFeatureType;
      text: string;
      start: number;
      end: number;
    }> = [];
    let currentGroup: {
      type: TextFeatureType;
      text: string;
      start: number;
      end: number;
    } | null = null;

    for (const segment of segments) {
      // All features respect their enabledFeatures value
      // When disabled, segments are displayed as plain text (no highlighting)
      let displayType: TextFeatureType;
      // Only check enabledFeatures for actual feature types (not "plain")
      if (
        segment.type !== "plain" &&
        enabledFeatures[segment.type as keyof typeof enabledFeatures]
      ) {
        displayType = segment.type;
      } else {
        displayType = "plain";
      }

      if (currentGroup && currentGroup.type === displayType) {
        currentGroup.text += segment.text;
        currentGroup.end = segment.end;
      } else {
        if (currentGroup) {
          grouped.push(currentGroup);
        }
        currentGroup = {
          type: displayType,
          text: segment.text,
          start: segment.start,
          end: segment.end,
        };
      }
    }

    if (currentGroup) {
      grouped.push(currentGroup);
    }

    return grouped;
  }, [segments, enabledFeatures, humanizedText, hasText]);

  const handleWordClick = (segment: {
    start: number;
    end: number;
    type: TextFeatureType;
  }) => {
    const isThesaurus = segment.type === "thesaurus";
    const thesaurusEnabled = enabledFeatures.thesaurus;

    if (isThesaurus || thesaurusEnabled) {
      setSelectedWord({ start: segment.start, end: segment.end });
      if (onWordSelect && hasText) {
        const word = humanizedText.substring(segment.start, segment.end).trim();
        onWordSelect(word, { start: segment.start, end: segment.end });
      }
    }
  };

  const getSegmentTitle = (type: TextFeatureType): string => {
    if (type === "thesaurus") {
      return "Click to see synonyms";
    }
    if (type === "changed") {
      return "Changed word";
    }
    if (type === "structural") {
      return "Structural change";
    }
    if (type === "unchanged") {
      return "Unchanged word";
    }
    return "";
  };

  if (!hasText) {
    return null;
  }

  return (
    <div className={cn("whitespace-pre-wrap break-words", className)}>
      {groupedSegments.map((segment, index) => {
        const baseClasses = "px-0.5 rounded transition-colors";
        const typeClasses: Record<TextFeatureType, string> = {
          changed:
            "bg-red-100 text-red-900 underline decoration-red-300 dark:bg-red-900/30 dark:text-red-200 dark:decoration-red-700",
          structural:
            "bg-yellow-100 text-yellow-900 underline decoration-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-200 dark:decoration-yellow-700",
          unchanged:
            "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200",
          thesaurus:
            "bg-purple-100 text-purple-900 underline decoration-purple-300 cursor-pointer hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-200 dark:decoration-purple-700 dark:hover:bg-purple-900/50",
          plain: "",
        };

        const isSelected =
          selectedWord &&
          segment.start >= selectedWord.start &&
          segment.end <= selectedWord.end;

        const isClickable =
          segment.type === "thesaurus" || enabledFeatures.thesaurus;
        const isPlain = segment.type === "plain";

        // Plain text segments don't need any special styling or classes
        if (isPlain) {
          return (
            <span key={`segment-${segment.start}-${segment.end}-${index}`}>
              {segment.text}
            </span>
          );
        }

        if (isClickable) {
          return (
            <button
              className={cn(
                baseClasses,
                typeClasses[segment.type],
                isSelected && "ring-2 ring-purple-500 ring-offset-1",
                "cursor-pointer"
              )}
              key={`segment-${segment.start}-${segment.end}-${index}`}
              onClick={() => {
                handleWordClick(segment);
              }}
              title={getSegmentTitle(segment.type)}
              type="button"
            >
              {segment.text}
            </button>
          );
        }

        return (
          <span
            className={cn(
              baseClasses,
              typeClasses[segment.type],
              isSelected && "ring-2 ring-purple-500 ring-offset-1"
            )}
            key={`segment-${segment.start}-${segment.end}-${index}`}
            title={getSegmentTitle(segment.type)}
          >
            {segment.text}
          </span>
        );
      })}
    </div>
  );
}
