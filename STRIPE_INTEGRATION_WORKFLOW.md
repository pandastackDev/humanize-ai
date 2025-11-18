# Stripe Integration Workflow Documentation

## Overview

This document describes the complete Stripe integration workflow for the Humanize app, including Next.js frontend, FastAPI backend, WorkOS AuthKit, and Convex database.

## Architecture

```
User Browser
    │
    │ Login → WorkOS AuthKit
    ▼
Next.js Frontend
    │
    │ Choose Plan: Basic / Pro / Ultra
    ▼
Next.js API Route (/api/subscribe)
    │
    ▼
Stripe Checkout ←───────────────┐
    │                         │ Webhooks
    ▼                         │
Stripe Billing Portal           │
                                ▼
                         FastAPI Backend
                         - Save subscription
                         - Save word limits
                         - Enforce plan rules
                         - Track monthly usage
                                │
                                ▼
                      Convex Database
                                │
                                ▼
                    Next.js → /api/v1/billing/status
```

## Pricing Plans

| Plan | Monthly Price | Annual Price | Monthly Words | Max Words/Request | Detectors | Priority |
|------|--------------|--------------|---------------|-------------------|-----------|----------|
| Basic | $5.99 | $2.99 | 5,000 | 500 | Turnitin, GPTZero, QuillBot | ❌ |
| Pro | $19.99 | $9.99 | 15,000 | 1,500 | + ZeroGPT, Originality, Copyleaks | ❌ |
| Ultra | $39.99 | $19.99 | 30,000 | 3,000 | All + Priority processing | ✅ |

## Workflow Steps

### 1. User Login - WorkOS AuthKit

**Flow:**
1. User clicks "Sign In"
2. Redirected to: `https://api.workos.com/user_management/authorize`
3. After login, WorkOS redirects back to: `http://localhost:3000/callback`
4. Next.js stores the session in a JWT cookie

**Configuration Required:**
- WorkOS Dashboard → Redirect URLs:
  - `http://localhost:3000/callback`
  - `http://localhost:3000/sign-in`
  - `https://your-production-domain.com/callback`
  - `https://your-production-domain.com/sign-in`

### 2. User Selects Plan → Next.js Creates Stripe Checkout Session

**Endpoint:** `POST /api/subscribe`

**Frontend sends:**
```json
{
  "userId": "user_01K9V...",
  "subscriptionLevel": "pro-annual"
}
```

**Next.js API Route:**
1. Validates WorkOS session (gets user ID + email)
2. Creates WorkOS organization if needed
3. Creates WorkOS organization membership
4. Maps plan → Stripe price lookup key:
   - `basic-monthly` → Stripe price with lookup key `basic-monthly`
   - `basic-annual` → Stripe price with lookup key `basic-annual`
   - `pro-monthly` → Stripe price with lookup key `pro-monthly`
   - `pro-annual` → Stripe price with lookup key `pro-annual`
   - `ultra-monthly` → Stripe price with lookup key `ultra-monthly`
   - `ultra-annual` → Stripe price with lookup key `ultra-annual`
5. Creates Stripe customer
6. Links Stripe customer to WorkOS organization
7. Creates Stripe checkout session with metadata:
   ```typescript
   {
     mode: "subscription",
     success_url: "/dashboard",
     cancel_url: "/pricing",
     metadata: {
       workOSOrganizationId: organization.id,
       userId: userId,
       subscriptionLevel: subscriptionLevel
     }
   }
   ```
8. Returns: `{ "url": "https://checkout.stripe.com/..." }`
9. Browser redirects to Stripe Checkout

### 3. Stripe → FastAPI Webhooks

**Endpoint:** `POST /api/v1/webhooks/stripe`

**FastAPI webhook handler:**
- Verifies Stripe webhook signature using `STRIPE_WEBHOOK_SECRET`
- Handles events:
  - `checkout.session.completed` - Initial subscription creation
  - `customer.subscription.created` - Subscription activated
  - `customer.subscription.updated` - Plan/status changes
  - `customer.subscription.deleted` - Subscription cancelled
  - `invoice.payment_succeeded` - Payment confirmed

**What it does:**
1. Extracts plan from Stripe price lookup key
2. Extracts organization ID from customer metadata
3. Updates Convex database via mutation:
   ```python
   {
     "organization_id": organization_id,
     "subscription_plan": "pro",
     "subscription_status": "active",
     "billing_period": "annual",
     "stripe_customer_id": "cus_...",
     "stripe_subscription_id": "sub_...",
     "current_period_end": 1732462000
   }
   ```

**Stripe Webhook Configuration:**
1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-fastapi-domain.com/api/v1/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
4. Copy webhook signing secret → Set `STRIPE_WEBHOOK_SECRET` in backend `.env`

### 4. Frontend Queries Billing Status via FastAPI

**Endpoint:** `GET /api/v1/billing/status?user_id={userId}&organization_id={orgId}`

**FastAPI returns:**
```json
{
  "active": true,
  "plan": "pro",
  "status": "active",
  "monthly_limit": 15000,
  "max_request_size": 1500,
  "detectors": ["turnitin", "gptzero", "quillbot", "zerogpt", "originality", "copyleaks"],
  "current_period_end": 1732462000,
  "billing_period": "annual"
}
```

