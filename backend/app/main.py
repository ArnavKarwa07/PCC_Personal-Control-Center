"""Main entry point for PCC FastAPI application."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_v1_router
from app.core.config import settings
from app.core.exceptions import register_exception_handlers


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events for setup and teardown."""
    # Startup actions
    yield
    # Shutdown actions


app = FastAPI(
    title="PCC API",
    version="0.1.0",
    description="Personal Control Center Backend API",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers for unified error envelopes
register_exception_handlers(app)

# Include API v1 router
app.include_router(api_v1_router, prefix="/api/v1")


@app.get("/")
def root():
    """Root endpoint for gateway health check and documentation link."""
    return {
        "name": "PCC API",
        "version": "0.1.0",
        "docs": "/docs",
        "api_v1": "/api/v1",
    }
