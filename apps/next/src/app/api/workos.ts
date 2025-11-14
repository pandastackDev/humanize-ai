import { WorkOS } from "@workos-inc/node";
import { env } from "@/env";

<<<<<<< HEAD
const workos = new WorkOS(env.WORKOS_API_KEY, {
  clientId: env.WORKOS_CLIENT_ID,
=======
// Use placeholder values during build time if env vars are not available
// These will be replaced with actual values at runtime
// WorkOS SDK requires apiKey to be provided, so we use a placeholder during build
const workosApiKey =
  process.env.WORKOS_API_KEY || "wk_placeholder_for_build_time_only";
const workosClientId =
  process.env.WORKOS_CLIENT_ID || "client_placeholder_for_build_time_only";

const workos = new WorkOS(workosApiKey, {
  clientId: workosClientId,
>>>>>>> 106b21e (fix tslint & deployment)
});

export { workos };