**Frontend uses this to:**
- Show available detectors
- Lock features if plan is Basic
- Limit input textarea by plan limit
- Display subscription status

### 5. Enforcing Limits in Humanizer API

**Endpoint:** `POST /api/v1/humanize`

**Backend checks (in order):**
1. **Subscription Status:** Is subscription active?
2. **Request Size:** Is request text length ≤ plan max (e.g., 1500 words for Pro)?
3. **Monthly Limit:** Does user have enough remaining monthly words?
4. **Detector Access:** Should backend enable extra detectors based on plan?

**Implementation:** See `backend/src/api/v1/endpoints/humanize.py`

**Plan-specific rules:**
- **Basic:** Turnitin, GPTZero, QuillBot only
- **Pro:** + ZeroGPT, Originality, Copyleaks
- **Ultra:** All detectors + priority queue

### 6. Customer Portal (Manage Billing)

**Action:** `redirectToBillingPortal(path: string)`

**Next.js:**
1. Gets organization from WorkOS
2. Creates Stripe Billing Portal session:
   ```typescript
   {
     customer: workosOrg.stripe_customer_id,
     return_url: `${BASE_URL}/dashboard/${path}`
   }
   ```
3. Redirects user to: `https://billing.stripe.com/p/session_...`

**User can:**
- Update payment card
- Change plan (upgrade/downgrade)
- Cancel subscription
- View billing history

**Webhook updates backend state** when user makes changes.

### 7. Monthly Reset Job (Future)

**Purpose:** Reset word counters at period end

**Implementation Options:**
- Vercel Cron Job (recommended)
- FastAPI background task
- Stripe webhook: `customer.subscription.updated` (when period ends)

## Configuration

### Environment Variables

**Next.js (.env.local):**
```env
WORKOS_API_KEY=sk_test_...
WORKOS_CLIENT_ID=client_...
WORKOS_COOKIE_PASSWORD=...
STRIPE_API_KEY=sk_test_...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_CONVEX_URL=https://your-convex-url.convex.cloud
```

**Backend (.env):**
```env
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CONVEX_URL=https://your-convex-url.convex.cloud
CONVEX_DEPLOYMENT_KEY=...
```

### Stripe Setup

**Create Products and Prices:**
1. Run setup script: `cd apps/next && pnpm run setup`
2. Or manually create in [Stripe Dashboard](https://dashboard.stripe.com/test/products):
   - Products: Basic Monthly, Basic Annual, Pro Monthly, Pro Annual, Ultra Monthly, Ultra Annual
   - Prices with lookup keys: `basic-monthly`, `basic-annual`, `pro-monthly`, `pro-annual`, `ultra-monthly`, `ultra-annual`

**Webhook Setup:**
1. Add webhook endpoint in Stripe Dashboard
2. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`
3. Configure events (see step 3 above)

## Testing

**Test Cards:**
- Success: `4242 4242 4242 4242`
- Requires Authentication: `4000 0025 0000 3155`
- Declined: `4000 0000 0000 9995`

**Testing Flow:**
1. Sign in with WorkOS AuthKit
2. Go to `/pricing`
3. Click "Subscribe" on a plan
4. Use test card in Stripe Checkout
5. Complete checkout → Redirected to `/dashboard`
6. Check Convex database for subscription record
7. Test humanize endpoint with plan limits
8. Verify detector access matches plan

## Troubleshooting

### WorkOS Redirect Not Working
- ✅ Check redirect URLs in WorkOS Dashboard
- ✅ Verify `NEXT_PUBLIC_BASE_URL` matches redirect URL
- ✅ Ensure `WORKOS_CLIENT_ID` is correct

### Stripe Price Not Found
- ✅ Run `pnpm run setup` to create prices
- ✅ Verify lookup keys match exactly (case-sensitive)
- ✅ Check Stripe Dashboard for created prices

### Webhooks Not Working
- ✅ Verify `STRIPE_WEBHOOK_SECRET` is set
- ✅ Check webhook endpoint URL in Stripe Dashboard
- ✅ Verify FastAPI endpoint is accessible
- ✅ Check FastAPI logs for webhook errors

### Subscription Limits Not Enforced
- ✅ Verify subscription is saved in Convex
- ✅ Check `X-User-Id` and `X-Organization-Id` headers are sent
- ✅ Verify `CONVEX_URL` and `CONVEX_DEPLOYMENT_KEY` are set

## API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/subscribe` | POST | Create Stripe checkout session |
| `/api/v1/billing/status` | GET | Get subscription status and limits |
| `/api/v1/webhooks/stripe` | POST | Handle Stripe webhooks |
| `/api/v1/subscriptions/check` | POST | Check subscription (internal) |
| `/api/v1/humanize` | POST | Humanize text (enforces limits) |

## Next Steps

1. ✅ Set up Stripe products and prices
2. ✅ Configure Stripe webhooks
3. ✅ Test full subscription flow
4. ⏳ Implement monthly reset job
5. ⏳ Add usage tracking dashboard
6. ⏳ Add plan upgrade/downgrade UI

