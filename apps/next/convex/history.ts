import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Create a new history entry
 */
export const create = mutation({
  args: {
    user_id: v.string(),
    organization_id: v.optional(v.string()),
    original_text: v.string(),
    humanized_text: v.string(),
    word_count: v.number(),
    language: v.optional(v.string()),
    readability_level: v.optional(v.string()),
    purpose: v.optional(v.string()),
    length_mode: v.optional(v.string()),
  },
  handler: async (ctx, args) =>
    await ctx.db.insert("history", {
      user_id: args.user_id,
      organization_id: args.organization_id,
      original_text: args.original_text,
      humanized_text: args.humanized_text,
      word_count: args.word_count,
      language: args.language,
      readability_level: args.readability_level,
      purpose: args.purpose,
      length_mode: args.length_mode,
    }),
});

/**
 * Get all history entries for a user
 */
export const getByUserId = query({
  args: {
    user_id: v.string(),
  },
  handler: async (ctx, args) =>
    await ctx.db
      .query("history")
      .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
      .order("desc")
      .collect(),
});

/**
 * Get all history entries for an organization
 */
export const getByOrganizationId = query({
  args: {
    organization_id: v.string(),
  },
  handler: async (ctx, args) =>
    await ctx.db
      .query("history")
      .withIndex("by_organization", (q) =>
        q.eq("organization_id", args.organization_id)
      )
      .order("desc")
      .collect(),
});

/**
 * Get a single history entry by ID
 */
export const getById = query({
  args: {
    id: v.id("history"),
  },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

/**
 * Delete a history entry
 */
export const destroy = mutation({
  args: {
    id: v.id("history"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

/**
 * Delete all history entries for a user
 */
export const destroyByUserId = mutation({
  args: {
    user_id: v.string(),
  },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("history")
      .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
      .collect();

    await Promise.all(entries.map((entry) => ctx.db.delete(entry._id)));
    return entries.length;
  },
});
