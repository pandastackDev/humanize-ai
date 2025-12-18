/**
 * AI Detection API Client
 *
 * Client functions for interacting with the /detect endpoint
 */

import { env } from "@/env";

/**
 * Get the backend API base URL.
 * Ensures no trailing slash to avoid double slashes in URLs.
 */
function getApiBaseUrl(): string {
  const url = env.NEXT_PUBLIC_PYTHON_API_URL;
  // Remove trailing slash if present
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

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
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/detect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      let errorMessage = "Detection failed";
      try {
        const error = await response.json();
        errorMessage = error.detail || error.message || errorMessage;
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || `HTTP ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      // Re-throw with original message
      throw error;
    }
    // Handle network errors or other unexpected errors
    throw new Error(
      "Failed to connect to detection service. Please check your connection and try again."
    );
  }
}

/**
 * Compare detection results before and after humanization
 */
export async function compareDetection(
  request: CompareRequest
): Promise<CompareResponse> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/detect/compare`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      let errorMessage = "Comparison failed";
      try {
        const error = await response.json();
        errorMessage = error.detail || error.message || errorMessage;
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || `HTTP ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      // Re-throw with original message
      throw error;
    }
    // Handle network errors or other unexpected errors
    throw new Error(
      "Failed to connect to detection service. Please check your connection and try again."
    );
  }
}
