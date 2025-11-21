"use node";

/**
 * Manual user synchronization functions
 * These can be used to sync users from WorkOS to Convex if webhooks fail
 */

import { WorkOS } from "@workos-inc/node";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction } from "./_generated/server";

type SyncResult = {
  success: boolean;
  action: "created" | "updated";
  userId: Id<"users">;
};

/**
 * Sync a single user from WorkOS to Convex by WorkOS user ID
 */
export const syncUserByWorkOSId = internalAction({
  args: {
    workosUserId: v.string(),
  },
  handler: async (ctx, args): Promise<SyncResult> => {
    const workos = new WorkOS(process.env.WORKOS_API_KEY);

    try {
      // Fetch user from WorkOS - getUser takes a string directly
      const user = await workos.userManagement.getUser(args.workosUserId);

      if (!user) {
        throw new Error(`User not found in WorkOS: ${args.workosUserId}`);
      }

      // Check if user already exists in Convex
      const existingUser = await ctx.runQuery(internal.users.getByWorkOSId, {
        workos_id: user.id,
      });

      if (existingUser) {
        console.log(`User ${user.id} already exists in Convex, updating...`);
        // Update existing user
        await ctx.runMutation(internal.users.update, {
          id: existingUser._id,
          patch: {
            email: user.email,
          },
        });
        return { success: true, action: "updated", userId: existingUser._id };
      }

      // Create new user in Convex
      // crud.create returns the full document, so we extract _id
      const createdUser = await ctx.runMutation(internal.users.create, {
        email: user.email,
        workos_id: user.id,
      });

      console.log(`Successfully synced user ${user.id} to Convex`);
      return { success: true, action: "created", userId: createdUser._id };
    } catch (error) {
      console.error(`Error syncing user ${args.workosUserId}:`, error);
      throw error;
    }
  },
});

/**
 * Sync a user by email (finds WorkOS user first, then syncs)
 */
export const syncUserByEmail = internalAction({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args): Promise<SyncResult> => {
    const workos = new WorkOS(process.env.WORKOS_API_KEY);

    try {
      // List users and find by email
      const users = await workos.userManagement.listUsers({
        email: args.email,
      });

      if (users.data.length === 0) {
        throw new Error(`User not found in WorkOS with email: ${args.email}`);
      }

      const user = users.data[0];
      if (!user) {
        throw new Error(`User not found in WorkOS with email: ${args.email}`);
      }

      // Check if user already exists in Convex
      const existingUser = await ctx.runQuery(internal.users.getByWorkOSId, {
        workos_id: user.id,
      });

      if (existingUser) {
        console.log(`User ${user.id} already exists in Convex, updating...`);
        await ctx.runMutation(internal.users.update, {
          id: existingUser._id,
          patch: {
            email: user.email,
          },
        });
        return { success: true, action: "updated", userId: existingUser._id };
      }

      // Create new user in Convex
      // crud.create returns the full document, so we extract _id
      const createdUser = await ctx.runMutation(internal.users.create, {
        email: user.email,
        workos_id: user.id,
      });

      console.log(`Successfully synced user ${user.id} to Convex`);
      return { success: true, action: "created", userId: createdUser._id };
    } catch (error) {
      console.error(`Error syncing user with email ${args.email}:`, error);
      throw error;
    }
  },
});
