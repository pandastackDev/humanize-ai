/**
 * Webhook event handlers
 * Extracted to reduce complexity in http.ts
 */

import { internal } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";

export type WebhookData = Record<string, unknown> & {
  id: string;
  email?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  profile_picture_url?: string;
  user_id?: string;
  organization_id?: string;
  role?: {
    slug: string;
  };
  status?: string;
};

export async function handleUserCreated(ctx: ActionCtx, data: WebhookData) {
  console.log("[handleUserCreated] Processing user creation:", {
    id: data.id,
    email: data.email,
    firstName: data.first_name,
    lastName: data.last_name,
  });

  if (!data.email) {
    console.error("[handleUserCreated] Missing email in webhook data:", data);
    throw new Error("Email is required for user creation");
  }

  if (!data.id) {
    console.error("[handleUserCreated] Missing id in webhook data:", data);
    throw new Error("WorkOS user ID is required for user creation");
  }

  try {
    // Check if user already exists (upsert logic)
    const existingUser = await ctx.runQuery(internal.users.getByWorkOSId, {
      workos_id: data.id,
    });

    const now = Date.now();
    const userData = {
      email: data.email as string,
      workos_id: data.id,
      name:
        (data.name as string) ||
        (data.first_name && data.last_name
          ? `${data.first_name} ${data.last_name}`
          : data.first_name || data.last_name || undefined),
      first_name: data.first_name as string | undefined,
      last_name: data.last_name as string | undefined,
      profile_picture_url: data.profile_picture_url as string | undefined,
      updated_at: now,
    };

    if (existingUser) {
      // Update existing user
      console.log(
        "[handleUserCreated] User already exists, updating:",
        data.id
      );
      await ctx.runMutation(internal.users.update, {
        id: existingUser._id,
        patch: userData,
      });
      console.log(
        "[handleUserCreated] Successfully updated user:",
        existingUser._id
      );
    } else {
      // Create new user
      const userId = await ctx.runMutation(internal.users.create, {
        ...userData,
        created_at: now,
      });
      console.log("[handleUserCreated] Successfully created user:", userId);
    }
  } catch (error) {
    console.error("[handleUserCreated] Error processing user:", error);
    throw error;
  }
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
  console.log("[handleUserUpdated] Processing user update:", {
    id: data.id,
    email: data.email,
  });

  const user = await ctx.runQuery(internal.users.getByWorkOSId, {
    workos_id: data.id,
  });

  if (!user?._id) {
    // If user doesn't exist, create it (upsert behavior)
    console.log(
      "[handleUserUpdated] User not found, creating new user:",
      data.id
    );
    await handleUserCreated(ctx, data);
    return;
  }

  if (!data.email) {
    throw new Error("Email is required for user update");
  }

  const now = Date.now();
  const updateData: Record<string, unknown> = {
    email: data.email,
    updated_at: now,
  };

  // Update optional fields if provided
  if (data.name) {
    updateData.name = data.name;
  }
  if (data.first_name) {
    updateData.first_name = data.first_name;
  }
  if (data.last_name) {
    updateData.last_name = data.last_name;
  }
  if (data.profile_picture_url) {
    updateData.profile_picture_url = data.profile_picture_url;
  }

  // If name not provided but first/last name are, construct name
  if (!updateData.name && (data.first_name || data.last_name)) {
    updateData.name = [data.first_name, data.last_name]
      .filter(Boolean)
      .join(" ");
  }

  await ctx.runMutation(internal.users.update, {
    id: user._id,
    patch: updateData,
  });

  console.log("[handleUserUpdated] Successfully updated user:", user._id);
}

export async function handleOrganizationCreated(
  ctx: ActionCtx,
  data: WebhookData
) {
  if (!data.name) {
    throw new Error("Name is required for organization creation");
  }
  await ctx.runMutation(internal.organizations.create, {
    name: data.name,
    workos_id: data.id,
  });
}

export async function handleOrganizationDeleted(
  ctx: ActionCtx,
  data: WebhookData
) {
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

export async function handleOrganizationUpdated(
  ctx: ActionCtx,
  data: WebhookData
) {
  const organization = await ctx.runQuery(
    internal.organizations.getByWorkOSId,
    {
      workos_id: data.id,
    }
  );

  if (!organization?._id) {
    throw new Error(`Organization not found: ${data.id}`);
  }

  if (!data.name) {
    throw new Error("Name is required for organization update");
  }

  await ctx.runMutation(internal.organizations.update, {
    id: organization._id,
    patch: { name: data.name },
  });
}

export async function handleMembershipCreated(
  ctx: ActionCtx,
  data: WebhookData
) {
  const hasRequiredFields = data.user_id && data.organization_id && data.status;
  if (!hasRequiredFields) {
    throw new Error(
      "user_id, organization_id, and status are required for membership creation"
    );
  }
  await ctx.runMutation(internal.organizationMemberships.create, {
    workos_id: data.id,
    user_id: data.user_id as string,
    organization_id: data.organization_id as string,
    role: data.role?.slug || "member",
    status: data.status as string,
  });
}

export async function handleMembershipUpdated(
  ctx: ActionCtx,
  data: WebhookData
) {
  const membership = await ctx.runQuery(
    internal.organizationMemberships.getByWorkOSId,
    {
      workos_id: data.id,
    }
  );

  if (!membership?._id) {
    throw new Error(`Membership not found: ${data.id}`);
  }

  if (!data.status) {
    throw new Error("Status is required for membership update");
  }

  await ctx.runMutation(internal.organizationMemberships.update, {
    id: membership._id,
    patch: {
      role: data.role?.slug || membership.role,
      status: data.status as string,
    },
  });
}

export async function handleMembershipDeleted(
  ctx: ActionCtx,
  data: WebhookData
) {
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
export async function handleWebhookEvent(
  ctx: ActionCtx,
  event: string,
  data: WebhookData
) {
  const handlers: Record<
    string,
    (handlerCtx: ActionCtx, handlerData: WebhookData) => Promise<void>
  > = {
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
