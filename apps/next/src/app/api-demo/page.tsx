import { Suspense } from 'react';
import Link from 'next/link';
import { Sdk } from '@humanize/api-client';
import ClientDemo from './client-demo';

// Initialize SDK for server-side usage
const sdk = new Sdk();

async function ItemsList() {
  try {
    // Fetch data using the generated SDK with Next.js fetch options
    const { data, error } = await sdk.getSampleDataApiV1ItemsDataGet({
      cache: 'no-store', // Always fetch fresh data
      // Alternatively, use: cache: 'force-cache' with next.revalidate
      // next: {
      //   revalidate: 60, // Revalidate every 60 seconds
      //   tags: ['items'], // For on-demand revalidation
      // },
    });

    if (error || !data) {
      return (
        <div className="text-red-500">
          <h3 className="text-lg font-semibold mb-2">Error loading items</h3>
          <p className="text-sm">{error?.toString() || 'Unknown error'}</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Items from API</h2>
          <span className="text-sm text-gray-500">
            Total: {data.total} items
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.data.map((item) => (
            <div
              key={item.id}
              className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold">{item.name}</h3>
                <span className="text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded">
                  {item.category || 'N/A'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">ID: {item.id}</p>
              <p className="text-lg font-bold text-green-600">
                ${item.value.toFixed(2)}
              </p>
              {item.tags && item.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded"
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
          <p className="text-xs text-gray-500 text-center mt-4">
            Last updated: {new Date(data.timestamp).toLocaleString()}
          </p>
        )}
      </div>
    );
  } catch (error) {
    return (
      <div className="text-red-500">
        <h3 className="text-lg font-semibold mb-2">Unexpected error</h3>
        <p className="text-sm">{String(error)}</p>
      </div>
    );
  }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-4 border rounded-lg shadow-sm">
            <div className="h-6 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-1/2" />
            <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ApiDemoPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-4xl font-bold">API Demo - Server Component</h1>
          <Link
            href="/"
            className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            ← Home
          </Link>
        </div>
        <p className="text-gray-600">
          This page demonstrates fetching data from the FastAPI backend using
          the generated API client in a Next.js Server Component.
        </p>
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>API Endpoint:</strong>{' '}
            <code className="bg-blue-100 px-1 py-0.5 rounded">
              {process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000'}
            </code>
          </p>
          <p className="text-sm text-blue-800 mt-2">
            <strong>Features:</strong> Server-side rendering, automatic type
            safety, Next.js caching support
          </p>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <ItemsList />
      </Suspense>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Try the Client Component</h3>
        <p className="text-sm text-gray-600 mb-4">
          See interactive data fetching with mutations and real-time updates
          using TanStack React Query.
        </p>
        <Link
          href="#client-demo"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Scroll to Client Demo ↓
        </Link>
      </div>

      <div id="client-demo" className="mt-12 pt-12 border-t">
        <Suspense fallback={<div>Loading interactive demo...</div>}>
          <ClientDemo />
        </Suspense>
      </div>
    </div>
  );
}

