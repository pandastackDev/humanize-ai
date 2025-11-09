# Vercel Python Functions Directory

This directory contains the entry point for Python serverless functions on Vercel.

## 📁 Structure

```
api/
└── index.py    # Vercel Python function entry point
```

## 🔧 How It Works

### `index.py`

This file serves as the bridge between Vercel's Python runtime and your FastAPI application in `/backend/src/api/main.py`.

**What it does:**

1. **Modifies Python Path**: Adds `/backend/src/` to `sys.path` so Python can find your modules
2. **Imports FastAPI App**: Imports the `app` from `backend/src/api/main.py`
3. **Exports Handler**: Exposes the FastAPI app as `handler` for Vercel

```python
import sys
from pathlib import Path

# Add backend/src to Python path
backend_src = Path(__file__).parent.parent / "backend" / "src"
sys.path.insert(0, str(backend_src))

# Import FastAPI app
from api.main import app  # noqa: E402

# Export for Vercel
handler = app
```

## 🌐 URL Routing

When deployed on Vercel, all requests to `/api/*` are routed to this function:

```
https://yourdomain.com/api/         → api/index.py → FastAPI app
https://yourdomain.com/api/docs     → api/index.py → FastAPI app
https://yourdomain.com/api/v1/users → api/index.py → FastAPI app
```

This routing is configured in `/vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/index.py"
    }
  ]
}
```

## 🔍 How Vercel Handles Python Functions

### File-based Routing

Vercel automatically creates serverless functions from Python files in these directories:
- `/api/` - Main API directory
- `/api/[subfolder]/` - Nested routes (if needed)

### Supported Patterns

1. **HTTP Functions** (what we use):
   ```python
   # Export ASGI/WSGI app
   handler = app
   ```

2. **Simple Functions**:
   ```python
   def handler(request):
       return {"hello": "world"}
   ```

## 🧩 Integration with FastAPI

The FastAPI app in `/backend/src/api/main.py` includes:

- All API routes (versioned under `/api/v1/`)
- CORS middleware
- Documentation endpoints
- Custom configuration

When a request hits `/api/*`:

```
Request → Vercel Edge Network
       → Python Serverless Function (api/index.py)
       → FastAPI app (backend/src/api/main.py)
       → Router (backend/src/api/v1/)
       → Endpoint (backend/src/api/v1/endpoints/*.py)
       → Response
```

## 📦 Dependencies

Python dependencies are installed from `/requirements.txt` at the project root.

Ensure all packages used by your FastAPI app are listed there:

```txt
fastapi>=0.115.0
uvicorn[standard]>=0.32.0
pydantic>=2.0.0
pydantic-settings>=2.0.0
email-validator>=2.0.0
scalar-fastapi>=1.0.0
```

## 🚀 Local Development

### With Vercel CLI (Recommended)

```bash
# From project root
vercel dev
```

This simulates the production environment:
- Next.js runs on `localhost:3000`
- API available at `localhost:3000/api/*`

### Run FastAPI Directly

```bash
cd backend
uvicorn src.api.main:app --reload --port 8000
```

Then access at `http://localhost:8000/api/v1/...`

## ⚙️ Configuration

### Python Version

Vercel uses Python 3.9 by default. To specify a different version, create a `runtime.txt`:

```txt
python-3.11
```

### Function Limits

- **Max execution time**: 10s (Hobby), 60s (Pro), 300s (Enterprise)
- **Max payload**: 4.5 MB (request + response)
- **Memory**: 1024 MB (Hobby), up to 3008 MB (Pro/Enterprise)

## 🐛 Debugging

### View Logs

```bash
# Real-time logs
vercel logs [deployment-url]

# Or in Vercel Dashboard
# Deployments → [Your Deployment] → Logs
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `ModuleNotFoundError` | Python can't find backend modules | Check path setup in `index.py` |
| Function timeout | Request takes too long | Optimize queries, upgrade plan |
| Import errors | Missing dependency | Add to `requirements.txt` |
| 404 on API routes | Rewrite rule not working | Check `vercel.json` |

### Debug Checklist

1. ✅ `api/index.py` exists and exports `handler`
2. ✅ `/requirements.txt` has all dependencies
3. ✅ Backend code works locally
4. ✅ `vercel.json` has correct rewrite rules
5. ✅ No syntax errors in Python files

## 🔄 How to Add More Functions

### Option 1: Use FastAPI Routes (Recommended)

Add new routes in `/backend/src/api/v1/endpoints/`:

```python
# backend/src/api/v1/endpoints/products.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/products")
def get_products():
    return {"products": []}
```

Then register in `/backend/src/api/v1/__init__.py`.

All routes will be accessible via `api/index.py`.

### Option 2: Create Separate Functions

Create new Python files in `/api/`:

```python
# api/webhook.py
def handler(request):
    return {"message": "Webhook received"}
```

Accessible at: `https://yourdomain.com/api/webhook`

## 📊 Performance

### Cold Starts

- First request initializes Python runtime + FastAPI
- Takes ~500ms - 2s depending on dependencies
- Subsequent requests reuse warm container (~50-200ms)

### Optimization Tips

1. **Keep dependencies minimal** - Reduces cold start time
2. **Import at module level** - Done once per container
3. **Cache data when possible** - Reduce external API calls
4. **Use Vercel Pro** - Better cold start performance

### Monitoring

Enable monitoring in Vercel Dashboard:
- Function invocations count
- Average duration
- Error rate
- P95/P99 latency

## 🔗 Related Documentation

- [Complete Deployment Guide](../VERCEL_DEPLOYMENT.md)
- [API Integration Examples](../NEXT_API_EXAMPLE.md)
- [Architecture Diagram](../DEPLOYMENT_DIAGRAM.md)
- [Vercel Python Docs](https://vercel.com/docs/functions/runtimes/python)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/vercel/)

## 💡 Best Practices

✅ **DO:**
- Keep `index.py` simple (just import and export)
- Put business logic in `/backend/`
- List all dependencies in `requirements.txt`
- Test locally with `vercel dev`
- Monitor function logs after deployment

❌ **DON'T:**
- Put business logic directly in `index.py`
- Use blocking operations (use async)
- Store state in memory (functions are stateless)
- Make long-running requests (respect timeout limits)
- Import heavy libraries unnecessarily

---

**Questions?** See the main [deployment documentation](../) or [Vercel's Python documentation](https://vercel.com/docs/functions/runtimes/python).

