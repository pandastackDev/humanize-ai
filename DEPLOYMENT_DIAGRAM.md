# Deployment Architecture Diagram

## 🌐 Production Deployment on Vercel

```
┌────────────────────────────────────────────────────────────────────────┐
│                         Internet / Users                                │
└────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    Vercel Edge Network (Global CDN)                     │
│                      https://yourdomain.com                             │
└────────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
    ┌───────────────────────────┐   ┌───────────────────────────┐
    │      Next.js Routes       │   │     API Routes (/api/*)   │
    │                           │   │                           │
    │  /                        │   │  Rewrite Rule in          │
    │  /dashboard               │   │  vercel.json              │
    │  /pricing                 │   │                           │
    │  /dashboard               │   │  /api/* → /api/index.py   │
    │  /login                   │   │                           │
    │  ... (all pages)          │   │                           │
    └───────────────────────────┘   └───────────────────────────┘
                │                                   │
                ▼                                   ▼
    ┌───────────────────────────┐   ┌───────────────────────────┐
    │   Next.js Build Output    │   │  Python Serverless Fn     │
    │                           │   │                           │
    │  - Static pages           │   │  api/index.py             │
    │  - Server components      │   │    │                      │
    │  - API routes (if any)    │   │    ├─> Sets Python path  │
    │  - Client bundles         │   │    ├─> Imports FastAPI   │
    │  - Public assets          │   │    └─> Exports handler   │
    │                           │   │                           │
    │  Source: apps/next/       │   │  Imports from:            │
    └───────────────────────────┘   │  backend/src/api/main.py  │
                                    └───────────────────────────┘
                                                │
                                                ▼
                                    ┌───────────────────────────┐
                                    │    FastAPI Application    │
                                    │                           │
                                    │  Routes:                  │
                                    │  - GET  /api/             │
                                    │  - GET  /api/docs         │
                                    │  - GET  /api/scalar       │
                                    │  - GET  /api/v1/users     │
                                    │  - POST /api/v1/users     │
                                    │  - GET  /api/v1/items     │
                                    │  - ... (all API routes)   │
                                    │                           │
                                    │  Middleware:              │
                                    │  - CORS                   │
                                    │                           │
                                    │  Source:                  │
                                    │  backend/src/api/         │
                                    └───────────────────────────┘
```

## 📂 File Structure Mapping

```
humanize/ (monorepo root)
│
├── vercel.json                      → Deployment configuration
│   ├─ buildCommand                  → Builds Next.js
│   ├─ outputDirectory               → Points to Next.js output
│   └─ rewrites                      → Routes /api/* to Python
│
├── api/                             → Vercel Functions Directory
│   └── index.py                     → Python entry point
│       └─ Imports: backend/src/api/main.py
│
├── requirements.txt                 → Python dependencies (root)
│
├── apps/
│   └── next/                        → Next.js Application
│       ├── src/                     → Source code
│       │   ├── app/                 → App router
│       │   │   ├── page.tsx         → Home page
│       │   │   ├── dashboard/       → Dashboard pages
│       │   │   ├── pricing/         → Pricing page
│       │   │   └── ...
│       │   └── lib/
│       │       └── api-client.ts    → API client (calls /api/*)
│       ├── public/                  → Static assets
│       ├── package.json
│       └── next.config.js
│
└── backend/                         → FastAPI Backend
    ├── src/
    │   └── api/
    │       ├── main.py              → FastAPI app entry
    │       ├── config.py            → Settings & config
    │       ├── models.py            → Pydantic models
    │       └── v1/                  → API v1 routes
    │           ├── __init__.py
    │           └── endpoints/
    │               ├── users.py
    │               └── items.py
    └── requirements.txt             → Python deps (also at root)
```

## 🔄 Request Flow Examples

### Example 1: User visits homepage

```
User Browser
    │
    ├─ GET https://yourdomain.com/
    │
    ▼
Vercel Edge Network
    │
    ├─ Matches Next.js route
    │
    ▼
Next.js Server Component
    │
    ├─ Renders apps/next/src/app/page.tsx
    │
    ▼
Response: HTML + React Hydration
```

### Example 2: User visits API docs

```
User Browser
    │
    ├─ GET https://yourdomain.com/api/docs
    │
    ▼
Vercel Edge Network
    │
    ├─ Matches /api/* rewrite rule
    │
    ▼
Python Serverless Function
    │
    ├─ Executes api/index.py
    │
    ▼
FastAPI App (backend/src/api/main.py)
    │
    ├─ Routes to /docs endpoint
    │
    ▼
Response: Swagger UI HTML
```

### Example 3: Next.js calls API endpoint

```
Next.js Server Component
    │
    ├─ fetch('/api/v1/users')
    │
    ▼
Same Domain Request
    │
    ├─ No CORS preflight needed
    │
    ▼
Vercel Edge Network
    │
    ├─ Matches /api/* rewrite rule
    │
    ▼
Python Serverless Function
    │
    ├─ Executes api/index.py
    │
    ▼
FastAPI App
    │
    ├─ Routes to /api/v1/users
    ├─ Executes backend/src/api/v1/endpoints/users.py
    │
    ▼
Response: JSON data
    │
    ▼
Next.js renders component with data
```

