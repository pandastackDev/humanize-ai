# Backend Subscription Architecture ✅

## Overview

The subscription system now uses a **dual-layer approach** for maximum reliability:

1. **Frontend fallback**: Creates organization in Convex immediately during subscription
2. **Backend source of truth**: Webhook updates subscription data in Convex after payment

This ensures the organization exists in Convex even if webhooks fail temporarily.

## Complete Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  SUBSCRIPTION FLOW                          │
└─────────────────────────────────────────────────────────────┘

User clicks "Subscribe" on Pro plan
  ↓
┌──────────────────────────────────────────────────────────────┐
│ FRONTEND: /api/subscribe (Next.js API Route)                │
│ Location: apps/next/src/app/api/subscribe/route.ts          │
├──────────────────────────────────────────────────────────────┤
│ 1. Create organization in WorkOS                            │
│    - Organization created with name                          │
│    - Returns organization ID                                 │
│                                                              │
│ 2. Create organization in Convex (FALLBACK)                 │
│    - Ensures organization exists for immediate use           │
│    - POST /api/mutation organizations:create                 │
│                                                              │
│ 3. Create membership in WorkOS                              │
│    - Links user to organization with "admin" role            │
│                                                              │
│ 4. Create Stripe customer                                   │
│    - Links to WorkOS organization via metadata               │
│                                                              │
│ 5. Create Stripe checkout session                           │
│    - success_url: /                                          │
│    - Metadata: workOSOrganizationId, userId                  │
│                                                              │
│ 6. Redirect user to Stripe payment                          │
└──────────────────────────────────────────────────────────────┘
  ↓
User completes payment on Stripe
  ↓
┌──────────────────────────────────────────────────────────────┐
│ BACKEND: Stripe Webhook Handler (FastAPI)                   │
│ Location: backend/src/api/v1/endpoints/webhooks.py          │
│ Endpoint: POST /api/v1/webhooks/stripe                      │
├──────────────────────────────────────────────────────────────┤
│ Event: checkout.session.completed                           │
│ Event: customer.subscription.created                        │
│                                                              │
│ 1. Verify Stripe webhook signature                          │
│    - Ensures request is from Stripe                          │
│    - Uses STRIPE_WEBHOOK_SECRET                              │
│                                                              │
│ 2. Extract subscription data                                │
│    - customer_id from Stripe                                 │
│    - subscription_id from Stripe                             │
│    - price_lookup_key (e.g., "pro-annual")                  │
│    - organization_id from customer metadata                  │
│                                                              │
│ 3. Parse plan from lookup key                               │
│    - "pro-annual" → plan: "pro", billing: "annual"          │
│    - "basic-monthly" → plan: "basic", billing: "monthly"    │
│                                                              │
│ 4. Check if organization exists in Convex                   │
│    - Query: subscriptions:getByWorkosId                      │
│    - If not found: create organization first                 │
│    - Uses: create_organization_in_convex()                   │
│                                                              │
│ 5. Update subscription in Convex                            │
│    - Mutation: subscriptions:updateSubscription              │
│    - Sets: subscription_plan, subscription_status            │
│    - Sets: billing_period, stripe IDs                        │
│                                                              │
│ 6. Return 200 OK to Stripe                                  │
│    - Stripe stops retrying on success                        │
└──────────────────────────────────────────────────────────────┘
  ↓
User redirected to homepage (/)
  ↓
