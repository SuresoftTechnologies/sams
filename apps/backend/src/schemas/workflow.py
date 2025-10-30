"""
Workflow schemas for asset check-in/check-out requests.
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class WorkflowType(str, Enum):
    """Workflow type enum."""

    CHECKOUT = "checkout"  # Asset checkout/assignment request
    CHECKIN = "checkin"  # Asset return request
    TRANSFER = "transfer"  # Transfer between users
    MAINTENANCE = "maintenance"  # Maintenance request
    RENTAL = "rental"  # Rental request for loaned assets
    RETURN = "return"  # Return request for borrowed assets
    DISPOSAL = "disposal"  # Disposal request for old assets


class WorkflowStatus(str, Enum):
    """Workflow status enum."""

    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class Workflow(BaseModel):
    """Workflow model."""

    model_config = ConfigDict(from_attributes=True)

    id: str = Field(..., description="Unique workflow ID (UUID)")
    type: WorkflowType = Field(..., description="Workflow type")
    status: WorkflowStatus = Field(default=WorkflowStatus.PENDING, description="Current status")

    # Asset and users
    asset_id: str = Field(..., description="Asset ID")
    requester_id: str = Field(..., description="Requester user ID")
    assignee_id: str | None = Field(None, description="Target assignee user ID")
    approver_id: str | None = Field(None, description="Approver user ID")

    # Request details
    reason: str | None = Field(None, description="Reason for request")
    expected_return_date: datetime | None = Field(None, description="Expected return date")

    # Approval/Rejection
    approved_at: datetime | None = Field(None, description="Approval timestamp")
    rejected_at: datetime | None = Field(None, description="Rejection timestamp")
    reject_reason: str | None = Field(None, description="Rejection reason")

    # Completion
    completed_at: datetime | None = Field(None, description="Completion timestamp")
    completion_notes: str | None = Field(None, description="Completion notes")

    # Timestamps
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "type": "checkout",
                "status": "pending",
                "asset_id": "550e8400-e29b-41d4-a716-446655440001",
                "requester_id": "550e8400-e29b-41d4-a716-446655440002",
                "reason": "프로젝트 업무용",
                "expected_return_date": "2024-12-31T00:00:00Z",
                "created_at": "2024-01-15T09:00:00Z",
                "updated_at": "2024-01-15T09:00:00Z",
            }
        }
    )


class CreateWorkflowRequest(BaseModel):
    """Create workflow request DTO."""

    type: WorkflowType = Field(..., description="Workflow type")
    asset_id: str = Field(..., description="Asset ID")
    assignee_id: str | None = Field(None, description="Target assignee (for transfer)")
    reason: str | None = Field(None, max_length=1000, description="Reason")
    expected_return_date: datetime | None = Field(None, description="Expected return date")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "type": "checkout",
                "asset_id": "550e8400-e29b-41d4-a716-446655440001",
                "reason": "프로젝트 업무용",
                "expected_return_date": "2024-12-31T00:00:00Z",
            }
        }
    )


class UpdateWorkflowRequest(BaseModel):
    """Update workflow request DTO - for status changes."""

    status: WorkflowStatus | None = Field(None, description="New status")
    reject_reason: str | None = Field(None, max_length=1000, description="Rejection reason")
    completion_notes: str | None = Field(None, max_length=1000, description="Completion notes")


class ApprovalRequest(BaseModel):
    """Workflow approval request DTO."""

    comment: str | None = Field(None, max_length=500, description="Approval comment")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "comment": "승인합니다",
            }
        }
    )
