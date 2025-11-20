# Word Limit Updates After Subscription ✅

## What's Been Fixed

Your subscription system now properly updates word limits based on the plan:

| Plan  | Word Limit Display | Per Request | Per Month |
|-------|-------------------|-------------|-----------|
| Free  | `0/500 words`     | 500         | 2,500     |
| Basic | `0/500 words`     | 500         | 5,000     |
| **Pro**   | **`0/1500 words`**    | **1,500**       | **15,000**    |
| Ultra | `0/3000 words`    | 3,000       | 30,000    |

## Complete Flow

```
User → Clicks "Subscribe" on Pro Plan
  ↓
Creates organization in WorkOS ✅
  ↓
Creates organization in Convex ✅ (NEWLY ADDED)
  subscription_plan: null (will be updated by webhook)
  ↓
User completes Stripe payment
  ↓
Stripe webhook: customer.subscription.created
  ↓
Backend updates Convex organization:
  subscription_plan: "pro" ✅
  subscription_status: "active" ✅
  ↓
User redirected to homepage
  ↓
Frontend fetches subscription from backend
  ↓
Backend queries Convex
  ↓
Returns: { plan: "pro", ... }
  ↓
Frontend updates word limit: 0/1500 words ✅
```

## Files Modified

### 1. `/apps/next/src/app/api/subscribe/route.ts`
- ✅ Creates organization in Convex when subscribing
- ✅ Creates organization membership in Convex

### 2. `/apps/next/src/app/components/humanize-editor.tsx`
- ✅ Fetches real subscription status on mount
- ✅ Updates word limit based on plan
- ✅ Shows correct limit for each tier

### 3. `/apps/next/src/app/components/pricing.tsx`
- ✅ Fetches subscription status
- ✅ Shows "Manage Subscription" for paid users
- ✅ Shows "Subscribe" for free users

### 4. `/backend/.env`
- ✅ Added Convex configuration
- ✅ Added Stripe configuration

## How to Test

### Step 1: Configure Stripe Webhook

**IMPORTANT:** You need to set up the Stripe webhook endpoint:

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/test/webhooks)

2. Click "Add endpoint"

3. Enter your endpoint URL:
   - **Local development:** Use ngrok
     ```bash
     ngrok http 8000
     # Use: https://xxxx.ngrok.io/api/v1/webhooks/stripe
     ```
   - **Production:** `https://your-domain.com/api/v1/webhooks/stripe`

4. Select these events:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`

5. Copy the "Signing secret" (starts with `whsec_`)

6. Update `backend/.env`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_your_actual_secret_here
   ```

### Step 2: Test the Subscription

1. **Start both servers:**
   ```bash
   # Terminal 1: Backend
   cd backend
   source .venv/bin/activate
   uvicorn src.api.main:app --reload --port 8000

   # Terminal 2: Frontend
   cd apps/next
   pnpm dev
   ```

2. **Subscribe to Pro plan:**
   - Open http://localhost:3000/pricing
   - Click "Subscribe" on Pro plan ($9.99/month annual)
   - Enter organization name
   - Use test card: `4242 4242 4242 4242`
   - Complete payment

3. **Check browser console:**
   ```
   Creating WorkOS organization: John's Organization
   Organization created: org_xxx
   Creating organization in Convex: { workosId: "org_xxx", name: "..." }
   Organization created in Convex successfully
   ```

4. **After redirect, check console:**
   ```
   Fetching subscription for: { userId: "user_xxx", organizationId: "org_xxx" }
   Subscription info received: { plan: "pro", status: "active", ... }
   ```

5. **Go to AI Humanizer:**
   - Word limit should show: **`0/1500 words`** ✅
   - (Not 500!)

### Step 3: Verify in Convex Dashboard

1. Open [Convex Dashboard](https://dashboard.convex.dev/)
2. Go to your project
3. Click "Data" → "organizations"
4. Find your organization
5. Verify fields:
   ```json
   {
     "workos_id": "org_xxx",
     "name": "John's Organization",
     "subscription_plan": "pro",           ← Should be "pro"
     "subscription_status": "active",      ← Should be "active"
     "stripe_customer_id": "cus_xxx",
     "stripe_subscription_id": "sub_xxx"
   }
   ```

## Troubleshooting

### ❌ Word limit still shows 500 after subscribing

**Solution 1: Check webhook**
- Go to Stripe Dashboard → Webhooks → Your endpoint → Logs
- Look for errors
- Make sure `STRIPE_WEBHOOK_SECRET` in `backend/.env` matches

**Solution 2: Check Convex**
- Open Convex dashboard
- Check if organization has `subscription_plan: "pro"`
- If not, the webhook didn't update it

**Solution 3: Manual fix**
- Open Convex dashboard → organizations
- Edit your organization
- Set:
  - `subscription_plan`: `"pro"`
  - `subscription_status`: `"active"`
- Save and refresh app

### ❌ "Manage Subscription" button not showing

Same as above - subscription status not detected.

### ❌ Webhook not firing

**For local development:**
```bash
# Install ngrok
brew install ngrok  # or download from ngrok.com

# Start ngrok
ngrok http 8000

# Use the https URL in Stripe webhook configuration
# Example: https://a1b2-xx-xx-xx.ngrok.io/api/v1/webhooks/stripe
```

**Check webhook logs:**
- Stripe Dashboard → Webhooks → Your endpoint → Recent deliveries
- Look for 200 OK responses
- If 400/500 errors, check backend logs

## Expected Results After Pro Subscription

✅ Word limit updates from `0/500` to `0/1500` words
✅ Pricing page shows "Manage Subscription" button
✅ Can input up to 1,500 words per request
✅ Has 15,000 words per month quota
✅ Advanced AI Humanizer features unlocked

## Quick Reference

### Frontend Environment (`apps/next/.env.local`)
```bash
NEXT_PUBLIC_CONVEX_URL=https://efficient-puma-893.convex.cloud
CONVEX_DEPLOYMENT=dev:efficient-puma-893
WORKOS_API_KEY=sk_test_...
STRIPE_API_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Backend Environment (`backend/.env`)
```bash
CONVEX_URL=https://efficient-puma-893.convex.cloud
CONVEX_DEPLOYMENT_KEY=dev:efficient-puma-893
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  ← GET THIS FROM STRIPE
```

## Next Steps

1. ✅ Configure Stripe webhook (most important!)
2. ✅ Test subscription flow end-to-end
3. ✅ Verify word limit updates correctly
4. ✅ Deploy to production with production webhook URL

