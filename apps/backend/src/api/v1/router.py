"""
API v1 Router - Aggregates all v1 endpoints
"""

from fastapi import APIRouter

from src.api.v1.endpoints import assets, auth, users

# Create main API router
api_router = APIRouter()

# Include sub-routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(assets.router, prefix="/assets", tags=["Assets"])
