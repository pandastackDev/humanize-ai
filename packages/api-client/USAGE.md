# API Client Usage Guide

This guide demonstrates how to use the `@humanize/api-client` package in your Next.js application.

## Setup

### 1. Install the Package

The package is already configured in your workspace. Just ensure you've run:

```bash
pnpm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in your Next.js app:

```env
NEXT_PUBLIC_PYTHON_API_URL=http://localhost:8000
```

For production/staging, use:

```env
NEXT_PUBLIC_PYTHON_API_URL=https://humanize-python.vercel.app
```

### 3. Generate API Client

From the `packages/api-client` directory:

```bash
# Generate from local backend
pnpm generate:local

# Generate from staging
pnpm generate:staging
```

## Usage Examples

### Server Components (Recommended for Static Data)

Use the SDK directly in Server Components for optimal performance:

```typescript
import { Sdk } from '@humanize/api-client';

// Initialize SDK
const sdk = new Sdk();

export default async function Page() {
  // Fetch data with Next.js caching
  const { data, error } = await sdk.getSampleDataApiV1ItemsDataGet({
    cache: 'force-cache',
    next: {
      revalidate: 60, // Revalidate every 60 seconds
      tags: ['items'], // For on-demand revalidation
    },
  });

  if (error || !data) {
    return <div>Error loading data</div>;
  }

  return (
    <div>
      <h1>Items: {data.total}</h1>
      {data.data.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

### Client Components (For Interactive Features)

Use TanStack React Query with generated options for reactive data fetching:

```typescript
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSampleDataApiV1ItemsDataGetOptions,
  createItemApiV1ItemsPostMutation,
  Sdk,
} from '@humanize/api-client';

// Initialize SDK instance for React Query
new Sdk();

export function ItemsList() {
  const queryClient = useQueryClient();

  // Query with generated options
  const { data, isLoading, error, refetch } = useQuery({
    ...getSampleDataApiV1ItemsDataGetOptions(),
  });

  // Mutation with generated options
  const createMutation = useMutation({
    ...createItemApiV1ItemsPostMutation(),
    onSuccess: () => {
      // Refresh data after successful creation
      queryClient.invalidateQueries({
        queryKey: ['getSampleDataApiV1ItemsDataGet'],
      });
    },
  });

  const handleCreate = () => {
    createMutation.mutate({
      body: {
        id: 123,
        name: 'New Item',
        value: 99.99,
        category: 'electronics',
      },
    });
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={handleCreate}>Create Item</button>
      {data?.data.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

## Available Endpoints

All endpoints are auto-generated from your OpenAPI spec. Common methods include:

### For Server Components (SDK methods)

- `sdk.getSampleDataApiV1ItemsDataGet()` - Get all items
- `sdk.getItemApiV1ItemsItemIdGet()` - Get specific item by ID
- `sdk.createItemApiV1ItemsPost()` - Create a new item
- `sdk.updateItemApiV1ItemsItemIdPut()` - Update an item
- `sdk.deleteItemApiV1ItemsItemIdDelete()` - Delete an item
- `sdk.createUserApiV1UsersPost()` - Create a new user
- `sdk.healthCheckHealthGet()` - Health check endpoint

### For Client Components (Query/Mutation Options)

**Query Options** (use with `useQuery` or `useSuspenseQuery`):

- `getSampleDataApiV1ItemsDataGetOptions()` - Get all items
- `getItemApiV1ItemsItemIdGetOptions()` - Get specific item by ID
- `healthCheckHealthGetOptions()` - Health check endpoint

**Mutation Options** (use with `useMutation`):

- `createItemApiV1ItemsPostMutation()` - Create a new item
- `updateItemApiV1ItemsItemIdPutMutation()` - Update an item
- `deleteItemApiV1ItemsItemIdDeleteMutation()` - Delete an item
- `createUserApiV1UsersPostMutation()` - Create a new user

## TypeScript Types

All types are automatically generated and exported:

```typescript
import type { Item, ItemCategory, DataResponse } from "@humanize/api-client";

const item: Item = {
  id: 1,
  name: "Product",
  value: 29.99,
  category: "electronics",
  tags: ["featured", "new"],
};
```

## Advanced Usage

### Custom Client Configuration

Create a custom client with specific settings:

```typescript
import { createClient } from "@humanize/api-client/client";

const customClient = createClient({
  baseUrl: "https://custom-api.example.com",
  headers: {
    Authorization: "Bearer token",
  },
});

// Use with SDK
const sdk = new Sdk({ client: customClient });
```

### Query Invalidation

Manually invalidate queries after mutations:

```typescript
import { useQueryClient } from "@tanstack/react-query";

function MyComponent() {
  const queryClient = useQueryClient();

  const createItem = () => {
    // ... create item logic

    // Invalidate specific query by function name
    queryClient.invalidateQueries({
      queryKey: ["getSampleDataApiV1ItemsDataGet"],
    });
  };
}
```

**Note**: Query keys are based on the function names, e.g., `'getSampleDataApiV1ItemsDataGet'` for the items list query.

### Error Handling

```typescript
const { data, error } = await sdk.getSampleDataApiV1ItemsDataGet({
  throwOnError: true, // Throw errors instead of returning them
});

// Or handle errors in mutations
const mutation = useCreateItemApiV1ItemsPost({
  mutation: {
    onError: (error) => {
      console.error("Failed to create item:", error);
      // Show toast notification, etc.
    },
  },
});
```

## Development Workflow

1. **Update Backend API**: Make changes to your FastAPI backend
2. **Regenerate Client**: Run `pnpm generate:local` or `pnpm generate:staging`
3. **Types Update**: TypeScript types automatically update
4. **Use New Endpoints**: New endpoints are immediately available

## Best Practices

1. **Server Components First**: Use Server Components for initial data loading when possible
2. **Client Components for Interactivity**: Use Client Components with React Query for forms and interactive features
3. **Cache Appropriately**: Use `force-cache` for static data, `no-store` for dynamic data
4. **Error Boundaries**: Wrap components with error boundaries for graceful error handling
5. **Loading States**: Always handle loading and error states in Client Components

## Troubleshooting

### Client Generation Fails

- Ensure the backend is running at the specified URL
- Check that `/openapi.json` endpoint is accessible
- Verify network connectivity

### Type Errors

- Regenerate the client: `pnpm generate`
- Ensure `@humanize/api-client` is properly linked in workspace
- Check TypeScript version compatibility

### Runtime Errors

- Verify `NEXT_PUBLIC_PYTHON_API_URL` is set correctly
- Check browser console for CORS issues
- Ensure backend API is running and accessible

## Examples

See the complete example implementation at:

- Server Component: `apps/next/src/app/api-demo/page.tsx`
- Client Component: `apps/next/src/app/api-demo/client-demo.tsx`
