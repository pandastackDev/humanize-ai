/**
 * Subscription API client for checking subscription status and usage.
 */

import { env } from "@/env";

export type SubscriptionPlan = "free" | "basic" | "pro" | "ultra";
export type SubscriptionStatus =
  | "active"
  | "cancelled"
  | "past_due"
  | "unpaid"
  | "trialing";

export type SubscriptionInfo = {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  word_limit: number;
  words_used: number;
  words_remaining: number;
  request_limit: number;
  requests_used: number;
  billing_period: "monthly" | "annual";
  current_period_end?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
};

/**
 * Get the backend API base URL.
 */
function getApiBaseUrl(): string | null {
  try {
    return env.NEXT_PUBLIC_PYTHON_API_URL;
  } catch {
    // Environment variable not configured
    return null;
  }
}

/**
 * Check subscription status and usage.
 *
 * @param userId - WorkOS user ID
 * @param organizationId - WorkOS organization ID (optional)
 * @returns Promise resolving to subscription information
 * @throws Error if the API call fails
 */
export async function checkSubscription(
  userId: string,
  organizationId?: string
): Promise<SubscriptionInfo> {
  const baseUrl = getApiBaseUrl();

  // If API URL is not configured, return default free plan
  if (!baseUrl) {
    console.warn(
      "NEXT_PUBLIC_PYTHON_API_URL is not configured. Using default free plan."
    );
    return {
      plan: "free",
      status: "active",
      word_limit: 3000,
      words_used: 0,
      words_remaining: 3000,
      request_limit: 10,
      requests_used: 0,
      billing_period: "monthly",
    };
  }

  const url = `${baseUrl}/api/v1/subscriptions/check`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        organization_id: organizationId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        detail: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(
        errorData.detail || `API request failed: ${response.statusText}`
      );
    }

    const data: SubscriptionInfo = await response.json();
    return data;
  } catch (error) {
    // If it's a network error (API not available), return default free plan
    if (error instanceof TypeError && error.message.includes("fetch")) {
      console.warn(
        "Backend API is not available. Using default free plan.",
        error.message
      );
      return {
        plan: "free",
        status: "active",
        word_limit: 3000,
        words_used: 0,
        words_remaining: 3000,
        request_limit: 10,
        requests_used: 0,
        billing_period: "monthly",
      };
    }

    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to check subscription status. Please try again.");
  }
}
