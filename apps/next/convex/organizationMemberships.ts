import { crud } from "convex-helpers/server/crud";
import { internalQuery } from "./_generated/server";
import schema from "./schema";

const membershipFields = schema.tables.organizationMemberships.validator.fields;

export const { create, destroy, update } = crud(
  schema,
  "organizationMemberships"
);

export const getByWorkOSId = internalQuery({
  args: { workos_id: membershipFields.workos_id },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("organizationMemberships")
      .withIndex("by_workos_id", (q) => q.eq("workos_id", args.workos_id))
      .first();
    return membership;
  },
});

export const listByUserId = internalQuery({
  args: { user_id: membershipFields.user_id },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("organizationMemberships")
      .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
      .collect();
    return memberships;
  },
});

export const listByOrganizationId = internalQuery({
  args: { organization_id: membershipFields.organization_id },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("organizationMemberships")
      .withIndex("by_organization", (q) =>
        q.eq("organization_id", args.organization_id)
      )
      .collect();
    return memberships;
  },
});

export const getByUserAndOrganization = internalQuery({
  args: {
    user_id: membershipFields.user_id,
    organization_id: membershipFields.organization_id,
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("organizationMemberships")
      .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
      .filter((q) => q.eq(q.field("organization_id"), args.organization_id))
      .first();
    return membership;
  },
});
