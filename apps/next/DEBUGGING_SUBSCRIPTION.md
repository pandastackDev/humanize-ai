# Debugging Subscription Issues

## Current Issues

### 1. Convex Import Error
**Error**: `Could not resolve "./stripeWebhookHandlers"`

**Solution**: 
- The file exists and exports correctly
- This is likely a Convex bundler cache issue
- **Try**: Restart Convex dev server or clear Convex cache
- **Command**: Stop and restart `pnpm dev:convex`

### 2. WorkOS Fetch Failed Error
**Error**: `TypeError: fetch failed`

**Possible Causes**:
1. **Network connectivity** - Can't reach WorkOS API
2. **Invalid API Key** - WORKOS_API_KEY is incorrect or expired
3. **DNS issues** - Can't resolve WorkOS API hostname
4. **Firewall/Proxy** - Network blocking WorkOS API calls
5. **WorkOS API down** - Temporary WorkOS service issue

**Debugging Steps**:

1. **Verify Environment Variables**:
   ```bash
   cd apps/next
   cat .env.local | grep WORKOS
   ```

2. **Check WorkOS API Key Format**:
   - Should start with `sk_test_` or `sk_live_`
   - Should be the full key from WorkOS dashboard

3. **Test WorkOS API Connection**:
   ```bash
   curl -X GET "https://api.workos.com/organizations" \
     -H "Authorization: Bearer YOUR_WORKOS_API_KEY" \
     -H "Content-Type: application/json"
   ```

4. **Check Server Logs**:
   - Look for detailed error messages
   - Check for network error details
   - Look for WorkOS API status codes

5. **Verify WorkOS Dashboard**:
   - Log into https://dashboard.workos.com
   - Check API keys are active
   - Verify API key permissions

## Improved Error Handling

The subscribe route now:
- ✅ Validates environment variables before making API calls
- ✅ Provides detailed error messages
- ✅ Handles network errors specifically
- ✅ Logs detailed error information for debugging
- ✅ Handles WorkOS API status codes

## Next Steps

1. **Restart Convex**:
   ```bash
   # Stop current Convex (Ctrl+C)
   cd apps/next
   pnpm dev:convex
   ```

2. **Restart Next.js Dev Server**:
   ```bash
   # Stop current server (Ctrl+C)
   cd apps/next
   pnpm dev
   ```

3. **Check Server Console**:
   - Look for detailed error logs
   - Check which step is failing (WorkOS org creation, membership, Stripe, etc.)

4. **Verify Stripe Keys**:
   - Ensure STRIPE_API_KEY is set correctly
   - Check Stripe dashboard for active test mode

5. **Test with Simple Request**:
   - Try subscribing again
   - Check console logs for detailed error information

