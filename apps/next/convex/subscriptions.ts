import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get subscription info for an organization
export const getByWorkosId = query({
  args: { workos_id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("organizations")
      .withIndex("workos_id", (q) => q.eq("workos_id", args.workos_id))
      .first();
  },
});

// Get subscription info by Stripe customer ID
export const getByStripeCustomerId = query({
  args: { stripe_customer_id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("organizations")
      .withIndex("by_stripe_customer_id", (q) =>
        q.eq("stripe_customer_id", args.stripe_customer_id)
      )
      .first();
  },
});

// Update organization subscription
export const updateSubscription = mutation({
  args: {
    organization_id: v.string(),
    subscription_plan: v.optional(
      v.union(v.literal("free"), v.literal("basic"), v.literal("pro"), v.literal("ultra"))
    ),
    subscription_status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("cancelled"),
        v.literal("past_due"),
        v.literal("unpaid"),
        v.literal("trialing")
      )
    ),
    billing_period: v.optional(v.union(v.literal("monthly"), v.literal("annual"))),
    stripe_customer_id: v.optional(v.string()),
    stripe_subscription_id: v.optional(v.string()),
    current_period_end: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const org = await ctx.db
      .query("organizations")
      .withIndex("workos_id", (q) => q.eq("workos_id", args.organization_id))
      .first();

    if (!org) {
      throw new Error(`Organization not found: ${args.organization_id}`);
    }

    const updateData: any = {};
    if (args.subscription_plan !== undefined) updateData.subscription_plan = args.subscription_plan;
    if (args.subscription_status !== undefined)
      updateData.subscription_status = args.subscription_status;
    if (args.billing_period !== undefined) updateData.billing_period = args.billing_period;
    if (args.stripe_customer_id !== undefined)
      updateData.stripe_customer_id = args.stripe_customer_id;
    if (args.stripe_subscription_id !== undefined)
      updateData.stripe_subscription_id = args.stripe_subscription_id;
    if (args.current_period_end !== undefined)
      updateData.current_period_end = args.current_period_end;

    await ctx.db.patch(org._id, updateData);
    return { success: true };
  },
});

