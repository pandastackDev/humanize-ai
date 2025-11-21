"use client";

import { Button } from "@humanize/ui/components/button";
import {
  BarChart3,
  Check,
  Clipboard,
  Clock,
  Copy,
  Download,
  FileCheck,
  FileText,
  FileUp,
  Info,
  Loader2,
  Sparkles,
  Star,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { type DetectResponse, detectAIContent } from "@/lib/detect-api";
import { humanizeText } from "@/lib/humanize-api";
import {
  checkSubscription,
  type SubscriptionPlan,
} from "@/lib/subscription-api";
import { type HistoryItem, HistorySidebar } from "./history-sidebar";
import { ProUpgradeSidebar } from "./pro-upgrade-sidebar";
import { TextDiffViewer } from "./text-diff-viewer";
import { TextFeaturesSidebar } from "./text-features-sidebar";

// import { TrustSidebar } from "./trust-sidebar";

const languages = [
  "English",
  "Spanish",
  "French",
  "German",
  "Bulgarian",
  "Czech",
  "Danish",
  "Greek",
  "Estonian",
  "Finnish",
  "Hungarian",
  "Italian",
  "Japanese",
  "Latvian",
  "Dutch",
  "Polish",
  "Portuguese",
  "Brazilian (Pr)",
  "Romanian",
  "Russian",
  "Slovak",
  "Slovenian",
  "Swedish",
  "Chinese",
];

const readabilityLevels = [
  { value: "university", label: "University" },
  { value: "high-school", label: "High School" },
  { value: "doctorate", label: "Doctorate", pro: true },
  { value: "journalist", label: "Journalist", pro: true },
  { value: "marketing", label: "Marketing", pro: true },
];

const purposes = [
  { value: "academic", label: "Academic" },
  { value: "general", label: "General Writing" },
  { value: "essay", label: "Essay" },
  { value: "article", label: "Article", pro: true },
  { value: "marketing", label: "Marketing Material", pro: true },
  { value: "story", label: "Story", pro: true },
  { value: "cover-letter", label: "Cover Letter", pro: true },
  { value: "report", label: "Report", pro: true },
  { value: "business", label: "Business Material", pro: true },
  { value: "legal", label: "Legal Material", pro: true },
];

const lengthModes = [
  { value: "standard", label: "Keep it as is" },
  { value: "shorten", label: "Make it shorter" },
  { value: "expand", label: "Make it longer" },
];

const WORD_COUNT_REGEX = /\s+/;

// AI detectors for loading screen
const AI_DETECTORS = [
  {
    name: "Turnitin",
    image: "/logos/humanization-logos/turnitin.png",
  },
  {
    name: "GPTZero",
    image: "/logos/humanization-logos/gptzero.png",
  },
  {
    name: "Copyleaks",
    image: "/logos/humanization-logos/copyleaks.png",
  },
  {
    name: "ZeroGPT",
    image: "/logos/humanization-logos/zerogpt.png",
  },
  {
    name: "Quillbot",
    image: "/logos/humanization-logos/quillbot.png",
  },
  {
    name: "Writer",
    image: "/logos/humanization-logos/writer.png",
  },
  {
    name: "Sapling",
    image: "/logos/humanization-logos/sapling.png",
  },
  {
    name: "Originality",
    image: "/logos/humanization-logos/originality.png",
  },
];

function getLanguageCode(languageName: string): string {
  const languageMap: Record<string, string> = {
    English: "en",
    Spanish: "es",
    French: "fr",
    German: "de",
    Bulgarian: "bg",
    Czech: "cs",
    Danish: "da",
    Greek: "el",
    Estonian: "et",
    Finnish: "fi",
    Hungarian: "hu",
    Italian: "it",
    Japanese: "ja",
    Latvian: "lv",
    Dutch: "nl",
    Polish: "pl",
    Portuguese: "pt",
    "Brazilian (Pr)": "pt-BR",
    Romanian: "ro",
    Russian: "ru",
    Slovak: "sk",
    Slovenian: "sl",
    Swedish: "sv",
    Chinese: "zh",
  };
  return languageMap[languageName] || "en";
}

// Example text for "Try example" button
const EXAMPLE_TEXT = `The seaside town was a picturesque blend of old-world charm and modern amenities. Waves crashed gently against the shore, their rhythmic sound providing a soothing backdrop to the bustling boardwalk. Colorful fishing boats bobbed in the harbor, their nets filled with the day's catch. Tourists strolled along the promenade, enjoying the salty sea breeze and the vibrant atmosphere.`;

// History storage key
const HISTORY_STORAGE_KEY = "humanize_history";

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Component handles multiple UI states and interactions
export function HumanizeEditor({
  userId,
  organizationId,
}: {
  userId?: string;
  organizationId?: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [readabilityLevel, setReadabilityLevel] = useState("");
  const [purpose, setPurpose] = useState("");
  const [lengthMode, setLengthMode] = useState<
    "shorten" | "expand" | "standard"
  >("standard");
  const [styleSample, setStyleSample] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("humanize");
  const [showStyleSample, setShowStyleSample] = useState(false);
  const [showTextFeatures, setShowTextFeatures] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showProUpgrade, setShowProUpgrade] = useState(false);
  const [humanScore, setHumanScore] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [subscriptionPlan, setSubscriptionPlan] =
    useState<SubscriptionPlan>("free");
  const [enabledFeatures, setEnabledFeatures] = useState({
    changed: true,
    structural: true,
    unchanged: true, // Toggleable - can be shown/hidden
    thesaurus: false, // Always false - not toggleable
  });
  const [presentFeatures, setPresentFeatures] = useState({
    changed: false,
    structural: false,
    unchanged: false,
    thesaurus: false,
  });

  // AI Detection state
  const [detectionResult, setDetectionResult] = useState<DetectResponse | null>(
    null
  );
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);

  // Fetch subscription status on mount
  useEffect(() => {
    async function fetchSubscription() {
      if (!userId) {
        return;
      }

      try {
        console.log("Fetching subscription for:", { userId, organizationId });
        const subscriptionInfo = await checkSubscription(
          userId,
          organizationId
        );
        console.log("Subscription info received:", subscriptionInfo);
        setSubscriptionPlan(subscriptionInfo.plan);
      } catch (err) {
        console.error("Failed to fetch subscription:", err);
        // Default to free plan on error
        setSubscriptionPlan("free");
      }
    }

    fetchSubscription();
  }, [userId, organizationId]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        const historyWithDates = parsed.map((item: HistoryItem) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
        setHistory(historyWithDates);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (err) {
      console.error("Failed to save history:", err);
    }
  }, [history]);

  const wordCount = inputText
    .trim()
    .split(WORD_COUNT_REGEX)
    .filter(Boolean).length;
  const outputWordCount = outputText
    .trim()
    .split(WORD_COUNT_REGEX)
    .filter(Boolean).length;

  // Get word limit based on subscription plan
  console.log("subscriptionPlan", subscriptionPlan);
  // const wordLimit = WORD_LIMITS[subscriptionPlan];
  const wordLimit = 3000;

  const isOverLimit = wordCount > wordLimit;

  // Handle paste from clipboard
  const handlePasteText = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
    } catch (err) {
      console.error("Failed to read clipboard:", err);
    }
  };

  // Handle try example
  const handleTryExample = () => {
    setInputText(EXAMPLE_TEXT);
  };

  // Handle file upload
  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    // Check file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "application/pdf",
      "application/msword", // .doc
    ];

    if (!validTypes.includes(file.type)) {
      setError("Please upload a .docx or .pdf file");
      return;
    }

    try {
      // For now, just read as text (in production, use proper parsing libraries)
      if (file.type === "application/pdf") {
        setError(
          "PDF parsing not yet implemented. Please paste text directly."
        );
        return;
      }

      // For .docx files, we'd need a library like mammoth or docx
      // For now, show error and suggest paste
      setError(
        "File upload not yet implemented. Please copy and paste the text directly."
      );
    } catch (err) {
      setError(
        "Failed to read file. Please try copying and pasting the text directly."
      );
      console.error("File read error:", err);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle clear input
  const handleClearInput = () => {
    setInputText("");
    setOutputText("");
    setHumanScore(null);
    setError(null);
  };

  // Helper: Build API request parameters
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
    };
  };

  // Helper: Process successful humanize response
  const processHumanizeResponse = (humanized: string) => {
    setOutputText(humanized);
    const score = Math.floor(Math.random() * 20) + 80; // 80-100% for demo
    setHumanScore(score);
    const historyItem: HistoryItem = {
      id: Date.now().toString(),
      originalText: inputText,
      humanizedText: humanized,
      timestamp: new Date(),
      wordCount,
    };
    setHistory((prev) => [historyItem, ...prev].slice(0, 50));
    // Reset present features when new output is generated
    setPresentFeatures({
      changed: false,
      structural: false,
      unchanged: false,
      thesaurus: false,
    });
  };

  // Helper: Handle humanize errors
  const handleHumanizeError = (err: unknown) => {
    const errorMessage =
      err instanceof Error
        ? err.message
        : "Failed to humanize text. Please try again.";
    setError(errorMessage);
    setOutputText("");
    console.error("Humanize error:", err);
  };

  // Handle humanize
  const handleHumanize = async () => {
    if (!inputText.trim()) {
      return;
    }

    if (isOverLimit) {
      setError(
        `Word limit exceeded. Your ${subscriptionPlan} plan allows up to ${wordLimit} words per request. ${subscriptionPlan === "free" ? "Upgrade to a paid plan for higher limits." : "Upgrade to a higher tier for more words."}`
      );
      router.push("/pricing");
      return;
    }

    setIsLoading(true);
    setError(null);
    setOutputText("");
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
      handleHumanizeError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle history selection
  const handleSelectHistory = (item: HistoryItem) => {
    setInputText(item.originalText);
    setOutputText(item.humanizedText);
    // Simulate score for historical items
    setHumanScore(Math.floor(Math.random() * 20) + 80);
  };

  // Handle history deletion
  const handleDeleteHistory = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  // Copy output to clipboard
  const handleCopyOutput = async () => {
    if (!outputText) {
      return;
    }
    try {
      await navigator.clipboard.writeText(outputText);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Handle AI Detection
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

  // Check if PRO item is selected
  const isProReadabilitySelected = readabilityLevels.find(
    (level) => level.value === readabilityLevel && level.pro
  );
  const isProPurposeSelected = purposes.find(
    (p) => p.value === purpose && p.pro
  );
  // Pro features are available for pro and ultra plans
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

  // Show PRO upgrade sidebar when PRO item is selected
  useEffect(() => {
    if (isProSelected && proValue) {
      setShowProUpgrade(true);
    } else {
      setShowProUpgrade(false);
    }
  }, [isProSelected, proValue]);

  // Check if we're in initial state (no input text)
  const trimmedInput = inputText.trim();
  const trimmedOutput = outputText.trim();
  const hasInputText = trimmedInput.length > 0;
  const hasOutputText = trimmedOutput.length > 0;
  const hasNoInput = !hasInputText;
  const hasNoOutput = !hasOutputText;
  const isInitialState = hasNoInput && hasNoOutput;

  // Get word count display text
  const getWordCountText = () => {
    if (isInitialState && activeTab === "humanize") {
      return `0/${wordLimit} words`;
    }
    if (isOverLimit) {
      return `${wordCount}/${wordLimit} words (Limit exceeded)`;
    }
    if (activeTab === "humanize" && hasOutputText) {
      return `${wordCount} / ${outputWordCount} Words`;
    }
    return `${wordCount}/${wordLimit} words`;
  };

  // Render humanize output based on state
  const renderHumanizeOutput = () => {
    // TEMPORARY: Force loading screen for development
    const forceLoading = false;

    if (error && !forceLoading) {
      return (
        <div className="flex h-[450px] w-full flex-col items-center justify-center gap-4 px-4 py-5 sm:px-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <p className="mb-2 font-semibold text-red-900 text-sm dark:text-red-200">
              Error
            </p>
            <p className="text-red-700 text-xs dark:text-red-300">{error}</p>
            <Button
              className="mt-3 h-8 w-full text-xs"
              onClick={() => {
                setError(null);
                handleHumanize();
              }}
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }
    if (isLoading || forceLoading) {
      return (
        <div className="flex h-[450px] w-full flex-col items-center gap-3 overflow-hidden px-4 py-4 sm:px-6">
          {/* Loading Spinner with Gradient Background */}
          <div className="flex w-full flex-col items-center justify-center gap-2.5 rounded-lg bg-gradient-to-br from-[#0066ff]/5 via-purple-500/5 to-[#0066ff]/5 p-5 dark:from-[#0066ff]/10 dark:via-purple-500/10 dark:to-[#0066ff]/10">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse rounded-full bg-[#0066ff]/20 blur-lg" />
              <LoadingSpinner className="relative" size="md" />
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <p className="bg-gradient-to-r from-[#0066ff] to-purple-600 bg-clip-text font-semibold text-sm text-transparent">
                Humanizing your text...
              </p>
              <p className="text-slate-500 text-xs dark:text-slate-400">
                This may take a few seconds
              </p>
            </div>
          </div>

          {/* Rating Card */}
          <div className="w-full rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((starNum) => (
                  <Star
                    className="h-4 w-4 fill-[#0066ff] text-[#0066ff]"
                    key={`rating-star-${starNum}`}
                  />
                ))}
              </div>
              <div className="flex flex-col">
                <p className="font-bold text-slate-900 text-sm dark:text-slate-100">
                  4.8/5
                </p>
                <p className="text-slate-600 text-xs dark:text-slate-400">
                  128,743 reviews
                </p>
              </div>
            </div>
          </div>

          {/* AI Detector Bypass Section */}
          <div className="w-full rounded-lg border border-white bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <h3 className="mb-2 font-semibold text-slate-900 text-xs dark:text-slate-100">
              AI Humanizer can bypass these AI detectors
            </h3>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {AI_DETECTORS.map((detector) => (
                <div
                  className="flex items-center gap-1.5 rounded-md border border-slate-100 bg-slate-50 p-1.5 transition-all hover:border-[#0066ff]/30 hover:bg-[#0066ff]/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-[#0066ff]/50 dark:hover:bg-[#0066ff]/10"
                  key={detector.name}
                >
                  <div className="relative flex h-4 w-4 shrink-0 items-center justify-center">
                    <Image
                      alt={detector.name}
                      className="object-contain"
                      height={16}
                      src={detector.image}
                      width={16}
                    />
                  </div>
                  <span className="font-medium text-slate-700 text-xs dark:text-slate-300">
                    {detector.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Trust Metrics */}
          <div className="w-full space-y-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="flex items-center gap-2 rounded-lg border border-[#0066ff]/20 bg-gradient-to-br from-[#0066ff]/10 to-[#0066ff]/5 p-2.5 shadow-sm dark:border-[#0066ff]/30 dark:from-[#0066ff]/20 dark:to-[#0066ff]/10">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0066ff]/20 dark:bg-[#0066ff]/30">
                  <Check className="h-3.5 w-3.5 text-[#0066ff]" />
                </div>
                <div>
                  <p className="font-bold text-[#0066ff] text-xs">
                    12 Million+
                  </p>
                  <p className="text-slate-600 text-xs dark:text-slate-400">
                    Trusted Users
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-[#0066ff]/20 bg-gradient-to-br from-[#0066ff]/10 to-[#0066ff]/5 p-2.5 shadow-sm dark:border-[#0066ff]/30 dark:from-[#0066ff]/20 dark:to-[#0066ff]/10">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0066ff]/20 dark:bg-[#0066ff]/30">
                  <FileText className="h-3.5 w-3.5 text-[#0066ff]" />
                </div>
                <div>
                  <p className="font-bold text-[#0066ff] text-xs">
                    1.46 Billion+
                  </p>
                  <p className="text-slate-600 text-xs dark:text-slate-400">
                    Words Monthly
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {/* Success Rate */}
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-green-50/50 px-3 py-1.5 shadow-sm dark:border-green-900/50 dark:from-green-950/30 dark:to-green-950/10">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                  <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
                <p className="font-bold text-green-700 text-xs dark:text-green-400">
                  99.54% Success Rate
                </p>
              </div>

              {/* Trustpilot Reviews */}
              <div className="flex flex-1 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                <Image
                  alt="4.5 stars on Trustpilot"
                  className="h-3.5 w-auto"
                  height={14}
                  src="https://cdn.trustpilot.net/brand-assets/4.1.0/stars/stars-4.5.svg"
                  unoptimized
                  width={70}
                />
                <span className="flex items-center gap-1 text-slate-700 text-xs dark:text-slate-300">
                  <span className="font-medium">5,936 reviews on</span>
                  <Image
                    alt="Trustpilot"
                    className="h-3 w-3"
                    height={12}
                    src="/logos/trustpilot-star.png"
                    width={12}
                  />
                  <span className="font-semibold">Trustpilot</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    if (hasOutputText) {
      return (
        <div className="h-[450px] overflow-auto px-4 py-4 text-sm sm:px-6 sm:py-5">
          <TextDiffViewer
            enabledFeatures={enabledFeatures}
            humanizedText={outputText}
            onFeaturesDetected={(features) => {
              setPresentFeatures(features);
            }}
            onWordSelect={(word, position) => {
              // Handle thesaurus word selection
              console.log("Selected word for thesaurus:", word, position);
            }}
            originalText={inputText}
          />
        </div>
      );
    }
    return (
      <div className="flex h-[450px] w-full flex-col items-center justify-center px-4 py-5 sm:px-6">
        <p className="text-slate-600 text-sm dark:text-slate-400">
          Your humanized text will appear here...
        </p>
      </div>
    );
  };

  // Render detection output
  const renderDetectionOutput = () => {
    const getScoreColor = (score: number) => {
      if (score >= 70) {
        return "text-green-600 dark:text-green-400";
      }
      if (score >= 40) {
        return "text-yellow-600 dark:text-yellow-400";
      }
      return "text-red-600 dark:text-red-400";
    };

    if (detectionError) {
      return (
        <div className="flex h-[450px] w-full flex-col items-center justify-center px-4 py-5 sm:px-6">
          <X className="mb-4 h-12 w-12 text-red-500" />
          <h3 className="mb-2 font-semibold text-base text-red-600 dark:text-red-400">
            Detection Error
          </h3>
          <p className="text-center text-slate-600 text-xs sm:text-sm dark:text-slate-400">
            {detectionError}
          </p>
          <Button
            className="mt-4"
            onClick={() => setDetectionError(null)}
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      );
    }

    if (!detectionResult) {
      // Loading screen with all detectors
      if (isDetecting) {
        return (
          <div className="flex h-[600px] w-full flex-col items-center justify-center bg-white/95 px-4 py-8 backdrop-blur-sm dark:bg-slate-900/95">
            {/* Purple heading */}
            <h2 className="mb-2 text-center font-bold text-2xl text-purple-600 dark:text-purple-400">
              Analyzing your text through all major AI detectors
            </h2>

            {/* Description */}
            <p className="mb-8 max-w-2xl text-center text-slate-600 text-sm dark:text-slate-400">
              This may take a few seconds as we cross-verify results across
              multiple platforms for maximum accuracy.
            </p>

            {/* Detector grid - 8 detectors in grid */}
            <div className="grid w-full max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
              {AI_DETECTORS.map((detector, index) => (
                <div
                  className="relative flex flex-col items-center justify-center rounded-lg bg-white/50 p-4 shadow-sm backdrop-blur-md transition-all hover:shadow-md dark:bg-slate-800/50"
                  key={detector.name}
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  {/* Logo */}
                  <div className="relative mb-2 flex h-12 w-12 items-center justify-center">
                    <Image
                      alt={detector.name}
                      className="object-contain"
                      height={48}
                      src={detector.image}
                      width={48}
                    />
                  </div>

                  {/* Detector name */}
                  <span className="mb-1 text-center font-medium text-slate-700 text-xs dark:text-slate-300">
                    {detector.name}
                  </span>

                  {/* Loading spinner */}
                  <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                </div>
              ))}
            </div>
          </div>
        );
      }

      // Default empty state
      return (
        <div className="flex h-[450px] w-full flex-col items-center justify-center px-4 py-5 sm:px-6">
          <BarChart3 className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h3 className="mb-2 font-semibold text-base text-slate-900 sm:text-lg dark:text-slate-100">
            AI Detector
          </h3>
          <p className="text-center text-slate-600 text-xs sm:text-sm dark:text-slate-400">
            Click &quot;Detect AI&quot; to analyze your text
          </p>
        </div>
      );
    }

    return (
      <div className="h-[450px] w-full overflow-y-auto px-4 py-5 sm:px-6">
        {/* Overall Score Card */}
        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Detection Results
            </h3>
            {detectionResult.cached && (
              <span className="flex items-center gap-1 text-blue-600 text-xs dark:text-blue-400">
                <Clock className="h-3 w-3" />
                Cached
              </span>
            )}
          </div>

          {/* Human Likelihood */}
          <div className="mb-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-600 text-sm dark:text-slate-400">
                Human Likelihood
              </span>
              <span
                className={`font-bold text-2xl ${getScoreColor(detectionResult.human_likelihood_pct)}`}
              >
                {detectionResult.human_likelihood_pct.toFixed(1)}%
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-2.5 rounded-full bg-green-600 transition-all"
                style={{ width: `${detectionResult.human_likelihood_pct}%` }}
              />
            </div>
          </div>

          {/* AI Likelihood */}
          <div className="mb-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-600 text-sm dark:text-slate-400">
                AI Likelihood
              </span>
              <span
                className={`font-bold text-2xl ${getScoreColor(100 - detectionResult.ai_likelihood_pct)}`}
              >
                {detectionResult.ai_likelihood_pct.toFixed(1)}%
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-2.5 rounded-full bg-red-600 transition-all"
                style={{ width: `${detectionResult.ai_likelihood_pct}%` }}
              />
            </div>
          </div>

          {/* Confidence */}
          <div className="flex items-center justify-between border-slate-200 border-t pt-3 text-sm dark:border-slate-700">
            <span className="text-slate-600 dark:text-slate-400">
              Confidence
            </span>
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {(detectionResult.confidence * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Detector Breakdown */}
        {detectionResult.detector_results.length > 0 && (
          <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h4 className="mb-3 font-semibold text-slate-900 text-sm dark:text-slate-100">
              Detector Breakdown
            </h4>
            <div className="space-y-2">
              {detectionResult.detector_results.map((detector) => (
                <div
                  className="flex items-center justify-between rounded-lg bg-slate-50 p-2 dark:bg-slate-900"
                  key={detector.detector}
                >
                  <div className="space-y-0.5">
                    <div className="font-medium text-slate-900 text-sm capitalize dark:text-slate-100">
                      {detector.detector}
                    </div>
                    <div className="text-slate-500 text-xs dark:text-slate-400">
                      Confidence: {(detector.confidence * 100).toFixed(0)}%
                      {detector.response_time_ms && (
                        <> • {detector.response_time_ms.toFixed(0)}ms</>
                      )}
                    </div>
                  </div>
                  <div
                    className={`font-bold text-lg ${getScoreColor(detector.human_probability * 100)}`}
                  >
                    {(detector.human_probability * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Internal Analysis */}
        {detectionResult.internal_analysis && (
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h4 className="mb-3 font-semibold text-slate-900 text-sm dark:text-slate-100">
              Internal Analysis
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {detectionResult.internal_analysis.perplexity_score && (
                <div>
                  <span className="text-slate-600 dark:text-slate-400">
                    Perplexity:
                  </span>
                  <span className="ml-2 font-medium text-slate-900 dark:text-slate-100">
                    {detectionResult.internal_analysis.perplexity_score.toFixed(
                      1
                    )}
                  </span>
                </div>
              )}
              {detectionResult.internal_analysis.entropy_score && (
                <div>
                  <span className="text-slate-600 dark:text-slate-400">
                    Entropy:
                  </span>
                  <span className="ml-2 font-medium text-slate-900 dark:text-slate-100">
                    {detectionResult.internal_analysis.entropy_score.toFixed(2)}
                  </span>
                </div>
              )}
              {detectionResult.internal_analysis.lexical_diversity && (
                <div>
                  <span className="text-slate-600 dark:text-slate-400">
                    Lexical:
                  </span>
                  <span className="ml-2 font-medium text-slate-900 dark:text-slate-100">
                    {detectionResult.internal_analysis.lexical_diversity.toFixed(
                      2
                    )}
                  </span>
                </div>
              )}
              {detectionResult.internal_analysis.burstiness_score && (
                <div>
                  <span className="text-slate-600 dark:text-slate-400">
                    Burstiness:
                  </span>
                  <span className="ml-2 font-medium text-slate-900 dark:text-slate-100">
                    {detectionResult.internal_analysis.burstiness_score.toFixed(
                      2
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render output for other tabs
  const renderOtherTabOutput = () => {
    if (activeTab === "detector") {
      return renderDetectionOutput();
    }

    // Plagiarism checker placeholder
    return (
      <div className="flex h-[450px] w-full flex-col items-center justify-center px-4 py-5 sm:px-6">
        <h3 className="mb-2 font-semibold text-base text-slate-900 sm:text-lg dark:text-slate-100">
          Plagiarism Checker
        </h3>
        <p className="text-center text-slate-600 text-xs sm:text-sm dark:text-slate-400">
          Click &quot;Check Plagiarism&quot; to analyze your text
        </p>
      </div>
    );
  };

  // Calculate indicator position based on active tab
  const getIndicatorLeft = () => {
    if (activeTab === "humanize") {
      return "0.125rem";
    }
    if (activeTab === "detector") {
      return "calc(33.333% + 0.0625rem)";
    }
    return "calc(66.666% + 0.0625rem)";
  };

  return (
    <div className="relative mx-auto w-full max-w-[1400px] overflow-x-hidden px-3 py-4 md:px-4">
      <div className="flex flex-col gap-4">
        {/* Tabs */}
        <div className="flex items-center justify-center px-1.5 sm:px-0">
          <Tabs
            className="w-full max-w-full sm:max-w-xl"
            onValueChange={setActiveTab}
            value={activeTab}
          >
            <TabsList className="relative grid h-8 w-full grid-cols-3 gap-0.5 rounded-[32px] bg-slate-100 p-0.5 sm:h-9 sm:gap-0.5 sm:p-0.5 dark:bg-[#141414] [&_button]:min-h-0">
              {/* Sliding indicator */}
              <div
                className="absolute top-0.5 bottom-0.5 rounded-[32px] bg-[var(--primary)] transition-all duration-300 ease-in-out sm:top-0.5 sm:bottom-0.5"
                style={{
                  left: getIndicatorLeft(),
                  width: "calc(33.333% - 0.1875rem)",
                }}
              />
              <TabsTrigger
                className="group relative z-10 flex h-full min-h-0 cursor-pointer items-center justify-center gap-0.5 rounded-[32px] bg-transparent px-1.5 font-medium text-[10px] text-gray-600 leading-tight transition-all duration-300 ease-in-out data-[state=active]:text-white sm:gap-1.5 sm:px-2 sm:text-xs sm:leading-normal dark:text-gray-300"
                value="humanize"
              >
                <Sparkles className="h-3 w-3 shrink-0 text-current transition-transform duration-300 ease-in-out group-data-[state=active]:scale-110 sm:h-3.5 sm:w-3.5" />
                <span className="whitespace-nowrap">AI Humanizer</span>
              </TabsTrigger>
              <TabsTrigger
                className="group relative z-10 flex h-full min-h-0 cursor-pointer items-center justify-center gap-0.5 rounded-[32px] bg-transparent px-1.5 font-medium text-[10px] text-gray-600 leading-tight transition-all duration-300 ease-in-out data-[state=active]:text-white sm:gap-1.5 sm:px-2 sm:text-xs sm:leading-normal dark:text-gray-300"
                value="detector"
              >
                <BarChart3 className="h-3 w-3 shrink-0 text-current transition-transform duration-300 ease-in-out group-data-[state=active]:scale-110 sm:h-3.5 sm:w-3.5" />
                <span className="whitespace-nowrap">AI Detector</span>
              </TabsTrigger>
              <TabsTrigger
                className="group relative z-10 flex h-full min-h-0 cursor-pointer items-center justify-center gap-0.5 rounded-[32px] bg-transparent px-1.5 font-medium text-[10px] text-gray-600 leading-tight transition-all duration-300 ease-in-out data-[state=active]:text-white sm:gap-1.5 sm:px-2 sm:text-xs sm:leading-normal dark:text-gray-300"
                value="plagiarism"
              >
                <FileCheck className="h-3 w-3 shrink-0 text-current transition-transform duration-300 ease-in-out group-data-[state=active]:scale-110 sm:h-3.5 sm:w-3.5" />
                <span className="whitespace-nowrap">Plagiarism Checker</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Main Editor Container */}
        <div className="relative flex gap-3">
          <div className="flex flex-1 flex-col gap-3 pr-[120px] pl-[120px]">
            {/* Main Editor Content */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#141414]">
              {/* Text Areas Container */}
              <div className="flex flex-col md:flex-row">
                {/* Left Text Area - Original */}
                <div className="flex w-full flex-col md:w-1/2 md:border-r dark:border-slate-700">
                  {/* Text Input Area - Always visible */}
                  <div className="relative flex flex-1 flex-col">
                    <Textarea
                      className="h-[450px] w-full resize-none border-0 border-b border-b-white px-4 py-4 pr-12 text-sm shadow-none outline-none focus:ring-0 focus-visible:ring-0 sm:px-6 sm:py-5 sm:pr-12"
                      onChange={(e) => {
                        setInputText(e.target.value);
                      }}
                      placeholder="To humanize AI text, enter/paste it here, or upload a fie(.docx, .pdf)"
                      ref={textareaRef}
                      value={inputText}
                    />
                    {/* Action Buttons - Only visible when textarea is empty and on humanize tab */}
                    {activeTab === "humanize" && !hasInputText && (
                      <div className="absolute top-[4.5rem] left-4 flex items-center gap-2 sm:top-[5.5rem] sm:left-6">
                        <Button
                          className="scale-100 gap-3 rounded-full border border-[#0066ff] bg-white px-2 font-medium text-[#0066ff] text-sm transition-none hover:scale-100 hover:bg-[#0066ff]/10 active:scale-100 dark:border-[#0066ff] dark:bg-[#141414] dark:text-[#0066ff] dark:hover:bg-slate-700"
                          onClick={handlePasteText}
                          variant="outline"
                        >
                          <Clipboard className="h-3 w-3" />
                          Paste text
                        </Button>
                        <Button
                          className="scale-100 gap-3 rounded-full border border-[#0066ff] bg-white px-2 font-medium text-[#0066ff] text-sm transition-none hover:scale-100 hover:bg-[#0066ff]/10 active:scale-100 dark:border-[#0066ff] dark:bg-[#141414] dark:text-[#0066ff] dark:hover:bg-slate-700"
                          onClick={handleFileUpload}
                          variant="outline"
                        >
                          <FileUp className="h-3 w-3" />
                          Upload file
                        </Button>
                        <input
                          accept=".docx,.pdf,.doc"
                          className="hidden"
                          onChange={handleFileChange}
                          ref={fileInputRef}
                          type="file"
                        />
                        <Button
                          className="scale-100 gap-3 rounded-full border border-[#0066ff] bg-white px-2 font-medium text-[#0066ff] text-sm transition-none hover:scale-100 hover:bg-[#0066ff]/10 active:scale-100 dark:border-[#0066ff] dark:bg-[#141414] dark:text-[#0066ff] dark:hover:bg-slate-700"
                          onClick={handleTryExample}
                          variant="outline"
                        >
                          <FileText className="h-3 w-3" />
                          Try example
                        </Button>
                      </div>
                    )}
                    {hasInputText && (
                      <Button
                        className="absolute top-4 right-4 h-8 w-8 cursor-pointer rounded p-0 hover:bg-slate-200 dark:hover:bg-slate-600"
                        onClick={handleClearInput}
                        title="Clear text"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      </Button>
                    )}
                  </div>

                  {/* Left Footer */}
                  <div className="flex flex-col gap-2 border-white border-t px-4 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-2 dark:border-slate-700 dark:bg-[#141414]/50">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-start gap-0.5">
                        <span
                          className={`font-semibold text-sm dark:text-slate-100 ${isOverLimit ? "text-red-600 dark:text-red-400" : "text-slate-900"}`}
                        >
                          {getWordCountText()}
                        </span>
                        {activeTab === "humanize" &&
                          !isInitialState &&
                          !isOverLimit && (
                            <span className="text-[#0066ff] text-xs dark:text-[#0066ff]">
                              Word Count
                            </span>
                          )}
                        {isOverLimit && (
                          <Button
                            className="mt-1 h-6 px-2 text-xs"
                            onClick={() => router.push("/pricing")}
                            variant="outline"
                          >
                            Unlock more words
                          </Button>
                        )}
                      </div>
                    </div>
                    {(() => {
                      if (isInitialState && activeTab === "humanize") {
                        return (
                          <div className="flex items-center gap-2">
                            <Button
                              className="h-8 gap-1.5 rounded-lg bg-slate-100 px-3 font-medium text-slate-500 text-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto dark:bg-slate-700 dark:text-slate-400"
                              disabled
                            >
                              Humanize
                            </Button>
                          </div>
                        );
                      }
                      if (activeTab === "detector") {
                        return (
                          <Button
                            className="h-8 gap-1.5 px-3 text-sm sm:w-auto"
                            disabled={!inputText.trim() || isDetecting}
                            onClick={handleDetectAI}
                          >
                            {isDetecting ? (
                              <>
                                <LoadingSpinner size="sm" />
                                Detecting...
                              </>
                            ) : (
                              <>
                                <BarChart3 className="h-4 w-4" />
                                Detect AI
                              </>
                            )}
                          </Button>
                        );
                      }
                      if (!isInitialState) {
                        return (
                          <Button
                            className="h-8 gap-1.5 px-3 text-sm sm:w-auto"
                            disabled={
                              !inputText.trim() || isLoading || isProSelected
                            }
                            onClick={handleHumanize}
                          >
                            {isLoading ? (
                              <>
                                <LoadingSpinner size="sm" />
                                Humanizing...
                              </>
                            ) : (
                              <>Humanize</>
                            )}
                          </Button>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>

                {/* Right Text Area - Humanized */}
                <div className="flex w-full flex-col md:w-1/2">
                  <div className="relative flex flex-1 flex-col">
                    <div className="flex-1 overflow-auto">
                      {activeTab === "humanize"
                        ? renderHumanizeOutput()
                        : renderOtherTabOutput()}
                    </div>
                  </div>

                  {/* Right Footer */}
                  {activeTab === "humanize" && (
                    <div className="flex flex-col gap-2 border-white border-t bg-white px-4 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-2 dark:border-slate-700 dark:bg-[#141414]/50">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="font-semibold text-slate-900 text-sm dark:text-slate-100">
                            {outputWordCount}
                          </span>
                          <span className="text-[#0066ff] text-xs dark:text-[#0066ff]">
                            Word Count
                          </span>
                        </div>
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="font-semibold text-slate-900 text-sm dark:text-slate-100">
                            {humanScore !== null ? `${humanScore}%` : "-"}
                          </span>
                          <span className="text-[#0066ff] text-xs dark:text-[#0066ff]">
                            HUMAN WRITTEN
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          className="h-8 w-8 rounded-lg p-0 transition-all hover:bg-slate-200 dark:hover:bg-slate-600"
                          onClick={() => setShowHistory(true)}
                          title="History"
                          variant="ghost"
                        >
                          <Clock className="h-4 w-4 text-[#141414] dark:text-slate-100" />
                        </Button>
                        <Button
                          className="h-8 w-8 rounded-lg p-0 transition-all hover:bg-slate-200 dark:hover:bg-slate-600"
                          variant="ghost"
                        >
                          <ThumbsUp className="h-4 w-4 text-[#141414] dark:text-slate-100" />
                        </Button>
                        <Button
                          className="h-8 w-8 rounded-lg p-0 transition-all hover:bg-slate-200 dark:hover:bg-slate-600"
                          variant="ghost"
                        >
                          <ThumbsDown className="h-4 w-4 text-[#141414] dark:text-slate-100" />
                        </Button>
                        <Button
                          className="h-8 w-8 rounded-lg p-0 transition-all hover:bg-slate-200 dark:hover:bg-slate-600"
                          variant="ghost"
                        >
                          <Download className="h-4 w-4 text-[#141414] dark:text-slate-100" />
                        </Button>
                        <Button
                          className="h-8 w-8 rounded-lg p-0 transition-all hover:bg-slate-200 dark:hover:bg-slate-600"
                          disabled={!hasOutputText}
                          onClick={handleCopyOutput}
                          variant="ghost"
                        >
                          <Copy className="h-4 w-4 text-[#141414] dark:text-slate-100" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Text Features Legend - Outside textarea area */}
              {activeTab === "humanize" && hasOutputText && (
                <div className="flex flex-wrap items-center justify-end gap-3 border-slate-200 border-t bg-white px-4 py-2 sm:px-6 dark:border-slate-700 dark:bg-[#141414]/50">
                  {/* Only show legend items for features that are present AND can be toggled */}
                  {presentFeatures.changed && (
                    <div className="flex items-center gap-1.5">
                      <div
                        aria-hidden="true"
                        className="h-3 w-3 shrink-0 rounded-full bg-red-500"
                      />
                      <span className="text-slate-600 text-xs dark:text-slate-400">
                        Changed Words
                      </span>
                    </div>
                  )}
                  {presentFeatures.structural && (
                    <div className="flex items-center gap-1.5">
                      <div
                        aria-hidden="true"
                        className="h-0.5 w-4 shrink-0 bg-yellow-500"
                      />
                      <span className="text-slate-600 text-xs dark:text-slate-400">
                        Structural Changes
                      </span>
                    </div>
                  )}
                  {presentFeatures.unchanged && (
                    <div className="flex items-center gap-1.5">
                      <div
                        aria-hidden="true"
                        className="h-3 w-3 shrink-0 rounded-full bg-blue-500"
                      />
                      <span className="text-slate-600 text-xs dark:text-slate-400">
                        Longest Unchanged Words
                      </span>
                    </div>
                  )}
                  {presentFeatures.thesaurus && (
                    <div className="flex items-center gap-1.5">
                      <div
                        aria-hidden="true"
                        className="h-3 w-3 shrink-0 rounded-full bg-purple-500"
                      />
                      <span className="text-slate-600 text-xs dark:text-slate-400">
                        Thesaurus
                      </span>
                    </div>
                  )}
                  {/* Only show info button if there are any toggleable present features */}
                  {(presentFeatures.changed ||
                    presentFeatures.structural ||
                    presentFeatures.unchanged ||
                    presentFeatures.thesaurus) && (
                    <Button
                      className="h-8 w-8 rounded-lg p-0 transition-all hover:bg-slate-200 dark:hover:bg-slate-600"
                      onClick={() => {
                        setShowTextFeatures(true);
                      }}
                      variant="ghost"
                    >
                      <Info className="h-4 w-4 text-[#141414] dark:text-slate-100" />
                    </Button>
                  )}
                </div>
              )}

              {/* Bottom Controls - Moved to bottom as per reference */}
              {activeTab === "humanize" && !isInitialState && (
                <div className="flex flex-col gap-3 border-white border-t bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:py-4 dark:border-slate-700 dark:bg-[#141414]/50">
                  <Select
                    onValueChange={setReadabilityLevel}
                    value={readabilityLevel || undefined}
                  >
                    <SelectTrigger className="h-9 w-full cursor-pointer border-slate-200 bg-white sm:w-[160px] dark:border-slate-600 dark:bg-slate-700">
                      <SelectValue placeholder="Select Readability Level" />
                    </SelectTrigger>
                    <SelectContent>
                      {readabilityLevels.map((level) => (
                        <SelectItem
                          className="cursor-pointer"
                          key={level.value}
                          value={level.value}
                        >
                          <div className="flex items-center gap-2">
                            <span>{level.label}</span>
                            {level.pro && (
                              <span className="rounded-full bg-primary px-2 py-0.5 font-medium text-primary-foreground text-xs">
                                PRO
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    onValueChange={setPurpose}
                    value={purpose || undefined}
                  >
                    <SelectTrigger className="h-9 w-full cursor-pointer border-slate-200 bg-white sm:w-[160px] dark:border-slate-600 dark:bg-slate-700">
                      <SelectValue placeholder="Select Purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      {purposes.map((p) => (
                        <SelectItem
                          className="cursor-pointer"
                          key={p.value}
                          value={p.value}
                        >
                          <div className="flex items-center gap-2">
                            <span>{p.label}</span>
                            {p.pro && (
                              <span className="rounded-full bg-primary px-2 py-0.5 font-medium text-primary-foreground text-xs">
                                PRO
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    className="h-9 gap-2 border-slate-200 bg-white px-4 font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                    onClick={() => {
                      setShowStyleSample(!showStyleSample);
                    }}
                    variant="outline"
                  >
                    <Sparkles className="h-4 w-4" />
                    Personalize
                  </Button>

                  <Select
                    onValueChange={setSelectedLanguage}
                    value={selectedLanguage || undefined}
                  >
                    <SelectTrigger className="h-9 w-full cursor-pointer border-slate-200 bg-white sm:w-[140px] dark:border-slate-600 dark:bg-slate-700">
                      <SelectValue placeholder="Auto-detect" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto-detect</SelectItem>
                      {languages.map((lang) => (
                        <SelectItem
                          className="cursor-pointer"
                          key={lang}
                          value={lang}
                        >
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    onValueChange={(value) =>
                      setLengthMode(value as "shorten" | "expand" | "standard")
                    }
                    value={lengthMode}
                  >
                    <SelectTrigger className="h-9 w-full cursor-pointer border-slate-200 bg-white sm:w-[160px] dark:border-slate-600 dark:bg-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {lengthModes.map((mode) => (
                        <SelectItem
                          className="cursor-pointer"
                          key={mode.value}
                          value={mode.value}
                        >
                          {mode.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Style Sample Input */}
              {activeTab === "humanize" && showStyleSample && (
                <div className="border-white border-t bg-slate-50 px-4 py-3 sm:px-6 dark:border-slate-700 dark:bg-[#141414]/50">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="font-medium text-slate-900 text-sm dark:text-slate-100">
                      Style Sample (Optional, ≥150 words recommended)
                    </label>
                    <Button
                      className="h-6 w-6 rounded p-0 hover:bg-slate-200 dark:hover:bg-slate-600"
                      onClick={() => setShowStyleSample(false)}
                      variant="ghost"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea
                    className="min-h-[100px] resize-y border border-slate-200 bg-white text-sm dark:border-slate-600 dark:bg-slate-700"
                    onChange={(e) => setStyleSample(e.target.value)}
                    placeholder="Paste a sample of writing style you want to match..."
                    value={styleSample}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Trust Indicators */}
          {/* <TrustSidebar /> */}
        </div>
      </div>

      {/* Text Features Sidebar */}
      <TextFeaturesSidebar
        enabledFeatures={enabledFeatures}
        onFeatureToggle={(feature, enabled) => {
          // Only allow toggling "changed", "structural", and "unchanged"
          // "thesaurus" is always enabled
          if (feature === "thesaurus") {
            return;
          }
          setEnabledFeatures((prev) => ({
            ...prev,
            [feature]: enabled,
          }));
        }}
        onOpenChange={setShowTextFeatures}
        open={showTextFeatures}
      />

      {/* History Sidebar */}
      <HistorySidebar
        history={history}
        onDeleteHistory={handleDeleteHistory}
        onOpenChange={setShowHistory}
        onSelectHistory={handleSelectHistory}
        open={showHistory}
      />

      {/* PRO Upgrade Sidebar */}
      <ProUpgradeSidebar
        onOpenChange={setShowProUpgrade}
        open={showProUpgrade}
        proType={proType}
        proValue={proValue}
      />
    </div>
  );
}
