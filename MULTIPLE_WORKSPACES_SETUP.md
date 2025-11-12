# Multiple Workspaces Configuration Guide

This document describes how your application is configured to support the **Multiple Workspaces** model using WorkOS AuthKit.

## Overview

Your application follows the **Multiple Workspaces** pattern, similar to apps like Figma, where:

- ✅ Users can be members of **multiple organizations** simultaneously
- ✅ Users can **create their own workspaces** (organizations)
- ✅ Users can **switch between organizations** seamlessly
- ✅ Users can **invite others** to join their organizations
- ✅ Users can **accept invitations** to join other organizations
- ✅ Data is scoped to organizations, not individual users

Reference: [WorkOS Organization Memberships Documentation](https://workos.com/docs/authkit/users-organizations/organizations/organization-memberships)

## Architecture

### 1. Database Schema (Convex)

Your Convex database tracks three main entities:

```typescript
// convex/schema.ts
export default defineSchema({
  users: defineTable({
    email: v.string(),
    workos_id: v.string(),
  }),

  organizations: defineTable({
    workos_id: v.string(),
    name: v.string(),
  }),

  organizationMemberships: defineTable({
    workos_id: v.string(),
    user_id: v.string(), // WorkOS user ID
    organization_id: v.string(), // WorkOS organization ID
    role: v.string(),
    status: v.string(), // "active", "inactive", "pending"
  })
    .index("by_user", ["user_id"])
    .index("by_organization", ["organization_id"])
    .index("by_workos_id", ["workos_id"]),
});
```

**Key Points:**

- `organizationMemberships` tracks the many-to-many relationship between users and organizations
- Indexed by user and organization for efficient queries
- Status field supports the membership lifecycle (pending → active → inactive)

### 2. Webhook Handlers

Your application listens to WorkOS webhooks to keep the local database in sync:

```typescript
// convex/http.ts
case "organization_membership.created": // User joins an organization
case "organization_membership.updated": // Membership role or status changes
case "organization_membership.deleted": // User leaves an organization
```

**Supported Events:**

- `user.created`, `user.updated`, `user.deleted`
- `organization.created`, `organization.updated`, `organization.deleted`
- `organization_membership.created`, `organization_membership.updated`, `organization_membership.deleted`

### 3. Authentication Flow

The router (`/app/router/route.ts`) handles the authentication and organization context:

```typescript
// 1. Check if user is authenticated
// 2. Get all user's organization memberships
// 3. If user has no organizations → redirect to pricing
// 4. If user has organizations but no active context → switch to first org
// 5. Create audit log and redirect based on role
```

**Benefits:**

- Automatic handling of users with multiple organizations
- Graceful fallback for new users without organizations
- Maintains organization context throughout the session

### 4. Organization Switcher

The header includes the WorkOS Organization Switcher widget:

```typescript
<OrganizationSwitcher
  authToken={authToken}
  organizationLabel="Teams"
  switchToOrganization={onSwitchOrganization}
>
  <DropdownMenu.Item onClick={() => setIsModalOpen(true)}>
    Add new team
  </DropdownMenu.Item>
</OrganizationSwitcher>
```

**Features:**

- Lists all organizations the user belongs to
- Allows switching between organizations
- Includes option to create new organizations
- Automatically refreshes session with new organization context

## Key Features

### 1. Creating Organizations

Users can create new organizations at any time:

**Implementation:**

- File: `src/actions/createOrganization.ts`
- Flow:
  1. Create organization via WorkOS API
  2. Add current user as admin member
  3. Switch session to new organization

**UI Location:**

- Organization switcher dropdown → "Add new team"
- Pricing page → Subscribe button (creates org + subscription)

### 2. Switching Organizations

Users can switch between their organizations:

**Implementation:**

- File: `src/actions/switchToOrganization.ts`
- Flow:
  1. Refresh session with new organization ID
  2. Handle SSO/MFA requirements if needed
  3. Revalidate page and redirect

**UI Location:**

- Header → Organization Switcher widget

### 3. Inviting Users

Organization admins can invite users to join:

**Implementation:**

- File: `src/actions/inviteUserToOrganization.ts`
- Functions:
  - `inviteUserToOrganization()` - Create invitation
  - `listOrganizationInvitations()` - View pending invitations
  - `revokeInvitation()` - Cancel invitation

**UI Location:**

- Dashboard → Team page (`/dashboard/team`)

### 4. Team Management

View and manage organization members:

**Implementation:**

- File: `src/app/dashboard/team/page.tsx`
- Features:
  - List all active members with roles and status
  - View pending invitations
  - See join dates and member details
  - Information about Multiple Workspaces model

**UI Location:**

- Dashboard → Team navigation item

### 5. Utility Functions

Helper functions for working with multiple organizations:

**Implementation:**

- File: `src/actions/getUserOrganizations.ts`
- Functions:
  - `getUserOrganizations()` - Get all user's organizations with details
  - `getUserMemberships()` - Get detailed membership information
  - `userHasOrganizationAccess()` - Check if user can access specific org

## User Flows

### New User Flow

1. User signs up via AuthKit
2. Redirected to `/router`
3. Router checks for organizations
4. No organizations found → redirect to `/pricing`
5. User subscribes and creates first organization
6. Redirected to dashboard with organization context

### Existing User Flow

1. User signs in via AuthKit
2. Redirected to `/router`
3. Router checks for organizations
4. Multiple organizations found → switch to first/last used org
5. User can switch organizations via header widget
6. Session context updates automatically

### Invitation Flow

1. Admin invites user via email
2. User receives invitation email (sent by WorkOS)
3. User clicks link in email
4. AuthKit handles invitation acceptance
5. Webhook creates membership record
6. User can now see and access the organization

## Configuration Checklist

### ✅ Completed Setup

- [x] Database schema includes `organizationMemberships` table
- [x] Webhook handlers process membership events
- [x] Router handles multiple organizations correctly
- [x] Organization switcher widget integrated
- [x] Create organization functionality
- [x] Switch organization functionality
- [x] Invitation system implemented
- [x] Team management page created
- [x] Utility functions for organization queries

### Required WorkOS Configuration

In your WorkOS Dashboard, ensure:

1. **Webhook Events Enabled:**
   - Navigate to: Dashboard → Webhooks
   - Add webhook endpoint: `https://your-domain.com/api/workos-webhook`
   - Enable events:
     - `user.*`
     - `organization.*`
     - `organization_membership.*`

2. **AuthKit Settings:**
   - Navigate to: Dashboard → AuthKit
   - Enable authentication methods (Email, OAuth, SSO)
   - Configure redirect URIs
   - Set session timeout preferences

3. **Organization Settings:**
   - Navigate to: Dashboard → Organizations
   - Enable "Allow users to create organizations"
   - Configure organization roles (admin, member, etc.)
   - Set up domain verification if needed

### Environment Variables

Ensure these are set in your `.env.local`:

```bash
# WorkOS Configuration
WORKOS_API_KEY=sk_...
WORKOS_CLIENT_ID=client_...
WORKOS_COOKIE_PASSWORD=... # 32+ character secret
WORKOS_REDIRECT_URI=http://localhost:3000/callback
WORKOS_WEBHOOK_SECRET=... # From WorkOS Dashboard

# Application
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Testing Multiple Workspaces

### Test Scenario 1: User Creates Multiple Organizations

1. Sign in as a user
2. Click organization switcher → "Add new team"
3. Create "Organization A"
4. Click organization switcher → "Add new team" again
5. Create "Organization B"
6. Verify both organizations appear in switcher
7. Switch between them and verify context changes

### Test Scenario 2: User Receives Invitation

1. Sign in as Admin user in "Organization A"
2. Go to Dashboard → Team
3. Invite user2@example.com
4. Sign in as user2@example.com
5. Check email for invitation
6. Accept invitation
7. Verify user2 now sees both their personal org and "Organization A"

### Test Scenario 3: Data Isolation

1. Sign in as user in "Organization A"
2. Create some data (API keys, settings, etc.)
3. Switch to "Organization B"
4. Verify "Organization A" data is not visible
5. Create different data in "Organization B"
6. Switch back to "Organization A"
7. Verify original data still exists and "Organization B" data is not visible

## Differences from Single Workspace Model

If you wanted to switch to a **Single Workspace** model instead:

| Aspect                | Multiple Workspaces (Current) | Single Workspace                |
| --------------------- | ----------------------------- | ------------------------------- |
| User-Org Relationship | Many-to-Many                  | One-to-One                      |
| Organization Switcher | Visible, allows switching     | Hidden or removed               |
| User can create orgs  | Yes, unlimited                | Usually no                      |
| Invitations           | User can join multiple        | User limited to one             |
| Data ownership        | Organization owns data        | Organization owns data          |
| Use cases             | Productivity apps, agencies   | Enterprise tools, internal apps |

## Best Practices

### 1. Always Check Organization Context

When querying data, always filter by current organization:

```typescript
const { organizationId } = await withAuth({ ensureSignedIn: true });

// Filter data by organization
const data = await db
  .query("items")
  .filter((q) => q.eq(q.field("organization_id"), organizationId))
  .collect();
```

### 2. Verify Organization Access

Before allowing actions, verify user has access:

```typescript
import { userHasOrganizationAccess } from "@/actions/getUserOrganizations";

const hasAccess = await userHasOrganizationAccess(organizationId);
if (!hasAccess) {
  throw new Error("Access denied");
}
```

### 3. Use Soft Deletes for Members

Consider using deactivation instead of deletion for membership management:

```typescript
// Instead of deleting
await workos.userManagement.deleteOrganizationMembership(membershipId);

// Use deactivation (if member might return)
await workos.userManagement.deactivateOrganizationMembership(membershipId);
```

### 4. Handle Organization Switching Gracefully

When users switch organizations, ensure:

- Session is properly refreshed
- Page state is cleared/reloaded
- Cached data is invalidated
- User sees appropriate loading states

## Troubleshooting

### Issue: User not seeing all their organizations

**Solution:**

1. Check webhook events are being received
2. Verify `organizationMemberships` table is populated
3. Check WorkOS Dashboard for membership status
4. Ensure user's memberships are "active" status

### Issue: Data leaking between organizations

**Solution:**

1. Audit all database queries to ensure they filter by `organizationId`
2. Check API routes validate organization access
3. Review Convex functions for proper organization scoping
4. Test with multiple users across organizations

### Issue: Organization switcher not appearing

**Solution:**

1. Verify user has active organization context
2. Check `authToken` is being generated
3. Ensure WorkOS widgets package is installed
4. Check browser console for errors

## Additional Resources

- [WorkOS AuthKit Documentation](https://workos.com/docs/authkit)
- [Organization Memberships](https://workos.com/docs/authkit/users-organizations/organizations/organization-memberships)
- [WorkOS Node SDK](https://github.com/workos/workos-node)
- [Convex Documentation](https://docs.convex.dev)

## Support

For issues specific to:

- **WorkOS AuthKit:** [WorkOS Support](https://workos.com/support)
- **Convex:** [Convex Discord](https://convex.dev/community)
- **Application Logic:** Review this documentation and codebase

---

Last Updated: November 2025
Configuration Model: **Multiple Workspaces** ✅
