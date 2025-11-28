"use client";

import { Button } from "@humanize/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@humanize/ui/components/card";
import { Label } from "@humanize/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@humanize/ui/components/select";
import { Textarea } from "@humanize/ui/components/textarea";
import {
  AlertCircle,
  BarChart3,
  CheckCircle,
  Clock,
  Copy,
  Info,
  Loader2,
  Search,
  Shield,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { detectAIContent } from "@/lib/detect-api";

// Top-level regex constant for word counting
const WORD_SPLIT_REGEX = /\s+/;

type DetectorResult = {
  detector: string;
  ai_probability: number;
  human_probability: number;
  confidence: number;
  details?: Record<string, unknown>;
  error?: string;
  response_time_ms?: number;
};

type InternalAnalysis = {
  perplexity_score?: number;
  entropy_score?: number;
  ngram_variance?: number;
  avg_sentence_length?: number;
  sentence_length_variance?: number;
  lexical_diversity?: number;
  burstiness_score?: number;
  ai_likelihood_internal: number;
};

type DetectionResult = {
  text_sample: string;
  language: string;
  human_likelihood_pct: number;
  ai_likelihood_pct: number;
  confidence: number;
  detector_results: DetectorResult[];
  internal_analysis?: InternalAnalysis;
  metadata?: Record<string, unknown>;
  cached: boolean;
};

const detectorOptions = [
  { value: "all", label: "All Detectors" },
  { value: "gptzero", label: "GPTZero" },
  { value: "copyleaks", label: "CopyLeaks" },
  { value: "sapling", label: "Sapling" },
  { value: "writer", label: "Writer" },
  { value: "zerogpt", label: "ZeroGPT" },
  { value: "originality", label: "Originality.ai" },
  { value: "quillbot", label: "QuillBot" },
];

// All detectors with their logo paths for loading screen
const ALL_DETECTORS = [
  { name: "GPTZero", logo: "/logos/humanization-logos/gptzero.png" },
  { name: "ZeroGPT", logo: "/logos/humanization-logos/zerogpt.png" },
  { name: "QuillBot", logo: "/logos/humanization-logos/quillbot.png" },
  { name: "Copyleaks", logo: "/logos/humanization-logos/copyleaks.png" },
  { name: "Originality.ai", logo: "/logos/humanization-logos/originality.png" },
  { name: "Sapling", logo: "/logos/humanization-logos/sapling.png" },
  { name: "Writer", logo: "/logos/humanization-logos/writer.png" },
  { name: "Turnitin", logo: "/logos/humanization-logos/turnitin.png" },
];

// Helper function to calculate word count
const calculateWordCount = (text: string): number =>
  text.trim() ? text.trim().split(WORD_SPLIT_REGEX).length : 0;

export function AIDetector() {
  const [text, setText] = useState("");
  const [selectedDetectors, setSelectedDetectors] = useState<string>("all");
  const [includeInternal, setIncludeInternal] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wordCount = calculateWordCount(text);

  const handleDetect = async () => {
    if (!text.trim()) {
      setError("Please enter some text to analyze");
      return;
    }

    if (wordCount < 10) {
      setError("Text must contain at least 10 words for accurate detection");
      return;
    }

    setIsDetecting(true);
    setError(null);

    try {
      const detectors =
        selectedDetectors === "all" ? undefined : [selectedDetectors];
      const response = await detectAIContent({
        text: text.trim(),
        detectors,
        include_internal_analysis: includeInternal,
        enable_caching: true,
      });

      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Detection failed");
    } finally {
      setIsDetecting(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      const summary = `AI Detection Results
==================
Human Likelihood: ${result.human_likelihood_pct.toFixed(1)}%
AI Likelihood: ${result.ai_likelihood_pct.toFixed(1)}%
Confidence: ${(result.confidence * 100).toFixed(1)}%
Language: ${result.language}

Detector Results:
${result.detector_results
  .map(
    (d) =>
      `- ${d.detector}: ${(d.human_probability * 100).toFixed(1)}% human (confidence: ${(d.confidence * 100).toFixed(1)}%)`
  )
  .join("\n")}`;

      navigator.clipboard.writeText(summary);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) {
      return "text-green-600 dark:text-green-400";
    }
    if (score >= 40) {
      return "text-yellow-600 dark:text-yellow-400";
    }
    return "text-red-600 dark:text-red-400";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 70) {
      return <CheckCircle className="h-6 w-6 text-green-600" />;
    }
    if (score >= 40) {
      return <AlertCircle className="h-6 w-6 text-yellow-600" />;
    }
    return <XCircle className="h-6 w-6 text-red-600" />;
  };

  const getDetectorAssessment = (detector: DetectorResult) => {
    const aiScore = detector.ai_probability * 100;
    const humanScore = detector.human_probability * 100;
    const isLikelyAI = aiScore > humanScore + 0.5;
    const isLikelyHuman = humanScore > aiScore + 0.5;

    if (isLikelyAI) {
      return {
        label: "Likely AI",
        score: aiScore,
        colorClass: "text-red-600 dark:text-red-400",
      };
    }

    if (isLikelyHuman) {
      return {
        label: "Likely Human",
        score: humanScore,
        colorClass: "text-green-600 dark:text-green-400",
      };
    }

    return {
      label: "Inconclusive",
      score: (aiScore + humanScore) / 2,
      colorClass: "text-yellow-600 dark:text-yellow-400",
    };
  };

  // Loading screen component with all detectors
  const renderLoadingScreen = () => (
    <Card className="flex h-[600px] flex-col items-center justify-center bg-card/95 px-4 py-8 backdrop-blur-sm dark:bg-editor-bg/95">
      <CardContent className="w-full max-w-4xl">
        {/* Purple heading */}
        <h2 className="mb-2 text-center font-bold text-2xl text-purple-600 dark:text-purple-400">
          Analyzing your text through all major AI detectors
        </h2>

        {/* Description */}
        <p className="mx-auto mb-8 max-w-2xl text-center text-muted-foreground text-sm">
          This may take a few seconds as we cross-verify results across multiple
          platforms for maximum accuracy.
        </p>

        {/* Detector grid - 8 detectors in grid */}
        <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-4">
          {ALL_DETECTORS.map((detector, index) => (
            <div
              className="relative flex flex-col items-center justify-center rounded-lg bg-card/50 p-4 shadow-sm backdrop-blur-md transition-all hover:shadow-md dark:bg-editor-bg/50"
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
                  src={detector.logo}
                  width={48}
                />
              </div>

              {/* Detector name */}
              <span className="mb-1 text-center font-medium text-card-foreground text-xs">
                {detector.name}
              </span>

              {/* Loading spinner */}
              <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // Render detection results (extracted to reduce complexity)
  const renderResults = () => {
    if (!result) {
      return null;
    }

    return (
      <>
        {/* Overall Score */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {getScoreIcon(result.human_likelihood_pct)}
                Detection Results
              </CardTitle>
              <Button onClick={handleCopy} size="sm" variant="outline">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {result.cached && (
              <CardDescription className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <Clock className="h-3 w-3" />
                Cached result
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Human Likelihood</span>
                <span
                  className={`font-bold text-2xl ${getScoreColor(result.human_likelihood_pct)}`}
                >
                  {result.human_likelihood_pct.toFixed(1)}%
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-muted dark:bg-editor-bg">
                <div
                  className="h-2.5 rounded-full bg-green-600 transition-all"
                  style={{ width: `${result.human_likelihood_pct}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">AI Likelihood</span>
                <span
                  className={`font-bold text-2xl ${getScoreColor(100 - result.ai_likelihood_pct)}`}
                >
                  {result.ai_likelihood_pct.toFixed(1)}%
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-muted dark:bg-editor-bg">
                <div
                  className="h-2.5 rounded-full bg-red-600 transition-all"
                  style={{ width: `${result.ai_likelihood_pct}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-2 text-sm">
              <span className="text-muted-foreground">Confidence</span>
              <span className="font-medium">
                {(result.confidence * 100).toFixed(1)}%
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Language</span>
              <span className="font-medium">{result.language}</span>
            </div>
          </CardContent>
        </Card>

        {/* Individual Detector Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Detector Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.detector_results.map((detector) => (
              <div
                className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                key={detector.detector}
              >
                <div className="space-y-1">
                  <div className="font-medium capitalize">
                    {detector.detector}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Confidence: {(detector.confidence * 100).toFixed(0)}%
                    {detector.response_time_ms && (
                      <> • {detector.response_time_ms.toFixed(0)}ms</>
                    )}
                  </div>
                </div>
                {(() => {
                  const assessment = getDetectorAssessment(detector);
                  return (
                    <div className="text-right">
                      <div
                        className={`font-bold text-lg ${assessment.colorClass}`}
                      >
                        {assessment.score.toFixed(0)}%
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {assessment.label}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ))}

            {result.internal_analysis && (
              <div className="mt-4 border-t pt-4">
                <div className="mb-3 font-medium text-sm">
                  Internal Analysis
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {result.internal_analysis.perplexity_score && (
                    <div>
                      <span className="text-muted-foreground">Perplexity:</span>
                      <span className="ml-2 font-medium">
                        {result.internal_analysis.perplexity_score.toFixed(1)}
                      </span>
                    </div>
                  )}
                  {result.internal_analysis.entropy_score && (
                    <div>
                      <span className="text-muted-foreground">Entropy:</span>
                      <span className="ml-2 font-medium">
                        {result.internal_analysis.entropy_score.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {result.internal_analysis.lexical_diversity && (
                    <div>
                      <span className="text-muted-foreground">
                        Lexical Diversity:
                      </span>
                      <span className="ml-2 font-medium">
                        {result.internal_analysis.lexical_diversity.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {result.internal_analysis.burstiness_score && (
                    <div>
                      <span className="text-muted-foreground">Burstiness:</span>
                      <span className="ml-2 font-medium">
                        {result.internal_analysis.burstiness_score.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metadata */}
        {result.metadata && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="h-4 w-4" />
                Analysis Info
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Words:</span>
                <span className="ml-2 font-medium">
                  {String(result.metadata.word_count ?? "N/A")}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Processing:</span>
                <span className="ml-2 font-medium">
                  {Number(result.metadata.processing_time_ms ?? 0).toFixed(0)}ms
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Detectors:</span>
                <span className="ml-2 font-medium">
                  {String(result.metadata.detectors_succeeded ?? 0)}/
                  {String(result.metadata.detectors_used ?? 0)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </>
    );
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Input Section */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              AI Content Detector
            </CardTitle>
            <CardDescription>
              Analyze text to determine if it was written by AI or a human
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="detect-text">Text to Analyze</Label>
                <span className="text-muted-foreground text-sm">
                  {wordCount} words
                </span>
              </div>
              <Textarea
                className="min-h-[300px] resize-y"
                id="detect-text"
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste the text you want to analyze here..."
                value={text}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="detector-select">Detector</Label>
                <Select
                  onValueChange={setSelectedDetectors}
                  value={selectedDetectors}
                >
                  <SelectTrigger id="detector-select">
                    <SelectValue placeholder="Select detector" />
                  </SelectTrigger>
                  <SelectContent>
                    {detectorOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    checked={includeInternal}
                    className="h-4 w-4 rounded border-border"
                    onChange={(e) => setIncludeInternal(e.target.checked)}
                    type="checkbox"
                  />
                  <span className="text-sm">Internal Analysis</span>
                </label>
              </div>
            </div>

            <Button
              className="w-full"
              disabled={isDetecting || wordCount < 10}
              onClick={handleDetect}
            >
              {isDetecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Detect AI Content
                </>
              )}
            </Button>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-red-800 text-sm dark:bg-red-900/20 dark:text-red-300">
                <AlertCircle className="mr-2 inline-block h-4 w-4" />
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        {renderResults()}

        {isDetecting && renderLoadingScreen()}

        {!(result || isDetecting) && (
          <Card className="flex h-[400px] items-center justify-center">
            <CardContent className="text-center text-muted-foreground">
              <Shield className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>Enter text and click &quot;Detect AI Content&quot;</p>
              <p className="mt-2 text-sm">Results will appear here</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
