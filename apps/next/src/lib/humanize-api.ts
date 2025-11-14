/**
 * Humanize API client for calling the backend /humanize endpoint.
 */

<<<<<<< HEAD
import { env } from "@/env";

=======
>>>>>>> 106b21e (fix tslint & deployment)
export type HumanizeRequest = {
  input_text: string;
  tone?: string;
  length_mode?: "shorten" | "expand" | "standard";
  style_sample?: string;
  readability_level?: string;
  language?: string;
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
 * Humanize text using the backend API.
 *
 * @param request - Humanize request parameters
 * @returns Promise resolving to humanized text response
 * @throws Error if the API call fails
 */
export async function humanizeText(
  request: HumanizeRequest
): Promise<HumanizeResponse> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/v1/humanize`;

  try {
    console.log("Fetching humanize text from:", url);
    console.log("Request:", request);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        detail: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(
        errorData.detail || `API request failed: ${response.statusText}`
      );
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
