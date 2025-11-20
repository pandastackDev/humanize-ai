/**
 * AI Detection API Client
 *
 * Client functions for interacting with the /detect endpoint
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type DetectRequest = {
  text: string;
  language?: string;
  detectors?: string[];
  include_internal_analysis?: boolean;
  enable_caching?: boolean;
};

export type DetectorResult = {
  detector: string;
  ai_probability: number;
  human_probability: number;
  confidence: number;
  details?: Record<string, unknown>;
  error?: string;
  response_time_ms?: number;
};

export type InternalAnalysis = {
  perplexity_score?: number;
  entropy_score?: number;
  ngram_variance?: number;
  avg_sentence_length?: number;
  sentence_length_variance?: number;
  lexical_diversity?: number;
  burstiness_score?: number;
  ai_likelihood_internal: number;
};

export type DetectResponse = {
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

export type CompareRequest = {
  original_text: string;
  humanized_text: string;
  detectors?: string[];
};

export type CompareResponse = {
  original: {
    human_likelihood_pct: number;
    ai_likelihood_pct: number;
    confidence: number;
  };
  humanized: {
    human_likelihood_pct: number;
    ai_likelihood_pct: number;
    confidence: number;
  };
  improvement: {
    human_likelihood_delta: number;
    ai_likelihood_delta: number;
    improvement_percentage: number;
  };
  summary: string;
};

/**
 * Detect AI-generated content in text
 */
export async function detectAIContent(
  request: DetectRequest
): Promise<DetectResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/detect/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: "Detection failed",
    }));
    throw new Error(error.detail || "Detection failed");
  }

  return response.json();
}

/**
 * Compare detection results before and after humanization
 */
export async function compareDetection(
  request: CompareRequest
): Promise<CompareResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/detect/compare`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: "Comparison failed",
    }));
    throw new Error(error.detail || "Comparison failed");
  }

  return response.json();
}
