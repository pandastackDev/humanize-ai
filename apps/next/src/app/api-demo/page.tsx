import { Sdk } from "@humanize/api-client";
import Link from "next/link";
import { Suspense } from "react";
import { env } from "@/env";
import ClientDemo from "./client-demo";

// Initialize SDK for server-side usage
const sdk = new Sdk();

async function ItemsList() {
  try {
    // Fetch data using the generated SDK with Next.js fetch options
    const { data, error } = await sdk.getSampleDataApiV1ItemsDataGet({
      cache: "no-store", // Always fetch fresh data
      // Alternatively, use: cache: 'force-cache' with next.revalidate
      // next: {
      //   revalidate: 60, // Revalidate every 60 seconds
      //   tags: ['items'], // For on-demand revalidation
      // },
    });

    if (error || !data) {
      return (
        <div className="text-red-500">
          <h3 className="mb-2 font-semibold text-lg">Error loading items</h3>
          <p className="text-sm">{error?.toString() || "Unknown error"}</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-2xl">Items from API</h2>
          <span className="text-gray-500 text-sm">
            Total: {data.total} items
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.data.map((item) => (
            <div
              className="rounded-lg border p-4 shadow-sm transition-shadow hover:shadow-md"
              key={item.id}
            >
              <div className="mb-2 flex items-start justify-between">
                <h3 className="font-semibold text-lg">{item.name}</h3>
                <span className="rounded bg-blue-100 px-2 py-1 text-blue-800 text-sm">
                  {item.category || "N/A"}
                </span>
              </div>
              <p className="mb-2 text-gray-600 text-sm">ID: {item.id}</p>
              <p className="font-bold text-green-600 text-lg">
                ${item.value.toFixed(2)}
              </p>
              {item.tags && item.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <span
                      className="rounded bg-gray-100 px-2 py-0.5 text-gray-700 text-xs"
                      key={tag}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {data.timestamp && (
          <p className="mt-4 text-center text-gray-500 text-xs">
            Last updated: {new Date(data.timestamp).toLocaleString()}
          </p>
        )}
      </div>
    );
  } catch (error) {
    return (
      <div className="text-red-500">
        <h3 className="mb-2 font-semibold text-lg">Unexpected error</h3>
        <p className="text-sm">{String(error)}</p>
      </div>
    );
  }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div className="rounded-lg border p-4 shadow-sm" key={i}>
            <div className="mb-2 h-6 animate-pulse rounded bg-gray-200" />
            <div className="mb-2 h-4 w-1/2 animate-pulse rounded bg-gray-200" />
            <div className="h-6 w-1/3 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ApiDemoPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-bold text-4xl">API Demo - Server Component</h1>
          <Link
            className="rounded-lg bg-gray-200 px-4 py-2 text-sm transition-colors hover:bg-gray-300"
            href="/"
          >
            ← Home
          </Link>
        </div>
        <p className="text-gray-600">
          This page demonstrates fetching data from the FastAPI backend using
          the generated API client in a Next.js Server Component.
        </p>
        <div className="mt-4 rounded-lg bg-blue-50 p-4">
          <p className="text-blue-800 text-sm">
            <strong>API Endpoint:</strong>{" "}
            <code className="rounded bg-blue-100 px-1 py-0.5">
              {env.NEXT_PUBLIC_PYTHON_API_URL}
            </code>
          </p>
          <p className="mt-2 text-blue-800 text-sm">
            <strong>Features:</strong> Server-side rendering, automatic type
            safety, Next.js caching support
          </p>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <ItemsList />
      </Suspense>

      <div className="mt-8 rounded-lg bg-gray-50 p-4">
        <h3 className="mb-2 font-semibold text-lg">Try the Client Component</h3>
        <p className="mb-4 text-gray-600 text-sm">
          See interactive data fetching with mutations and real-time updates
          using TanStack React Query.
        </p>
        <Link
          className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          href="#client-demo"
        >
          Scroll to Client Demo ↓
        </Link>
      </div>

      <div className="mt-12 border-t pt-12" id="client-demo">
        <Suspense fallback={<div>Loading interactive demo...</div>}>
          <ClientDemo />
        </Suspense>
      </div>
    </div>
  );
}
