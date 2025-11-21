import { v } from "convex/values";
import { crud } from "convex-helpers/server/crud";
import { internalQuery, query } from "./_generated/server";
import schema from "./schema";

const userFields = schema.tables.users.validator.fields;

export const { create, destroy, update } = crud(schema, "users");

// Internal query for use within Convex functions
export const getByWorkOSId = internalQuery({
  args: { workos_id: userFields.workos_id },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("workos_id"), args.workos_id))
      .first();
    return user;
  },
});

// Public query for external clients (e.g., Python backend)
export const getPublicByWorkOSId = query({
  args: { workos_id: userFields.workos_id },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("workos_id"), args.workos_id))
      .first();
    return user;
  },
});

// Query by email
export const getByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
    return user;
  },
});
