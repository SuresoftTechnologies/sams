"""
SQLAlchemy ORM models.

Import all models here to ensure they are registered with Base.metadata.
This is required for Alembic auto-generation to work properly.
"""

from src.models.approval import Approval
from src.models.asset import Asset, AssetGrade, AssetStatus
from src.models.asset_attachment import AssetAttachment
from src.models.asset_history import AssetHistory, HistoryAction
from src.models.category import Category
from src.models.department import Department
from src.models.location import Location, LocationSite
from src.models.user import User, UserRole
from src.models.workflow import Workflow, WorkflowStatus, WorkflowType
from src.models.workflow_comment import WorkflowComment
from src.models.workflow_history import WorkflowHistory

__all__ = [
    # Models
    "Approval",
    "Asset",
    "AssetAttachment",
    "AssetHistory",
    "Category",
    "Department",
    "Location",
    "User",
    "Workflow",
    "WorkflowComment",
    "WorkflowHistory",
    # Enums
    "AssetGrade",
    "AssetStatus",
    "HistoryAction",
    "LocationSite",
    "UserRole",
    "WorkflowStatus",
    "WorkflowType",
]
