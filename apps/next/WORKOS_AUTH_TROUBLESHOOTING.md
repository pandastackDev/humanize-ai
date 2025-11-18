# WorkOS AuthKit Authentication Troubleshooting

## Issue: Redirect Loop After Sign-In

If you're experiencing a redirect loop where after entering correct credentials, you're redirected back to the WorkOS sign-in page, follow these steps:

## 1. Verify Environment Variables

Make sure all required environment variables are set in `.env.local`:

```bash
WORKOS_API_KEY=sk_test_...
WORKOS_CLIENT_ID=client_...
WORKOS_COOKIE_PASSWORD=... (64 character hex string)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3000/callback
```

## 2. Verify WorkOS Dashboard Configuration

### Redirect URI Configuration

1. Go to [WorkOS Dashboard](https://dashboard.workos.com)
2. Navigate to **User Management** → **Redirects**
3. Ensure `http://localhost:3000/callback` is listed as a redirect URI
4. For production, add your production callback URL

### App Homepage URL

1. In WorkOS Dashboard, go to **User Management** → **Settings**
2. Set the **App Homepage URL** to:
   - Development: `http://localhost:3000`
   - Production: Your production URL

## 3. Check Middleware Configuration

The middleware file (`src/middleware.ts`) should exclude the callback route:

```typescript
export const config = {
  matcher: [
    "/",
    "/pricing",
    "/dashboard/:path*",
    "/product",
    // Exclude callback, login, API routes, and static files
    "/((?!_next/static|_next/image|favicon.ico|callback|login|api|.*\\.css|.*\\.js|.*\\.png|.*\\.jpg|.*\\.svg).*)",
  ],
};
```

## 4. Verify Callback Route

The callback route (`src/app/callback/route.ts`) should be:

```typescript
import { handleAuth } from "@workos-inc/authkit-nextjs";

export const GET = handleAuth({
  returnPathname: "/",
});
```

## 5. Check Browser Console and Server Logs

1. Open browser DevTools (F12)
2. Check the Console tab for any errors
3. Check the Network tab to see if the callback request is successful
4. Check your Next.js server logs for any errors

## 6. Clear Browser Cookies and Cache

Sometimes stale cookies can cause issues:

1. Clear browser cookies for `localhost:3000`
2. Clear browser cache
3. Try in an incognito/private window

## 7. Verify Cookie Password

The `WORKOS_COOKIE_PASSWORD` must be exactly 64 characters (32 bytes as hex).

Generate a new one if needed:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 8. Test the Flow

1. Start your dev server: `pnpm dev`
2. Navigate to `http://localhost:3000`
3. Click "Sign In"
4. Enter credentials
5. You should be redirected to `/callback` which then redirects to `/`

## Common Issues

### Issue: "App Homepage URL not found"
- **Solution**: Set the App Homepage URL in WorkOS Dashboard (see step 2 above)

### Issue: Redirect loop
- **Solution**: 
  - Verify callback route is excluded from middleware
  - Check that redirect URI matches exactly in WorkOS Dashboard
  - Verify environment variables are correct

### Issue: Session not persisting
- **Solution**: 
  - Verify `WORKOS_COOKIE_PASSWORD` is correct (64 characters)
  - Check that cookies are being set in browser DevTools
  - Ensure middleware is properly configured

## Still Having Issues?

1. Check WorkOS Dashboard for any error messages
2. Review server logs for detailed error information
3. Verify all environment variables are loaded correctly
4. Try creating a new WorkOS application and reconfiguring

