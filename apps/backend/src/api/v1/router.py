"""
API v1 Router - Aggregates all v1 endpoints
"""

from fastapi import APIRouter

from src.api.v1.endpoints import (
    auth,
    users,
    assets,
    categories,
    locations,
    workflows,
    qrcode,
    statistics,
)

# Create main API router
api_router = APIRouter()

# Include sub-routers with appropriate prefixes and tags
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"],
)

api_router.include_router(
    users.router,
    prefix="/users",
    tags=["Users"],
)

api_router.include_router(
    assets.router,
    prefix="/assets",
    tags=["Assets"],
)

api_router.include_router(
    categories.router,
    prefix="/categories",
    tags=["Categories"],
)

api_router.include_router(
    locations.router,
    prefix="/locations",
    tags=["Locations"],
)

api_router.include_router(
    workflows.router,
    prefix="/workflows",
    tags=["Workflows"],
)

api_router.include_router(
    qrcode.router,
    prefix="/qrcode",
    tags=["QR Codes"],
)

api_router.include_router(
    statistics.router,
    prefix="/statistics",
    tags=["Statistics"],
)
