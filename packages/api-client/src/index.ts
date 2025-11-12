/**
 * @humanize/api-client
 *
 * Auto-generated TypeScript client for the Humanize FastAPI backend.
 *
 * This package exports:
 * - SDK methods for server-side usage (Next.js Server Components)
 * - TanStack React Query hooks for client-side usage
 * - TypeScript types and schemas
 * - Runtime configuration utilities
 */

// Re-export everything from the generated client
export * from "./client";

// Export TanStack React Query hooks
export * from "./client/@tanstack/react-query.gen";

// Export schemas
export * from "./client/schemas.gen";

// Export configuration utilities
export { createClientConfig, getApiBaseUrl } from "./config";
