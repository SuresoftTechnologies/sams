"""
Workflow comment schemas for API request/response.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class WorkflowCommentCreate(BaseModel):
    """Schema for creating a workflow comment."""

    comment: str = Field(..., min_length=1, max_length=5000, description="Comment text")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "comment": "자산 대여 목적과 기간을 확인하였습니다.",
            }
        }
    )


class WorkflowCommentUser(BaseModel):
    """User info in comment response."""

    id: str = Field(..., description="User ID")
    name: str = Field(..., description="User name")
    email: str = Field(..., description="User email")
    role: str = Field(..., description="User role")

    model_config = ConfigDict(from_attributes=True)


class WorkflowCommentResponse(BaseModel):
    """Schema for workflow comment response."""

    id: str = Field(..., description="Comment ID")
    workflow_id: str = Field(..., description="Workflow ID")
    user_id: str = Field(..., description="User ID who created the comment")
    user: WorkflowCommentUser = Field(..., description="User details")
    comment: str = Field(..., description="Comment text")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "workflow_id": "550e8400-e29b-41d4-a716-446655440001",
                "user_id": "550e8400-e29b-41d4-a716-446655440002",
                "user": {
                    "id": "550e8400-e29b-41d4-a716-446655440002",
                    "name": "홍길동",
                    "email": "hong@example.com",
                    "role": "admin",
                },
                "comment": "자산 대여 목적과 기간을 확인하였습니다.",
                "created_at": "2024-01-15T09:00:00Z",
                "updated_at": "2024-01-15T09:00:00Z",
            }
        }
    )


class WorkflowCommentUpdate(BaseModel):
    """Schema for updating a workflow comment."""

    comment: str = Field(..., min_length=1, max_length=5000, description="Updated comment text")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "comment": "추가 문서 제출이 필요합니다.",
            }
        }
    )
