# Vercel Deployment Guide

This guide explains how to deploy both the Next.js frontend (in `apps/next`) and FastAPI backend (in `backend`) to the same Vercel deployment.

## Architecture Overview

- **Frontend**: Next.js app at `/` (all routes handled by Next.js)
- **Backend**: FastAPI at `/api/*` (all API routes proxied to Python serverless functions)

## Project Structure

```
humanize/
├── vercel.json              # Root Vercel configuration
├── requirements.txt          # Python dependencies for Vercel
├── api/
│   └── index.py             # Vercel Python entry point (proxies to backend)
├── apps/
│   └── next/                # Next.js application
│       ├── src/
│       ├── package.json
│       └── next.config.js
└── backend/
    ├── src/
    │   └── api/
    │       └── main.py      # FastAPI application
    └── requirements.txt      # Backend requirements (also copied to root)
```

## How It Works

1. **Next.js Routes**: All frontend routes (`/`, `/dashboard`, etc.) are handled by Next.js
2. **API Routes**: All requests to `/api/*` are rewritten to the Python serverless function
3. **Python Function**: The `api/index.py` file imports your FastAPI app and exposes it to Vercel
4. **Single Deployment**: Both apps share the same domain and deployment

## Deployment Steps

### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI** (if not already installed):

   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:

   ```bash
   vercel login
   ```

3. **Deploy from the root directory**:

   ```bash
   vercel
   ```

4. **For production deployment**:
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via GitHub Integration

1. **Push your code to GitHub**:

   ```bash
   git add .
   git commit -m "Configure Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Vercel will automatically detect the `vercel.json` configuration

3. **Configure Environment Variables** (if needed):
   - In Vercel Dashboard → Settings → Environment Variables
   - Add any required environment variables for both Next.js and FastAPI

### Option 3: Deploy via Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Vercel will auto-detect the configuration from `vercel.json`
4. Click "Deploy"

## Configuration Details

### vercel.json

The root `vercel.json` configures:

- **buildCommand**: Builds the Next.js app
- **outputDirectory**: Points to the Next.js build output
- **framework**: Specifies Next.js for optimized handling
- **rewrites**: Routes `/api/*` requests to the Python function

### api/index.py

This file:

- Adds the backend source to Python path
- Imports your FastAPI app
- Exports it as `handler` for Vercel

### requirements.txt

Contains Python dependencies needed by your FastAPI backend.

## Testing Locally

### Test Next.js:

```bash
cd apps/next
pnpm dev
```

Visit: http://localhost:3000

### Test FastAPI:

```bash
cd backend
uvicorn src.api.main:app --reload --port 8000
```

Visit: http://localhost:8000

### Test Together with Vercel CLI:

```bash
vercel dev
```

This runs both Next.js and the API locally, simulating the Vercel environment.

## API Endpoints

After deployment, your API will be available at:

- Production: `https://yourdomain.com/api/`
- Development: `https://yourdomain-dev.vercel.app/api/`

Example endpoints:

- `https://yourdomain.com/api/` - API docs (root endpoint)
- `https://yourdomain.com/api/scalar` - Scalar API documentation
- `https://yourdomain.com/api/docs` - Swagger UI
- `https://yourdomain.com/api/v1/users` - Your API endpoints

## Environment Variables

Set these in Vercel Dashboard (Settings → Environment Variables):

### For Next.js:

- Any Next.js specific env vars (e.g., `NEXT_PUBLIC_API_URL`)

### For FastAPI:

- Any backend specific env vars
- These will be available in your FastAPI app via `os.environ`

## Troubleshooting

### Python import errors:

- Ensure `api/index.py` correctly adds the backend path
- Check that `requirements.txt` includes all dependencies

### API routes not working:

- Verify the rewrite rule in `vercel.json`
- Check Vercel deployment logs for Python errors

### Build failures:

- Check that pnpm is configured correctly
- Ensure all dependencies are listed in `package.json`

### Cold starts:

- Vercel serverless functions may have cold starts
- Consider upgrading to Vercel Pro for better performance

## Monorepo Considerations

Since this is a pnpm workspace monorepo:

- The root `package.json` manages workspace configuration
- The `apps/next/package.json` has Next.js dependencies
- Vercel handles the monorepo structure automatically

## Best Practices

1. **API Versioning**: Your FastAPI uses `/api/v1/*` which is good for future updates
2. **CORS**: If needed, configure CORS in `backend/src/api/main.py`
3. **Environment-specific configs**: Use Vercel's environment variable system
4. **Monitoring**: Use Vercel Analytics and Logs for monitoring
5. **Secrets**: Never commit secrets, use Vercel environment variables

## Additional Resources

- [Vercel Next.js Documentation](https://vercel.com/docs/frameworks/nextjs)
- [Vercel Python Documentation](https://vercel.com/docs/functions/runtimes/python)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Monorepo Deployment Guide](https://vercel.com/docs/monorepos)
