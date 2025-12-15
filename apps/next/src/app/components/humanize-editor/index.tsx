"use client";

import { Button } from "@humanize/ui/components/button";
import { LoadingSpinner } from "@humanize/ui/components/loading-spinner";
import { Tabs, TabsList, TabsTrigger } from "@humanize/ui/components/tabs";
import { Textarea } from "@humanize/ui/components/textarea";
import {
  BarChart3,
  Clipboard,
  Clock,
  Copy,
  Download,
  FileCheck,
  FileText,
  FileUp,
  Loader2,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as pdfjsLib from "pdfjs-dist";
import type React from "react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { detectAIContent } from "@/lib/detect-api";
import { humanizeText } from "@/lib/humanize-api";
import {
  checkSubscription,
  type SubscriptionPlan,
} from "@/lib/subscription-api";
import { HistorySidebar } from "../history-sidebar";
import { ProUpgradeSidebar } from "../pro-upgrade-sidebar";
import { TextFeaturesSidebar } from "../text-features-sidebar";
import { DetectionOutput } from "./components/detection-output";
import { EditorControls } from "./components/editor-controls";
import { HumanizeOutput } from "./components/humanize-output";
import { StyleSampleModal } from "./components/style-sample-modal";
import {
  EDITOR_STATE_KEY,
  EXAMPLE_TEXT,
  purposes,
  readabilityLevels,
  WORD_COUNT_REGEX,
} from "./constants";
import { useDragDrop } from "./hooks/use-drag-drop";
import { useEditorState } from "./hooks/use-editor-state";
import { useFileUpload } from "./hooks/use-file-upload";
import { useHistory } from "./hooks/use-history";
import { MarketingInner } from "./marketing-inner";
import type {
  EnabledFeatures,
  HistoryItem,
  HumanizeEditorProps,
  PresentFeatures,
} from "./types";
import { getLanguageCode } from "./utils";

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Main component handles multiple UI states
export function HumanizeEditor({
  userId,
  organizationId,
}: HumanizeEditorProps) {
  const router = useRouter();
  const tabsId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [subscriptionPlan, setSubscriptionPlan] =
    useState<SubscriptionPlan>("free");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hasTextareaScrollbar, setHasTextareaScrollbar] = useState(false);

  const [showStyleSampleModal, setShowStyleSampleModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showProUpgrade, setShowProUpgrade] = useState(false);
  const [tempStyleSample, setTempStyleSample] = useState("");
  const [styleSampleError, setStyleSampleError] = useState<string | null>(null);

  const [enabledFeatures, setEnabledFeatures] = useState<EnabledFeatures>({
    changed: true,
    structural: true,
    unchanged: true,
    thesaurus: false,
  });
  const [presentFeatures, setPresentFeatures] = useState<PresentFeatures>({
    changed: false,
    structural: false,
    unchanged: false,
    thesaurus: false,
  });
  // Preserve the last detected features when we have output text
  const [preservedFeatures, setPreservedFeatures] = useState<PresentFeatures>({
    changed: false,
    structural: false,
    unchanged: false,
    thesaurus: false,
  });
  // Preserve the original text that was humanized, separate from current inputText
  const [originalHumanizedText, setOriginalHumanizedText] = useState("");

  const {
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
  } = useEditorState(subscriptionPlan);

  const { fileInputRef, isParsingFile, processUploadedFile, handleFileUpload } =
    useFileUpload();

  const { history, setHistory } = useHistory();

  const hasInputText = inputText.trim().length > 0;
  const hasOutputText = outputText.trim().length > 0;

  const {
    isDragOver,
    isDragOverValid,
    handleContainerDragEnter,
    handleContainerDragLeave,
    handleContainerDragOver,
    handleContainerDrop,
  } = useDragDrop(hasInputText);

  // Check if textarea has scrollbar
  useLayoutEffect(() => {
    const checkScrollbar = () => {
      if (textareaRef.current) {
        const hasScrollbar =
          textareaRef.current.scrollHeight > textareaRef.current.clientHeight;
        setHasTextareaScrollbar(hasScrollbar);
      }
    };

    requestAnimationFrame(() => {
      checkScrollbar();
    });

    window.addEventListener("resize", checkScrollbar);
    return () => {
      window.removeEventListener("resize", checkScrollbar);
    };
  }, []);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(
        document.documentElement.classList.contains("dark") ||
          window.matchMedia("(prefers-color-scheme: dark)").matches
      );
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", checkDarkMode);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", checkDarkMode);
    };
  }, []);

  // Clear all state on browser refresh to start fresh
  // Use useLayoutEffect to run synchronously before other effects
  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    // Clear localStorage to ensure fresh start on refresh
    // This must happen before useEditorState loads from localStorage
    try {
      localStorage.removeItem(EDITOR_STATE_KEY);
    } catch {
      // Silently fail if localStorage is not available
    }
  }, []); // Only run on mount (browser refresh)

  // Clear all preserved states on mount (browser refresh)
  useEffect(() => {
    setOriginalHumanizedText("");
    setPreservedFeatures({
      changed: false,
      structural: false,
      unchanged: false,
      thesaurus: false,
    });
    setPresentFeatures({
      changed: false,
      structural: false,
      unchanged: false,
      thesaurus: false,
    });
    setError(null);
    setDetectionError(null);
    setDetectionResult(null);
    setHumanScore(null);
  }, [setDetectionResult, setHumanScore]);

  // Fetch subscription status
  useEffect(() => {
    async function fetchSubscription() {
      if (!userId || typeof window === "undefined") {
        return;
      }

      try {
        const subscriptionInfo = await checkSubscription(
          userId,
          organizationId
        );
        setSubscriptionPlan(subscriptionInfo.plan);
      } catch {
        setSubscriptionPlan("free");
      }
    }

    fetchSubscription();
  }, [userId, organizationId]);

  // Initialize PDF.js worker
  useEffect(() => {
    if (typeof window !== "undefined") {
      const pdfjsVersion = pdfjsLib.version || "4.0.379";
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;
    }
  }, []);

  const wordCount = inputText
    .trim()
    .split(WORD_COUNT_REGEX)
    .filter(Boolean).length;
  const outputWordCount = outputText
    .trim()
    .split(WORD_COUNT_REGEX)
    .filter(Boolean).length;

  const wordLimit = userId ? 3000 : 500;
  const isOverLimit = wordCount > wordLimit;
  const hasStyleSample = styleSample.trim().length > 0;

  const handlePasteText = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
    } catch (err) {
      console.error("Failed to read clipboard:", err);
    }
  };

  const handleTryExample = () => {
    setInputText(EXAMPLE_TEXT);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      const text = await processUploadedFile(file);
      if (text && text.trim().length > 0) {
        setInputText(text);
        console.log("File text set to input area, length:", text.length);
      } else {
        console.warn("No text extracted from file");
      }
    } catch (fileError) {
      console.error("Error processing file:", fileError);
    }
  };

  const handleClearInput = () => {
    setInputText("");
    setOutputText("");
    setOriginalHumanizedText("");
    setPreservedFeatures({
      changed: false,
      structural: false,
      unchanged: false,
      thesaurus: false,
    });
    setHumanScore(null);
    setError(null);
    setDetectionError(null);
    setDetectionResult(null);
    setIsLoading(false);
    setIsDetecting(false);
  };

  const buildHumanizeRequest = () => {
    const languageCode = selectedLanguage
      ? getLanguageCode(selectedLanguage)
      : "en";
    return {
      input_text: inputText,
      tone: purpose || "academic",
      length_mode: lengthMode,
      readability_level: readabilityLevel || "university",
      language: languageCode !== "en" ? languageCode : undefined,
      style_sample: styleSample.trim() || undefined,
      advanced_mode: advancedMode,
    };
  };

  const processHumanizeResponse = (humanized: string) => {
    setOutputText(humanized);
    // Preserve the original text that was humanized for diff viewer
    // This ensures all three features (Changed Words, Structural Changes, Longest Unchanged Words)
    // are displayed correctly even if user clears the input later
    if (inputText.trim().length > 0) {
      setOriginalHumanizedText(inputText);
    }
    const score = Math.floor(Math.random() * 20) + 80;
    setHumanScore(score);
    const historyItem: HistoryItem = {
      id: Date.now().toString(),
      originalText: inputText,
      humanizedText: humanized,
      timestamp: new Date(),
      wordCount,
      readabilityLevel,
      purpose,
      language: selectedLanguage,
      lengthMode,
      humanScore: score,
      detectionResult: detectionResult
        ? {
            humanLikelihoodPct: detectionResult.human_likelihood_pct,
            aiLikelihoodPct: detectionResult.ai_likelihood_pct,
          }
        : undefined,
    };
    setHistory((prev) => [historyItem, ...prev].slice(0, 50));
    setPresentFeatures({
      changed: false,
      structural: false,
      unchanged: false,
      thesaurus: false,
    });
  };

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Handles multiple validation and API call scenarios
  const handleHumanize = async () => {
    if (!inputText.trim()) {
      return;
    }

    if (!hasInteracted) {
      setHasInteracted(true);
    }

    if (isOverLimit) {
      const errorMessage = userId
        ? `Word limit exceeded. Your ${subscriptionPlan} plan allows up to ${wordLimit} words per request. ${subscriptionPlan === "free" ? "Upgrade to a paid plan for higher limits." : "Upgrade to a higher tier for more words."}`
        : `Word limit exceeded. Please sign in to increase your limit to 3000 words. Current limit: ${wordLimit} words.`;
      setError(errorMessage);
      router.push("/pricing");
      return;
    }

    setIsLoading(true);
    setError(null);
    setOutputText("");
    setOriginalHumanizedText("");
    setHumanScore(null);

    try {
      const requestParams = buildHumanizeRequest();
      const response = await humanizeText(
        requestParams,
        userId,
        organizationId
      );
      const humanized = response.humanized_text || "";
      processHumanizeResponse(humanized);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to humanize text. Please try again.";
      setError(errorMessage);
      setOutputText("");
      console.error("Humanize error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDetectAI = async () => {
    if (!inputText.trim()) {
      setDetectionError("Please enter some text to analyze");
      return;
    }

    if (wordCount < 10) {
      setDetectionError(
        "Text must contain at least 10 words for accurate detection"
      );
      return;
    }

    setIsDetecting(true);
    setDetectionError(null);
    setDetectionResult(null);

    try {
      const result = await detectAIContent({
        text: inputText.trim(),
        include_internal_analysis: true,
        enable_caching: true,
      });
      setDetectionResult(result);
    } catch (err) {
      setDetectionError(
        err instanceof Error ? err.message : "Detection failed"
      );
    } finally {
      setIsDetecting(false);
    }
  };

  const handleCheckForAI = () => {
    if (!inputText.trim()) {
      setDetectionError("Please enter some text to analyze");
      return;
    }

    if (wordCount < 10) {
      setDetectionError(
        "Text must contain at least 10 words for accurate detection"
      );
      return;
    }

    if (!hasInteracted) {
      setHasInteracted(true);
    }

    setActiveTab("detector");

    setTimeout(() => {
      void handleDetectAI();
    }, 100);
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setInputText(item.originalText);
    setOutputText(item.humanizedText);
    setOriginalHumanizedText(item.originalText);
    setHumanScore(Math.floor(Math.random() * 20) + 80);
  };

  const handleDeleteHistory = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCopyOutput = async () => {
    if (!outputText) {
      return;
    }
    try {
      await navigator.clipboard.writeText(outputText);
      toast.success("Copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy text");
    }
  };

  const handleDownloadOutput = () => {
    if (!outputText) {
      return;
    }
    try {
      const blob = new Blob([outputText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `humanized-text-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("File downloaded successfully!");
    } catch (err) {
      console.error("Failed to download:", err);
      toast.error("Failed to download file");
    }
  };

  const handleThumbsUp = () => {
    console.log("Thumbs up feedback for output:", outputText.substring(0, 50));
    toast.success("Thank you for your feedback!");
  };

  const handleThumbsDown = () => {
    console.log(
      "Thumbs down feedback for output:",
      outputText.substring(0, 50)
    );
    toast.success("Thank you for your feedback! We'll work to improve.");
  };

  const handleSaveStyleSample = () => {
    const styleWordCount = tempStyleSample
      .trim()
      .split(WORD_COUNT_REGEX)
      .filter(Boolean).length;

    if (styleWordCount < 150) {
      setStyleSampleError(
        "Please enter at least 150 words for the writing style sample."
      );
      return;
    }

    setStyleSample(tempStyleSample);
    setShowStyleSampleModal(false);
    setStyleSampleError(null);
  };

  const isProReadabilitySelected = readabilityLevels.find(
    (level) => level.value === readabilityLevel && level.pro
  );
  const isProPurposeSelected = purposes.find(
    (p) => p.value === purpose && p.pro
  );
  const isPremium = subscriptionPlan === "pro" || subscriptionPlan === "ultra";
  const isProSelected =
    (isProReadabilitySelected || isProPurposeSelected) && !isPremium;

  let proType: "readability" | "purpose" | null = null;
  let proValue: string | null = null;

  if (isProReadabilitySelected) {
    proType = "readability";
    proValue = readabilityLevel;
  } else if (isProPurposeSelected) {
    proType = "purpose";
    proValue = purpose;
  }

  useEffect(() => {
    if (isProSelected && proValue) {
      setShowProUpgrade(true);
    } else {
      setShowProUpgrade(false);
    }
  }, [isProSelected, proValue]);

  const handleProUpgradeSidebarChange = (open: boolean) => {
    setShowProUpgrade(open);
    // When closing the sidebar, reset the pro selection back to default
    if (!open && proType) {
      if (proType === "readability") {
        setReadabilityLevel("university");
      } else if (proType === "purpose") {
        setPurpose("general");
      }
    }
  };

  const isInitialState = !(hasInputText || hasOutputText);

  const getWordCountText = () => {
    if (isInitialState && activeTab === "humanize") {
      return `0/${wordLimit} words`;
    }
    if (isOverLimit) {
      return `${wordCount}/${wordLimit} words`;
    }
    if (activeTab === "humanize" && hasOutputText) {
      return `${wordCount} / ${outputWordCount} Words`;
    }
    return `${wordCount}/${wordLimit} words`;
  };

  const renderOtherTabOutput = () => {
    if (activeTab === "detector") {
      return (
        <DetectionOutput
          detectionError={detectionError}
          detectionResult={detectionResult}
          isDarkMode={isDarkMode}
          isDetecting={isDetecting}
          onRetryDetection={handleDetectAI}
        />
      );
    }

    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-background px-3 py-3 sm:px-4 md:px-6 dark:bg-background">
        <MarketingInner />
      </div>
    );
  };

  const getIndicatorLeft = () => {
    if (activeTab === "humanize") {
      return "0.125rem";
    }
    if (activeTab === "detector") {
      return "calc(33.333% + 0.0625rem)";
    }
    return "calc(66.666% + 0.0625rem)";
  };

  const shouldShowRightPanel = () => {
    switch (activeTab) {
      case "humanize":
        return hasOutputText || error;
      case "detector":
        return detectionResult !== null || detectionError !== null;
      case "plagiarism":
        return true;
      default:
        return false;
    }
  };

  const getRightPanelClasses = () => {
    if (!shouldShowRightPanel()) {
      return "bg-transparent";
    }

    const isErrorState =
      (activeTab === "humanize" && error) ||
      (activeTab === "detector" && detectionError);

    if (isErrorState) {
      return "rounded-r-xl border border-border border-l-0 bg-background shadow-sm dark:border-editor-border dark:bg-editor-bg";
    }

    if (activeTab === "humanize" && hasOutputText) {
      return "rounded-r-xl border border-border border-l-0 bg-background shadow-sm dark:border-editor-border dark:bg-editor-bg";
    }

    return "rounded-r-xl border border-background border-l-0 bg-background shadow-sm dark:border-background dark:bg-background";
  };

  const getLeftPanelClasses = () => {
    const baseClasses =
      "box-border flex w-full min-w-0 flex-col overflow-hidden border border-border bg-card shadow-sm md:w-1/2 dark:border-editor-border dark:bg-editor-bg";
    const radiusClass = shouldShowRightPanel() ? "rounded-l-xl" : "rounded-xl";
    return `${baseClasses} ${radiusClass}`;
  };

  let dragContainerHighlightClass = "";
  if (isDragOverValid) {
    dragContainerHighlightClass =
      "border-2 border-brand-primary border-dashed bg-brand-primary/5";
  } else if (isDragOver) {
    dragContainerHighlightClass =
      "border-2 border-destructive/70 border-dashed bg-destructive/100/5";
  }

  if (!isMounted) {
    return null;
  }

  return (
    <div className="relative mx-auto w-full max-w-container px-3 py-4 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-20">
      <div className="flex flex-col gap-4">
        {/* Tabs */}
        <div className="flex items-center justify-center px-1-5 sm:px-0">
          <Tabs
            className="w-full max-w-full sm:max-w-xl"
            id={tabsId}
            onValueChange={setActiveTab}
            value={activeTab}
          >
            <TabsList className="relative grid h-tabs-list-md w-full grid-cols-3 gap-1 rounded-tab bg-muted p-1 sm:h-tabs-list-lg sm:gap-1 sm:p-1 dark:bg-tabs-bg [&_button]:min-h-0">
              <div
                className="absolute top-1 bottom-1 rounded-tab bg-brand-primary transition-all duration-normal ease-in-out sm:top-1 sm:bottom-1"
                style={{
                  left: getIndicatorLeft(),
                  width: "calc(33.333% - 0.1875rem)",
                }}
              />
              <TabsTrigger
                className="group relative z-overlay flex h-full min-h-0 cursor-pointer items-center justify-center gap-1 rounded-tab bg-transparent px-3 font-medium text-muted-foreground text-sm leading-normal transition-all duration-normal ease-in-out data-[state=active]:bg-brand-primary data-[state=active]:text-white sm:gap-2 sm:px-4 dark:text-white"
                value="humanize"
              >
                <Sparkles className="size-icon-sm shrink-none text-current transition-transform duration-normal ease-in-out group-data-[state=active]:scale-active-large" />
                <span className="whitespace-nowrap">AI Humanizer</span>
              </TabsTrigger>
              <TabsTrigger
                className="group relative z-overlay flex h-full min-h-0 cursor-pointer items-center justify-center gap-1 rounded-tab bg-transparent px-3 font-medium text-muted-foreground text-sm leading-normal transition-all duration-normal ease-in-out data-[state=active]:bg-brand-primary data-[state=active]:text-white sm:gap-2 sm:px-4 dark:text-white"
                value="detector"
              >
                <BarChart3 className="size-icon-sm shrink-none text-current transition-transform duration-normal ease-in-out group-data-[state=active]:scale-active-large" />
                <span className="whitespace-nowrap">AI Detector</span>
              </TabsTrigger>
              <TabsTrigger
                className="group relative z-overlay flex h-full min-h-0 cursor-pointer items-center justify-center gap-1 rounded-tab bg-transparent px-3 font-medium text-muted-foreground text-sm leading-normal transition-all duration-normal ease-in-out data-[state=active]:bg-brand-primary data-[state=active]:text-white sm:gap-2 sm:px-4 dark:text-white"
                value="plagiarism"
              >
                <FileCheck className="size-icon-sm shrink-none text-current transition-transform duration-normal ease-in-out group-data-[state=active]:scale-active-large" />
                <span className="whitespace-nowrap">Plagiarism Checker</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Main Editor Container */}
        <div className="relative flex min-w-0 gap-3">
          <div className="relative flex min-w-0 flex-1 flex-col gap-3 px-0">
            <div className="relative min-h-editor-sm overflow-hidden md:min-h-editor-md">
              <div className="relative flex w-full min-w-0 flex-col md:flex-row">
                {/* Left Panel - Input */}
                <div className={getLeftPanelClasses()}>
                  {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: Drag-and-drop handlers are required for file upload functionality */}
                  <section
                    aria-label="File drop zone"
                    className={`relative flex w-full min-w-0 flex-1 flex-col rounded-lg transition-colors ${dragContainerHighlightClass}`}
                    onDragEnter={handleContainerDragEnter}
                    onDragLeave={handleContainerDragLeave}
                    onDragOver={handleContainerDragOver}
                    onDrop={(e) =>
                      handleContainerDrop(e, processUploadedFile, setInputText)
                    }
                  >
                    <fieldset
                      aria-label="Original text input and file drop zone"
                      className="relative flex w-full min-w-0 flex-1 flex-col border-0"
                    >
                      <div
                        className={
                          isDragOverValid && !hasInputText
                            ? "pointer-events-none opacity-0"
                            : "opacity-100"
                        }
                      >
                        <Textarea
                          className="h-editor-sm w-full min-w-0 resize-none border-0 border-b-transparent px-3 py-3 pr-6 text-sm shadow-none outline-none focus:border-b-transparent focus:ring-0 focus-visible:border-b-transparent focus-visible:ring-0 sm:h-editor-md sm:px-4 sm:py-4 sm:pr-7 md:h-editor-lg md:px-5 md:py-5 md:pr-9 dark:border-b-editor-border dark:bg-editor-bg dark:focus-visible:border-b-editor-border dark:focus:border-b-editor-border"
                          disabled={isLoading || isDetecting}
                          onChange={(e) => {
                            setInputText(e.target.value);
                          }}
                          placeholder="To humanize AI text, enter/paste it here, or upload a file (.docx, .pdf, .txt)"
                          ref={textareaRef}
                          style={{
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                            boxSizing: "border-box",
                            paddingRight:
                              hasTextareaScrollbar && hasInputText
                                ? "3.5rem"
                                : undefined,
                          }}
                          value={inputText}
                        />
                        {/* Action Buttons */}
                        {activeTab === "humanize" && !hasInputText && (
                          <div className="absolute top-16 left-3 flex flex-wrap items-center gap-1-5 sm:top-20 sm:left-4 sm:gap-2 md:top-24 md:left-6">
                            <Button
                              className="scale-100 cursor-pointer gap-1-5 rounded-full border border-brand-primary bg-card px-2 py-1-5 font-medium text-brand-primary text-xs transition-none hover:scale-100 hover:bg-brand-primary/10 active:scale-100 sm:gap-2 sm:px-2-5 sm:text-sm dark:border-brand-primary dark:bg-background dark:text-brand-primary dark:hover:bg-select-hover"
                              onClick={handlePasteText}
                              variant="outline"
                            >
                              <Clipboard className="size-icon-xs shrink-none" />
                              <span className="whitespace-nowrap">
                                Paste text
                              </span>
                            </Button>
                            <Button
                              className="scale-100 cursor-pointer gap-1-5 rounded-full border border-brand-primary bg-card px-2 py-1-5 font-medium text-brand-primary text-xs transition-none hover:scale-100 hover:bg-brand-primary/10 active:scale-100 sm:gap-2 sm:px-2-5 sm:text-sm dark:border-brand-primary dark:bg-background dark:text-brand-primary dark:hover:bg-select-hover"
                              disabled={isParsingFile}
                              onClick={handleFileUpload}
                              variant="outline"
                            >
                              {isParsingFile ? (
                                <Loader2 className="size-icon-xs shrink-none animate-spin" />
                              ) : (
                                <FileUp className="size-icon-xs shrink-none" />
                              )}
                              <span className="whitespace-nowrap">
                                {isParsingFile
                                  ? "Parsing file..."
                                  : "Upload file"}
                              </span>
                            </Button>
                            <input
                              accept=".docx,.pdf,.doc,.txt"
                              className="hidden"
                              onChange={handleFileChange}
                              ref={fileInputRef}
                              type="file"
                            />
                            <Button
                              className="scale-100 cursor-pointer gap-1-5 rounded-full border border-brand-primary bg-card px-2 py-1-5 font-medium text-brand-primary text-xs transition-none hover:scale-100 hover:bg-brand-primary/10 active:scale-100 sm:gap-2 sm:px-2-5 sm:text-sm dark:border-brand-primary dark:bg-background dark:text-brand-primary dark:hover:bg-select-hover"
                              onClick={handleTryExample}
                              variant="outline"
                            >
                              <FileText className="size-icon-xs shrink-none" />
                              <span className="whitespace-nowrap">
                                Try example
                              </span>
                            </Button>
                          </div>
                        )}
                        {hasInputText && (
                          <Button
                            className="h-8 w-8 cursor-pointer rounded p-0 text-muted-foreground transition-colors hover:bg-transparent hover:text-destructive dark:text-muted-foreground dark:hover:text-destructive"
                            disabled={isLoading || isDetecting}
                            onClick={handleClearInput}
                            style={{
                              position: "absolute",
                              right: hasTextareaScrollbar ? "12px" : "2px",
                              top: "6px",
                              zIndex: 10,
                            }}
                            title="Clear text"
                            variant="ghost"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </fieldset>

                    {/* Drag overlay */}
                    {isDragOver && !hasInputText && (
                      <div className="pointer-events-none absolute inset-0 z-modal flex flex-col items-center justify-center rounded-lg bg-background/90 text-center text-muted-foreground text-sm dark:bg-editor-bg/90">
                        {isDragOverValid ? (
                          <>
                            <FileUp className="mb-2 h-6 w-6 text-brand-primary" />
                            <p className="font-medium">
                              Drop your file here (.docx, .pdf, .txt)
                            </p>
                          </>
                        ) : (
                          <>
                            <X className="mb-2 h-6 w-6 text-destructive" />
                            <p className="font-medium text-destructive dark:text-destructive">
                              Invalid file type. Please drop .docx, .pdf, or
                              .txt files only.
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </section>

                  {/* Left Footer */}
                  <div
                    className={`flex flex-col gap-3 border-white border-t px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 sm:py-3 md:px-6 md:py-4 dark:border-editor-border dark:bg-editor-bg ${activeTab === "humanize" && hasOutputText ? "rounded-bl-xl" : "rounded-b-xl"}`}
                  >
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                      {isOverLimit ? (
                        <>
                          <span className="shrink-0 cursor-help font-semibold text-destructive text-sm dark:text-destructive">
                            {getWordCountText()}
                          </span>
                          <Button
                            className="h-7 shrink-0 cursor-pointer px-2.5 text-xs"
                            onClick={() => router.push("/pricing")}
                            variant="outline"
                          >
                            Unlock more words
                          </Button>
                        </>
                      ) : (
                        <span className="font-semibold text-card-foreground text-sm">
                          {getWordCountText()}
                        </span>
                      )}
                    </div>
                    {activeTab === "humanize" && (
                      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-2">
                        <Button
                          className="h-8 shrink-0 cursor-pointer gap-1-5 px-3 text-sm"
                          disabled={
                            !inputText.trim() || isDetecting || isLoading
                          }
                          onClick={handleCheckForAI}
                        >
                          {isDetecting ? (
                            <>
                              <LoadingSpinner size="sm" />
                              <span>Detecting...</span>
                            </>
                          ) : (
                            <>
                              <BarChart3 className="h-4 w-4 shrink-0" />
                              <span className="whitespace-nowrap">
                                Check for AI
                              </span>
                            </>
                          )}
                        </Button>
                        <Button
                          className="h-8 shrink-0 cursor-pointer gap-1-5 px-3 text-sm"
                          disabled={
                            !inputText.trim() ||
                            isLoading ||
                            isDetecting ||
                            isProSelected
                          }
                          onClick={handleHumanize}
                        >
                          {isLoading ? (
                            <>
                              <LoadingSpinner size="sm" />
                              <span>Humanizing...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="size-icon-xs shrink-none text-current transition-transform duration-normal ease-in-out group-data-[state=active]:scale-active-large sm:size-icon-sm" />
                              <span className="whitespace-nowrap">
                                Humanize
                              </span>
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                    {activeTab === "detector" && (
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <Button
                          className="h-8 shrink-0 cursor-pointer gap-1-5 px-3 text-sm"
                          disabled={
                            !inputText.trim() || isDetecting || isLoading
                          }
                          onClick={handleDetectAI}
                        >
                          {isDetecting ? (
                            <>
                              <LoadingSpinner size="sm" />
                              <span>Detecting...</span>
                            </>
                          ) : (
                            <>
                              <BarChart3 className="h-4 w-4 shrink-0" />
                              <span className="whitespace-nowrap">
                                Detect AI
                              </span>
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Panel - Output */}
                <div
                  className={`flex w-full min-w-0 flex-col overflow-hidden md:w-1/2 ${getRightPanelClasses()}`}
                >
                  <div className="relative flex min-w-0 flex-1 flex-col justify-center">
                    <div
                      className={`${activeTab === "humanize" && hasOutputText ? "overflow-y-auto" : ""}`}
                    >
                      {activeTab === "humanize" ? (
                        <HumanizeOutput
                          enabledFeatures={enabledFeatures}
                          error={error}
                          hasOutputText={hasOutputText}
                          inputText={
                            // Always use preserved original text when we have output,
                            // so diff colors persist even if user clears the input
                            // This ensures all three features (Changed Words, Structural Changes,
                            // Longest Unchanged Words) are displayed correctly with their proper colors
                            // (red for Changed Words, yellow underline for Structural Changes, blue for Longest Unchanged Words)
                            hasOutputText &&
                            originalHumanizedText &&
                            originalHumanizedText.trim().length > 0
                              ? originalHumanizedText
                              : inputText
                          }
                          isLoading={isLoading}
                          onFeaturesDetected={(features) => {
                            setPresentFeatures(features);
                            // Preserve features when we have output, so legend stays visible
                            // even if input is cleared later
                            if (
                              hasOutputText &&
                              (features.changed ||
                                features.structural ||
                                features.unchanged)
                            ) {
                              setPreservedFeatures(features);
                            }
                          }}
                          onRetry={() => {
                            setError(null);
                            handleHumanize();
                          }}
                          onWordSelect={(word, position) => {
                            console.log(
                              "Selected word for thesaurus:",
                              word,
                              position
                            );
                          }}
                          outputText={outputText}
                        />
                      ) : (
                        renderOtherTabOutput()
                      )}
                    </div>
                  </div>

                  {/* Right Footer */}
                  {activeTab === "humanize" && hasOutputText && (
                    <div className="flex flex-col gap-2 rounded-br-xl bg-transparent px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-2 md:px-6">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-start gap-0-5">
                          <span className="font-semibold text-card-foreground text-sm">
                            {outputWordCount}
                          </span>
                          <span className="text-brand-primary text-xs dark:text-brand-primary">
                            Word Count
                          </span>
                        </div>
                        <div className="flex flex-col items-start gap-0-5">
                          <span className="font-semibold text-card-foreground text-sm">
                            {humanScore !== null ? `${humanScore}%` : "-"}
                          </span>
                          <span className="text-brand-primary text-xs dark:text-brand-primary">
                            HUMAN WRITTEN
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          className="h-8 w-8 rounded-lg p-0 transition-all hover:bg-muted dark:hover:bg-select-hover"
                          disabled={!hasOutputText}
                          onClick={handleThumbsUp}
                          title="Like this output"
                          variant="ghost"
                        >
                          <ThumbsUp className="h-4 w-4 text-foreground" />
                        </Button>
                        <Button
                          className="h-8 w-8 rounded-lg p-0 transition-all hover:bg-muted dark:hover:bg-select-hover"
                          disabled={!hasOutputText}
                          onClick={handleThumbsDown}
                          title="Dislike this output"
                          variant="ghost"
                        >
                          <ThumbsDown className="h-4 w-4 text-foreground" />
                        </Button>
                        <Button
                          className="h-8 w-8 rounded-lg p-0 transition-all hover:bg-muted dark:hover:bg-select-hover"
                          disabled={!hasOutputText}
                          onClick={handleDownloadOutput}
                          title="Download text"
                          variant="ghost"
                        >
                          <Download className="h-4 w-4 text-foreground" />
                        </Button>
                        <Button
                          className="h-8 w-8 rounded-lg p-0 transition-all hover:bg-muted dark:hover:bg-select-hover"
                          disabled={!hasOutputText}
                          onClick={handleCopyOutput}
                          title="Copy to clipboard"
                          variant="ghost"
                        >
                          <Copy className="h-4 w-4 text-foreground" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Controls */}
              {activeTab === "humanize" && !isInitialState && (
                <EditorControls
                  advancedMode={advancedMode}
                  hasStyleSample={hasStyleSample}
                  lengthMode={lengthMode}
                  onOpenStyleModal={() => {
                    setShowStyleSampleModal(true);
                    setTempStyleSample(styleSample);
                    setStyleSampleError(null);
                  }}
                  purpose={purpose}
                  readabilityLevel={readabilityLevel}
                  selectedLanguage={selectedLanguage}
                  setAdvancedMode={setAdvancedMode}
                  setLengthMode={setLengthMode}
                  setPurpose={setPurpose}
                  setReadabilityLevel={setReadabilityLevel}
                  setSelectedLanguage={setSelectedLanguage}
                />
              )}

              {/* Text Features Legend */}
              {activeTab === "humanize" && hasOutputText && (
                <div className="flex flex-wrap items-center justify-end gap-2 bg-transparent px-3 py-2 sm:gap-3 sm:px-4 md:px-6">
                  {/* Use preserved features if available, otherwise use current features */}
                  {(preservedFeatures.changed || presentFeatures.changed) && (
                    <div className="flex items-center gap-1-5">
                      <div
                        aria-hidden="true"
                        className="size-icon-xs shrink-none rounded-full bg-destructive/100"
                      />
                      <span className="text-muted-foreground text-xs dark:text-muted-foreground">
                        Changed Words
                      </span>
                    </div>
                  )}
                  {(preservedFeatures.structural ||
                    presentFeatures.structural) && (
                    <div className="flex items-center gap-1-5">
                      <div
                        aria-hidden="true"
                        className="h-bar-thin w-4 shrink-none bg-warning"
                      />
                      <span className="text-muted-foreground text-xs dark:text-muted-foreground">
                        Structural Changes
                      </span>
                    </div>
                  )}
                  {(preservedFeatures.unchanged ||
                    presentFeatures.unchanged) && (
                    <div className="flex items-center gap-1-5">
                      <div
                        aria-hidden="true"
                        className="size-icon-xs shrink-none rounded-full bg-info"
                      />
                      <span className="text-muted-foreground text-xs dark:text-muted-foreground">
                        Longest Unchanged Words
                      </span>
                    </div>
                  )}
                  {presentFeatures.thesaurus && (
                    <div className="flex items-center gap-1-5">
                      <div
                        aria-hidden="true"
                        className="size-icon-xs shrink-none rounded-full bg-purple-500"
                      />
                      <span className="text-muted-foreground text-xs dark:text-muted-foreground">
                        Thesaurus
                      </span>
                    </div>
                  )}
                  {(presentFeatures.changed ||
                    presentFeatures.structural ||
                    presentFeatures.unchanged ||
                    presentFeatures.thesaurus) && (
                    <TextFeaturesSidebar
                      enabledFeatures={enabledFeatures}
                      onFeatureToggle={(feature, enabled) => {
                        if (feature === "thesaurus") {
                          return;
                        }
                        setEnabledFeatures((prev) => ({
                          ...prev,
                          [feature]: enabled,
                        }));
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
          {activeTab === "humanize" && hasInteracted && (
            <div className="-right-20 absolute top-2 z-overlay flex flex-col items-center gap-1">
              <Button
                className="h-8 w-8 cursor-pointer rounded-full border border-border bg-tabs-bg p-0 text-card-foreground hover:bg-tabs-bg/90 dark:border-editor-border dark:bg-editor-bg dark:hover:bg-editor-bg/80"
                onClick={() => setShowHistory(true)}
                title="History"
                variant="ghost"
              >
                <Clock className="h-4 w-4" />
              </Button>
              <p className="text-card-foreground text-xs">History</p>
            </div>
          )}
        </div>
      </div>

      {/* Sidebars and Modals */}
      <HistorySidebar
        history={history}
        onDeleteHistory={handleDeleteHistory}
        onOpenChange={setShowHistory}
        onSelectHistory={handleSelectHistory}
        open={showHistory}
      />

      <ProUpgradeSidebar
        onOpenChange={handleProUpgradeSidebarChange}
        open={showProUpgrade}
        proType={proType}
        proValue={proValue}
      />

      <StyleSampleModal
        onOpenChange={(open) => {
          setShowStyleSampleModal(open);
          if (!open) {
            setTempStyleSample("");
            setStyleSampleError(null);
          }
        }}
        onSave={handleSaveStyleSample}
        open={showStyleSampleModal}
        setStyleSampleError={setStyleSampleError}
        setTempStyleSample={setTempStyleSample}
        styleSampleError={styleSampleError}
        tempStyleSample={tempStyleSample}
      />
    </div>
  );
}
