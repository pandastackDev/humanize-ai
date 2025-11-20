# Subscription Flow Testing Guide

## Current Implementation Status ✅

The subscription system has been updated to properly save data to Convex database. Here's what happens now:

### When User Subscribes (Pro Plan Example)

```
1. User clicks "Subscribe" on Pro plan
   ↓
2. POST /api/subscribe 
   - Creates WorkOS organization
   - Creates organization in Convex ✅ (FIXED)
   - Creates organization membership in WorkOS
   - Creates membership in Convex ✅ (FIXED)
   - Creates Stripe customer
   - Creates Stripe checkout session
   ↓
3. User completes payment on Stripe
   ↓
4. Stripe webhook fires: customer.subscription.created
   ↓
5. Webhook updates Convex:
   - subscription_plan: "pro"
   - subscription_status: "active"
   - billing_period: "monthly" or "annual"
   ↓
6. User redirected to homepage (/)
   ↓
7. Frontend fetches subscription from backend
   ↓
8. Backend queries Convex for organization
   ↓
9. Word limit updates: 0/1500 words ✅
```

## Word Limits by Plan

| Plan  | Words per Request | Words per Month |
|-------|-------------------|-----------------|
| Free  | 500               | 2,500           |
| Basic | 500               | 5,000           |
| Pro   | **1,500**         | 15,000          |
| Ultra | 3,000             | 30,000          |

## Testing Checklist

### ✅ Step 1: Check Environment Variables

Make sure these are set in your `.env.local`:

```bash
# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
CONVEX_DEPLOYMENT=prod:your-deployment-key

# WorkOS
WORKOS_API_KEY=sk_live_xxx
WORKOS_CLIENT_ID=client_xxx

# Stripe
STRIPE_API_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

Backend `.env`:

```bash
CONVEX_URL=https://your-project.convex.cloud
CONVEX_DEPLOYMENT_KEY=prod:your-deployment-key
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### ✅ Step 2: Configure Stripe Webhook

**Option A: Use FastAPI Webhook (Recommended)**

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/v1/webhooks/stripe`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `checkout.session.completed`

**Option B: Use Convex Webhook**

1. Add endpoint: `https://your-domain.com/stripe-webhook`
2. Select same events as above

### ✅ Step 3: Test Subscription Flow

1. **Clear existing data (if testing again):**
   ```javascript
   // In Convex dashboard, delete test organizations
   // Or use a new test user email
   ```

2. **Subscribe to Pro plan:**
   - Open browser console (F12)
   - Go to `/pricing`
   - Click "Subscribe" on Pro plan
   - Check console logs:
     ```
     Creating WorkOS organization: John's Organization
     Organization created: org_xxx
     Creating organization in Convex: { workosId: "org_xxx", name: "John's Organization" }
     Organization created in Convex successfully
     Creating organization membership with admin role
     ```

3. **Complete Stripe payment:**
   - Use test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any CVC

4. **After redirect to homepage:**
   - Check console logs:
     ```
     Fetching subscription for: { userId: "user_xxx", organizationId: "org_xxx" }
     Subscription info received: { plan: "pro", status: "active", ... }
     ```

5. **Check word limit:**
   - Go to AI Humanizer tool
   - Word counter should show: `0/1500 words` ✅

### ✅ Step 4: Verify Database

Open Convex Dashboard → Data → organizations:

```json
{
  "_id": "...",
  "_creationTime": 1234567890,
  "workos_id": "org_xxx",
  "name": "John's Organization",
  "subscription_plan": "pro",          ← Should be "pro"
  "subscription_status": "active",      ← Should be "active"
  "billing_period": "monthly",
  "stripe_customer_id": "cus_xxx",
  "stripe_subscription_id": "sub_xxx",
  "current_period_end": 1234567890
}
```

## Troubleshooting

### Problem: Word limit still shows 500

**Check 1: Organization exists in Convex?**
```javascript
// Convex dashboard → Functions
// Run: organizations:getByWorkOSId
// Args: { workos_id: "org_xxx" }
```

If null, the organization wasn't created. Check server logs during subscribe.

**Check 2: Subscription plan is set?**
```javascript
// If organization exists but subscription_plan is undefined or "free"
// The webhook didn't fire or failed
```

Check Stripe Dashboard → Developers → Webhooks → Your webhook → Logs

**Check 3: Frontend is fetching correctly?**

Open browser console, look for:
```
Fetching subscription for: { userId: "user_xxx", organizationId: "org_xxx" }
Subscription info received: { plan: "pro", ... }
```

If you see errors here, check backend logs at `/api/v1/subscriptions/check`

### Problem: "Manage Subscription" button not showing

This means the frontend didn't detect an active subscription. Same troubleshooting as above.

### Problem: Webhook not firing

1. Check Stripe Dashboard → Webhooks → Your webhook → Logs
2. Common issues:
   - Endpoint URL is wrong
   - Webhook signing secret doesn't match
   - Server is not reachable from internet (use ngrok for local testing)

For local testing:
```bash
# Terminal 1: Start your backend
pnpm dev

# Terminal 2: Start ngrok
ngrok http 3000

# Use ngrok URL in Stripe webhook
# e.g., https://xxxx-xxx-xxx.ngrok.io/api/v1/webhooks/stripe
```

## Quick Fix: Manual Update

If webhook failed, you can manually update Convex:

1. Open Convex dashboard
2. Go to Data → organizations
3. Find your organization (search by name or workos_id)
4. Click Edit
5. Set fields:
   ```json
   {
     "subscription_plan": "pro",
     "subscription_status": "active",
     "billing_period": "monthly",
     "stripe_customer_id": "cus_xxx",
     "stripe_subscription_id": "sub_xxx"
   }
   ```
6. Save
7. Refresh your app
8. Word limit should now show `0/1500 words` ✅

## Expected Behavior After Pro Subscription

✅ Word limit shows: `0/1500 words` (instead of 500)
✅ Pricing page shows: "Manage Subscription" button
✅ Advanced AI Humanizer features unlocked
✅ Can use up to 15,000 words per month
✅ Each request can be up to 1,500 words

## Support

If issues persist:
1. Check server logs for errors
2. Check Convex logs
3. Check Stripe webhook logs
4. Verify all environment variables are set correctly

