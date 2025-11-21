/**
 * Webhook diagnostics and manual sync endpoints
 */

import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

/**
 * Diagnostic endpoint to check webhook configuration
 * GET /webhook-diagnostics
 */
export const diagnostics = httpAction(async (_ctx) => {
  try {
    const hasWorkOSApiKey = !!process.env.WORKOS_API_KEY;
    const hasWorkOSWebhookSecret = !!process.env.WORKOS_WEBHOOK_SECRET;
    
    // Get deployment URL from environment or use default
    const siteUrl = process.env.CONVEX_SITE_URL || "https://academic-terrier-140.convex.site";
    const webhookUrl = `${siteUrl}/workos-webhook`;

    const response = {
      status: "ok",
      configuration: {
        workosApiKey: hasWorkOSApiKey ? "configured" : "missing",
        workosWebhookSecret: hasWorkOSWebhookSecret ? "configured" : "missing",
      },
      webhookUrl,
      deployment: {
        siteUrl,
        deploymentName: process.env.CONVEX_DEPLOYMENT || "unknown",
      },
      instructions: {
        step1: "Go to WorkOS Dashboard → Webhooks",
        step2: `Add webhook endpoint: ${webhookUrl}`,
        step3:
          "Enable events: user.created, user.updated, user.deleted, organization.created, etc.",
        step4:
          "Copy webhook secret and set in Convex: npx convex env set WORKOS_WEBHOOK_SECRET <secret>",
      },
    };

    console.log("[Webhook Diagnostics] Configuration check:", {
      hasApiKey: hasWorkOSApiKey,
      hasWebhookSecret: hasWorkOSWebhookSecret,
      webhookUrl,
    });

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Webhook Diagnostics] Error:", errorMessage);
    return new Response(
      JSON.stringify({
        status: "error",
        message: errorMessage,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Manual user sync endpoint
 * POST /sync-user
 * Body: { email: string } or { workosUserId: string }
 */
export const syncUser = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const { email, workosUserId } = body;

    if (!(email || workosUserId)) {
      return new Response(
        JSON.stringify({
          error: "Either 'email' or 'workosUserId' is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    type SyncResult = {
      success: boolean;
      action: "created" | "updated";
      userId: string;
    };

    let result: SyncResult;
    if (workosUserId) {
      result = await ctx.runAction(internal.userSync.syncUserByWorkOSId, {
        workosUserId,
      });
    } else {
      result = await ctx.runAction(internal.userSync.syncUserByEmail, {
        email: email as string,
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
