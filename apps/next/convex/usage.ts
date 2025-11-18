import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get usage for an organization/user for a specific month
export const getByOrganizationMonth = query({
  args: {
    organization_id: v.string(),
    year: v.number(),
    month: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("usage")
      .withIndex("by_organization_month", (q) =>
        q
          .eq("organization_id", args.organization_id)
          .eq("year", args.year)
          .eq("month", args.month)
      )
      .first();
  },
});

export const getByUserMonth = query({
  args: {
    user_id: v.string(),
    year: v.number(),
    month: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("usage")
      .withIndex("by_user_month", (q) =>
        q.eq("user_id", args.user_id).eq("year", args.year).eq("month", args.month)
      )
      .first();
  },
});

// Track usage for a request
export const trackUsage = mutation({
  args: {
    organization_id: v.string(),
    user_id: v.string(),
    words: v.number(),
    year: v.number(),
    month: v.number(),
  },
  handler: async (ctx, args) => {
    // Try to find existing usage record
    let usage = await ctx.db
      .query("usage")
      .withIndex("by_organization_month", (q) =>
        q
          .eq("organization_id", args.organization_id)
          .eq("year", args.year)
          .eq("month", args.month)
      )
      .first();

    if (usage) {
      // Update existing usage
      await ctx.db.patch(usage._id, {
        words_used: usage.words_used + args.words,
        requests_count: usage.requests_count + 1,
      });
      return {
        words_used: usage.words_used + args.words,
        requests_count: usage.requests_count + 1,
      };
    } else {
      // Create new usage record
      const newUsageId = await ctx.db.insert("usage", {
        organization_id: args.organization_id,
        user_id: args.user_id,
        year: args.year,
        month: args.month,
        words_used: args.words,
        requests_count: 1,
      });
      return {
        words_used: args.words,
        requests_count: 1,
      };
    }
  },
});

