import { startTransition, useEffect, useRef, useState } from "react";
import type { DetectResponse } from "@/lib/detect-api";
import type { SubscriptionPlan } from "@/lib/subscription-api";
import { EDITOR_STATE_KEY, purposes, readabilityLevels } from "../constants";

const DEFAULT_STATE = {
  inputText: "",
  outputText: "",
  selectedLanguage: "",
  readabilityLevel: "university",
  purpose: "general",
  lengthMode: "standard" as const,
  styleSample: "",
  advancedMode: false,
  humanScore: null as number | null,
  detectionResult: null as DetectResponse | null,
  hasInteracted: false,
  activeTab: "humanize",
};

function isProReadabilityLevel(level: string): boolean {
  return Boolean(readabilityLevels.find((l) => l.value === level && l.pro));
}

function isProPurpose(purposeValue: string): boolean {
  return Boolean(purposes.find((p) => p.value === purposeValue && p.pro));
}

function getReadabilityLevel(
  stored: string | undefined,
  subscriptionPlan: SubscriptionPlan
): string {
  if (!stored) {
    return DEFAULT_STATE.readabilityLevel;
  }
  if (isProReadabilityLevel(stored) && subscriptionPlan === "free") {
    return DEFAULT_STATE.readabilityLevel;
  }
  return stored;
}

function getPurpose(
  stored: string | undefined,
  subscriptionPlan: SubscriptionPlan
): string {
  if (!stored) {
    return DEFAULT_STATE.purpose;
  }
  if (isProPurpose(stored) && subscriptionPlan === "free") {
    return DEFAULT_STATE.purpose;
  }
  return stored;
}

function loadInitialState(subscriptionPlan: SubscriptionPlan) {
  // Only access localStorage on the client side to avoid hydration mismatches
  if (typeof window === "undefined") {
    return DEFAULT_STATE;
  }

  try {
    const stored = localStorage.getItem(EDITOR_STATE_KEY);
    if (!stored) {
      return DEFAULT_STATE;
    }

    const p = JSON.parse(stored);

    return {
      inputText: p.inputText || DEFAULT_STATE.inputText,
      outputText: p.outputText || DEFAULT_STATE.outputText,
      selectedLanguage: p.selectedLanguage || DEFAULT_STATE.selectedLanguage,
      readabilityLevel: getReadabilityLevel(
        p.readabilityLevel,
        subscriptionPlan
      ),
      purpose: getPurpose(p.purpose, subscriptionPlan),
      lengthMode: p.lengthMode || DEFAULT_STATE.lengthMode,
      styleSample: p.styleSample || DEFAULT_STATE.styleSample,
      advancedMode:
        typeof p.advancedMode === "boolean"
          ? p.advancedMode
          : DEFAULT_STATE.advancedMode,
      humanScore:
        typeof p.humanScore === "number"
          ? p.humanScore
          : DEFAULT_STATE.humanScore,
      detectionResult: p.detectionResult || DEFAULT_STATE.detectionResult,
      hasInteracted:
        typeof p.hasInteracted === "boolean"
          ? p.hasInteracted
          : DEFAULT_STATE.hasInteracted,
      activeTab: p.activeTab || DEFAULT_STATE.activeTab,
    };
  } catch {
    // Silently fail - state will use defaults
    return DEFAULT_STATE;
  }
}

