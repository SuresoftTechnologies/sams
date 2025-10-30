"""
Repository layer for data access.

This package provides repository classes that encapsulate database operations
using the Repository pattern. Each repository handles data access for a specific
model or domain entity.
"""

from src.repositories.asset_repository import AssetRepository, asset_repository
from src.repositories.base import CRUDBase
from src.repositories.user_repository import UserRepository, user_repository

__all__ = [
    # Base
    "CRUDBase",
    # Asset
    "AssetRepository",
    "asset_repository",
    # User
    "UserRepository",
    "user_repository",
]
