from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from .routers import tasks, auth
import os

app = FastAPI(
    title="TaskMaster Pro API",
    description="FastAPI Backend with TinyDB + React Frontend",
    version="1.0.0",
)

# Configure CORS for local development and common frontend ports
origins = [
    "http://localhost",
    "http://localhost:8000",
    "http://localhost:3000",  # React / Next.js default port
    "http://localhost:5173",  # Vite default port
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# All API routes are prefixed with /api so they don't clash with frontend paths
app.include_router(auth.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")

@app.get("/api/")
def read_root():
    return {"message": "Welcome to the TaskMaster Pro API"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

# ---------------------------------------------------------------------------
# Serve the React frontend (production build)
# The built files live in frontend/dist (relative to the NC root).
# We mount them AFTER all API routes so /api/* is never shadowed.
# ---------------------------------------------------------------------------
_FRONTEND_DIST = os.path.join(
    os.path.dirname(__file__),   # backend/app
    "..", "..",                   # → NC root
    "frontend", "dist"
)
_FRONTEND_DIST = os.path.abspath(_FRONTEND_DIST)

if os.path.isdir(_FRONTEND_DIST):
    # Serve static assets (JS/CSS/images) under /assets
    app.mount(
        "/assets",
        StaticFiles(directory=os.path.join(_FRONTEND_DIST, "assets")),
        name="assets",
    )

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_frontend(full_path: str):
        """Catch-all: returns index.html so React Router can handle the path."""
        index = os.path.join(_FRONTEND_DIST, "index.html")
        return FileResponse(index)
