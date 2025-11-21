import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    workos_id: v.string(),
    name: v.optional(v.string()),
    first_name: v.optional(v.string()),
    last_name: v.optional(v.string()),
    profile_picture_url: v.optional(v.string()),
    created_at: v.optional(v.number()), // Unix timestamp
    updated_at: v.optional(v.number()), // Unix timestamp
  })
    .index("by_workos_id", ["workos_id"])
    .index("by_email", ["email"]),
  organizations: defineTable({
    workos_id: v.string(),
    name: v.string(),
    stripe_customer_id: v.optional(v.string()),
    stripe_subscription_id: v.optional(v.string()),
    subscription_plan: v.optional(
      v.union(
        v.literal("free"),
        v.literal("basic"),
        v.literal("pro"),
        v.literal("ultra")
      )
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
    billing_period: v.optional(
      v.union(v.literal("monthly"), v.literal("annual"))
    ),
    current_period_end: v.optional(v.number()),
    word_balance: v.optional(v.number()), // One-time purchased words balance
  })
    .index("by_stripe_customer_id", ["stripe_customer_id"])
    .index("workos_id", ["workos_id"]),
  organizationMemberships: defineTable({
    workos_id: v.string(),
    user_id: v.string(), // WorkOS user ID
    organization_id: v.string(), // WorkOS organization ID
    role: v.string(),
    status: v.string(), // "active", "inactive", "pending"
  })
    .index("by_user", ["user_id"])
    .index("by_organization", ["organization_id"])
    .index("by_workos_id", ["workos_id"]),
  usage: defineTable({
    organization_id: v.string(),
    user_id: v.string(),
    year: v.number(),
    month: v.number(), // 1-12
    words_used: v.number(),
    requests_count: v.number(),
  })
    .index("by_organization_month", ["organization_id", "year", "month"])
    .index("by_user_month", ["user_id", "year", "month"]),
  history: defineTable({
    user_id: v.string(), // WorkOS user ID
    organization_id: v.optional(v.string()), // WorkOS organization ID (optional)
    original_text: v.string(),
    humanized_text: v.string(),
    word_count: v.number(),
    // Additional metadata
    language: v.optional(v.string()),
    readability_level: v.optional(v.string()),
    purpose: v.optional(v.string()),
    length_mode: v.optional(v.string()),
  })
    .index("by_user", ["user_id"])
    .index("by_organization", ["organization_id"]),
});