┌──────────────────────────────────────────────────────────────┐
│ FRONTEND: Check Subscription Status                         │
│ Location: apps/next/src/app/components/humanize-editor.tsx  │
├──────────────────────────────────────────────────────────────┤
│ 1. Fetch subscription on component mount                    │
│    - useEffect calls checkSubscription()                     │
│    - API: /api/v1/subscriptions/check                       │
│                                                              │
│ 2. Backend queries Convex                                   │
│    - Query: subscriptions:getByWorkosId                      │
│    - Returns: plan, status, limits, usage                    │
│                                                              │
│ 3. Update word limit display                                │
│    - Pro plan: 0/1500 words ✅                              │
│    - Basic: 0/500 words                                      │
│    - Ultra: 0/3000 words                                     │
│                                                              │
│ 4. Enable premium features                                  │
│    - Advanced AI Humanizer                                   │
│    - Higher word limits                                      │
└──────────────────────────────────────────────────────────────┘
```

## Backend Functions

### 1. `get_organization_from_convex(organization_id: str)`

**Purpose**: Check if organization exists in Convex

**File**: `backend/src/api/v1/endpoints/webhooks.py`

```python
async def get_organization_from_convex(organization_id: str) -> dict | None:
    """Query Convex for organization data"""
    query_url = f"{settings.CONVEX_URL}/api/query"
    query_data = {
        "path": "subscriptions:getByWorkosId",
        "args": {"workos_id": organization_id},
        "format": "json",
    }
    response = await client.post(query_url, json=query_data, headers=headers)
    return response.json() if response.status_code == 200 else None
```

### 2. `create_organization_in_convex(organization_id, name)`

**Purpose**: Create organization in Convex if it doesn't exist

**File**: `backend/src/api/v1/endpoints/webhooks.py`

```python
async def create_organization_in_convex(
    organization_id: str, 
    organization_name: str
) -> bool:
    """Create new organization record in Convex"""
    mutation_url = f"{settings.CONVEX_URL}/api/mutation"
    mutation_data = {
        "path": "organizations:create",
        "args": {
            "workos_id": organization_id,
            "name": organization_name,
        },
        "format": "json",
    }
    response = await client.post(mutation_url, json=mutation_data, headers=headers)
    return response.status_code == 200
```

### 3. `update_subscription_in_convex(organization_id, subscription_data)`

**Purpose**: Update subscription details (plan, status, etc.)

**File**: `backend/src/api/v1/endpoints/webhooks.py`

```python
async def update_subscription_in_convex(
    organization_id: str, 
    subscription_data: dict
) -> bool:
    """Update subscription in Convex, creating org if needed"""
    
    # Check if organization exists
    org = await get_organization_from_convex(organization_id)
    
    if not org:
        # Create it first
        org_name = subscription_data.get("organization_name", f"Organization {organization_id[:8]}")
        await create_organization_in_convex(organization_id, org_name)
    
    # Now update the subscription
    mutation_url = f"{settings.CONVEX_URL}/api/mutation"
    mutation_data = {
        "path": "subscriptions:updateSubscription",
        "args": {
            "organization_id": organization_id,
            **subscription_data,  # subscription_plan, subscription_status, etc.
        },
        "format": "json",
    }
    response = await client.post(mutation_url, json=mutation_data, headers=headers)
    return response.status_code == 200
```

### 4. `get_subscription_from_convex(user_id, organization_id)`

**Purpose**: Query subscription status for frontend

**File**: `backend/src/api/v1/endpoints/subscriptions.py`

```python
async def get_subscription_from_convex(
    user_id: str, 
    organization_id: str | None
) -> dict | None:
    """Query Convex for subscription info"""
    query_url = f"{settings.CONVEX_URL}/api/query"
    query_data = {
        "path": "subscriptions:getByWorkosId",
        "args": {"workos_id": organization_id},
        "format": "json",
    }
    response = await client.post(query_url, json=query_data, headers=headers)
    
    if response.status_code == 200:
        org_data = response.json()
        return {
            "plan": org_data.get("subscription_plan", "free"),
            "status": org_data.get("subscription_status", "active"),
            "billing_period": org_data.get("billing_period", "monthly"),
            # ... more fields
        }
    return None
```

## Convex Schema

```typescript
// apps/next/convex/schema.ts
organizations: defineTable({
  workos_id: v.string(),              // WorkOS organization ID
  name: v.string(),                    // Organization name
  stripe_customer_id: v.optional(v.string()),
  stripe_subscription_id: v.optional(v.string()),
  subscription_plan: v.optional(      // ← Updated by webhook
    v.union(
      v.literal("free"),
      v.literal("basic"),
      v.literal("pro"),
      v.literal("ultra")
    )
  ),
  subscription_status: v.optional(    // ← Updated by webhook
    v.union(
      v.literal("active"),
      v.literal("cancelled"),
      v.literal("past_due"),
      v.literal("unpaid"),
      v.literal("trialing")
    )
  ),
  billing_period: v.optional(         // ← Updated by webhook
    v.union(v.literal("monthly"), v.literal("annual"))
  ),
  current_period_end: v.optional(v.number()),
  word_balance: v.optional(v.number()), // For one-time word purchases
})
```

## Environment Variables

### Backend (`backend/.env`)

```bash
# Convex
CONVEX_URL=https://efficient-puma-893.convex.cloud
CONVEX_DEPLOYMENT_KEY=dev:efficient-puma-893

