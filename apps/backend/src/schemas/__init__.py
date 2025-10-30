"""
Pydantic schemas for request/response validation.
"""

# Common schemas
from src.schemas.common import (
    ErrorResponse,
    MessageResponse,
    PaginatedResponse,
    PaginationParams,
)

# User schemas
from src.schemas.user import CreateUserRequest, UpdateUserRequest, User, UserRole

# Auth schemas
from src.schemas.auth import (
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    RegisterRequest,
    TokenPair,
    TokenPayload,
)

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

# Category schemas
from src.schemas.category import Category, CreateCategoryRequest, UpdateCategoryRequest

# Location schemas
from src.schemas.location import CreateLocationRequest, Location, UpdateLocationRequest

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
