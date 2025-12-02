"use client";

import { Button } from "@humanize/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@humanize/ui/components/card";
import { Textarea } from "@humanize/ui/components/textarea";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  CheckCircle,
  Copy,
  Loader2,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { type CompareResponse, compareDetection } from "@/lib/detect-api";

// Top-level regex constant for word counting
const WORD_SPLIT_REGEX = /\s+/;

export function EvaluationDashboard() {
  const [originalText, setOriginalText] = useState("");
  const [humanizedText, setHumanizedText] = useState("");
  const [isComparing, setIsComparing] = useState(false);
  const [result, setResult] = useState<CompareResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const originalWordCount = originalText.trim()
    ? originalText.trim().split(WORD_SPLIT_REGEX).length
    : 0;
  const humanizedWordCount = humanizedText.trim()
    ? humanizedText.trim().split(WORD_SPLIT_REGEX).length
    : 0;

  const handleCompare = async () => {
    if (!(originalText.trim() && humanizedText.trim())) {
      setError("Please provide both original and humanized text");
      return;
    }

    if (originalWordCount < 10 || humanizedWordCount < 10) {
      setError("Both texts must contain at least 10 words");
      return;
    }

    setIsComparing(true);
    setError(null);

    try {
      const response = await compareDetection({
        original_text: originalText.trim(),
        humanized_text: humanizedText.trim(),
      });

      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Comparison failed");
    } finally {
      setIsComparing(false);
    }
  };

  const getImprovementColor = (delta: number) => {
    if (delta > 10) {
      return "text-success dark:text-success";
    }
    if (delta > 0) {
      return "text-warning dark:text-warning";
    }
    return "text-destructive dark:text-destructive";
  };

  const getImprovementIcon = (delta: number) => {
    if (delta > 10) {
      return <TrendingUp className="h-5 w-5 text-success" />;
    }
    if (delta > 0) {
      return <ArrowUp className="h-5 w-5 text-warning" />;
    }
    return <ArrowDown className="h-5 w-5 text-destructive" />;
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Original Text</CardTitle>
            <CardDescription>
              Text before humanization ({originalWordCount} words)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              className="min-h-editor-sm resize-y"
              onChange={(e) => setOriginalText(e.target.value)}
              placeholder="Paste the original text here..."
              value={originalText}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Humanized Text</CardTitle>
            <CardDescription>
              Text after humanization ({humanizedWordCount} words)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              className="min-h-editor-sm resize-y"
              onChange={(e) => setHumanizedText(e.target.value)}
              placeholder="Paste the humanized text here..."
              value={humanizedText}
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center">
        <Button
          disabled={
            isComparing || originalWordCount < 10 || humanizedWordCount < 10
          }
          onClick={handleCompare}
          size="lg"
        >
          {isComparing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Comparing...
            </>
          ) : (
            <>
              <BarChart3 className="mr-2 h-4 w-4" />
              Compare Detection Results
            </>
          )}
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/30 bg-destructive/10 dark:border-destructive/50 dark:bg-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive dark:text-destructive">
              <XCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {result && (
        <div className="space-y-4">
          {/* Summary Card */}
          <Card className="border-2 border-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {getImprovementIcon(
                    result.improvement.human_likelihood_delta
                  )}
                  Improvement Summary
                </CardTitle>
                <Button
                  onClick={() => {
                    const summary = `Humanization Evaluation Results
==================
${result.summary}

Original: ${result.original.human_likelihood_pct.toFixed(1)}% human
Humanized: ${result.humanized.human_likelihood_pct.toFixed(1)}% human
Improvement: ${result.improvement.human_likelihood_delta.toFixed(1)}% (${result.improvement.improvement_percentage.toFixed(1)}% relative)`;
                    navigator.clipboard.writeText(summary);
                  }}
                  size="sm"
                  variant="outline"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>{result.summary}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="font-medium text-muted-foreground text-sm">
                    Human Likelihood Gain
                  </div>
                  <div
                    className={`font-bold text-3xl ${getImprovementColor(result.improvement.human_likelihood_delta)}`}
                  >
                    {result.improvement.human_likelihood_delta > 0 ? "+" : ""}
                    {result.improvement.human_likelihood_delta.toFixed(1)}%
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="font-medium text-muted-foreground text-sm">
                    Relative Improvement
                  </div>
                  <div
                    className={`font-bold text-3xl ${getImprovementColor(result.improvement.improvement_percentage)}`}
                  >
                    {result.improvement.improvement_percentage > 0 ? "+" : ""}
                    {result.improvement.improvement_percentage.toFixed(1)}%
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="font-medium text-muted-foreground text-sm">
                    AI Likelihood Reduction
                  </div>
                  <div
                    className={`font-bold text-3xl ${getImprovementColor(-result.improvement.ai_likelihood_delta)}`}
                  >
                    {result.improvement.ai_likelihood_delta.toFixed(1)}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comparison Chart */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Original Text Detection</CardTitle>
                <CardDescription>Before humanization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-sm">
                      Human Likelihood
                    </span>
                    <span className="font-bold text-info text-lg dark:text-info">
                      {result.original.human_likelihood_pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-bar-md w-full rounded-full bg-muted dark:bg-muted-bg-medium">
                    <div
                      className="h-bar-md rounded-full bg-info transition-all"
                      style={{
                        width: `${result.original.human_likelihood_pct}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-sm">AI Likelihood</span>
                    <span className="font-bold text-destructive text-lg dark:text-destructive">
                      {result.original.ai_likelihood_pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-bar-md w-full rounded-full bg-muted dark:bg-muted-bg-medium">
                    <div
                      className="h-bar-md rounded-full bg-destructive transition-all"
                      style={{ width: `${result.original.ai_likelihood_pct}%` }}
                    />
                  </div>
                </div>

                <div className="border-t pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Confidence</span>
                    <span className="font-medium">
                      {(result.original.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Humanized Text Detection
                  {result.improvement.human_likelihood_delta > 5 && (
                    <CheckCircle className="h-5 w-5 text-success" />
                  )}
                </CardTitle>
                <CardDescription>After humanization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-sm">
                      Human Likelihood
                    </span>
                    <span className="font-bold text-lg text-success dark:text-success">
                      {result.humanized.human_likelihood_pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-bar-md w-full rounded-full bg-muted dark:bg-muted-bg-medium">
                    <div
                      className="h-bar-md rounded-full bg-success transition-all"
                      style={{
                        width: `${result.humanized.human_likelihood_pct}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-sm">AI Likelihood</span>
                    <span className="font-bold text-destructive text-lg dark:text-destructive">
                      {result.humanized.ai_likelihood_pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-bar-md w-full rounded-full bg-muted dark:bg-muted-bg-medium">
                    <div
                      className="h-bar-md rounded-full bg-destructive transition-all"
                      style={{
                        width: `${result.humanized.ai_likelihood_pct}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="border-t pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Confidence</span>
                    <span className="font-medium">
                      {(result.humanized.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Visual Improvement Indicator */}
          <Card>
            <CardHeader>
              <CardTitle>Improvement Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative h-8 overflow-hidden rounded-full bg-muted dark:bg-muted-bg-medium">
                {/* Original position */}
                <div
                  className="absolute h-full border-info border-r-2 bg-info/30"
                  style={{ width: `${result.original.human_likelihood_pct}%` }}
                >
                  <span className="absolute top-1 right-2 font-medium text-info text-xs dark:text-info">
                    Original
                  </span>
                </div>
                {/* Humanized position */}
                <div
                  className="absolute h-full border-success border-r-2 bg-success/30"
                  style={{ width: `${result.humanized.human_likelihood_pct}%` }}
                >
                  <span className="absolute top-1 right-2 font-medium text-success text-xs dark:text-success">
                    Humanized
                  </span>
                </div>
              </div>
              <div className="mt-2 flex justify-between text-muted-foreground text-xs">
                <span>0% Human</span>
                <span>100% Human</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
