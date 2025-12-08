import type { DetectResponse } from "@/lib/detect-api";

export type HistoryItem = {
  id: string;
  originalText: string;
  humanizedText: string;
  timestamp: Date;
  wordCount: number;
  readabilityLevel?: string;
  purpose?: string;
  language?: string;
  lengthMode?: string;
  humanScore?: number;
  detectionResult?: {
    humanLikelihoodPct: number;
    aiLikelihoodPct: number;
  };
};

export type EnabledFeatures = {
  changed: boolean;
  structural: boolean;
  unchanged: boolean;
  thesaurus: boolean;
};

export type PresentFeatures = {
  changed: boolean;
  structural: boolean;
  unchanged: boolean;
  thesaurus: boolean;
};

export type EditorState = {
  inputText: string;
  outputText: string;
  activeTab: string;
  selectedLanguage: string;
  readabilityLevel: string;
  purpose: string;
  lengthMode: "shorten" | "expand" | "standard";
  styleSample: string;
  advancedMode: boolean;
  humanScore: number | null;
  detectionResult: DetectResponse | null;
  hasInteracted: boolean;
};

export type HumanizeEditorProps = {
  userId?: string;
  organizationId?: string;
};

export type FileType = "pdf" | "docx" | "doc" | "txt" | "unknown";

export type DetectorStyles = {
  bgColor: string;
  borderColor: string;
  textColor: string;
};
