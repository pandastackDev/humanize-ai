import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { bulkSyncUsers } from "./bulkSyncHttp";
import { handleStripeWebhook } from "./stripeWebhookHandlers";
import { diagnostics, syncUser } from "./webhookDiagnostics";
import { handleWebhookEvent, type WebhookData } from "./webhookHandlers";

const http = httpRouter();

http.route({
  path: "/workos-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const bodyText = await request.text();
    const sigHeader = String(request.headers.get("workos-signature"));

    console.log("[WorkOS Webhook] Received request");
    console.log(
      "[WorkOS Webhook] Signature header:",
      sigHeader ? "present" : "missing"
    );

    try {
      // Verify webhook signature (returns parsed JSON payload)
      const parsedBody = await ctx.runAction(internal.workos.verifyWebhook, {
        payload: bodyText,
        signature: sigHeader,
      });

      // WorkOS webhook payload structure: { event: "user.created", data: {...} }
      const { data, event: eventType } = parsedBody as {
        event: string;
        data: Record<string, unknown> & { id: string };
      };

      console.log("[WorkOS Webhook] Event type:", eventType);
      console.log(
        "[WorkOS Webhook] Event data:",
        JSON.stringify(data, null, 2)
      );

      // Handle the webhook event using extracted handlers
      // Type assertion: data from WorkOS webhook always has an id field
      await handleWebhookEvent(ctx, eventType, data as WebhookData);

      console.log("[WorkOS Webhook] Successfully processed event:", eventType);

      return new Response(
        JSON.stringify({ status: "success", event: eventType }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      const errorStack = e instanceof Error ? e.stack : undefined;

      console.error("[WorkOS Webhook] Error processing webhook:", errorMessage);
      if (errorStack) {
        console.error("[WorkOS Webhook] Stack trace:", errorStack);
      }

      if (e instanceof Error && e.message.includes("Unhandled event type")) {
        return new Response(
          JSON.stringify({
            status: "error",
            message: e.message,
            event: "unhandled",
          }),
          {
            status: 422,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          status: "error",
          message: errorMessage,
          details:
            process.env.NODE_ENV === "development" ? errorStack : undefined,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

http.route({
  path: "/stripe-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const bodyText = await request.text();
    const sigHeader = String(request.headers.get("stripe-signature"));

    try {
      const event = await ctx.runAction(internal.stripe.verifyStripeWebhook, {
        payload: bodyText,
        signature: sigHeader,
      });

      // Handle the Stripe webhook event
      await handleStripeWebhook(ctx, event.type, event.data);

      return new Response(JSON.stringify({ status: "success" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      if (e instanceof Error && e.message.includes("Unhandled event type")) {
        return new Response(
          JSON.stringify({
            status: "error",
            message: e.message,
          }),
          {
            status: 422,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          status: "error",
          message: "Internal server error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

// Webhook diagnostics endpoint
http.route({
  path: "/webhook-diagnostics",
  method: "GET",
  handler: diagnostics,
});

// Manual user sync endpoint
http.route({
  path: "/sync-user",
  method: "POST",
  handler: syncUser,
});

// Bulk sync all users endpoint
http.route({
  path: "/bulk-sync-users",
  method: "POST",
  handler: bulkSyncUsers,
});

export default http;
