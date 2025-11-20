# Quick Start: Deploy to Vercel

This is a quick reference for deploying your Next.js + FastAPI monorepo to Vercel.

## ✅ Prerequisites

- [x] Vercel account
- [x] Git repository (GitHub, GitLab, or Bitbucket)
- [x] Node.js and pnpm installed locally

## 🚀 One-Command Deploy

From the project root:

```bash
vercel
```

That's it! Vercel will:

1. Detect the monorepo structure
2. Build the Next.js app
3. Set up Python serverless functions
4. Deploy everything together

## 📁 What's Been Configured

The following files enable the unified deployment:

### 1. `/vercel.json`

- Configures Next.js build from `apps/next`
- Sets up rewrites for API routes
- Defines framework and build commands

### 2. `/api/index.py`

- Vercel's entry point for Python functions
- Imports and exposes your FastAPI app
- Handles path resolution for imports

### 3. `/requirements.txt`

- Python dependencies at root level
- Required by Vercel for Python builds

### 4. Updated `/backend/src/api/main.py`

- Added CORS middleware
- Configured for cross-origin requests

## 🌐 URL Structure After Deployment

```
https://yourdomain.com/              → Next.js pages
https://yourdomain.com/dashboard     → Next.js pages
https://yourdomain.com/api/          → FastAPI root (docs)
https://yourdomain.com/api/v1/users  → FastAPI endpoints
https://yourdomain.com/api/docs      → Swagger UI
https://yourdomain.com/api/scalar    → Scalar UI
```

## 🔧 Environment Variables

Set in Vercel Dashboard → Settings → Environment Variables:

### Next.js Variables

```bash
NEXT_PUBLIC_API_URL=/api/v1
# Add other NEXT_PUBLIC_* variables
```

### FastAPI Variables

```bash
ENVIRONMENT=production
ALLOWED_ORIGINS=["https://yourdomain.com"]
# Add other backend variables
```

## 🧪 Test Locally

### With Vercel CLI (Recommended)

```bash
vercel dev
```

- Simulates production environment
- Runs Next.js on port 3000
- API available at `/api/*`

### Run Separately

```bash
# Terminal 1: Next.js
cd apps/next && pnpm dev

# Terminal 2: FastAPI
cd backend && uvicorn src.api.main:app --reload --port 8000
```

## 📊 Monitor Your Deployment

After deploying:

1. **Logs**: Vercel Dashboard → Deployments → [Your Deployment] → Logs
2. **Functions**: View Python function execution logs
3. **Analytics**: Enable Vercel Analytics for traffic insights
4. **Errors**: Check Runtime Logs for API errors

## 🐛 Common Issues & Fixes

| Issue                | Solution                                   |
| -------------------- | ------------------------------------------ |
| Python import errors | Check `api/index.py` path setup            |
| API returns 404      | Verify rewrite rules in `vercel.json`      |
| CORS errors          | Update `ALLOWED_ORIGINS` in backend config |
| Build fails          | Check `pnpm-lock.yaml` is committed        |
| Cold starts          | Consider Vercel Pro for better performance |

## 📚 More Information

- **Full deployment guide**: See `VERCEL_DEPLOYMENT.md`
- **Next.js API integration**: See `NEXT_API_EXAMPLE.md`
- **Vercel Docs**: https://vercel.com/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com

## 🎯 Next Steps

1. **Deploy**: Run `vercel` or connect via GitHub
2. **Test**: Visit your deployment URL and test `/api/`
3. **Configure**: Set environment variables in Vercel Dashboard
4. **Monitor**: Check logs and function execution
5. **Optimize**: Configure caching, edge functions, etc.

## 💡 Pro Tips

- Use `vercel --prod` for production deployments
- Set up preview deployments for PRs automatically
- Use Vercel CLI to pull environment variables: `vercel env pull`
- Enable Vercel Analytics for performance monitoring
- Use environment-specific configs (dev, staging, prod)

## 🔄 Continuous Deployment

Once connected to GitHub:

- Push to `main` → auto-deploys to production
- Open PR → creates preview deployment
- Merge PR → updates production

No manual deploys needed! 🎉
