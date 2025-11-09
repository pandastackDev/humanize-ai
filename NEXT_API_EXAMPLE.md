# Using FastAPI from Next.js

This guide shows how to call your FastAPI backend from the Next.js frontend when both are deployed on Vercel.

## API Base URL

Since both apps are on the same domain, you can use relative URLs:

```typescript
const API_BASE_URL = '/api/v1';
```

Or use environment variables for flexibility:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
```

## Example: API Client

Create a file `apps/next/src/lib/api-client.ts`:

```typescript
// apps/next/src/lib/api-client.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // Example methods
  async getUsers() {
    return this.request<User[]>('/users');
  }

  async getUser(id: string) {
    return this.request<User>(`/users/${id}`);
  }

  async createUser(data: CreateUserData) {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getItems() {
    return this.request<Item[]>('/items');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Types (match your FastAPI models)
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface CreateUserData {
  name: string;
  email: string;
}

export interface Item {
  id: string;
  name: string;
  description?: string;
}
```

## Example: Server Component

```typescript
// apps/next/src/app/users/page.tsx
import { apiClient } from '@/lib/api-client';

export default async function UsersPage() {
  const users = await apiClient.getUsers();

  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.name} - {user.email}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Example: Client Component with React Query

```typescript
// apps/next/src/app/users/users-list.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function UsersList() {
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.getUsers(),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading users</div>;

  return (
    <ul>
      {users?.map((user) => (
        <li key={user.id}>
          {user.name} - {user.email}
        </li>
      ))}
    </ul>
  );
}
```

## Example: API Route Handler (Next.js)

If you need server-side API handling in Next.js:

```typescript
// apps/next/src/app/api/proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Call your FastAPI backend
  const response = await fetch(`${process.env.API_URL || ''}/api/v1/users`);
  const data = await response.json();
  
  return NextResponse.json(data);
}
```

## Example: Form Submission

```typescript
// apps/next/src/app/users/create-user-form.tsx
'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

export function CreateUserForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await apiClient.createUser({ name, email });
      alert('User created successfully!');
      setName('');
      setEmail('');
    } catch (error) {
      alert('Error creating user');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        required
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}
```

## Environment Variables

Add to `apps/next/.env.local`:

```env
# Optional: Override API URL (useful for development)
NEXT_PUBLIC_API_URL=/api/v1

# For server-side API calls
API_URL=http://localhost:3000
```

For production (set in Vercel Dashboard):

```env
NEXT_PUBLIC_API_URL=/api/v1
API_URL=https://yourdomain.com
```

## Testing Locally

### Option 1: Run Separately
```bash
# Terminal 1: Run Next.js
cd apps/next
pnpm dev

# Terminal 2: Run FastAPI
cd backend
uvicorn src.api.main:app --reload --port 8000
```

Update your API client to use `http://localhost:8000/api/v1` when in development.

### Option 2: Use Vercel Dev (Recommended)
```bash
# From project root
vercel dev
```

This will run both Next.js and FastAPI together, simulating the production environment.

## CORS Configuration

The FastAPI backend is configured with CORS middleware. For production, update `backend/src/api/config.py`:

```python
class Settings(BaseSettings):
    # Restrict to your domain in production
    ALLOWED_ORIGINS: list[str] = [
        "https://yourdomain.com",
        "https://www.yourdomain.com",
        "http://localhost:3000",  # for local development
    ]
```

Or set via environment variable in Vercel:
```
ALLOWED_ORIGINS=["https://yourdomain.com","http://localhost:3000"]
```

## Best Practices

1. **Type Safety**: Generate TypeScript types from your FastAPI OpenAPI schema:
   ```bash
   npx openapi-typescript http://localhost:8000/openapi.json -o types/api.ts
   ```

2. **Error Handling**: Always handle API errors gracefully

3. **Loading States**: Show loading indicators for better UX

4. **Caching**: Use React Query or SWR for automatic caching and revalidation

5. **Authentication**: Add auth tokens to requests if needed:
   ```typescript
   headers: {
     'Authorization': `Bearer ${token}`,
     'Content-Type': 'application/json',
   }
   ```

6. **API Documentation**: Access your API docs at:
   - `/api/` - Documentation home
   - `/api/docs` - Swagger UI
   - `/api/scalar` - Scalar UI
   - `/api/redoc` - ReDoc

## Troubleshooting

### CORS Errors
- Check `ALLOWED_ORIGINS` in backend config
- Ensure CORS middleware is added to FastAPI app
- Check browser console for specific CORS errors

### 404 on API Routes
- Verify the rewrite rule in `vercel.json`
- Check that `/api/*` requests are being routed correctly
- Inspect Vercel function logs

### Import Errors
- Ensure `api/index.py` correctly sets up Python path
- Check that all dependencies are in `requirements.txt`

### Type Errors
- Keep TypeScript types in sync with FastAPI models
- Consider using code generation tools

