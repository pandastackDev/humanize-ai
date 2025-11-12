/**
 * Webhook event handlers
 * Extracted to reduce complexity in http.ts
 */

import { internal } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";

type WebhookData = any;

export async function handleUserCreated(ctx: ActionCtx, data: WebhookData) {
  await ctx.runMutation(internal.users.create, {
    email: data.email,
    workos_id: data.id,
  });
}

export async function handleUserDeleted(ctx: ActionCtx, data: WebhookData) {
  const user = await ctx.runQuery(internal.users.getByWorkOSId, {
    workos_id: data.id,
  });

  if (!user?._id) {
    throw new Error(`User not found: ${data.id}`);
  }

  await ctx.runMutation(internal.users.destroy, {
    id: user._id,
  });
}

export async function handleUserUpdated(ctx: ActionCtx, data: WebhookData) {
  const user = await ctx.runQuery(internal.users.getByWorkOSId, {
    workos_id: data.id,
  });

  if (!user?._id) {
    throw new Error(`User not found: ${data.id}`);
  }

  await ctx.runMutation(internal.users.update, {
    id: user._id,
    patch: { email: data.email },
  });
}

export async function handleOrganizationCreated(ctx: ActionCtx, data: WebhookData) {
  await ctx.runMutation(internal.organizations.create, {
    name: data.name,
    workos_id: data.id,
  });
}

export async function handleOrganizationDeleted(ctx: ActionCtx, data: WebhookData) {
  const organization = await ctx.runQuery(
    internal.organizations.getByWorkOSId,
    {
      workos_id: data.id,
    }
  );

  if (!organization?._id) {
    throw new Error(`Organization not found: ${data.id}`);
  }

  await ctx.runMutation(internal.organizations.destroy, {
    id: organization._id,
  });
}

export async function handleOrganizationUpdated(ctx: ActionCtx, data: WebhookData) {
  const organization = await ctx.runQuery(
    internal.organizations.getByWorkOSId,
    {
      workos_id: data.id,
    }
  );

  if (!organization?._id) {
    throw new Error(`Organization not found: ${data.id}`);
  }

  await ctx.runMutation(internal.organizations.update, {
    id: organization._id,
    patch: { name: data.name },
  });
}

export async function handleMembershipCreated(ctx: ActionCtx, data: WebhookData) {
  await ctx.runMutation(internal.organizationMemberships.create, {
    workos_id: data.id,
    user_id: data.user_id,
    organization_id: data.organization_id,
    role: data.role?.slug || "member",
    status: data.status,
  });
}

export async function handleMembershipUpdated(ctx: ActionCtx, data: WebhookData) {
  const membership = await ctx.runQuery(
    internal.organizationMemberships.getByWorkOSId,
    {
      workos_id: data.id,
    }
  );

  if (!membership?._id) {
    throw new Error(`Membership not found: ${data.id}`);
  }

  await ctx.runMutation(internal.organizationMemberships.update, {
    id: membership._id,
    patch: {
      role: data.role?.slug || membership.role,
      status: data.status,
    },
  });
}

export async function handleMembershipDeleted(ctx: ActionCtx, data: WebhookData) {
  const membership = await ctx.runQuery(
    internal.organizationMemberships.getByWorkOSId,
    {
      workos_id: data.id,
    }
  );

  if (!membership?._id) {
    throw new Error(`Membership not found: ${data.id}`);
  }

  await ctx.runMutation(internal.organizationMemberships.destroy, {
    id: membership._id,
  });
}

/**
 * Main webhook event dispatcher
 */
export async function handleWebhookEvent(ctx: ActionCtx, event: string, data: WebhookData) {
  const handlers: Record<string, (ctx: ActionCtx, data: WebhookData) => Promise<void>> = {
    "user.created": handleUserCreated,
    "user.deleted": handleUserDeleted,
    "user.updated": handleUserUpdated,
    "organization.created": handleOrganizationCreated,
    "organization.deleted": handleOrganizationDeleted,
    "organization.updated": handleOrganizationUpdated,
    "organization_membership.created": handleMembershipCreated,
    "organization_membership.updated": handleMembershipUpdated,
    "organization_membership.deleted": handleMembershipDeleted,
  };

  const handler = handlers[event];
  if (!handler) {
    throw new Error(`Unhandled event type: ${event}`);
  }

  await handler(ctx, data);
}

