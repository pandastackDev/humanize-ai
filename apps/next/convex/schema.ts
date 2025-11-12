import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    workos_id: v.string(),
  }),
  organizations: defineTable({
    workos_id: v.string(),
    name: v.string(),
  }),
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
});
