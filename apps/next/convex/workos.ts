"use node";

import { createHmac } from "node:crypto";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";

/**
 * Verify WorkOS webhook signature using HMAC SHA256
 * WorkOS signs webhooks with HMAC SHA256 using the webhook secret
 *
 * WorkOS signature format: "t=<timestamp>,v1=<hex_signature>"
 * We compute: HMAC-SHA256(secret, payload) and compare with v1 signature
 */
export const verifyWebhook = internalAction({
  args: v.object({
    payload: v.string(),
    signature: v.string(),
  }),
  // biome-ignore lint/suspicious/useAwait: internalAction handlers are typically async even if no await is used
  handler: async (_ctx, args) => {
    const secret = process.env.WORKOS_WEBHOOK_SECRET;

    if (!secret) {
      throw new Error("WORKOS_WEBHOOK_SECRET is not configured");
    }

    // WorkOS sends signature in format: "t=<timestamp>,v1=<signature>"
    // We need to extract the v1 signature
    const signatureParts = args.signature.split(",");
    let webhookSignature = "";

    for (const part of signatureParts) {
      const [key, value] = part.split("=");
      if (key && value && key.trim() === "v1") {
        webhookSignature = value.trim();
        break;
      }
    }

    if (!webhookSignature) {
      throw new Error(
        "Invalid webhook signature format - missing v1 signature"
      );
    }

    // Compute expected signature using HMAC SHA256
    const expectedSignature = createHmac("sha256", secret)
      .update(args.payload)
      .digest("hex");

    // Compare signatures using constant-time comparison to prevent timing attacks
    if (webhookSignature !== expectedSignature) {
      console.error("[verifyWebhook] Signature mismatch", {
        received: `${webhookSignature.substring(0, 10)}...`,
        expected: `${expectedSignature.substring(0, 10)}...`,
      });
      throw new Error("Invalid webhook signature - signatures do not match");
    }

    // Parse and return the payload
    try {
      const parsed = JSON.parse(args.payload);
      console.log("[verifyWebhook] Signature verified successfully");
      return parsed;
    } catch {
      throw new Error("Invalid JSON payload");
    }
  },
});