### Example 4: External API call from browser

```
External Website/App
    │
    ├─ fetch('https://yourdomain.com/api/v1/users')
    │
    ▼
Vercel Edge Network
    │
    ├─ CORS preflight (if needed)
    │
    ▼
Python Serverless Function
    │
    ├─ CORS middleware checks origin
    │
    ▼
FastAPI App
    │
    ├─ If allowed: Process request
    ├─ If not: Return CORS error
    │
    ▼
Response: JSON data (with CORS headers)
```

## 🏗️ Build Process

### Step 1: Vercel receives deployment trigger

```
GitHub Push or Manual Deploy
    │
    ▼
Vercel Build System
```

### Step 2: Install Dependencies

```
Vercel Build System
    │
    ├─ Install Node.js dependencies (pnpm install)
    ├─ Install Python dependencies (pip install -r requirements.txt)
    │
    ▼
Dependencies Ready
```

### Step 3: Build Next.js

```
Execute buildCommand from vercel.json
    │
    ├─ cd apps/next
    ├─ pnpm install
    ├─ pnpm build
    │
    ▼
Next.js build output → apps/next/.next/
```

### Step 4: Prepare Python Functions

```
Process api/index.py
    │
    ├─ Bundle with backend/src/api/
    ├─ Include requirements.txt dependencies
    │
    ▼
Python serverless function ready
```

### Step 5: Deploy to Edge Network

```
Upload Assets
    │
    ├─ Static files → CDN
    ├─ Next.js functions → Serverless
    ├─ Python functions → Serverless
    │
    ▼
Live at https://yourdomain.com
```

## 🔐 Environment Variables Flow

```
Vercel Dashboard
    │
    ├─ Environment Variables
    │
    ├──> NEXT_PUBLIC_* → Available in Next.js client-side
    ├──> Other vars → Available in Next.js server-side only
    └──> All vars → Available in Python functions
```

## 📊 Scaling & Performance

```
User Traffic
    │
    ▼
Vercel Edge Network (150+ locations globally)
    │
    ├─ Static assets → Cached at edge
    ├─ Dynamic pages → Generated on-demand
    └─ API requests → Route to serverless functions
        │
        ├─ Cold start (first request)
        │   ├─ Initialize Python runtime
        │   ├─ Load FastAPI app
        │   └─ ~500ms - 2s
        │
        └─ Warm requests
            ├─ Reuse existing container
            └─ ~50ms - 200ms
```

### Cold Start Optimization

```python
# api/index.py
# ✅ Import at module level (happens once per container)
from api.main import app

# ❌ Don't import inside handler function
def handler(request):
    from api.main import app  # BAD: Imports on every request
```

## 🔍 Monitoring & Debugging

```
Vercel Dashboard
    │
    ├─ Deployments
    │   ├─ Build Logs
    │   └─ Deployment Status
    │
    ├─ Functions
    │   ├─ Invocations Count
    │   ├─ Duration/Performance
    │   ├─ Error Rate
    │   └─ Logs (Python stdout/stderr)
    │
    └─ Analytics
        ├─ Traffic
        ├─ Performance
        └─ Web Vitals
```

## 🎯 Key Benefits

```
Single Deployment
    │
    ├─ ✅ Same domain (no CORS issues)
    ├─ ✅ Unified deployment pipeline
    ├─ ✅ Single SSL certificate
    ├─ ✅ Shared environment variables
    ├─ ✅ One git push deploys everything
    └─ ✅ Preview deployments for both frontend & backend
```

## 🚦 Traffic Distribution

```
100 Requests to https://yourdomain.com

    ├─ 70 requests to / or /dashboard etc
    │  └─> Next.js handles
    │      ├─ Static: Cached at edge
    │      └─ Dynamic: Serverless function
    │
    └─ 30 requests to /api/*
       └─> Python serverless function
           └─> FastAPI handles
               ├─ /api/ → Docs
               ├─ /api/v1/users → Users API
               └─ /api/v1/items → Items API
```

## 🎨 Summary

This architecture gives you:

- **Unified codebase**: Monorepo with both apps
- **Single deployment**: One command deploys everything  
- **Optimal routing**: Vercel handles intelligent routing
- **Auto-scaling**: Both Next.js and Python scale independently
- **Global CDN**: Fast worldwide with 150+ edge locations
- **Zero configuration**: Works out of the box with vercel.json
- **Developer experience**: Easy local dev with `vercel dev`
- **Type safety**: Shared types between frontend and backend

---

For more details, see:
- [DEPLOYMENT_QUICK_START.md](DEPLOYMENT_QUICK_START.md)
- [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)
- [SETUP_SUMMARY.md](SETUP_SUMMARY.md)

