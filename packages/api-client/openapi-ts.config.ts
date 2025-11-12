import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: process.env.OPENAPI_URL || "http://localhost:8000/openapi.json",
  output: {
    format: "prettier",
    lint: "eslint",
    path: "./src/client",
  },
  plugins: [
    // Client for Next.js App Router with runtime config
    {
      name: "@hey-api/client-next",
      runtimeConfigPath: "../config",
    },
    // SDK methods for direct API calls
    {
      instance: true,
      name: "@hey-api/sdk",
    },
    // Fetch client for TanStack React Query
    "@hey-api/client-fetch",
    // TypeScript types with JavaScript enums
    {
      enums: "javascript",
      name: "@hey-api/typescript",
    },
    // Schemas for validation
    "@hey-api/schemas",
    // TanStack React Query hooks
    "@tanstack/react-query",
  ],
});
