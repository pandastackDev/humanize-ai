import type { CreateClientConfig } from "./client/client.gen";

/**
 * Get the API base URL from environment variables or use default
 * @returns The API base URL
 */
export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_PYTHON_API_URL || "http://localhost:8000";
}

/**
 * Configuration for @hey-api/client-next
 * This is imported by the generated client code
 */
export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: getApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
    ...config?.headers,
  },
});
