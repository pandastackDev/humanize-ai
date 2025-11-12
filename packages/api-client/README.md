# @humanize/api-client

TypeScript API client generated from FastAPI OpenAPI specification.

## Installation

This package is part of the monorepo workspace. It's automatically linked when you run `pnpm install` from the root.

## Usage

### In Server Components (Next.js)

```typescript
import { getItemsApiV1ItemsDataGet } from '@humanize/api-client';

export default async function Page() {
  const { data } = await getItemsApiV1ItemsDataGet({
    cache: 'no-store'
  });
  
  return <div>{/* Use data */}</div>;
}
```

### In Client Components (with TanStack Query)

```typescript
'use client';

import { useGetItemsApiV1ItemsDataGetSuspense } from '@humanize/api-client';

export function ItemsList() {
  const { data } = useGetItemsApiV1ItemsDataGetSuspense();
  
  return <div>{/* Use data */}</div>;
}
```

## Development

### Generate Client

```bash
# Generate from local backend
pnpm generate:local

# Generate from staging
pnpm generate:staging
```

### Environment Variables

Set `NEXT_PUBLIC_PYTHON_API_URL` to configure the API base URL:

- Local: `http://localhost:8000`
- Staging: `https://humanize-python.vercel.app`

## Generated Files

The `src/client/` directory contains auto-generated files:

- `sdk.gen.ts` - SDK methods for direct API calls
- `@tanstack/react-query.gen.ts` - React Query hooks
- `types.gen.ts` - TypeScript type definitions
- `schemas.gen.ts` - Validation schemas
- `client.gen.ts` - HTTP client configuration

