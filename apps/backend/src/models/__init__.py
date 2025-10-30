"""
SQLAlchemy ORM models.

Import all models here to ensure they are registered with Base.metadata.
This is required for Alembic auto-generation to work properly.
"""

from src.models.asset import Asset, AssetGrade, AssetStatus
from src.models.asset_history import AssetHistory, HistoryAction
from src.models.category import Category
from src.models.location import Location
from src.models.user import User, UserRole
from src.models.workflow import Workflow, WorkflowStatus, WorkflowType

__all__ = [
    # Models
    "Asset",
    "AssetHistory",
    "Category",
    "Location",
    "User",
    "Workflow",
    # Enums
    "AssetGrade",
    "AssetStatus",
    "HistoryAction",
    "UserRole",
    "WorkflowStatus",
    "WorkflowType",
]
