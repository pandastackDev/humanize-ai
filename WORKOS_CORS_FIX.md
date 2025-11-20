# WorkOS CORS Error Fix

## Problem
```
Access to fetch at 'https://api.workos.com/_widgets/UserManagement/organizations' from origin 'http://localhost:3000' has been blocked by CORS policy
```

The WorkOS AuthKit widgets (like `OrganizationSwitcher`) make direct API calls to WorkOS from the browser. These calls require proper CORS configuration in your WorkOS environment.

---

## Solution 1: Configure Allowed Origins in WorkOS Dashboard (RECOMMENDED)

### Step 1: Go to WorkOS Dashboard
1. Navigate to: https://dashboard.workos.com
2. Select your WorkOS environment (Development/Staging/Production)

### Step 2: Configure Redirect URIs
1. Go to **"Redirects"** section in the left sidebar
2. Under **"Sign-in Redirect URIs"**, add:
   ```
   http://localhost:3000/callback
   ```
3. Under **"Sign-out Redirect URIs"**, add:
   ```
   http://localhost:3000
   ```
4. Click **"Save Changes"**

### Step 3: Configure Allowed Origins (CRITICAL)
WorkOS may have a separate section for CORS origins. Look for:
1. **"API Settings"** or **"Security"** section
2. Add allowed origins:
   ```
   http://localhost:3000
   ```
3. If deploying to production, also add:
   ```
   https://your-domain.com
   ```

### Step 4: Verify Configuration
After saving, wait a few minutes for the changes to propagate, then:
1. Clear your browser cache
2. Restart your Next.js dev server:
   ```bash
   cd apps/next
   npm run dev
   ```
3. Test the organization switcher

---

## Solution 2: Proxy WorkOS Widget API Calls (Alternative)

If WorkOS doesn't have CORS configuration or you want more control, create a proxy endpoint:

### Create API Route: `apps/next/src/app/api/workos-proxy/organizations/route.ts`

```typescript
import { withAuth } from "@workos-inc/authkit-nextjs";
import { workos } from "@/app/api/workos";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Verify user is authenticated
    const auth = await withAuth();
    if (!auth.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch organizations for the authenticated user
    const organizations = await workos.userManagement.listOrganizationMemberships({
      userId: auth.user.id,
    });

    // Return in format expected by WorkOS widgets
    return NextResponse.json({
      data: organizations.data.map((om) => ({
        id: om.organizationId,
        name: om.organization.name,
      })),
    });
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}
```

**Note:** This solution requires modifying the WorkOS widget implementation, which may not be fully supported.

---

## Solution 3: Use Server-Side Data Fetching (BEST PRACTICE)

Instead of relying on client-side WorkOS widgets, fetch organization data server-side and pass it to your components:

### Update `apps/next/src/app/components/layout/header.tsx`

```typescript
import { withAuth } from "@workos-inc/authkit-nextjs";
import { workos } from "@/app/api/workos";
import { OrganizationSwitcherHeader } from "./organization-switcher-header";

export async function Header() {
  const { user, organizationId, role } = await withAuth();
  
  if (!user) {
    return null; // Or redirect to login
  }

  // Fetch organizations server-side
  const organizationMemberships = await workos.userManagement.listOrganizationMemberships({
    userId: user.id,
  });

  const organizations = organizationMemberships.data.map((om) => ({
    id: om.organizationId,
    name: om.organization.name,
    role: om.role,
  }));

  const currentOrganization = organizations.find((org) => org.id === organizationId);

  return (
    <header>
      {/* Pass server-fetched data instead of using WorkOS widgets */}
      <CustomOrganizationSwitcher
        organizations={organizations}
        currentOrganization={currentOrganization}
        onSwitchOrganization={switchToOrganization}
      />
    </header>
  );
}
```

### Create Custom Organization Switcher

```typescript
"use client";

import { DropdownMenu } from "@radix-ui/themes";
import { useState } from "react";

type Organization = {
  id: string;
  name: string;
  role: string;
};

type CustomOrganizationSwitcherProps = {
  organizations: Organization[];
  currentOrganization: Organization | undefined;
  onSwitchOrganization: (params: { organizationId: string }) => Promise<void>;
};

export function CustomOrganizationSwitcher({
  organizations,
  currentOrganization,
  onSwitchOrganization,
}: CustomOrganizationSwitcherProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSwitch = async (orgId: string) => {
    setIsLoading(true);
    try {
      await onSwitchOrganization({ organizationId: orgId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {currentOrganization?.name || "Select Organization"}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {organizations.map((org) => (
          <DropdownMenu.Item
            key={org.id}
            onClick={() => handleSwitch(org.id)}
            disabled={isLoading}
          >
            {org.name} {org.id === currentOrganization?.id && "✓"}
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
```

---

## Recommended Approach

**For Development:**
1. Use **Solution 1**: Configure CORS in WorkOS Dashboard
2. This is the quickest fix and officially supported by WorkOS

**For Production:**
1. Use **Solution 3**: Server-side data fetching
2. Better security (no direct API calls from browser)
3. More control over data and UI
4. Easier to test and debug

---

## Quick Fix (Test if CORS is the only issue)

If you just want to test, you can temporarily use a browser extension to disable CORS:
- **Chrome:** Install "CORS Unblock" extension
- **Firefox:** Install "CORS Everywhere" extension

⚠️ **WARNING:** Only use this for local testing! Never deploy with CORS disabled.

---

## Verifying the Fix

After applying the fix, check the browser console:
1. Open DevTools (F12)
2. Go to Console tab
3. You should see:
   ```
   Fetching subscription for: { userId: "user_xxx", organizationId: "org_xxx" }
   Subscription info received: { plan: "pro", status: "active", ... }
   ```
4. No CORS errors

---

## Additional Resources

- [WorkOS Documentation - AuthKit Setup](https://workos.com/docs/user-management/authentication)
- [WorkOS Widgets Documentation](https://workos.com/docs/user-management/widgets)
- [Next.js CORS Configuration](https://nextjs.org/docs/api-routes/api-middlewares#cors)

---

## Still Having Issues?

If you still see CORS errors after configuring WorkOS:

1. **Clear Browser Cache:**
   ```bash
   Ctrl+Shift+Delete (Chrome/Firefox)
   # Or open DevTools → Application → Clear storage
   ```

2. **Restart Dev Server:**
   ```bash
   cd apps/next
   npm run dev
   ```

3. **Check WorkOS Environment:**
   - Ensure you're using the correct `WORKOS_CLIENT_ID` (matches your environment)
   - Verify `WORKOS_API_KEY` starts with `sk_test_` for development

4. **Contact WorkOS Support:**
   - Email: support@workos.com
   - Include: Environment ID, error message, and browser console logs

