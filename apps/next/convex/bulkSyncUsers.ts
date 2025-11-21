"use node";

/**
 * Bulk sync all WorkOS users to Convex
 * This is useful for syncing existing users that were created before webhooks were set up
 */

import { WorkOS } from "@workos-inc/node";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { ActionCtx } from "./_generated/server";
import { internalAction } from "./_generated/server";

type SyncResult = {
  success: boolean;
  action: "created" | "updated" | "skipped";
  userId: Id<"users"> | string;
  email: string;
  error?: string;
};

type BulkSyncResult = {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  results: SyncResult[];
};

/**
 * Sync a single user from WorkOS to Convex
 * Returns the sync result and updates counters
 */
async function syncSingleUser(
  ctx: ActionCtx,
  user: { id: string; email: string }
): Promise<{
  result: SyncResult;
  counters: {
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  };
}> {
  const counters = { created: 0, updated: 0, skipped: 0, errors: 0 };

  try {
    // Check if user already exists in Convex
    const existingUser = await ctx.runQuery(internal.users.getByWorkOSId, {
      workos_id: user.id,
    });

    if (existingUser) {
      // Update if email changed
      if (existingUser.email !== user.email) {
        await ctx.runMutation(internal.users.update, {
          id: existingUser._id,
          patch: {
            email: user.email,
          },
        });
        counters.updated = 1;
        return {
          result: {
            success: true,
            action: "updated",
            userId: existingUser._id,
            email: user.email,
          },
          counters,
        };
      }
      counters.skipped = 1;
      return {
        result: {
          success: true,
          action: "skipped",
          userId: existingUser._id,
          email: user.email,
        },
        counters,
      };
    }

    // Create new user in Convex
    const createdUser = await ctx.runMutation(internal.users.create, {
      email: user.email,
      workos_id: user.id,
    });
    counters.created = 1;
    return {
      result: {
        success: true,
        action: "created",
        userId: createdUser._id,
        email: user.email,
      },
      counters,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`Error syncing user ${user.id} (${user.email}):`, errorMsg);
    counters.errors = 1;
    return {
      result: {
        success: false,
        action: "skipped",
        userId: "",
        email: user.email,
        error: errorMsg,
      },
      counters,
    };
  }
}

/**
 * Sync all users from WorkOS to Convex
 * This will paginate through all WorkOS users and sync them
 */
export const syncAllUsers = internalAction({
  args: {},
  handler: async (ctx): Promise<BulkSyncResult> => {
    const workos = new WorkOS(process.env.WORKOS_API_KEY);
    const results: SyncResult[] = [];
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    try {
      // Paginate through all WorkOS users
      let cursor: string | undefined;
      let hasMore = true;

      while (hasMore) {
        const usersResponse = await workos.userManagement.listUsers({
          limit: 100, // WorkOS max is 100 per page
          ...(cursor && { cursor }),
        });

        const users = usersResponse.data;
        if (users.length === 0) {
          hasMore = false;
          break;
        }

        // Sync each user
        for (const user of users) {
          const { result, counters: userCounters } = await syncSingleUser(
            ctx,
            user
          );
          results.push(result);
          created += userCounters.created;
          updated += userCounters.updated;
          skipped += userCounters.skipped;
          errors += userCounters.errors;
        }

        // Check if there are more pages
        cursor = usersResponse.listMetadata.after;
        hasMore = usersResponse.listMetadata.after !== undefined;
      }

      return {
        total: results.length,
        created,
        updated,
        skipped,
        errors,
        results,
      };
    } catch (error) {
      console.error("Error in bulk sync:", error);
      throw error;
    }
  },
});
