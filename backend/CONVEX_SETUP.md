# Backend Convex Configuration

## Important: Connect to the Correct Convex Project

The backend should connect to the **`humanize-03d19`** Convex project, not `academic-terrier-140`.

## Environment Variable

Set the `CONVEX_URL` environment variable in your backend environment:

```bash
CONVEX_URL=https://humanize-03d19.convex.cloud
```

### For Local Development

Create a `.env` file in the `backend/` directory:

```bash
# backend/.env
CONVEX_URL=https://humanize-03d19.convex.cloud
```

### For Production (Vercel)

Set the environment variable in Vercel:

```bash
vercel env add CONVEX_URL
# Enter: https://humanize-03d19.convex.cloud
```

Or via Vercel Dashboard:
1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add `CONVEX_URL` with value `https://humanize-03d19.convex.cloud`

## Verify Configuration

Test the Convex connection:

```bash
curl http://localhost:8000/api/v1/convex/health
```

Or check the health endpoint response:

```json
{
  "status": "healthy",
  "convex_url": "https://humanize-03d19.convex.cloud",
  "convex_configured": true,
  "message": "Successfully connected to Convex"
}
```

## Backend User Endpoints

The backend now has endpoints to save users to Convex:

### Create User in Convex

```bash
POST /api/v1/users/convex/create
Content-Type: application/json

{
  "email": "user@example.com",
  "workos_id": "user_01K9Z3XX6JNWP3101EVZ9QHCEM"
}
```

### Query User by WorkOS ID

```bash
POST /api/v1/users/convex/query
Content-Type: application/json

{
  "workos_id": "user_01K9Z3XX6JNWP3101EVZ9QHCEM"
}
```

### Update User in Convex

```bash
POST /api/v1/users/convex/update
Content-Type: application/json

{
  "id": "j973rgm72apamqyd7n18xsadsx7v11gq",
  "email": "newemail@example.com"
}
```

## How It Works

1. Backend receives request to create/update user
2. Backend connects to Convex using `CONVEX_URL`
3. Backend calls Convex mutation/query function
4. Convex saves/retrieves user data from database

## Troubleshooting

### Error: "Convex is not configured"

Make sure `CONVEX_URL` is set in your environment variables.

### Error: "Failed to connect to Convex"

1. Verify the `CONVEX_URL` is correct: `https://humanize-03d19.convex.cloud`
2. Check network connectivity
3. Verify Convex project is accessible

### User not appearing in Convex

1. Check backend logs for errors
2. Verify `CONVEX_URL` points to the correct project
3. Test the endpoint directly with curl
4. Check Convex dashboard for the user

