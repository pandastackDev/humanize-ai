from fastapi import FastAPI
from fastapi.responses import HTMLResponse


app = FastAPI(
    title="Humanize API",
    description="FastAPI backend for humanize",
    version="1.0.0",
)


@app.get("/api/data")
def get_sample_data():
    return {
        "data": [
            {"id": 1, "name": "Sample Item 1", "value": 100},
            {"id": 2, "name": "Sample Item 2", "value": 200},
            {"id": 3, "name": "Sample Item 3", "value": 300},
        ],
        "total": 3,
        "timestamp": "2024-01-01T00:00:00Z",
    }


@app.get("/api/items/{item_id}")
def get_item(item_id: int):
    return {
        "item": {
            "id": item_id,
            "name": "Sample Item " + str(item_id),
            "value": item_id * 100,
        },
        "timestamp": "2024-01-01T00:00:00Z",
    }


@app.get("/", response_class=HTMLResponse)
def read_root():
    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>FastAPI backend for humanize</title>
        <link rel="icon" type="image/x-icon" href="/favicon.ico">
    </head>
    <body>
        <main>
                    <a href="/docs">Open Swagger UI →</a>
        </main>
    </body>
    </html>
    """
