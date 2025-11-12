# Quick Start Guide

Get started with `@humanize/api-client` in 5 minutes.

## 1️⃣ Environment Setup

Create `apps/next/.env.local`:

```env
NEXT_PUBLIC_PYTHON_API_URL=http://localhost:8000
```

## 2️⃣ Generate API Client

```bash
cd packages/api-client
pnpm generate:local  # or generate:staging for production
```

## 3️⃣ Use in Server Component

```typescript
import { Sdk } from '@humanize/api-client';

const sdk = new Sdk();

export default async function Page() {
  const { data } = await sdk.getSampleDataApiV1ItemsDataGet();

  return <div>{data.total} items</div>;
}
```

## 4️⃣ Use in Client Component

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { getSampleDataApiV1ItemsDataGetOptions, Sdk } from '@humanize/api-client';

// Initialize SDK once
new Sdk();

export function MyComponent() {
  const { data } = useQuery(getSampleDataApiV1ItemsDataGetOptions());

  return <div>{data?.total} items</div>;
}
```

## 5️⃣ View Example

Visit the demo page:

```
http://localhost:3000/api-demo
```

---

**Need more details?** See [USAGE.md](./USAGE.md) for comprehensive documentation.

**Having issues?** Check [Troubleshooting](#troubleshooting) section in USAGE.md.
