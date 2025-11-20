# Pre-Deployment Checklist

Before deploying to Vercel, use this checklist to ensure everything is configured correctly.

## ✅ Configuration Files

- [x] **`vercel.json`** exists at project root
  - Path: `/vercel.json`
  - Configures Next.js build and API rewrites

- [x] **`api/index.py`** exists and is configured
  - Path: `/api/index.py`
  - Entry point for Python serverless functions

- [x] **`requirements.txt`** exists at project root
  - Path: `/requirements.txt`
  - Contains Python dependencies

- [x] **CORS middleware** added to FastAPI
  - File: `/backend/src/api/main.py`
  - CORSMiddleware configured

- [x] **`.vercelignore`** exists (optional but recommended)
  - Path: `/.vercelignore`
  - Optimizes deployment size

## 🔍 Code Verification

### Backend (FastAPI)

- [ ] Backend runs locally without errors
  ```bash
  cd backend
  uvicorn src.api.main:app --reload
  # Visit http://localhost:8000
  ```

- [ ] API endpoints return expected responses
  - [ ] `http://localhost:8000/` - Docs page loads
  - [ ] `http://localhost:8000/docs` - Swagger UI loads
  - [ ] `http://localhost:8000/api/v1/users` - Returns data (or expected error)

- [ ] All dependencies listed in `requirements.txt`

- [ ] No hardcoded local paths or development-only code

### Frontend (Next.js)

- [ ] Next.js app builds successfully
  ```bash
  cd apps/next
  pnpm build
  ```

- [ ] No TypeScript errors
  ```bash
  cd apps/next
  pnpm check-types
  ```

- [ ] Linting passes
  ```bash
  cd apps/next
  pnpm lint-ci
  ```

- [ ] All dependencies in `package.json`

## 🔧 Environment Variables

### Identify Required Variables

- [ ] List all environment variables used in Next.js
  - Look for `process.env.NEXT_PUBLIC_*`
  - Look for `process.env.*` in server code

- [ ] List all environment variables used in FastAPI
  - Check `backend/src/api/config.py`
  - Look for `os.environ.get()` calls

### Set in Vercel (before deployment)

- [ ] Go to Vercel Dashboard → Settings → Environment Variables
- [ ] Add all required variables for **Production**
- [ ] Add all required variables for **Preview** (if different)
- [ ] Add all required variables for **Development** (if different)

### Recommended Variables

```bash
# Next.js
NEXT_PUBLIC_API_URL=/api/v1

# FastAPI (Production)
ENVIRONMENT=production
ALLOWED_ORIGINS=["https://yourdomain.com"]

# WorkOS (if using)
WORKOS_CLIENT_ID=...
WORKOS_API_KEY=...
WORKOS_COOKIE_PASSWORD=...

# Convex (if using)
NEXT_PUBLIC_CONVEX_URL=...
CONVEX_DEPLOY_KEY=...

# Stripe (if using)
STRIPE_SECRET_KEY=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
```

## 🧪 Local Testing

### Test with Vercel CLI (Recommended)

- [ ] Install Vercel CLI
  ```bash
  npm install -g vercel
  ```

- [ ] Run local simulation
  ```bash
  vercel dev
  ```

- [ ] Verify Next.js loads at `http://localhost:3000`

- [ ] Verify API loads at `http://localhost:3000/api/`

- [ ] Test API endpoint: `http://localhost:3000/api/v1/users`

- [ ] No console errors in browser

- [ ] No errors in terminal

## 📦 Git Repository

- [ ] All changes committed
  ```bash
  git status
  ```

- [ ] No sensitive data in git history
  - No API keys
  - No passwords
  - No private keys

- [ ] `.gitignore` includes:
  - `node_modules/`
  - `.env`
  - `.env.local`
  - `__pycache__/`
  - `.vercel/`

- [ ] `pnpm-lock.yaml` is committed (Vercel needs this)

- [ ] No large binary files (keep under 100MB total)

## 🔐 Security Check

- [ ] No hardcoded API keys in code

- [ ] Environment variables used for all secrets

- [ ] CORS configured appropriately
  - Development: Allow localhost
  - Production: Restrict to your domain

- [ ] No debug/development endpoints in production code

- [ ] No sensitive data logged to console

## 🌐 Domain & DNS (if using custom domain)

- [ ] Domain purchased and ready

- [ ] DNS access available

- [ ] Know how to update DNS records (or can do it)

## 📋 Deployment Method Decision

Choose your deployment method:

### Option A: Vercel CLI (Fastest for testing)

- [ ] Installed Vercel CLI: `npm install -g vercel`
- [ ] Logged in: `vercel login`
- Ready to run: `vercel` (preview) or `vercel --prod` (production)

### Option B: GitHub Integration (Best for CI/CD)

- [ ] Code pushed to GitHub
- [ ] GitHub repository accessible
- Ready to connect repository in Vercel dashboard

### Option C: GitLab/Bitbucket

- [ ] Code pushed to GitLab/Bitbucket
- Ready to connect repository in Vercel dashboard

## 🎯 Final Checks

- [ ] Read [DEPLOYMENT_QUICK_START.md](DEPLOYMENT_QUICK_START.md)

- [ ] Understand the [deployment architecture](DEPLOYMENT_DIAGRAM.md)

- [ ] Know where to find deployment logs (Vercel Dashboard)

- [ ] Have Vercel account ready

- [ ] Team members notified (if applicable)

## 🚀 Ready to Deploy!

Once all items are checked:

### For CLI Deployment:
```bash
# From project root
vercel

# Or for production:
vercel --prod
```

### For Git Integration:
1. Push to your repository
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Add environment variables
5. Deploy!

## 📊 Post-Deployment Verification

After deployment, check:

- [ ] Deployment succeeded (no errors in Vercel dashboard)

- [ ] Production URL accessible

- [ ] Home page loads: `https://yourdomain.com/`

- [ ] API docs load: `https://yourdomain.com/api/`

- [ ] Swagger UI loads: `https://yourdomain.com/api/docs`

- [ ] Test API endpoint: `https://yourdomain.com/api/v1/users`

- [ ] No console errors in production

- [ ] Check Vercel function logs for Python errors

- [ ] Test CORS if calling from external apps

- [ ] Monitor for 5-10 minutes for any errors

## 🐛 If Something Goes Wrong

1. **Check Vercel Dashboard Logs**
   - Deployments → [Your Deployment] → Logs

2. **Common Issues**:
   - Python import errors → Check `api/index.py`
   - Build failures → Check `pnpm-lock.yaml` committed
   - API 404s → Verify rewrite rules in `vercel.json`
   - CORS errors → Check `ALLOWED_ORIGINS` setting

3. **Get Help**:
   - See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) troubleshooting section
   - Check [Vercel documentation](https://vercel.com/docs)
   - Review deployment logs for specific errors

## 📚 Reference Documentation

- [DEPLOYMENT_QUICK_START.md](DEPLOYMENT_QUICK_START.md) - Quick deploy guide
- [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) - Complete deployment guide
- [SETUP_SUMMARY.md](SETUP_SUMMARY.md) - Architecture overview
- [DEPLOYMENT_DIAGRAM.md](DEPLOYMENT_DIAGRAM.md) - Visual architecture
- [NEXT_API_EXAMPLE.md](NEXT_API_EXAMPLE.md) - API integration examples

---

**Pro Tip**: Deploy to a preview environment first to test everything before deploying to production!