export function useEditorState(subscriptionPlan: SubscriptionPlan) {
  // Use a ref to track if we've loaded from localStorage (prevents duplicate loads)
  const hasLoadedFromStorageRef = useRef(false);
  // Track mounted state - starts false to prevent saving before load
  const [isMounted, setIsMounted] = useState(false);

  // Always start with default values to ensure server/client hydration match
  const [inputText, setInputText] = useState(DEFAULT_STATE.inputText);
  const [outputText, setOutputText] = useState(DEFAULT_STATE.outputText);
  const [selectedLanguage, setSelectedLanguage] = useState(
    DEFAULT_STATE.selectedLanguage
  );
  const [readabilityLevel, setReadabilityLevel] = useState(
    DEFAULT_STATE.readabilityLevel
  );
  const [purpose, setPurpose] = useState(DEFAULT_STATE.purpose);
  const [lengthMode, setLengthMode] = useState<
    "shorten" | "expand" | "standard"
  >(DEFAULT_STATE.lengthMode);
  const [styleSample, setStyleSample] = useState(DEFAULT_STATE.styleSample);
  const [advancedMode, setAdvancedMode] = useState(DEFAULT_STATE.advancedMode);
  const [humanScore, setHumanScore] = useState<number | null>(
    DEFAULT_STATE.humanScore
  );
  const [detectionResult, setDetectionResult] = useState<DetectResponse | null>(
    DEFAULT_STATE.detectionResult
  );
  const [hasInteracted, setHasInteracted] = useState(
    DEFAULT_STATE.hasInteracted
  );
  const [activeTab, setActiveTab] = useState(DEFAULT_STATE.activeTab);

  // Load state from localStorage only after mount (client-side only)
  // This is necessary to avoid hydration mismatches between server and client
  useEffect(() => {
    if (hasLoadedFromStorageRef.current) {
      return;
    }
    hasLoadedFromStorageRef.current = true;

    const loaded = loadInitialState(subscriptionPlan);

    // Use startTransition to mark these as non-urgent updates
    startTransition(() => {
      setIsMounted(true);
      setInputText(loaded.inputText);
      setOutputText(loaded.outputText);
      setSelectedLanguage(loaded.selectedLanguage);
      setReadabilityLevel(loaded.readabilityLevel);
      setPurpose(loaded.purpose);
      setLengthMode(loaded.lengthMode);
      setStyleSample(loaded.styleSample);
      setAdvancedMode(loaded.advancedMode);
      setHumanScore(loaded.humanScore);
      setDetectionResult(loaded.detectionResult);
      setHasInteracted(loaded.hasInteracted);
      setActiveTab(loaded.activeTab);
    });
  }, [subscriptionPlan]);

  // Handle subscription plan changes - adjust pro features if needed
  const prevSubscriptionPlanRef = useRef<SubscriptionPlan>(subscriptionPlan);

  useEffect(() => {
    // Only run when subscriptionPlan actually changes
    if (prevSubscriptionPlanRef.current === subscriptionPlan) {
      return;
    }

    prevSubscriptionPlanRef.current = subscriptionPlan;

    // Check current values and adjust if needed
    const isProReadability = readabilityLevels.find(
      (level) => level.value === readabilityLevel && level.pro
    );
    const isProPurposeItem = purposes.find(
      (purposeItem) => purposeItem.value === purpose && purposeItem.pro
    );

    // Use startTransition to mark these as non-urgent updates
    // This is the React-recommended pattern for state updates triggered by prop changes
    startTransition(() => {
      if (isProReadability && subscriptionPlan === "free") {
        setReadabilityLevel("university");
      }
      if (isProPurposeItem && subscriptionPlan === "free") {
        setPurpose("general");
      }
    });
  }, [subscriptionPlan, readabilityLevel, purpose]);

  // Save editor state to localStorage whenever key state changes (only after mounted)
  useEffect(() => {
    if (!isMounted) {
      return;
    }

    try {
      const state = {
        inputText,
        outputText,
        activeTab,
        selectedLanguage,
        readabilityLevel,
        purpose,
        lengthMode,
        styleSample,
        advancedMode,
        humanScore,
        detectionResult,
        hasInteracted,
      };
      localStorage.setItem(EDITOR_STATE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error("Failed to save editor state:", err);
    }
  }, [
    isMounted,
    inputText,
    outputText,
    activeTab,
    selectedLanguage,
    readabilityLevel,
    purpose,
    lengthMode,
    styleSample,
    advancedMode,
    humanScore,
    detectionResult,
    hasInteracted,
  ]);

  return {
    isMounted,
    inputText,
    setInputText,
    outputText,
    setOutputText,
    selectedLanguage,
    setSelectedLanguage,
    readabilityLevel,
    setReadabilityLevel,
    purpose,
    setPurpose,
    lengthMode,
    setLengthMode,
    styleSample,
    setStyleSample,
    advancedMode,
    setAdvancedMode,
    humanScore,
    setHumanScore,
    detectionResult,
    setDetectionResult,
    hasInteracted,
    setHasInteracted,
    activeTab,
    setActiveTab,
  };
}
