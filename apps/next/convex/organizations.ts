import { v } from "convex/values";
import { crud } from "convex-helpers/server/crud";
import {
  internalMutation,
  internalQuery,
  type QueryCtx,
  query,
} from "./_generated/server";
import schema from "./schema";

const organizationFields = schema.tables.organizations.validator.fields;

const fetchOrganizationByWorkOSId = async (ctx: QueryCtx, workosId: string) =>
  await ctx.db
    .query("organizations")
    .filter((q) => q.eq(q.field("workos_id"), workosId))
    .first();

export const { create, destroy, update } = crud(schema, "organizations");

export const getByWorkOSId = internalQuery({
  args: { workos_id: organizationFields.workos_id },
  handler: async (ctx, args) =>
    await fetchOrganizationByWorkOSId(ctx, args.workos_id),
});

export const getPublicByWorkOSId = query({
  args: { workos_id: organizationFields.workos_id },
  handler: async (ctx, args) =>
    await fetchOrganizationByWorkOSId(ctx, args.workos_id),
});

export const addWordBalance = internalMutation({
  args: {
    organization_id: v.string(),
    word_amount: v.number(),
  },
  handler: async (ctx, args) => {
    const organization = await ctx.db
      .query("organizations")
      .filter((q) => q.eq(q.field("workos_id"), args.organization_id))
      .first();

    if (!organization) {
      throw new Error(`Organization not found: ${args.organization_id}`);
    }

    const currentBalance = organization.word_balance || 0;
    const newBalance = currentBalance + args.word_amount;

    await ctx.db.patch(organization._id, {
      word_balance: newBalance,
    });

    return { newBalance };
  },
});
