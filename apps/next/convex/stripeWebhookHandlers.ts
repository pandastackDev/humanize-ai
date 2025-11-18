/**
 * Stripe webhook event handlers
 */

import type Stripe from "stripe";
import { internal } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";

type StripeWebhookData = Stripe.Event["data"];

function extractSessionMetadata(
  session: Stripe.Checkout.Session
): Record<string, string> | undefined {
  if (session.metadata && Object.keys(session.metadata).length > 0) {
    return session.metadata;
  }
  if (session.client_reference_id) {
    try {
      return JSON.parse(session.client_reference_id);
    } catch (error) {
      console.error("Failed to parse client_reference_id metadata:", error);
    }
  }
  return;
}

async function handleWordPurchase(
  ctx: ActionCtx,
  metadata: Record<string, string>
): Promise<boolean> {
  if (metadata.type !== "word_purchase") {
    return false;
  }

  const organizationId = metadata.organizationId;
  const wordAmount = Number.parseInt(metadata.wordAmount || "0", 10);

  if (!(organizationId && wordAmount)) {
    console.warn("Word purchase missing organizationId or wordAmount");
    return true;
  }

  try {
    await ctx.runMutation(internal.organizations.addWordBalance, {
      organization_id: organizationId,
      word_amount: wordAmount,
    });
    console.log(`Added ${wordAmount} words to organization ${organizationId}`);
  } catch (error) {
    console.error(
      `Error adding word balance for organization ${organizationId}:`,
      error
    );
    throw error;
  }
  return true;
}

async function handleCheckoutSessionCompleted(
  ctx: ActionCtx,
  data: StripeWebhookData
) {
  const session = data.object as Stripe.Checkout.Session;
  const metadata = extractSessionMetadata(session);

  if (metadata && (await handleWordPurchase(ctx, metadata))) {
    return;
  }

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string | null;

  if (!(customerId && subscriptionId)) {
    throw new Error("Missing customer or subscription ID in checkout session");
  }

  const org = await ctx.runQuery(internal.subscriptions.getByStripeCustomerId, {
    stripe_customer_id: customerId,
  });

  if (!org) {
    console.warn(`Organization not found for Stripe customer: ${customerId}`);
    return;
  }

  // Subscription details will be handled by customer.subscription.created event
  console.log(
    `Checkout completed for organization ${org.workos_id} with subscription ${subscriptionId}`
  );
}

function parsePlanFromLookupKey(
  lookupKey: string | null | undefined
): "basic" | "pro" | "ultra" {
  if (!lookupKey) {
    return "basic";
  }
  const lookupLower = lookupKey.toLowerCase();
  if (lookupLower.includes("ultra")) {
    return "ultra";
  }
  if (lookupLower.includes("pro")) {
    return "pro";
  }
  return "basic";
}

function parseBillingPeriodFromLookupKey(
  lookupKey: string | null | undefined
): "monthly" | "annual" {
  if (!lookupKey) {
    return "monthly";
  }
  const lookupLower = lookupKey.toLowerCase();
  if (lookupLower.includes("annual") || lookupLower.includes("yearly")) {
    return "annual";
  }
  return "monthly";
}

function mapStripeStatusToConvex(
  stripeStatus: string
): "active" | "past_due" | "cancelled" | "unpaid" | "trialing" {
  if (stripeStatus === "active") {
    return "active";
  }
  if (stripeStatus === "past_due") {
    return "past_due";
  }
  if (stripeStatus === "canceled") {
    return "cancelled";
  }
  if (stripeStatus === "unpaid") {
    return "unpaid";
  }
  if (stripeStatus === "trialing") {
    return "trialing";
  }
  return "active";
}

async function handleCustomerSubscriptionCreated(
  ctx: ActionCtx,
  data: StripeWebhookData
) {
  const subscription = data.object as Stripe.Subscription;
  const customerId = subscription.customer as string;

  const org = await ctx.runQuery(internal.subscriptions.getByStripeCustomerId, {
    stripe_customer_id: customerId,
  });

  if (!org) {
    console.warn(`Organization not found for Stripe customer: ${customerId}`);
    return;
  }

  const priceLookupKey = subscription.items.data[0]?.price.lookup_key;
  const plan = parsePlanFromLookupKey(priceLookupKey);
  const billingPeriod = parseBillingPeriodFromLookupKey(priceLookupKey);

  await ctx.runMutation(internal.subscriptions.updateSubscription, {
    organization_id: org.workos_id,
    subscription_plan: plan,
    subscription_status: "active",
    billing_period: billingPeriod,
    stripe_subscription_id: subscription.id,
    current_period_end:
      "current_period_end" in subscription && subscription.current_period_end
        ? (subscription.current_period_end as number)
        : undefined,
  });
}

async function handleCustomerSubscriptionUpdated(
  ctx: ActionCtx,
  data: StripeWebhookData
) {
  const subscription = data.object as Stripe.Subscription;
  const customerId = subscription.customer as string;

  const org = await ctx.runQuery(internal.subscriptions.getByStripeCustomerId, {
    stripe_customer_id: customerId,
  });

  if (!org) {
    console.warn(`Organization not found for Stripe customer: ${customerId}`);
    return;
  }

  const priceLookupKey = subscription.items.data[0]?.price.lookup_key;
  const plan = parsePlanFromLookupKey(priceLookupKey);
  const billingPeriod = parseBillingPeriodFromLookupKey(priceLookupKey);
  const status = mapStripeStatusToConvex(subscription.status);

  await ctx.runMutation(internal.subscriptions.updateSubscription, {
    organization_id: org.workos_id,
    subscription_plan: plan,
    subscription_status: status,
    billing_period: billingPeriod,
    stripe_subscription_id: subscription.id,
    current_period_end:
      "current_period_end" in subscription && subscription.current_period_end
        ? (subscription.current_period_end as number)
        : undefined,
  });
}

async function handleCustomerSubscriptionDeleted(
  ctx: ActionCtx,
  data: StripeWebhookData
) {
  const subscription = data.object as Stripe.Subscription;
  const customerId = subscription.customer as string;

  // Get organization by Stripe customer ID
  const org = await ctx.runQuery(internal.subscriptions.getByStripeCustomerId, {
    stripe_customer_id: customerId,
  });

  if (!org) {
    console.warn(`Organization not found for Stripe customer: ${customerId}`);
    return;
  }

  // Set subscription to cancelled
  await ctx.runMutation(internal.subscriptions.updateSubscription, {
    organization_id: org.workos_id,
    subscription_status: "cancelled",
  });
}

/**
 * Main Stripe webhook event dispatcher
 */
export async function handleStripeWebhook(
  ctx: ActionCtx,
  eventType: string,
  data: StripeWebhookData
) {
  const handlers: Record<
    string,
    (handlerCtx: ActionCtx, handlerData: StripeWebhookData) => Promise<void>
  > = {
    "checkout.session.completed": handleCheckoutSessionCompleted,
    "customer.subscription.created": handleCustomerSubscriptionCreated,
    "customer.subscription.updated": handleCustomerSubscriptionUpdated,
    "customer.subscription.deleted": handleCustomerSubscriptionDeleted,
  };

  const handler = handlers[eventType];
  if (!handler) {
    throw new Error(`Unhandled Stripe event type: ${eventType}`);
  }

  await handler(ctx, data);
}
