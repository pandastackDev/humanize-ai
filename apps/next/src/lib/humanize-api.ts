/**
 * Humanize API client for calling the backend /humanize endpoint.
 */

import { env } from "@/env";

export type HumanizeRequest = {
  input_text: string;
  tone?: string;
  length_mode?: "shorten" | "expand" | "standard";
  style_sample?: string;
  readability_level?: string;
  language?: string;
  advanced_mode?: boolean;
};

export type HumanizeMetrics = {
  semantic_similarity?: number;
  style_similarity?: number;
  word_count?: number;
  character_count?: number;
  processing_time_ms?: number;
  sentence_length_variance?: number;
  avg_sentence_length?: number;
  lexical_diversity?: number;
};

export type HumanizeMetadata = {
  detected_language?: string;
  language_confidence?: number;
  chunk_count?: number;
  model_used?: string;
};

export type HumanizeResponse = {
  humanized_text: string;
  language?: string;
  metrics?: HumanizeMetrics;
  metadata?: HumanizeMetadata;
};

/**
 * Get the backend API base URL.
 */
function getApiBaseUrl(): string {
  return env.NEXT_PUBLIC_PYTHON_API_URL;
}

/**
 * Extract and format error message from API response.
 */
function extractErrorMessage(response: Response, errorData: unknown): string {
  let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

  // Try to extract error message from response
  if (errorData && typeof errorData === "object") {
    const data = errorData as Record<string, unknown>;
    if (data.detail && typeof data.detail === "string") {
      errorMessage = data.detail;
    } else if (data.message && typeof data.message === "string") {
      errorMessage = data.message;
    }
  } else if (typeof errorData === "string") {
    errorMessage = errorData;
  }

  // Provide user-friendly error messages for common issues
  if (errorMessage.includes("cannot access local variable")) {
    return "A server error occurred. Please try again or contact support if the issue persists.";
  }
  if (errorMessage.includes("rate limit") || errorMessage.includes("429")) {
    return "Too many requests. Please wait a moment and try again.";
  }
  if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
    return "The request took too long. Please try again with a shorter text.";
  }

  return errorMessage;
}

/**
 * Humanize text using the backend API.
 *
 * @param request - Humanize request parameters
 * @param userId - WorkOS user ID (optional, for subscription checks)
 * @param organizationId - WorkOS organization ID (optional)
 * @returns Promise resolving to humanized text response
 * @throws Error if the API call fails
 */
export async function humanizeText(
  request: HumanizeRequest,
  userId?: string,
  organizationId?: string
): Promise<HumanizeResponse> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/v1/humanize`;

  try {
    console.log("Fetching humanize text from:", url);
    console.log("Request:", request);

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (userId) {
      headers["X-User-Id"] = userId;
    }
    if (organizationId) {
      headers["X-Organization-Id"] = organizationId;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        // If JSON parsing fails, use default error
        errorData = {
          detail: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const errorMessage = extractErrorMessage(response, errorData);
      throw new Error(errorMessage);
    }

    const data: HumanizeResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to humanize text. Please try again.");
  }
}