# Stripe
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  ← REQUIRED!
```

### Frontend (`apps/next/.env.local`)

```bash
# Convex
NEXT_PUBLIC_CONVEX_URL=https://efficient-puma-893.convex.cloud
CONVEX_DEPLOYMENT=dev:efficient-puma-893

# Stripe
STRIPE_API_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Word Limits by Plan

| Plan  | Per Request | Per Month | Updated By         |
|-------|-------------|-----------|-------------------|
| Free  | 500         | 2,500     | Default           |
| Basic | 500         | 5,000     | Webhook           |
| Pro   | **1,500**   | 15,000    | Webhook ← fixes this |
| Ultra | 3,000       | 30,000    | Webhook           |

## Testing the Backend Flow

### 1. Start Backend Server

```bash
cd backend
source .venv/bin/activate
uvicorn src.api.main:app --reload --port 8000
```

### 2. Configure Stripe Webhook

For local testing, use ngrok:

```bash
# Terminal 3
ngrok http 8000

# Use ngrok URL in Stripe Dashboard
# Example: https://xxxx.ngrok.io/api/v1/webhooks/stripe
```

### 3. Subscribe to Pro Plan

```bash
# Open http://localhost:3000/pricing
# Click Subscribe on Pro plan
# Complete payment with test card: 4242 4242 4242 4242
```

### 4. Check Backend Logs

You should see:

```
INFO: Received Stripe webhook: customer.subscription.created
INFO: Organization org_xxx not found in Convex, creating it
INFO: Successfully created organization in Convex: org_xxx
INFO: Successfully updated subscription in Convex for org_xxx
```

### 5. Verify in Convex Dashboard

```json
{
  "workos_id": "org_xxx",
  "name": "John's Organization",
  "subscription_plan": "pro",           ← Should be "pro"
  "subscription_status": "active",      ← Should be "active"  
  "billing_period": "annual",
  "stripe_customer_id": "cus_xxx",
  "stripe_subscription_id": "sub_xxx"
}
```

### 6. Check Frontend

- Go to AI Humanizer
- Word limit should show: **`0/1500 words`** ✅

## Troubleshooting

### Issue: Organization not created in Convex

**Symptom**: Word limit still shows 500 after Pro subscription

**Check**:
1. Backend logs - did webhook fire?
2. Stripe Dashboard → Webhooks → Logs
3. `STRIPE_WEBHOOK_SECRET` matches in backend/.env
4. Convex dashboard - organization exists?

**Fix**: Manually create organization in Convex dashboard

### Issue: Webhook signature invalid

**Symptom**: 400 error in Stripe webhook logs

**Fix**: 
1. Get signing secret from Stripe Dashboard
2. Update `backend/.env`: `STRIPE_WEBHOOK_SECRET=whsec_xxx`
3. Restart backend server

### Issue: Convex mutation fails

**Symptom**: 500 error in backend logs

**Check**:
1. `CONVEX_URL` is correct
2. `CONVEX_DEPLOYMENT_KEY` matches deployment
3. Organization schema exists in Convex

## Summary

✅ **Backend** now handles:
- Creating organizations in Convex (if missing)
- Updating subscriptions via webhooks
- Querying subscription status for frontend

✅ **Frontend** gets:
- Real-time subscription data
- Correct word limits (500 → 1500 for Pro)
- "Manage Subscription" button for paid users

✅ **Convex** stores:
- Organizations with subscription data
- Usage tracking
- Word balances

The system is now fully integrated with proper backend architecture! 🎉

