# Multiple Workspaces Quick Reference

## 🎯 Key Concept

Your application uses the **Multiple Workspaces** model where users can:
- Be members of multiple organizations simultaneously
- Create unlimited organizations
- Switch between organizations
- Invite others to their organizations

## 📋 Quick Checklist

### ✅ What's Already Configured

- [x] Database schema with organization memberships tracking
- [x] Webhook handlers for membership events
- [x] Organization switcher in header
- [x] Create organization functionality
- [x] Switch organization functionality  
- [x] Router handles multiple organizations
- [x] Team management page
- [x] Invitation system

### ⚙️ WorkOS Dashboard Setup Required

1. **Enable Webhook Events**
   - URL: `https://your-domain.com/api/workos-webhook`
   - Events: `user.*`, `organization.*`, `organization_membership.*`

2. **Configure Environment Variables**
   ```bash
   WORKOS_API_KEY=sk_...
   WORKOS_CLIENT_ID=client_...
   WORKOS_WEBHOOK_SECRET=...
   ```

## 🚀 User Flows

### Creating a New Organization
1. User clicks organization switcher
2. Clicks "Add new team"
3. Enters organization name
4. Automatically becomes admin of new org

### Switching Organizations
1. User clicks organization switcher
2. Selects different organization
3. Session context updates
4. Page refreshes with new context

### Inviting Team Members
1. Navigate to Dashboard → Team
2. Click "Invite Member"
3. Enter email and role
4. Invitation sent via WorkOS

## 📁 Key Files

| File | Purpose |
|------|---------|
| `convex/schema.ts` | Database schema with memberships |
| `convex/webhookHandlers.ts` | Webhook event handlers |
| `src/actions/createOrganization.ts` | Create new organization |
| `src/actions/switchToOrganization.ts` | Switch between orgs |
| `src/actions/getUserOrganizations.ts` | Get user's orgs |
| `src/actions/inviteUserToOrganization.ts` | Invite users |
| `src/app/dashboard/team/page.tsx` | Team management UI |

## 🔍 Testing

### Test 1: Multiple Organizations
```bash
1. Sign in as user
2. Create "Org A"
3. Create "Org B"
4. Verify both appear in switcher
5. Switch between them
```

### Test 2: Invitations
```bash
1. Sign in as admin in "Org A"
2. Invite user@example.com
3. Sign in as user@example.com
4. Accept invitation
5. Verify user sees both their org and "Org A"
```

## 🛠️ Common Queries

### Get User's Organizations
```typescript
import { getUserOrganizations } from "@/actions/getUserOrganizations";

const orgs = await getUserOrganizations();
// Returns array of all organizations user belongs to
```

### Check Organization Access
```typescript
import { userHasOrganizationAccess } from "@/actions/getUserOrganizations";

const hasAccess = await userHasOrganizationAccess(orgId);
// Returns boolean
```

### Invite User
```typescript
import { inviteUserToOrganization } from "@/actions/inviteUserToOrganization";

await inviteUserToOrganization({
  organizationId: "org_123",
  email: "user@example.com",
  roleSlug: "member"
});
```

## 🎨 UI Components

### Organization Switcher
```tsx
<OrganizationSwitcherHeader
  authToken={authToken}
  onSwitchOrganization={handleSwitch}
  onCreateTeam={handleCreate}
/>
```

Located in: Header (top right)

## 📚 Full Documentation

See `MULTIPLE_WORKSPACES_SETUP.md` for comprehensive documentation.

## 🔗 Resources

- [WorkOS Docs](https://workos.com/docs/authkit/users-organizations/organizations/organization-memberships)
- [Convex Docs](https://docs.convex.dev)

---

**Configuration:** Multiple Workspaces ✅  
**Last Updated:** November 2025

