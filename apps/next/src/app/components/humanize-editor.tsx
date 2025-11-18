"use client";

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
import { Button } from "@/components/ui/button";
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
import { humanizeText } from "@/lib/humanize-api";
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

// Constants for word limits
const FREE_WORD_LIMIT = 500;
const PREMIUM_WORD_LIMIT = 25_000;

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
  const [isPremium, setIsPremium] = useState(false); // TODO: Get from auth context
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

  // Get word limit based on subscription status
  const wordLimit = isPremium ? PREMIUM_WORD_LIMIT : FREE_WORD_LIMIT;
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
        `Word limit exceeded. Free users can humanize up to ${FREE_WORD_LIMIT} words. Upgrade to premium for ${PREMIUM_WORD_LIMIT} words.`
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
    // Calculate word counts
    const inputWords = item.originalText
      .trim()
      .split(WORD_COUNT_REGEX)
      .filter(Boolean).length;
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

  // Check if PRO item is selected
  const isProReadabilitySelected = readabilityLevels.find(
    (level) => level.value === readabilityLevel && level.pro
  );
  const isProPurposeSelected = purposes.find(
    (p) => p.value === purpose && p.pro
  );
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
      return isPremium ? "0/25000 words" : "0/2500 words";
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
      const aiDetectors = [
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

      return (
        <div className="flex h-[450px] w-full flex-col gap-6 overflow-hidden px-4 py-5 sm:px-6">
          {/* Loading Spinner */}
          <div className="flex flex-col items-center justify-center gap-3">
            <LoadingSpinner size="lg" />
            <p className="text-slate-600 text-sm dark:text-slate-400">
              Humanizing your text...
            </p>
          </div>

          {/* Rating */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((starNum) => (
                <Star
                  className="h-4 w-4 fill-[#0066ff] text-[#0066ff]"
                  key={`rating-star-${starNum}`}
                />
              ))}
            </div>
            <p className="text-slate-600 text-xs dark:text-slate-400">
              4.8/5 based on 128,743 reviews
            </p>
          </div>

          {/* AI Detector Bypass Section */}
          <div className="border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-[#141414]/50">
            <h3 className="mb-3 font-semibold text-slate-900 text-sm dark:text-slate-100">
              AI Humanizer can bypass these AI detectors
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {aiDetectors.map((detector) => (
                <div
                  className="flex items-center gap-2 p-2 dark:bg-[#141414]"
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
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex flex-1 items-start gap-3 border border-[#0066ff] bg-[#0066ff]/10 p-3 dark:border-[#0066ff] dark:bg-[#141414]">
                <Check className="h-4 w-4 shrink-0 text-[#0066ff] dark:text-[#0066ff]" />
                <div>
                  <p className="font-semibold text-[#0066ff] text-xs dark:text-[#0066ff]">
                    Trusted by 12 Million+ Users
                  </p>
                </div>
              </div>

              <div className="flex flex-1 items-start gap-3 border border-[#0066ff] bg-[#0066ff]/10 p-3 dark:border-[#0066ff] dark:bg-[#141414]">
                <FileText className="h-4 w-4 shrink-0 text-[#0066ff] dark:text-[#0066ff]" />
                <div>
                  <p className="whitespace-nowrap font-semibold text-[#0066ff] text-xs dark:text-[#0066ff]">
                    1.46 Billion+ Words Humanized Monthly
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-0">
              {/* Success Rate Button */}
              <div className="flex items-center gap-2 border border-[#0066ff] bg-[#0066ff]/10 px-3 py-2 dark:border-[#0066ff] dark:bg-[#141414]">
                <Check className="h-4 w-4 shrink-0 text-[#0066ff] dark:text-[#0066ff]" />
                <p className="font-semibold text-[#0066ff] text-xs dark:text-[#0066ff]">
                  99.54% Success Rate
                </p>
              </div>

              {/* Stars and Reviews Section */}
              <div className="ml-auto flex items-center gap-3 border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-[#141414]">
                <Image
                  alt="4.5 stars on Trustpilot"
                  className="h-4 w-auto"
                  height={16}
                  src="https://cdn.trustpilot.net/brand-assets/4.1.0/stars/stars-4.5.svg"
                  unoptimized
                  width={80}
                />
                <span className="flex items-center gap-1 text-black text-xs dark:text-slate-100">
                  <span className="gap-4 underline">5,936 reviews on</span>
                  <Image
                    alt="Trustpilot"
                    className="h-3 w-3"
                    height={12}
                    src="/logos/trustpilot-star.png"
                    width={12}
                  />
                  <span>Trustpilot</span>
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

  // Render output for other tabs
  const renderOtherTabOutput = () => {
    const title =
      activeTab === "plagiarism" ? "Plagiarism Checker" : "AI Detector";
    const message =
      activeTab === "plagiarism"
        ? 'Click "Check Plagiarism" to analyze your text'
        : 'Click "Detect AI" to analyze your text';
    return (
      <div className="flex h-[450px] w-full flex-col items-center justify-center px-4 py-5 sm:px-6">
        <h3 className="mb-2 font-semibold text-base text-slate-900 sm:text-lg dark:text-slate-100">
          {title}
        </h3>
        <p className="text-center text-slate-600 text-xs sm:text-sm dark:text-slate-400">
          {message}
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
                    {isInitialState && activeTab === "humanize" ? (
                      <div className="flex items-center gap-2">
                        <Button
                          className="h-8 gap-1.5 rounded-lg bg-slate-100 px-3 font-medium text-slate-500 text-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto dark:bg-slate-700 dark:text-slate-400"
                          disabled
                        >
                          Humanize
                        </Button>
                      </div>
                    ) : (
                      !isInitialState && (
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
                      )
                    )}
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
                    className="min-h-[100px] resize-none border border-slate-200 bg-white text-sm dark:border-slate-600 dark:bg-slate-700"
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
