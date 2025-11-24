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
import { LoadingSpinner } from "@humanize/ui/components/loading-spinner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@humanize/ui/components/select";
import { Tabs, TabsList, TabsTrigger } from "@humanize/ui/components/tabs";
import { Textarea } from "@humanize/ui/components/textarea";
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
  Pencil,
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
import { toast } from "sonner";
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

// Get detector-specific styles matching HTML exactly
function getDetectorStyles(detectorName: string): {
  bgColor: string;
  borderColor: string;
  textColor: string;
} {
  const name = detectorName.toLowerCase();
  // Default purple
  let bgColor = "rgb(245, 243, 255)";
  let borderColor = "rgb(221, 214, 254)";
  let textColor = "rgb(91, 33, 182)";

  if (
    name.includes("gptzero") ||
    name.includes("zerogpt") ||
    name.includes("copyleaks")
  ) {
    bgColor = "rgb(239, 246, 255)";
    borderColor = "rgb(191, 219, 254)";
    textColor = "rgb(30, 64, 175)";
  } else if (name.includes("smodin")) {
    bgColor = "rgb(254, 242, 242)";
    borderColor = "rgb(254, 202, 202)";
    textColor = "rgb(153, 27, 27)";
  } else if (name.includes("quillbot")) {
    bgColor = "rgb(240, 253, 244)";
    borderColor = "rgb(187, 247, 208)";
    textColor = "rgb(22, 101, 52)";
  } else if (name.includes("scribbr")) {
    bgColor = "rgb(255, 247, 237)";
    borderColor = "rgb(254, 215, 170)";
    textColor = "rgb(154, 52, 18)";
  }

  return { bgColor, borderColor, textColor };
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
  const [tempStyleSample, setTempStyleSample] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("humanize");
  const [showStyleSampleModal, setShowStyleSampleModal] = useState(false);
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
      toast.success("Copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy text");
    }
  };

  // Handle download output
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

  // Handle thumbs up feedback
  const handleThumbsUp = () => {
    // Store feedback or send to API
    console.log("Thumbs up feedback for output:", outputText.substring(0, 50));
    toast.success("Thank you for your feedback!");
  };

  // Handle thumbs down feedback
  const handleThumbsDown = () => {
    // Store feedback or send to API
    console.log(
      "Thumbs down feedback for output:",
      outputText.substring(0, 50)
    );
    toast.success("Thank you for your feedback! We'll work to improve.");
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
        <div className="flex h-[300px] w-full flex-col items-center justify-center gap-4 px-3 py-4 sm:h-[400px] sm:px-4 md:h-[450px] md:px-6">
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
        <div className="flex h-[300px] w-full flex-col items-center gap-3 overflow-hidden px-3 py-3 sm:h-[400px] sm:px-4 md:h-[450px] md:px-6">
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
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[#0066ff] bg-[#0066ff]/20 dark:bg-[#0066ff]/30">
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
        <div className="h-[300px] overflow-auto px-3 py-3 text-sm sm:h-[400px] sm:px-4 sm:py-4 md:h-[450px] md:px-6 md:py-5">
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
      <div className="flex h-[300px] w-full flex-col items-center justify-center px-3 py-4 sm:h-[400px] sm:px-4 md:h-[450px] md:px-6 md:py-5">
        <p className="text-slate-600 text-sm dark:text-slate-400">
          Your humanized text will appear here...
        </p>
      </div>
    );
  };

  // Render detection output
  const renderDetectionOutput = () => {
    // Removed unused function: getScoreColor

    if (detectionError) {
      return (
        <div className="flex h-[300px] w-full flex-col items-center justify-center px-3 py-4 sm:h-[400px] sm:px-4 md:h-[450px] md:px-6 md:py-5">
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
          <div className="flex h-[300px] w-full flex-col items-center justify-center bg-white px-3 py-3 sm:h-[400px] sm:px-4 md:h-[450px] md:px-6 dark:bg-slate-50">
            <div className="flex w-full max-w-3xl flex-col items-center justify-center">
              {/* Purple heading - smaller */}
              <h2 className="mb-1 text-center font-bold text-purple-600 text-sm dark:text-purple-500">
                Analyzing your text through all major AI detectors
              </h2>

              {/* Description - smaller */}
              <p className="mb-4 max-w-2xl text-center text-[10px] text-slate-600 dark:text-slate-500">
                This may take a few seconds as we cross-verify results across
                multiple platforms for maximum accuracy.
              </p>

              {/* Detector grid - Pill-shaped buttons matching HTML exactly */}
              <div className="flex w-full flex-wrap justify-center gap-2">
                {AI_DETECTORS.map((detector, index) => (
                  <div
                    className="flex shrink-0 items-center gap-1.5 rounded-full border-[1.5px] px-3 py-1.5"
                    key={detector.name}
                    style={{
                      backgroundColor: "rgb(245, 243, 255)",
                      borderColor: "rgb(221, 214, 254)",
                      flex: "0 0 calc(25% - 8px)",
                      maxWidth: "calc(25% - 8px)",
                      minWidth: "140px",
                      justifyContent: "center",
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    {/* Logo - 16px exactly as in HTML */}
                    <div className="shrink-0">
                      <Image
                        alt={detector.name}
                        className="h-4 w-4"
                        height={16}
                        src={detector.image}
                        width={16}
                      />
                    </div>

                    {/* Detector name - 12px font, exact styling */}
                    <span
                      className="whitespace-nowrap font-semibold"
                      style={{
                        fontSize: "12px",
                        lineHeight: "16px",
                        color: "rgb(91, 33, 182)",
                      }}
                    >
                      {detector.name}
                    </span>

                    {/* Spinner - matching the empty div structure */}
                    <div className="shrink-0">
                      <Loader2 className="h-3 w-3 animate-spin text-purple-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      // Default empty state
      return (
        <div className="flex h-[300px] w-full flex-col items-center justify-center px-3 py-4 sm:h-[400px] sm:px-4 md:h-[450px] md:px-6 md:py-5">
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

    // Create a map of detector names to their results for quick lookup
    const detectorMap = new Map(
      detectionResult.detector_results.map((r) => [r.detector.toLowerCase(), r])
    );

    // Helper to get detector result or default
    const getDetectorResult = (detectorName: string) => {
      const key = detectorName.toLowerCase();
      return detectorMap.get(key) || null;
    };

    return (
      <div className="flex h-[300px] w-full flex-col items-center justify-center overflow-y-auto bg-white px-3 py-3 sm:h-[400px] sm:px-4 md:h-[450px] md:px-6 dark:bg-slate-50">
        <div className="flex w-full max-w-3xl flex-col items-center justify-center">
          {/* Main Result Header - smaller, centered */}
          <div className="mb-4 text-center">
            <div className="mb-1 flex flex-col items-center justify-center">
              <span className="font-bold text-5xl text-slate-900 dark:text-slate-800">
                {detectionResult.ai_likelihood_pct > 50
                  ? detectionResult.ai_likelihood_pct.toFixed(0)
                  : detectionResult.human_likelihood_pct.toFixed(0)}
                %
              </span>
              <span
                className={`font-semibold text-sm ${
                  detectionResult.ai_likelihood_pct > 50
                    ? "text-red-600 dark:text-red-500"
                    : "text-green-600 dark:text-green-500"
                }`}
              >
                {detectionResult.ai_likelihood_pct > 50
                  ? "of text likely AI"
                  : "of text likely Human"}
              </span>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-500">
              Your text has been deeply analyzed using the strongest AI
              detectors in the market.
            </p>
          </div>

          {/* Detector Grid - Smaller pill-shaped buttons, centered */}
          <div className="mb-4 flex w-full flex-wrap justify-center gap-1.5">
            {AI_DETECTORS.map((detector) => {
              const result = getDetectorResult(detector.name);
              const humanPct = result
                ? (result.human_probability * 100).toFixed(0)
                : "N/A";
              const hasError = result?.error !== undefined;

              const styles = getDetectorStyles(detector.name);

              const getStatusText = () => {
                if (hasError) {
                  return (
                    <span
                      className="whitespace-nowrap font-semibold"
                      style={{
                        fontSize: "12px",
                        lineHeight: "16px",
                        color: "rgb(220, 38, 38)",
                      }}
                    >
                      Error
                    </span>
                  );
                }
                if (result) {
                  return (
                    <span
                      className="whitespace-nowrap font-semibold"
                      style={{
                        fontSize: "12px",
                        lineHeight: "16px",
                        color: styles.textColor,
                      }}
                    >
                      {humanPct}%
                    </span>
                  );
                }
                return (
                  <span
                    className="whitespace-nowrap font-semibold"
                    style={{
                      fontSize: "12px",
                      lineHeight: "16px",
                      color: "rgb(148, 163, 184)",
                    }}
                  >
                    N/A
                  </span>
                );
              };

              return (
                <div
                  className="flex shrink-0 items-center gap-1 rounded-full border-[1.5px] px-2 py-1"
                  key={detector.name}
                  style={{
                    backgroundColor: styles.bgColor,
                    borderColor: styles.borderColor,
                    flex: "0 0 calc(25% - 6px)",
                    maxWidth: "calc(25% - 6px)",
                    minWidth: "120px",
                    justifyContent: "center",
                  }}
                >
                  {/* Logo - smaller */}
                  <div className="shrink-0">
                    <Image
                      alt={detector.name}
                      className="h-3 w-3"
                      height={12}
                      src={detector.image}
                      width={12}
                    />
                  </div>

                  {/* Detector name - matching processing state font */}
                  <span
                    className="whitespace-nowrap font-semibold"
                    style={{
                      fontSize: "12px",
                      lineHeight: "16px",
                      color: styles.textColor,
                    }}
                  >
                    {detector.name}
                  </span>

                  {/* Status - matching the empty div structure from HTML */}
                  <div className="shrink-0">
                    {hasError || result ? getStatusText() : null}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Score Breakdown - Smaller, centered */}
          <div className="mb-4 w-full max-w-sm rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-lg dark:border-slate-600 dark:bg-slate-800/50">
            <div className="relative mb-2 flex items-center justify-between border-slate-200 border-b pb-2 dark:border-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-700 text-xs dark:text-slate-300">
                  AI-generated
                </span>
                <div className="relative">
                  <Info className="h-3 w-3 cursor-help text-slate-500 dark:text-slate-500" />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                <span className="font-medium text-slate-900 text-xs dark:text-white">
                  {detectionResult.ai_likelihood_pct.toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-700 text-xs dark:text-slate-300">
                  Human-written
                </span>
                <div className="relative">
                  <Info className="h-3 w-3 cursor-help text-slate-500 dark:text-slate-500" />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <span className="font-medium text-slate-900 text-xs dark:text-white">
                  {detectionResult.human_likelihood_pct.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {/* Word count and message - smaller, centered */}
          <div className="mb-3 text-center">
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Predicted based upon{" "}
              {String(detectionResult.metadata?.word_count ?? 0)} words.
            </p>
          </div>

          {/* Final message - smaller, centered */}
          <div
            className="w-full rounded-lg border bg-white p-2 text-center dark:bg-white"
            style={{
              boxShadow: "none",
              borderColor: "white",
            }}
          >
            <p className="text-[10px] text-slate-700 dark:text-slate-600">
              {(() => {
                const score = detectionResult.human_likelihood_pct;
                if (score >= 70) {
                  return "Excellent! Your content demonstrates natural human writing patterns.";
                }
                if (score >= 40) {
                  return "Good! Your content shows some human characteristics but could be improved.";
                }
                return "Warning! Your content may need further humanization to pass AI detection.";
              })()}
            </p>
          </div>

          {/* Cached indicator */}
          {detectionResult.cached && (
            <div className="mt-3 flex items-center justify-center gap-1 text-blue-600 text-xs dark:text-blue-500">
              <Clock className="h-3 w-3" />
              Cached result
            </div>
          )}
        </div>
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
      <div className="flex h-[300px] w-full flex-col items-center justify-center px-3 py-4 sm:h-[400px] sm:px-4 md:h-[450px] md:px-6 md:py-5">
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
            <TabsList className="relative grid h-8 w-full grid-cols-3 gap-0.5 rounded-[32px] bg-slate-100 p-0.5 sm:h-9 sm:gap-0.5 sm:p-0.5 dark:bg-[#262626] [&_button]:min-h-0">
              {/* Sliding indicator */}
              <div
                className="absolute top-0.5 bottom-0.5 rounded-[32px] bg-[hsl(216_100%_50%/1)] transition-all duration-300 ease-in-out sm:top-0.5 sm:bottom-0.5"
                style={{
                  left: getIndicatorLeft(),
                  width: "calc(33.333% - 0.1875rem)",
                }}
              />
              <TabsTrigger
                className="group relative z-10 flex h-full min-h-0 cursor-pointer items-center justify-center gap-0.5 rounded-[32px] bg-transparent px-1.5 font-medium text-[10px] text-gray-600 leading-tight transition-all duration-300 ease-in-out data-[state=active]:text-white sm:gap-1.5 sm:px-2 sm:text-xs sm:leading-normal dark:text-white"
                value="humanize"
              >
                <Sparkles className="h-3 w-3 shrink-0 text-current transition-transform duration-300 ease-in-out group-data-[state=active]:scale-110 sm:h-3.5 sm:w-3.5" />
                <span className="whitespace-nowrap">AI Humanizer</span>
              </TabsTrigger>
              <TabsTrigger
                className="group relative z-10 flex h-full min-h-0 cursor-pointer items-center justify-center gap-0.5 rounded-[32px] bg-transparent px-1.5 font-medium text-[10px] text-gray-600 leading-tight transition-all duration-300 ease-in-out data-[state=active]:text-white sm:gap-1.5 sm:px-2 sm:text-xs sm:leading-normal dark:text-white"
                value="detector"
              >
                <BarChart3 className="h-3 w-3 shrink-0 text-current transition-transform duration-300 ease-in-out group-data-[state=active]:scale-110 sm:h-3.5 sm:w-3.5" />
                <span className="whitespace-nowrap">AI Detector</span>
              </TabsTrigger>
              <TabsTrigger
                className="group relative z-10 flex h-full min-h-0 cursor-pointer items-center justify-center gap-0.5 rounded-[32px] bg-transparent px-1.5 font-medium text-[10px] text-gray-600 leading-tight transition-all duration-300 ease-in-out data-[state=active]:text-white sm:gap-1.5 sm:px-2 sm:text-xs sm:leading-normal dark:text-white"
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
          <div className="relative flex flex-1 flex-col gap-3 px-0 lg:pr-[120px] lg:pl-[120px]">
            {/* History Button - Outside textarea at top right */}

            {/* Main Editor Content */}
            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-[#1d1d1d] dark:bg-[#1d1d1d]">
              {/* Text Areas Container */}
              <div className="flex flex-col md:flex-row">
                {/* Left Text Area - Original */}
                <div className="box-border flex w-full flex-col border-0 md:w-1/2 md:border-r dark:border-white-700">
                  {/* Text Input Area - Always visible */}
                  <div className="relative flex flex-1 flex-col">
                    <Textarea
                      className="h-[300px] w-full resize-none border-0 border-b border-b-white px-3 py-3 pr-12 text-sm shadow-none outline-none focus:ring-0 focus-visible:ring-0 sm:h-[400px] sm:px-4 sm:py-4 sm:pr-14 md:h-[450px] md:px-6 md:py-5 md:pr-14 dark:border-b-[#1d1d1d]"
                      onChange={(e) => {
                        setInputText(e.target.value);
                      }}
                      placeholder="To humanize AI text, enter/paste it here, or upload a file (.docx, .pdf)"
                      ref={textareaRef}
                      value={inputText}
                    />
                    {/* Action Buttons - Only visible when textarea is empty and on humanize tab */}
                    {activeTab === "humanize" && !hasInputText && (
                      <div className="absolute top-16 left-3 flex flex-wrap items-center gap-1.5 sm:top-20 sm:left-4 sm:gap-2 md:top-24 md:left-6">
                        <Button
                          className="scale-100 gap-1.5 rounded-full border border-[#0066ff] bg-white px-2 py-1.5 font-medium text-[#0066ff] text-xs transition-none hover:scale-100 hover:bg-[#0066ff]/10 active:scale-100 sm:gap-2 sm:px-2.5 sm:text-sm dark:border-[#0066ff] dark:bg-[#141414] dark:text-[#0066ff] dark:hover:bg-slate-700"
                          onClick={handlePasteText}
                          variant="outline"
                        >
                          <Clipboard className="h-3 w-3 shrink-0" />
                          <span className="whitespace-nowrap">Paste text</span>
                        </Button>
                        <Button
                          className="scale-100 gap-1.5 rounded-full border border-[#0066ff] bg-white px-2 py-1.5 font-medium text-[#0066ff] text-xs transition-none hover:scale-100 hover:bg-[#0066ff]/10 active:scale-100 sm:gap-2 sm:px-2.5 sm:text-sm dark:border-[#0066ff] dark:bg-[#141414] dark:text-[#0066ff] dark:hover:bg-slate-700"
                          onClick={handleFileUpload}
                          variant="outline"
                        >
                          <FileUp className="h-3 w-3 shrink-0" />
                          <span className="whitespace-nowrap">Upload file</span>
                        </Button>
                        <input
                          accept=".docx,.pdf,.doc"
                          className="hidden"
                          onChange={handleFileChange}
                          ref={fileInputRef}
                          type="file"
                        />
                        <Button
                          className="scale-100 gap-1.5 rounded-full border border-[#0066ff] bg-white px-2 py-1.5 font-medium text-[#0066ff] text-xs transition-none hover:scale-100 hover:bg-[#0066ff]/10 active:scale-100 sm:gap-2 sm:px-2.5 sm:text-sm dark:border-[#0066ff] dark:bg-[#141414] dark:text-[#0066ff] dark:hover:bg-slate-700"
                          onClick={handleTryExample}
                          variant="outline"
                        >
                          <FileText className="h-3 w-3 shrink-0" />
                          <span className="whitespace-nowrap">Try example</span>
                        </Button>
                      </div>
                    )}
                    {hasInputText && (
                      <Button
                        className="absolute top-4 right-1 h-8 w-8 cursor-pointer rounded p-0 hover:bg-slate-200 dark:hover:bg-slate-600"
                        onClick={handleClearInput}
                        title="Clear text"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      </Button>
                    )}
                  </div>

                  {/* Left Footer */}
                  <div className="flex flex-col gap-2 border-white border-t px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-2 md:px-6 dark:border-[#1d1d1d] dark:bg-[#1d1d1d]">
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
                            className="h-8 cursor-pointer gap-1.5 px-3 text-sm sm:w-auto"
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
                            className="h-8 cursor-pointer gap-1.5 px-3 text-sm sm:w-auto"
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
                    <div className="flex flex-col gap-2 border-white border-t bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-2 md:px-6 dark:border-[#1d1d1d] dark:bg-[#1d1d1d]">
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
                          disabled={!hasOutputText}
                          onClick={handleThumbsUp}
                          title="Like this output"
                          variant="ghost"
                        >
                          <ThumbsUp className="h-4 w-4 text-[#141414] dark:text-slate-100" />
                        </Button>
                        <Button
                          className="h-8 w-8 rounded-lg p-0 transition-all hover:bg-slate-200 dark:hover:bg-slate-600"
                          disabled={!hasOutputText}
                          onClick={handleThumbsDown}
                          title="Dislike this output"
                          variant="ghost"
                        >
                          <ThumbsDown className="h-4 w-4 text-[#141414] dark:text-slate-100" />
                        </Button>
                        <Button
                          className="h-8 w-8 rounded-lg p-0 transition-all hover:bg-slate-200 dark:hover:bg-slate-600"
                          disabled={!hasOutputText}
                          onClick={handleDownloadOutput}
                          title="Download text"
                          variant="ghost"
                        >
                          <Download className="h-4 w-4 text-[#141414] dark:text-slate-100" />
                        </Button>
                        <Button
                          className="h-8 w-8 rounded-lg p-0 transition-all hover:bg-slate-200 dark:hover:bg-slate-600"
                          disabled={!hasOutputText}
                          onClick={handleCopyOutput}
                          title="Copy to clipboard"
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
                <div className="flex flex-wrap items-center justify-end gap-2 border-slate-200 border-t bg-white px-3 py-2 sm:gap-3 sm:px-4 md:px-6 dark:border-t-[#1d1d1d] dark:bg-[#141414]/50">
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
                <div className="flex flex-col gap-2 border-white border-t bg-slate-50 px-3 py-2 sm:flex-row sm:items-center sm:gap-3 sm:px-4 sm:py-3 md:gap-4 md:px-6 md:py-4 dark:border-t-[#1d1d1d] dark:bg-[#141414]/50">
                  <Select
                    onValueChange={setReadabilityLevel}
                    value={readabilityLevel || undefined}
                  >
                    <SelectTrigger className="h-9 w-full cursor-pointer border-slate-200 bg-white text-slate-900 sm:w-[160px] dark:border-[#1f1f1f] dark:bg-[#1f1f1f] dark:text-white">
                      <SelectValue placeholder="Select Readability Level" />
                    </SelectTrigger>
                    <SelectContent className="border-slate-200 bg-white dark:border-[#1f1f1f] dark:bg-[#1f1f1f]">
                      {readabilityLevels.map((level) => (
                        <SelectItem
                          className="cursor-pointer text-slate-900 dark:text-white dark:focus:bg-[#282828]"
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
                    <SelectTrigger className="h-9 w-full cursor-pointer border-slate-200 bg-white text-slate-900 sm:w-[160px] dark:border-[#1f1f1f] dark:bg-[#1f1f1f] dark:text-white">
                      <SelectValue placeholder="Select Purpose" />
                    </SelectTrigger>
                    <SelectContent className="border-slate-200 bg-white dark:border-[#1f1f1f] dark:bg-[#1f1f1f]">
                      {purposes.map((p) => (
                        <SelectItem
                          className="cursor-pointer text-slate-900 dark:text-white dark:focus:bg-[#282828]"
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
                    className="h-9 gap-2 border-slate-200 bg-white px-4 font-medium text-slate-700 hover:bg-slate-50 dark:border-[#1f1f1f] dark:bg-[#1f1f1f] dark:text-white dark:hover:bg-[#282828]"
                    onClick={() => {
                      setShowStyleSampleModal(true);
                    }}
                    variant="outline"
                  >
                    <Sparkles className="h-4 w-4 dark:text-white" />
                    Personalize
                  </Button>

                  <Select
                    onValueChange={setSelectedLanguage}
                    value={selectedLanguage || undefined}
                  >
                    <SelectTrigger className="h-9 w-full cursor-pointer border-slate-200 bg-white text-slate-900 sm:w-[140px] dark:border-[#1f1f1f] dark:bg-[#1f1f1f] dark:text-white">
                      <SelectValue placeholder="Auto-detect" />
                    </SelectTrigger>
                    <SelectContent className="min-w-[400px] border-slate-200 bg-white dark:border-[#1f1f1f] dark:bg-[#1f1f1f] [&>div>div]:grid [&>div>div]:grid-cols-3 [&>div>div]:gap-0">
                      <SelectGroup>
                        {languages.map((lang) => (
                          <SelectItem
                            className="cursor-pointer text-slate-900 dark:text-white dark:focus:bg-[#282828]"
                            key={lang}
                            value={lang}
                          >
                            {lang}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectSeparator className="col-span-3 dark:bg-[#2a2a2a]" />
                      <SelectItem
                        className="col-span-3 cursor-pointer text-slate-900 dark:text-white dark:focus:bg-[#282828]"
                        value="auto"
                      >
                        Auto-detect
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    onValueChange={(value) =>
                      setLengthMode(value as "shorten" | "expand" | "standard")
                    }
                    value={lengthMode}
                  >
                    <SelectTrigger className="h-9 w-full cursor-pointer border-slate-200 bg-white text-slate-900 sm:w-[160px] dark:border-[#1f1f1f] dark:bg-[#1f1f1f] dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-slate-200 bg-white dark:border-[#1f1f1f] dark:bg-[#1f1f1f]">
                      {lengthModes.map((mode) => (
                        <SelectItem
                          className="cursor-pointer text-slate-900 dark:text-white dark:focus:bg-[#282828]"
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
            </div>
          </div>
          {activeTab === "humanize" && (
            <div className="absolute top-2 right-16 z-10 flex flex-col items-center gap-1">
              <Button
                className="h-8 w-8 cursor-pointer rounded-full bg-black p-0 hover:bg-slate-800 dark:hover:bg-slate-800"
                onClick={() => setShowHistory(true)}
                title="History"
                variant="ghost"
              >
                <Clock className="h-4 w-4 text-white" />
              </Button>
              <p className="text-slate-900 text-xs dark:text-slate-100">
                History
              </p>
            </div>
          )}
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

      {/* Style Sample Modal */}
      <Dialog
        onOpenChange={(open) => {
          setShowStyleSampleModal(open);
          if (open) {
            // Initialize temp state when opening
            setTempStyleSample(styleSample);
          } else {
            // Reset temp state when closing without saving
            setTempStyleSample("");
          }
        }}
        open={showStyleSampleModal}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-slate-900 dark:text-slate-100" />
              <DialogTitle className="text-left">My Writing Style</DialogTitle>
            </div>
            <DialogDescription className="text-left">
              This feature helps generate content that matches your writing
              style.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Textarea
                className="min-h-[200px] resize-y border-2 border-green-500 bg-white text-sm focus:border-green-600 focus:ring-0 dark:bg-slate-800"
                onChange={(e) => setTempStyleSample(e.target.value)}
                placeholder="Add your real text, min 150 words"
                value={tempStyleSample}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-slate-600 text-sm dark:text-slate-400">
                    {
                      tempStyleSample
                        .trim()
                        .split(WORD_COUNT_REGEX)
                        .filter(Boolean).length
                    }{" "}
                    / 30,000 Words
                  </span>
                </div>
                <button
                  className="font-medium text-green-600 text-sm hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                  onClick={() => {
                    setTempStyleSample(EXAMPLE_TEXT);
                  }}
                  type="button"
                >
                  Show me an example
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              className="border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
              onClick={() => {
                setShowStyleSampleModal(false);
                setTempStyleSample("");
              }}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              className="bg-green-600 text-white hover:bg-green-700"
              onClick={() => {
                const styleWordCount = tempStyleSample
                  .trim()
                  .split(WORD_COUNT_REGEX)
                  .filter(Boolean).length;

                if (styleWordCount < 150) {
                  setError(
                    "Please enter at least 150 words for the writing style sample."
                  );
                  return;
                }

                // Save the style sample
                setStyleSample(tempStyleSample);
                setShowStyleSampleModal(false);
                setError(null);
              }}
              type="button"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
