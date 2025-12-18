"""
FastAPI application entry point.

Best practices implemented:
- Centralized configuration using settings
- API versioning (v1)
- Router-based organization
- Separation of concerns (models, endpoints, config)
"""

import logging
import os
import sys

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from scalar_fastapi import get_scalar_api_reference

# Add the src directory to Python path for Vercel deployment
# This ensures that the 'api' module can be found
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)


from api.config import settings  # noqa: E402
from api.v1 import router as v1_router  # noqa: E402

# Configure logging for Vercel
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

# Log startup information
logger.info("=" * 60)
logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}")
logger.info(f"Environment: {settings.ENVIRONMENT}")
logger.info(f"Python version: {sys.version}")
logger.info(f"Current working directory: {os.getcwd()}")
logger.info(f"VERCEL_ENV: {os.environ.get('VERCEL_ENV', 'not set')}")
logger.info("=" * 60)


# ============================================================================
# Application Initialization
# ============================================================================

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
)

# Configure CORS - MUST be added before other middleware
# Parse CORS origins from environment variable
if settings.CORS_ORIGINS == "*":
    # For wildcard, we cannot use credentials
    cors_origins = ["*"]
    allow_creds = False
else:
    # Parse comma-separated origins and strip whitespace
    cors_origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",")]
    allow_creds = True

logger.info(f"CORS Origins: {cors_origins}")
logger.info(f"CORS Allow Credentials: {allow_creds}")

# Add CORS middleware FIRST (before other middleware)
# This is critical - CORS middleware must be added before any other middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=allow_creds,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],
    max_age=3600,
)


# Add request logging middleware for debugging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"🔵 Request: {request.method} {request.url.path}")
    logger.info(f"🔵 Origin: {request.headers.get('origin', 'No origin header')}")
    try:
        response = await call_next(request)
        
        # Ensure CORS headers are present (backup in case middleware doesn't work)
        origin = request.headers.get("origin")
        if origin:
            if "*" in cors_origins or origin in cors_origins:
                response.headers["Access-Control-Allow-Origin"] = origin if "*" not in cors_origins else "*"
                response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
                response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept, Origin, X-Requested-With"
                if allow_creds:
                    response.headers["Access-Control-Allow-Credentials"] = "true"
        
        logger.info(
            f"✅ Response: {request.method} {request.url.path} - Status: {response.status_code}"
        )
        return response
    except Exception as e:
        logger.error(f"❌ Error: {request.method} {request.url.path} - {str(e)}")
        logger.exception("Full traceback:")
        error_response = JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "detail": str(e),
                "path": request.url.path,
                "method": request.method,
            },
        )
        # Add CORS headers to error response too
        origin = request.headers.get("origin")
        if origin and ("*" in cors_origins or origin in cors_origins):
            error_response.headers["Access-Control-Allow-Origin"] = origin if "*" not in cors_origins else "*"
            error_response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            error_response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept, Origin, X-Requested-With"
            if allow_creds:
                error_response.headers["Access-Control-Allow-Credentials"] = "true"
        return error_response


# Add explicit OPTIONS handler for all routes (before including routers)
# This ensures preflight requests are handled even if middleware fails
@app.options("/{full_path:path}")
async def options_handler(request: Request):
    """Explicit OPTIONS handler for CORS preflight requests"""
    from fastapi.responses import Response
    
    origin = request.headers.get("origin", "")
    logger.info(f"🔵 OPTIONS preflight request from origin: {origin}")
    logger.info(f"🔵 Request path: {request.url.path}")
    logger.info(f"🔵 Allowed origins: {cors_origins}")
    
    # Create response with 200 status
    response = Response(status_code=200)
    
    # Always set CORS headers (allow all for now, can be restricted later)
    if "*" in cors_origins or not cors_origins or origin in cors_origins:
        response.headers["Access-Control-Allow-Origin"] = origin if ("*" not in cors_origins and origin) else "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept, Origin, X-Requested-With"
        response.headers["Access-Control-Max-Age"] = "3600"
        if allow_creds and origin:
            response.headers["Access-Control-Allow-Credentials"] = "true"
        logger.info(f"✅ OPTIONS preflight handled - CORS headers set for origin: {origin}")
    else:
        logger.warning(f"⚠️ OPTIONS request from unauthorized origin: {origin}")
        # Still set headers but log warning
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept, Origin, X-Requested-With"
    
    return response

# Include API v1 router with versioned prefix
app.include_router(v1_router, prefix=settings.API_V1_STR)

logger.info(f"✓ API v1 router mounted at {settings.API_V1_STR}")


# ============================================================================
# Root & Documentation Endpoints
# ============================================================================


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
    }


@app.get("/scalar", include_in_schema=False)
async def scalar_html():
    """Scalar API Reference UI"""
    return get_scalar_api_reference(
        openapi_url=app.openapi_url,
        title=app.title,
        scalar_proxy_url="https://proxy.scalar.com",
        # show_sidebar=True,
        # hide_download_button=False,
        # hide_models=False,
        # dark_mode=True,
        # search_hot_key=SearchHotKey.K,
        # servers=[
        #     {"url": "https://api.production.example.com"},
        #     {"url": "https://api.staging.example.com"}
        # ],
        # default_open_all_tags=True,
        # authentication={"bearerAuth": "your-static-token-if-needed"},
    )


@app.get("/", response_class=HTMLResponse, include_in_schema=False)
def docs_page():
    """HTML page with links to all documentation"""
    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{settings.PROJECT_NAME} - Documentation</title>
        <link rel="icon" type="image/x-icon" href="/favicon.ico">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 800px;
                margin: 50px auto;
                padding: 20px;
                line-height: 1.6;
            }}
            h1 {{ color: #333; }}
            ul {{ list-style: none; padding: 0; }}
            li {{ margin: 10px 0; }}
            a {{
                color: #0066cc;
                text-decoration: none;
                font-size: 18px;
            }}
            a:hover {{ text-decoration: underline; }}
        </style>
    </head>
    <body>
        <h1>{settings.PROJECT_NAME}</h1>
        <p>{settings.PROJECT_DESCRIPTION}</p>
        <p><strong>Version:</strong> {settings.VERSION}</p>
        <h2>API Documentation</h2>
        <ul>
            <li><a href="/scalar">📘 Scalar UI →</a></li>
            <li><a href="/docs">📗 Swagger UI →</a></li>
            <li><a href="/redoc">📕 ReDoc UI →</a></li>
            <li><a href="/openapi.json">📄 OpenAPI JSON →</a></li>
        </ul>
    </body>
    </html>
    """
