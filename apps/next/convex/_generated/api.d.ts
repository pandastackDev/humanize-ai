/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as bulkSyncHttp from "../bulkSyncHttp.js";
import type * as bulkSyncUsers from "../bulkSyncUsers.js";
import type * as history from "../history.js";
import type * as http from "../http.js";
import type * as organizationMemberships from "../organizationMemberships.js";
import type * as organizations from "../organizations.js";
import type * as stripe from "../stripe.js";
import type * as stripeWebhookHandlers from "../stripeWebhookHandlers.js";
import type * as subscriptions from "../subscriptions.js";
import type * as usage from "../usage.js";
import type * as userSync from "../userSync.js";
import type * as users from "../users.js";
import type * as webhookDiagnostics from "../webhookDiagnostics.js";
import type * as webhookHandlers from "../webhookHandlers.js";
import type * as workos from "../workos.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  bulkSyncHttp: typeof bulkSyncHttp;
  bulkSyncUsers: typeof bulkSyncUsers;
  history: typeof history;
  http: typeof http;
  organizationMemberships: typeof organizationMemberships;
  organizations: typeof organizations;
  stripe: typeof stripe;
  stripeWebhookHandlers: typeof stripeWebhookHandlers;
  subscriptions: typeof subscriptions;
  usage: typeof usage;
  userSync: typeof userSync;
  users: typeof users;
  webhookDiagnostics: typeof webhookDiagnostics;
  webhookHandlers: typeof webhookHandlers;
  workos: typeof workos;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
