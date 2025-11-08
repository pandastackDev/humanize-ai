"""
FastAPI application entry point.

Best practices implemented:
- Centralized configuration using settings
- API versioning (v1)
- Router-based organization
- Separation of concerns (models, endpoints, config)
"""

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from scalar_fastapi import get_scalar_api_reference

from api.config import settings
from api.v1 import router as v1_router


# ============================================================================
# Application Initialization
# ============================================================================

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
)

# Include API v1 router with versioned prefix
app.include_router(v1_router, prefix=settings.API_V1_STR)


# ============================================================================
# Root & Documentation Endpoints
# ============================================================================


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
