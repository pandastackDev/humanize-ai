"use client";

import {
  BarChart3,
  ChevronDown,
  Copy,
  Download,
  FileCheck,
  FileText,
  FileUp,
  History,
  Loader2,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

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
  { value: "shorten", label: "Shorten" },
  { value: "expand", label: "Expand" },
  { value: "standard", label: "Standard" },
];

const WORD_COUNT_REGEX = /\s+/;
const WORD_SPLIT_REGEX = /\s+/;

/**
 * Map language display name to ISO 639-1 language code.
 */
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

export function HumanizeEditor() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [readabilityLevel, setReadabilityLevel] = useState("university");
  const [purpose, setPurpose] = useState("academic");
  const [lengthMode, setLengthMode] = useState<
    "shorten" | "expand" | "standard"
  >("standard");
  const [styleSample, setStyleSample] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"text" | "file">("text");
  const [activeTab, setActiveTab] = useState("humanize");
  const [showAllLanguages, setShowAllLanguages] = useState(false);
  const [showStyleSample, setShowStyleSample] = useState(false);
  const allLanguagesRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        allLanguagesRef.current &&
        !allLanguagesRef.current.contains(event.target as Node)
      ) {
        setShowAllLanguages(false);
      }
    };

    if (showAllLanguages) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAllLanguages]);

  const wordCount = inputText
    .trim()
    .split(WORD_COUNT_REGEX)
    .filter(Boolean).length;
  const outputWordCount = outputText
    .trim()
    .split(WORD_COUNT_REGEX)
    .filter(Boolean).length;

  // Helper functions for button text and placeholders
  const getActionButtonText = () => {
    if (activeTab === "humanize") {
      return "Humanize";
    }
    if (activeTab === "plagiarism") {
      return "Check Plagiarism";
    }
    return "Detect AI";
  };

  const getRightPanelTitle = () => {
    if (activeTab === "plagiarism") {
      return "Plagiarism Checker";
    }
    return "AI Detector";
  };

  const getRightPanelMessage = () => {
    if (activeTab === "plagiarism") {
      return 'Click "Check Plagiarism" to analyze your text';
    }
    return 'Click "Detect AI" to analyze your text';
  };

  const getWordCountDisplay = () => {
    if (activeTab === "plagiarism" || activeTab === "detector") {
      return `Words: ${wordCount}`;
    }
    return wordCount;
  };

  // Prevent horizontal scroll - ensure body always has overflow-x hidden
  useEffect(() => {
    // Ensure body never scrolls horizontally
    const originalOverflowX = document.body.style.overflowX;
    document.body.style.overflowX = "hidden";

    return () => {
      document.body.style.overflowX = originalOverflowX;
    };
  }, []);

  // Handle humanize button click
  const handleHumanize = async () => {
    if (!inputText.trim()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setOutputText("");

    try {
      const languageCode = getLanguageCode(selectedLanguage);
      const response = await humanizeText({
        input_text: inputText,
        tone: purpose,
        length_mode: lengthMode,
        readability_level: readabilityLevel,
        language: languageCode !== "en" ? languageCode : undefined, // Only send if not English
        style_sample: styleSample.trim() || undefined,
      });

      setOutputText(response.humanized_text || "");
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

  return (
    <div className="relative mx-auto w-full max-w-[1400px] overflow-x-hidden px-4 py-6 md:px-6">
      <div className="flex flex-col gap-6">
        {/* Segment Control - Humanize/Plagiarism Checker/AI Detector */}
        <div className="flex items-center justify-center px-2 sm:px-0">
          <Tabs
            className="w-full max-w-full sm:max-w-xl"
            onValueChange={setActiveTab}
            value={activeTab}
          >
            <TabsList className="grid h-10 w-full grid-cols-3 gap-0.5 rounded-[32px] bg-slate-100 p-0.5 sm:h-12 sm:gap-1 sm:p-1 dark:bg-slate-800">
              <TabsTrigger
                className="group flex h-full cursor-pointer items-center justify-center gap-1 rounded-[32px] px-2 font-medium text-[11px] leading-tight transition-all duration-500 ease-in-out data-[state=active]:bg-[lab(7.78673%_1.82345_-15.0537)] data-[state=active]:text-white data-[state=active]:shadow-sm sm:gap-2 sm:px-3 sm:text-sm sm:leading-normal dark:data-[state=active]:bg-slate-700"
                value="humanize"
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0 transition-transform duration-500 ease-in-out group-data-[state=active]:scale-110 sm:h-4 sm:w-4" />
                <span className="whitespace-nowrap">Humanize</span>
              </TabsTrigger>
              <TabsTrigger
                className="group flex h-full cursor-pointer items-center justify-center gap-1 rounded-[32px] px-2 font-medium text-[11px] leading-tight transition-all duration-500 ease-in-out data-[state=active]:bg-[lab(7.78673%_1.82345_-15.0537)] data-[state=active]:text-white data-[state=active]:shadow-sm sm:gap-2 sm:px-3 sm:text-sm sm:leading-normal dark:data-[state=active]:bg-slate-700"
                value="plagiarism"
              >
                <FileCheck className="h-3.5 w-3.5 shrink-0 transition-transform duration-500 ease-in-out group-data-[state=active]:scale-110 sm:h-4 sm:w-4" />
                <span className="whitespace-nowrap">Plagiarism Checker</span>
              </TabsTrigger>
              <TabsTrigger
                className="group flex h-full cursor-pointer items-center justify-center gap-1 rounded-[32px] px-2 font-medium text-[11px] leading-tight transition-all duration-500 ease-in-out data-[state=active]:bg-[lab(7.78673%_1.82345_-15.0537)] data-[state=active]:text-white data-[state=active]:shadow-sm sm:gap-2 sm:px-3 sm:text-sm sm:leading-normal dark:data-[state=active]:bg-slate-700"
                value="detector"
              >
                <BarChart3 className="h-3.5 w-3.5 shrink-0 transition-transform duration-500 ease-in-out group-data-[state=active]:scale-110 sm:h-4 sm:w-4" />
                <span className="whitespace-nowrap">AI Detector</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Mobile Controls */}
        {activeTab === "humanize" && (
          <div className="flex flex-col gap-4 border-slate-200 border-b pb-4 md:hidden dark:border-slate-700">
            {/* Mobile Text/File Buttons */}
            <div className="flex items-center gap-2">
              <Button
                className={cn(
                  "h-10 flex-1 gap-2 border border-slate-200 bg-white font-medium text-sm shadow-sm dark:border-slate-700 dark:bg-slate-800",
                  mode === "text"
                    ? "border-slate-800 bg-slate-50 text-slate-900 dark:border-slate-400 dark:bg-slate-700"
                    : "text-slate-700 dark:text-slate-300"
                )}
                onClick={() => setMode("text")}
                variant="outline"
              >
                <FileText className="h-4 w-4" />
                <span>Text</span>
              </Button>
              <Button
                className={cn(
                  "h-10 flex-1 gap-2 border border-slate-200 bg-white font-medium text-sm shadow-sm dark:border-slate-700 dark:bg-slate-800",
                  mode === "file"
                    ? "border-slate-800 bg-slate-50 text-slate-900 dark:border-slate-400 dark:bg-slate-700"
                    : "text-slate-700 dark:text-slate-300"
                )}
                onClick={() => setMode("file")}
                variant="outline"
              >
                <FileUp className="h-4 w-4" />
                <span>File</span>
              </Button>
            </div>

            {/* Mobile Language Selector */}
            <Select
              onValueChange={setSelectedLanguage}
              value={selectedLanguage}
            >
              <SelectTrigger className="h-10 w-full cursor-pointer border-slate-200 dark:border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
          </div>
        )}

        {/* Main Editor Container */}
        <div className="relative flex gap-4">
          {/* Controls and Main Editor Content - Same Width */}
          <div className="flex flex-1 flex-col gap-4">
            {/* Top Controls Bar - Desktop */}
            {activeTab === "humanize" && (
              <div className="hidden items-center gap-4 px-0 md:flex">
                {/* Left: Humanize Text/File Buttons */}
                <div className="flex items-center gap-3">
                  <Button
                    className={cn(
                      "h-11 min-w-[160px] cursor-pointer gap-2 border border-slate-200 bg-white px-4 py-2.5 font-medium text-sm shadow-sm transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700",
                      mode === "text"
                        ? "border-slate-800 bg-slate-50 text-slate-900 dark:border-slate-400 dark:bg-slate-700 dark:text-slate-50"
                        : "text-slate-700 dark:text-slate-300"
                    )}
                    onClick={() => setMode("text")}
                    variant="outline"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Humanize Text</span>
                  </Button>
                  <Button
                    className={cn(
                      "h-11 min-w-[160px] cursor-pointer gap-2 border border-slate-200 bg-white px-4 py-2.5 font-medium text-sm shadow-sm transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700",
                      mode === "file"
                        ? "border-slate-800 bg-slate-50 text-slate-900 dark:border-slate-400 dark:bg-slate-700 dark:text-slate-50"
                        : "text-slate-700 dark:text-slate-300"
                    )}
                    onClick={() => setMode("file")}
                    variant="outline"
                  >
                    <FileUp className="h-4 w-4" />
                    <span>Humanize File</span>
                  </Button>
                </div>

                {/* Right: Language Selector - aligned with text area right edge */}
                <div className="ml-auto flex items-center gap-3">
                  {["English", "Spanish", "French", "German"].map((lang) => (
                    <button
                      className={cn(
                        "h-10 min-w-[90px] rounded-full px-4 py-2 font-medium text-sm transition-all",
                        selectedLanguage === lang
                          ? "border-2 border-slate-800 bg-transparent text-slate-800 dark:border-slate-400 dark:text-slate-300"
                          : "border border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      )}
                      key={lang}
                      onClick={() => setSelectedLanguage(lang)}
                      type="button"
                    >
                      {lang}
                    </button>
                  ))}
                  <div className="relative" ref={allLanguagesRef}>
                    <button
                      className="flex h-10 items-center gap-1.5 rounded-full border border-transparent px-4 py-2 font-medium text-slate-600 text-sm transition-all hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      onClick={() => setShowAllLanguages(!showAllLanguages)}
                      type="button"
                    >
                      All
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    {showAllLanguages && (
                      <div className="absolute top-12 right-0 z-50 grid w-[calc(100vw-2rem)] max-w-[600px] grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-lg sm:grid-cols-3 sm:p-4 dark:border-slate-700 dark:bg-slate-800">
                        {languages.map((lang) => (
                          <Button
                            className={cn(
                              "h-9 justify-start gap-2 rounded-lg px-3 font-medium text-xs transition-colors sm:text-sm",
                              selectedLanguage === lang
                                ? "bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white"
                                : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                            )}
                            key={lang}
                            onClick={() => {
                              setSelectedLanguage(lang);
                              setShowAllLanguages(false);
                            }}
                            variant="ghost"
                          >
                            {lang}
                            {selectedLanguage === lang && (
                              <svg
                                aria-label="Selected language"
                                className="ml-auto h-4 w-4 text-slate-800 dark:text-slate-300"
                                fill="none"
                                height="16"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                viewBox="0 0 24 24"
                                width="16"
                              >
                                <title>Selected language</title>
                                <path d="M20 6 9 17l-5-5" />
                              </svg>
                            )}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Main Editor Content */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
              {/* Top Dropdowns and Personalize Button - Only for Humanize */}
              {activeTab === "humanize" && (
                <div className="flex flex-col gap-2 border-slate-200 border-b bg-slate-50 px-3 py-2 sm:cursor-pointer sm:flex-row sm:items-center sm:gap-3 sm:px-4 sm:py-1.5 dark:border-slate-700 dark:bg-slate-800/50">
                  <div className="flex gap-2 sm:gap-3">
                    <Select
                      onValueChange={setReadabilityLevel}
                      value={readabilityLevel}
                    >
                      <SelectTrigger className="h-8 flex-1 cursor-pointer rounded-md border border-slate-200 bg-white px-2.5 font-medium text-xs shadow-sm transition-all hover:border-slate-300 focus:border-slate-400 sm:h-7 sm:w-[130px] sm:flex-none dark:border-slate-600 dark:bg-slate-700 dark:hover:border-slate-500">
                        <SelectValue placeholder="Select Readability Level" />
                      </SelectTrigger>
                      <SelectContent className="min-w-[130px]">
                        {readabilityLevels.map((level) => (
                          <SelectItem
                            className="cursor-pointer"
                            key={level.value}
                            value={level.value}
                          >
                            <div className="flex items-center gap-2 pl-4">
                              <span>{level.label}</span>
                              {level.pro && (
                                <span className="rounded-full bg-slate-800 px-2 py-0.5 font-medium text-white text-xs dark:bg-slate-600">
                                  PRO
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select onValueChange={setPurpose} value={purpose}>
                      <SelectTrigger className="h-8 flex-1 cursor-pointer rounded-md border border-slate-200 bg-white px-2.5 font-medium text-xs shadow-sm transition-all hover:border-slate-300 focus:border-slate-400 sm:h-7 sm:w-[130px] sm:flex-none dark:border-slate-600 dark:bg-slate-700 dark:hover:border-slate-500">
                        <SelectValue placeholder="Select Purpose" />
                      </SelectTrigger>
                      <SelectContent className="min-w-[130px]">
                        {purposes.map((p) => (
                          <SelectItem
                            className="cursor-pointer"
                            key={p.value}
                            value={p.value}
                          >
                            <div className="flex items-center gap-2">
                              <span>{p.label}</span>
                              {p.pro && (
                                <span className="rounded-full bg-slate-800 px-2 py-0.5 font-medium text-white text-xs dark:bg-slate-600">
                                  PRO
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      onValueChange={(value) =>
                        setLengthMode(
                          value as "shorten" | "expand" | "standard"
                        )
                      }
                      value={lengthMode}
                    >
                      <SelectTrigger className="h-8 flex-1 cursor-pointer rounded-md border border-slate-200 bg-white px-2.5 font-medium text-xs shadow-sm transition-all hover:border-slate-300 focus:border-slate-400 sm:h-7 sm:w-[130px] sm:flex-none dark:border-slate-600 dark:bg-slate-700 dark:hover:border-slate-500">
                        <SelectValue placeholder="Length Mode" />
                      </SelectTrigger>
                      <SelectContent className="min-w-[130px]">
                        {lengthModes.map((lengthModeOption) => (
                          <SelectItem
                            className="cursor-pointer"
                            key={lengthModeOption.value}
                            value={lengthModeOption.value}
                          >
                            {lengthModeOption.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    className="h-9 w-full cursor-pointer gap-1.5 rounded-md border border-slate-200 bg-white px-3 font-medium text-slate-700 text-xs shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 sm:ml-auto sm:h-8 sm:w-auto dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-600"
                    onClick={() => setShowStyleSample(!showStyleSample)}
                    variant="outline"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-slate-700 dark:text-slate-300" />
                    Personalize
                  </Button>
                </div>
              )}

              {/* Style Sample Input - Collapsible */}
              {activeTab === "humanize" && showStyleSample && (
                <div className="border-slate-200 border-b bg-slate-50 px-3 py-3 sm:px-4 dark:border-slate-700 dark:bg-slate-800/50">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="font-medium text-slate-900 text-xs sm:text-sm dark:text-slate-100">
                      Style Sample (Optional, ≥150 words recommended)
                    </label>
                    <Button
                      className="h-6 w-6 rounded p-0 text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-600"
                      onClick={() => setShowStyleSample(false)}
                      variant="ghost"
                    >
                      <svg
                        aria-label="Close style sample input"
                        className="h-4 w-4"
                        fill="none"
                        height="16"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        width="16"
                      >
                        <title>Close style sample input</title>
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </Button>
                  </div>
                  <Textarea
                    className="min-h-[100px] resize-none border border-slate-200 bg-white text-sm dark:border-slate-600 dark:bg-slate-700"
                    onChange={(e) => setStyleSample(e.target.value)}
                    placeholder="Paste a sample of writing style you want to match (at least 150 words for best results)..."
                    value={styleSample}
                  />
                  <p className="mt-1 text-slate-500 text-xs dark:text-slate-400">
                    {styleSample.trim()
                      ? `${styleSample.trim().split(WORD_SPLIT_REGEX).length} words`
                      : "Leave empty to use default style"}
                  </p>
                </div>
              )}

              {/* Sub-tabs for Plagiarism Checker and AI Detector */}
              {(activeTab === "plagiarism" || activeTab === "detector") && (
                <div className="flex items-center gap-0 border-slate-200 border-b bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                  <button
                    className={cn(
                      "flex h-10 items-center gap-2 border-b-2 px-6 font-medium text-sm transition-colors",
                      mode === "text"
                        ? "border-[lab(7.78673%_1.82345_-15.0537)] text-[lab(7.78673%_1.82345_-15.0537)]"
                        : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                    )}
                    onClick={() => setMode("text")}
                    type="button"
                  >
                    {activeTab === "plagiarism" ? (
                      <FileCheck className="h-4 w-4" />
                    ) : (
                      <BarChart3 className="h-4 w-4" />
                    )}
                    <span>
                      {activeTab === "plagiarism" ? "Input" : "Output"}
                    </span>
                  </button>
                  <button
                    className={cn(
                      "flex h-10 items-center gap-2 border-b-2 px-6 font-medium text-sm transition-colors",
                      mode === "file"
                        ? "border-[lab(7.78673%_1.82345_-15.0537)] text-[lab(7.78673%_1.82345_-15.0537)]"
                        : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                    )}
                    onClick={() => setMode("file")}
                    type="button"
                  >
                    <FileUp className="h-4 w-4" />
                    <span>
                      {activeTab === "plagiarism"
                        ? "Check File"
                        : "Detect File"}
                    </span>
                  </button>
                </div>
              )}

              {/* Text Areas Container */}
              <div className="flex flex-col md:flex-row">
                {/* Left Text Area */}
                <div className="flex w-full flex-col border-slate-200 border-b md:w-1/2 md:border-r md:border-b-0 dark:border-slate-700">
                  <div className="flex flex-1 flex-col">
                    <div className="flex-1 overflow-hidden">
                      <Textarea
                        className="h-[300px] w-full resize-none border-0 px-4 py-4 text-sm focus-visible:ring-0 sm:px-6 sm:py-5 md:h-[450px]"
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Paste or type your text here..."
                        value={inputText}
                      />
                    </div>
                  </div>

                  {/* Left Footer */}
                  <div className="flex flex-col gap-3 border-slate-200 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4 dark:border-slate-700 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="font-semibold text-slate-900 text-sm dark:text-slate-100">
                          {getWordCountDisplay()}
                        </span>
                        {activeTab === "humanize" && (
                          <span className="text-[lab(7.78673%_1.82345_-15.0537)] text-xs dark:text-[lab(7.78673%_1.82345_-15.0537)]">
                            Word Count
                          </span>
                        )}
                      </div>
                      {activeTab === "humanize" && (
                        <Button
                          className="h-8 w-8 rounded p-0 transition-all hover:bg-slate-200 dark:hover:bg-slate-600"
                          title="Freeze Keywords"
                          variant="ghost"
                        >
                          <svg
                            aria-label="Freeze Keywords"
                            className="h-4 w-4 text-[lab(7.78673%_1.82345_-15.0537)] dark:text-[lab(7.78673%_1.82345_-15.0537)]"
                            fill="none"
                            height="20"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            viewBox="0 0 20 20"
                            width="20"
                          >
                            <title>Freeze Keywords</title>
                            <path d="M10 2.5L5 7.5V15H15V7.5L10 2.5Z" />
                          </svg>
                        </Button>
                      )}
                    </div>
                    <Button
                      className="h-9 w-full gap-2 rounded-lg bg-slate-900 px-4 font-medium text-sm text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto dark:bg-slate-700 dark:hover:bg-slate-600"
                      disabled={!inputText.trim() || isLoading}
                      onClick={
                        activeTab === "humanize" ? handleHumanize : undefined
                      }
                    >
                      {isLoading && activeTab === "humanize" ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Humanizing...
                        </>
                      ) : (
                        getActionButtonText()
                      )}
                    </Button>
                  </div>
                </div>

                {/* Right Text Area */}
                <div className="flex w-full flex-col md:w-1/2">
                  <div className="flex flex-1 flex-col">
                    <div className="flex-1 overflow-hidden">
                      {activeTab === "humanize" ? (
                        error ? (
                          <div className="flex h-[300px] w-full flex-col items-center justify-center gap-4 px-4 py-5 sm:px-6 md:h-[450px]">
                            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                              <p className="mb-2 font-semibold text-red-900 text-sm dark:text-red-200">
                                Error
                              </p>
                              <p className="text-red-700 text-xs dark:text-red-300">
                                {error}
                              </p>
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
                        ) : (
                          <Textarea
                            className="h-[300px] w-full resize-none whitespace-pre-wrap border-0 px-4 py-4 text-sm focus-visible:ring-0 sm:px-6 sm:py-5 md:h-[450px]"
                            onChange={(e) => setOutputText(e.target.value)}
                            placeholder={
                              isLoading
                                ? "Humanizing your text..."
                                : "Your humanized text will appear here..."
                            }
                            readOnly={isLoading}
                            style={{ whiteSpace: "pre-wrap" }}
                            value={outputText}
                          />
                        )
                      ) : (
                        <div className="flex h-[300px] w-full flex-col items-center justify-center px-4 py-5 sm:px-6 md:h-[450px]">
                          <h3 className="mb-2 font-semibold text-base text-slate-900 sm:text-lg dark:text-slate-100">
                            {getRightPanelTitle()}
                          </h3>
                          <p className="text-center text-slate-600 text-xs sm:text-sm dark:text-slate-400">
                            {getRightPanelMessage()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Footer */}
                  {activeTab === "humanize" && (
                    <div className="flex flex-col gap-3 border-slate-200 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4 dark:border-slate-700 dark:bg-slate-800/50">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="font-semibold text-slate-900 text-sm dark:text-slate-100">
                            {outputWordCount}
                          </span>
                          <span className="text-[lab(7.78673%_1.82345_-15.0537)] text-xs dark:text-[lab(7.78673%_1.82345_-15.0537)]">
                            Word Count
                          </span>
                        </div>
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="font-semibold text-slate-900 text-sm dark:text-slate-100">
                            -
                          </span>
                          <span className="text-[lab(7.78673%_1.82345_-15.0537)] text-xs dark:text-[lab(7.78673%_1.82345_-15.0537)]">
                            Human Score
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          className="h-9 w-9 rounded-lg p-0 transition-all hover:bg-slate-200 dark:hover:bg-slate-600"
                          variant="ghost"
                        >
                          <ThumbsUp className="h-4 w-4 text-[lab(7.78673%_1.82345_-15.0537)] transition-colors hover:text-[lab(7.78673%_1.82345_-15.0537)] dark:text-[lab(7.78673%_1.82345_-15.0537)] dark:hover:text-[lab(7.78673%_1.82345_-15.0537)]" />
                        </Button>
                        <Button
                          className="h-9 w-9 rounded-lg p-0 transition-all hover:bg-slate-200 dark:hover:bg-slate-600"
                          variant="ghost"
                        >
                          <ThumbsDown className="h-4 w-4 text-[lab(7.78673%_1.82345_-15.0537)] transition-colors hover:text-red-600 dark:text-[lab(7.78673%_1.82345_-15.0537)] dark:hover:text-red-400" />
                        </Button>
                        <Button
                          className="h-9 w-9 rounded-lg p-0 transition-all hover:bg-slate-200 dark:hover:bg-slate-600"
                          variant="ghost"
                        >
                          <Download className="h-4 w-4 text-[lab(7.78673%_1.82345_-15.0537)] transition-colors hover:text-[lab(7.78673%_1.82345_-15.0537)] dark:text-[lab(7.78673%_1.82345_-15.0537)] dark:hover:text-[lab(7.78673%_1.82345_-15.0537)]" />
                        </Button>
                        <Button
                          className="h-9 w-9 rounded-lg p-0 transition-all hover:bg-slate-200 dark:hover:bg-slate-600"
                          variant="ghost"
                        >
                          <Copy className="h-4 w-4 text-[lab(7.78673%_1.82345_-15.0537)] transition-colors hover:text-[lab(7.78673%_1.82345_-15.0537)] dark:text-[lab(7.78673%_1.82345_-15.0537)] dark:hover:text-[lab(7.78673%_1.82345_-15.0537)]" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* History and Fact Check Sidebar - Right Side (Outside Text Area) */}
          <div className="mt-4 hidden flex-col gap-3 md:flex">
            <Button
              className="mt-20 flex h-auto flex-col items-center gap-1.5 rounded-lg p-2.5 transition-all hover:bg-slate-100 dark:hover:bg-slate-700"
              variant="ghost"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                <History className="h-4 w-4 text-slate-700 dark:text-slate-300" />
              </div>
              <span className="font-medium text-slate-600 text-xs dark:text-slate-400">
                History
              </span>
            </Button>
            <Button
              className="flex h-auto flex-col items-center gap-1.5 rounded-lg p-2.5 transition-all hover:bg-slate-100 dark:hover:bg-slate-700"
              variant="ghost"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                <BarChart3 className="h-4 w-4 text-slate-700 dark:text-slate-300" />
              </div>
              <span className="font-medium text-slate-600 text-xs dark:text-slate-400">
                Fact Check
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
