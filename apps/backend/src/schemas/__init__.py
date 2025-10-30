"""
Pydantic schemas for request/response validation.
"""

# Common schemas
# Asset schemas
from src.schemas.asset import (
    Asset,
    AssetFilterParams,
    AssetGrade,
    AssetListResponse,
    AssetStatus,
    CreateAssetRequest,
    UpdateAssetRequest,
)

# Asset history schemas
from src.schemas.asset_history import (
    AssetHistory,
    AssetHistoryListResponse,
    HistoryAction,
)

# Auth schemas
from src.schemas.auth import (
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    RegisterRequest,
    TokenPair,
    TokenPayload,
)

# Category schemas
from src.schemas.category import Category, CreateCategoryRequest, UpdateCategoryRequest
from src.schemas.common import (
    ErrorResponse,
    MessageResponse,
    PaginatedResponse,
    PaginationParams,
)

# Location schemas
from src.schemas.location import CreateLocationRequest, Location, UpdateLocationRequest

# User schemas
from src.schemas.user import CreateUserRequest, UpdateUserRequest, User, UserRole

# Workflow schemas
from src.schemas.workflow import (
    ApprovalRequest,
    CreateWorkflowRequest,
    UpdateWorkflowRequest,
    Workflow,
    WorkflowStatus,
    WorkflowType,
)

__all__ = [
    # Common
    "ErrorResponse",
    "MessageResponse",
    "PaginatedResponse",
    "PaginationParams",
    # User
    "User",
    "UserRole",
    "CreateUserRequest",
    "UpdateUserRequest",
    # Auth
    "LoginRequest",
    "LoginResponse",
    "RegisterRequest",
    "TokenPair",
    "TokenPayload",
    "RefreshTokenRequest",
    # Asset
    "Asset",
    "AssetStatus",
    "AssetGrade",
    "CreateAssetRequest",
    "UpdateAssetRequest",
    "AssetFilterParams",
    "AssetListResponse",
    # Asset History
    "AssetHistory",
    "AssetHistoryListResponse",
    "HistoryAction",
    # Category
    "Category",
    "CreateCategoryRequest",
    "UpdateCategoryRequest",
    # Location
    "Location",
    "CreateLocationRequest",
    "UpdateLocationRequest",
    # Workflow
    "Workflow",
    "WorkflowType",
    "WorkflowStatus",
    "CreateWorkflowRequest",
    "UpdateWorkflowRequest",
    "ApprovalRequest",
]
