import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { handleStripeWebhook } from "./stripeWebhookHandlers";
import { handleWebhookEvent } from "./webhookHandlers";

const http = httpRouter();

http.route({
  path: "/workos-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const bodyText = await request.text();
    const sigHeader = String(request.headers.get("workos-signature"));

    try {
      await ctx.runAction(internal.workos.verifyWebhook, {
        payload: bodyText,
        signature: sigHeader,
      });

      const { data, event } = JSON.parse(bodyText);

      // Handle the webhook event using extracted handlers
      await handleWebhookEvent(ctx, event, data);

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

export default http;
