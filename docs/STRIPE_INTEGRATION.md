# Stripe Integration Guide

This document describes the complete Stripe integration for the Humanize project, including setup, configuration, and usage.

## Overview

The Stripe integration provides:
- Subscription management (Basic, Pro, Ultra plans)
- Usage tracking (words per month, requests per month)
- Automatic limit enforcement
- Webhook handling for subscription lifecycle events
- Integration with WorkOS for user/organization management

## Architecture

### Backend (FastAPI)
- **Subscription Endpoints**: `/api/v1/subscriptions/check`, `/api/v1/subscriptions/usage`
- **Humanization Endpoint**: Updated to check subscription limits before processing
- **Subscription Models**: Pydantic models for subscription data
- **Convex Integration**: Queries Convex for subscription and usage data

### Frontend (Next.js)
- **Pricing Component**: Integrated with Stripe Checkout
- **Subscription API Client**: `lib/subscription-api.ts`
- **Humanize API Client**: Updated to include user/org headers
- **Modal Dialog**: Subscription checkout flow

### Database (Convex)
- **Organizations Table**: Stores subscription plan, status, Stripe customer/subscription IDs
- **Usage Table**: Tracks monthly word and request usage per organization/user
- **Subscription Functions**: Query and update subscription data
- **Usage Functions**: Track and query usage data

## Setup

### 1. Environment Variables

#### Backend (.env in backend/)
```env
# Stripe Configuration
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Convex Configuration (for subscription queries)
CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOYMENT_KEY=...
```

#### Frontend (.env.local in apps/next/)
```env
# Stripe Configuration
STRIPE_API_KEY=sk_test_...

# Already configured in env.ts:
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_PYTHON_API_URL=http://localhost:8000
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

### 2. Stripe Products Setup

Create products and prices in Stripe with the following lookup keys:
- `basic-monthly`
- `basic-annual`
- `pro-monthly`
- `pro-annual`
- `ultra-monthly`
- `ultra-annual`

You can use the setup script:
```bash
cd apps/next
pnpm run setup
```

### 3. Stripe Webhook Setup

1. Create a webhook endpoint in Stripe Dashboard:
   - URL: `https://your-domain.com/stripe-webhook` (or use Stripe CLI for local testing)
   - Events: 
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`

2. Get the webhook secret and add it to environment variables:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

3. For local testing with Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/stripe-webhook
   ```

## Subscription Plans

| Plan   | Monthly Words | Request Limit | Words/Request | Monthly Price | Annual Price |
|--------|---------------|---------------|---------------|---------------|--------------|
| Free   | 2,500         | 10            | 500           | Free          | Free         |
| Basic  | 5,000         | 100           | 500           | $5.99         | $2.99        |
| Pro    | 15,000        | 500           | 1,500         | $19.99        | $9.99        |
| Ultra  | 30,000        | 1,000         | 3,000         | $39.99        | $19.99       |

## Usage

### Frontend: Check Subscription

```typescript
import { checkSubscription } from "@/lib/subscription-api";

const subscription = await checkSubscription(userId, organizationId);
console.log(subscription.plan); // "free" | "basic" | "pro" | "ultra"
console.log(subscription.words_remaining); // remaining words this month
```

### Frontend: Humanize Text with Subscription

The humanize API client automatically includes user/org headers when provided:

```typescript
import { humanizeText } from "@/lib/humanize-api";

const response = await humanizeText(
  {
    input_text: "Your text here",
    tone: "academic",
    length_mode: "standard",
  },
  userId,        // Optional: WorkOS user ID
  organizationId // Optional: WorkOS organization ID
);
```

### Backend: Check Limits in Endpoint

The humanization endpoint automatically checks subscription limits:

```python
# Headers required:
X-User-Id: <workos_user_id>
X-Organization-Id: <workos_org_id>  # Optional

# The endpoint will:
# 1. Check subscription plan
# 2. Verify word count per request limit
# 3. Verify monthly word limit
# 4. Return 403 if limits exceeded
```

## Subscription Flow

1. **User selects plan** on `/pricing` page
2. **Modal dialog** opens asking for organization name
3. **Subscribe API** (`/api/subscribe`) creates:
   - WorkOS organization
   - Stripe customer
   - Stripe checkout session
4. **User redirected** to Stripe Checkout
5. **After payment**, Stripe webhook fires:
   - `checkout.session.completed`
   - `customer.subscription.created`
6. **Webhook handler** updates Convex:
   - Sets subscription plan
   - Sets subscription status to "active"
   - Stores Stripe customer/subscription IDs
7. **User redirected** to dashboard

## Webhook Events

### `checkout.session.completed`
- Triggered when checkout completes
- Links Stripe customer to WorkOS organization

### `customer.subscription.created`
- Triggered when subscription is created
- Updates Convex with subscription plan and status

### `customer.subscription.updated`
- Triggered when subscription changes (plan upgrade/downgrade, renewal, etc.)
- Updates Convex with new subscription details

### `customer.subscription.deleted`
- Triggered when subscription is cancelled
- Updates Convex subscription status to "cancelled"

## Usage Tracking

Usage is tracked automatically:
- When humanization request succeeds, usage is recorded
- Monthly limits reset at the start of each billing period
- Usage is tracked per organization (if user has org) or per user

## Testing

### Test Cards (Stripe Test Mode)
- **Success**: `4242 4242 4242 4242`
- **Requires Authentication**: `4000 0025 0000 3155`
- **Declined**: `4000 0000 0000 9995`

### Local Testing
1. Start backend: `cd backend && uv run uvicorn src.index:app --reload`
2. Start frontend: `cd apps/next && pnpm dev`
3. Start Convex: `cd apps/next && pnpm dev:convex`
4. Use Stripe CLI for webhooks: `stripe listen --forward-to localhost:3000/stripe-webhook`

## Error Handling

### Subscription Limit Exceeded (403)
```json
{
  "detail": "Request limit exceeded. Your plan (free) allows up to 500 words per request, but you provided 600 words."
}
```

### Monthly Limit Exceeded (403)
```json
{
  "detail": "Monthly limit exceeded. You have 100 words remaining this month, but your request requires 200 words."
}
```

## Troubleshooting

### "Subscription check failed, proceeding anyway"
- Check CONVEX_URL is set correctly
- Verify Convex deployment is running
- Check network connectivity to Convex

### "Price not found for subscription level"
- Verify Stripe products/prices are created
- Check lookup keys match exactly (case-sensitive)
- Run setup script to create products

### Webhooks not firing
- Verify webhook secret is correct
- Check webhook URL is accessible
- Use Stripe CLI for local testing
- Check Convex deployment is running

## Next Steps

1. **Usage Tracking**: Implement actual usage tracking mutations in Convex
2. **Billing Portal**: Add link to Stripe billing portal for subscription management
3. **Usage Dashboard**: Show usage charts and statistics
4. **Plan Upgrades**: Add upgrade flow for existing subscribers
5. **Usage Alerts**: Notify users when approaching limits

