# Backend API

This is the FastAPI backend for the humanize project, configured for deployment to Vercel.

## Features

This CI/CD pipeline uses modern Python tooling:

- **UV** for Python dependency management and virtual environments
- **FastAPI** for building high-performance APIs
- **Ruff** for linting and formatting
- **Pyright** for static type checking
- **Pytest** for testing 
- `pytest-cov` for coverage
- Checks `uv.lock` for consistency
- Builds distributable wheels


## Getting Started

### Prerequisites

- Python 3.14+
- [uv](https://github.com/astral-sh/uv) package manager

### Installation

Install dependencies using uv:

```bash
uv sync
```

## Running Locally

Start the development server on http://0.0.0.0:8000

```bash
uv run uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
```

When you make changes to your project, the server will automatically reload.

Visit:
- API Documentation: http://localhost:8000/docs
- Alternative API Docs: http://localhost:8000/redoc

## Development

### Running Tests

```bash
uv run pytest
```

### Running Linting

```bash
uv run ruff check .
```

### Running Type Checking

```bash
uv run pyright
```

### Formatting Code

```bash
uv run ruff format .
```

## API Endpoints

- `GET /` - Root endpoint with HTML response
- `GET /api/data` - Get sample data
- `GET /api/items/{item_id}` - Get specific item by ID
- `GET /docs` - Interactive API documentation (Swagger UI)
- `GET /redoc` - Alternative API documentation

## Deploying to Vercel

### First Time Setup

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

### Deploy

Deploy your project to Vercel:

```bash
vercel --prod
```

Or push to your repository with the [Vercel Git integration](https://vercel.com/docs/deployments/git).

### Configuration

The `vercel.json` file configures how Vercel deploys the FastAPI application:
- Builds the Python application using `@vercel/python`
- Routes all requests to the FastAPI app
- Static files are served from the `public/` directory

## Project Structure

```
backend/
├── src/
│   └── api/
│       ├── __init__.py
│       └── main.py          # FastAPI application
├── public/
│   └── favicon.ico          # Static assets
├── tests/
│   └── test_main.py         # Tests
├── pyproject.toml           # Project configuration
├── uv.lock                  # Dependency lock file
├── vercel.json              # Vercel deployment config
└── README.md                # This file
```

## Environment Variables

For production deployment, set environment variables in the Vercel dashboard or using:

```bash
vercel env add VARIABLE_NAME
```
