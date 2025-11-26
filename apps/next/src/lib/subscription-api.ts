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
function getApiBaseUrl(): string {
  return env.NEXT_PUBLIC_PYTHON_API_URL;
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
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to check subscription status. Please try again.");
  }
}
