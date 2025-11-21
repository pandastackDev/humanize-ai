/**
 * HTTP endpoint for bulk syncing WorkOS users to Convex
 */

import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

/**
 * Bulk sync all WorkOS users to Convex
 * POST /bulk-sync-users
 */
export const bulkSyncUsers = httpAction(async (ctx) => {
  try {
    const result = await ctx.runAction(internal.bulkSyncUsers.syncAllUsers, {});

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${result.total} users: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped, ${result.errors} errors`,
        data: result,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
