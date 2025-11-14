import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Server-side environment variables.
   * These are only available on the server and will not be sent to the client.
   */
  server: {
    // ============================================
    // WorkOS Authentication Configuration
    // ============================================
    // Get credentials from: https://dashboard.workos.com/api-keys

    /**
     * WorkOS API Key (Secret)
     * Used for server-side WorkOS API calls
     * Format: sk_test_... (test) or sk_live_... (production)
     * @example "sk_test_a2V5XzAxSzlGNFpCUVozSE1BNEFXRVNGMlBRS1lG"
     */
    WORKOS_API_KEY: z.string().min(1).startsWith("sk_"),

    /**
     * WorkOS Client ID
     * Used for OAuth flows and authentication
     * Format: client_...
     * @example "client_01K9F4ZC85KACBG229R0R2VG5D"
     */
    WORKOS_CLIENT_ID: z.string().min(1).startsWith("client_"),

    /**
     * WorkOS Cookie Password (Secret)
     * Used by AuthKit middleware to encrypt session cookies
     * Must be a 32-byte hex string (64 characters)
     * Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     * @example "919f602f4a882621d94e3db999159dc4b8732e95670d7f1e0aa0fdefa234a736"
     */
    WORKOS_COOKIE_PASSWORD: z.string().length(64),

    // ============================================
    // Stripe Payment Configuration
    // ============================================
    // Get credentials from: https://dashboard.stripe.com/test/apikeys

    /**
     * Stripe API Key (Secret)
     * Used for payment processing and subscription management
     * Format: sk_test_... (test) or sk_live_... (production)
     * ⚠️ IMPORTANT: Use test keys (sk_test_) for development
     * @example "sk_test_51PcLUhAaDFStRNr01FGoJsSfcVE3ZbV..."
     */
    STRIPE_API_KEY: z.string().min(1).startsWith("sk_"),

    // ============================================
    // Convex Backend Configuration
    // ============================================

    /**
     * Convex Deployment Identifier
     * Automatically set by `npx convex dev`
     * Format: dev:deployment-name or prod:deployment-name
     * @example "dev:academic-terrier-140"
     */
    CONVEX_DEPLOYMENT: z.string(),

    // ============================================
    // Node Environment
    // ============================================

    /**
     * Node Environment
     * Determines the runtime environment mode
     */
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  /**
   * Client-side environment variables.
   * These must be prefixed with NEXT_PUBLIC_ and will be exposed to the browser.
   * ⚠️ NEVER put secrets or API keys here!
   */
  client: {
    // ============================================
    // Application URLs
    // ============================================

    /**
     * Base URL of the Application
     * Used for OAuth redirects, webhooks, and absolute URLs
     * Must include protocol (http:// or https://)
     * @example "http://localhost:3000" (development)
     * @example "https://app.example.com" (production)
     */
    NEXT_PUBLIC_BASE_URL: z.url(),

    /**
     * WorkOS OAuth Redirect URI
     * Callback URL for WorkOS authentication
     * Should be: {NEXT_PUBLIC_BASE_URL}/callback
     * @example "http://localhost:3000/callback"
     */
    NEXT_PUBLIC_WORKOS_REDIRECT_URI: z.url(),

    // ============================================
    // Backend API URLs
    // ============================================

    /**
     * Python FastAPI Backend URL
     * URL for the humanize API backend
     * Defaults to localhost if not specified
     * @example "http://localhost:8000" (development)
     * @example "https://api.example.com" (production)
     */
    NEXT_PUBLIC_PYTHON_API_URL: z.url(),

    /**
     * Convex Backend URL
     * Automatically set by `npx convex dev` or Convex deployment
     * Used for real-time database and functions
     * @example "https://academic-terrier-140.convex.cloud"
     */
    NEXT_PUBLIC_CONVEX_URL: z.url(),
  },

  /**
   * Runtime environment variables.
   * For Next.js >= 13.4.4, we need to destructure client variables explicitly.
   * This ensures they are included in the client bundle.
   */
  runtimeEnv: {
    // ============================================
    // Server Variables
    // ============================================
    WORKOS_API_KEY: process.env.WORKOS_API_KEY,
    WORKOS_CLIENT_ID: process.env.WORKOS_CLIENT_ID,
    WORKOS_COOKIE_PASSWORD: process.env.WORKOS_COOKIE_PASSWORD,
    STRIPE_API_KEY: process.env.STRIPE_API_KEY,
    CONVEX_DEPLOYMENT: process.env.CONVEX_DEPLOYMENT,
    NODE_ENV: process.env.NODE_ENV,

    // ============================================
    // Client Variables (exposed to browser)
    // ============================================
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_WORKOS_REDIRECT_URI:
      process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI,
    NEXT_PUBLIC_PYTHON_API_URL: process.env.NEXT_PUBLIC_PYTHON_API_URL,
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
  },

  /**
   * Skip validation during build on CI/CD pipelines that don't have all env vars.
   * Set SKIP_ENV_VALIDATION=true to skip validation.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  /**
   * Makes it so that empty strings are treated as undefined.
   * `SOME_VAR: z.string()` and `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
