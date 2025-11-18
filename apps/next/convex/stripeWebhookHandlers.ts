/**
 * Stripe webhook event handlers
 */

import type Stripe from "stripe";
import { internal } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";

type StripeWebhookData = Stripe.Event["data"];

async function handleCheckoutSessionCompleted(
  ctx: ActionCtx,
  data: StripeWebhookData
) {
  const session = data.object as Stripe.Checkout.Session;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string | null;
  let metadata: Record<string, string> | undefined;
  if (session.metadata && Object.keys(session.metadata).length > 0) {
    metadata = session.metadata;
  } else if (session.client_reference_id) {
    try {
      metadata = JSON.parse(session.client_reference_id);
    } catch (error) {
      console.error(
        "Failed to parse client_reference_id metadata:",
        error
      );
    }
  }

  // Check if this is a word purchase (one-time payment)
  if (metadata && metadata.type === "word_purchase") {
    const organizationId = metadata.organizationId;
    const wordAmount = parseInt(metadata.wordAmount || "0", 10);

    if (!organizationId || !wordAmount) {
      console.warn("Word purchase missing organizationId or wordAmount");
      return;
    }

    // Add words to organization balance
    try {
      await ctx.runMutation(internal.organizations.addWordBalance, {
        organization_id: organizationId,
        word_amount: wordAmount,
      });
      console.log(
        `Added ${wordAmount} words to organization ${organizationId}`
      );
    } catch (error) {
      console.error(
        `Error adding word balance for organization ${organizationId}:`,
        error
      );
      throw error;
    }
    return;
  }

  // Handle subscription checkout
  if (!customerId || !subscriptionId) {
    throw new Error("Missing customer or subscription ID in checkout session");
  }

  // Get organization by Stripe customer ID
  const org = await ctx.runQuery(internal.subscriptions.getByStripeCustomerId, {
    stripe_customer_id: customerId,
  });

  if (!org) {
    console.warn(`Organization not found for Stripe customer: ${customerId}`);
    return;
  }

  // Get subscription details from Stripe to determine plan
  // The subscription metadata or price lookup key should indicate the plan
  // For now, we'll need to get this from the subscription object
  // This should be done by querying Stripe API, but for webhook handlers
  // we can get it from the subscription metadata
}

async function handleCustomerSubscriptionCreated(
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

  // Determine plan from price lookup key or metadata
  const priceId = subscription.items.data[0]?.price.id;
  let plan: "basic" | "pro" | "ultra" = "basic";
  let billingPeriod: "monthly" | "annual" = "monthly";

  // Try to get plan from price lookup key
  const priceLookupKey = subscription.items.data[0]?.price.lookup_key;
  if (priceLookupKey) {
    const lookupLower = priceLookupKey.toLowerCase();
    if (lookupLower.includes("basic")) plan = "basic";
    else if (lookupLower.includes("pro")) plan = "pro";
    else if (lookupLower.includes("ultra")) plan = "ultra";

    if (lookupLower.includes("annual") || lookupLower.includes("yearly")) {
      billingPeriod = "annual";
    }
  }

  // Update subscription in Convex
  await ctx.runMutation(internal.subscriptions.updateSubscription, {
    organization_id: org.workos_id,
    subscription_plan: plan,
    subscription_status: "active",
    billing_period: billingPeriod,
    stripe_subscription_id: subscription.id,
    current_period_end: subscription.current_period_end
      ? subscription.current_period_end
      : undefined,
  });
}

async function handleCustomerSubscriptionUpdated(
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

  // Determine plan and status
  const priceLookupKey = subscription.items.data[0]?.price.lookup_key;
  let plan: "basic" | "pro" | "ultra" = "basic";
  let billingPeriod: "monthly" | "annual" = "monthly";

  if (priceLookupKey) {
    const lookupLower = priceLookupKey.toLowerCase();
    if (lookupLower.includes("basic")) plan = "basic";
    else if (lookupLower.includes("pro")) plan = "pro";
    else if (lookupLower.includes("ultra")) plan = "ultra";

    if (lookupLower.includes("annual") || lookupLower.includes("yearly")) {
      billingPeriod = "annual";
    }
  }

  const status =
    subscription.status === "active"
      ? "active"
      : subscription.status === "past_due"
        ? "past_due"
        : subscription.status === "canceled"
          ? "cancelled"
          : subscription.status === "unpaid"
            ? "unpaid"
            : subscription.status === "trialing"
              ? "trialing"
              : "active";

  // Update subscription in Convex
  await ctx.runMutation(internal.subscriptions.updateSubscription, {
    organization_id: org.workos_id,
    subscription_plan: plan,
    subscription_status: status,
    billing_period: billingPeriod,
    stripe_subscription_id: subscription.id,
    current_period_end: subscription.current_period_end
      ? subscription.current_period_end
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

