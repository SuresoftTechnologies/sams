"""
Workflow (asset request) management endpoints.
"""

import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status, Body
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.middlewares.auth import get_current_user, require_role
from src.models.user import User as UserModel, UserRole
from src.models.asset import Asset as AssetModel, AssetStatus
from src.models.workflow import Workflow as WorkflowModel, WorkflowType, WorkflowStatus
from src.models.asset_history import AssetHistory, HistoryAction
from src.schemas.workflow import (
    Workflow,
    CreateWorkflowRequest,
    UpdateWorkflowRequest,
    ApprovalRequest,
)
from src.schemas.common import PaginatedResponse, MessageResponse

router = APIRouter()


@router.get("", response_model=PaginatedResponse[Workflow])
async def get_workflows(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    workflow_type: WorkflowType | None = Query(None, description="Filter by type"),
    status: WorkflowStatus | None = Query(None, description="Filter by status"),
    asset_id: str | None = Query(None, description="Filter by asset"),
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> PaginatedResponse[Workflow]:
    """
    Get list of workflows.

    Users see their own requests or requests they need to approve (Managers/Admins).

    Args:
        skip: Number of items to skip
        limit: Number of items per page
        workflow_type: Filter by workflow type
        status: Filter by status
        asset_id: Filter by asset
        db: Database session
        current_user: Current authenticated user

    Returns:
        Paginated list of workflows
    """
    query = select(WorkflowModel)

    # Filter based on role
    if current_user.role == UserRole.EMPLOYEE:
        # Employees see only their own requests
        query = query.where(WorkflowModel.requester_id == current_user.id)
    # Managers and Admins see all workflows

    # Apply filters
    if workflow_type:
        query = query.where(WorkflowModel.type == workflow_type)
    if status:
        query = query.where(WorkflowModel.status == status)
    if asset_id:
        query = query.where(WorkflowModel.asset_id == asset_id)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Apply pagination
    query = query.offset(skip).limit(limit).order_by(WorkflowModel.created_at.desc())
    result = await db.execute(query)
    workflows = result.scalars().all()

    return PaginatedResponse(
        items=[Workflow.model_validate(wf) for wf in workflows],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/{workflow_id}", response_model=Workflow)
async def get_workflow(
    workflow_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> Workflow:
    """
    Get workflow by ID.

    Args:
        workflow_id: Workflow ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        Workflow object

    Raises:
        HTTPException: 404 if workflow not found
        HTTPException: 403 if user doesn't have permission
    """
    result = await db.execute(
        select(WorkflowModel).where(WorkflowModel.id == workflow_id)
    )
    workflow = result.scalar_one_or_none()

    if workflow is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found",
        )

    # Check permission
    if (
        current_user.role == UserRole.EMPLOYEE
        and workflow.requester_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this workflow",
        )

    return Workflow.model_validate(workflow)


@router.post("/checkout", response_model=Workflow, status_code=status.HTTP_201_CREATED)
async def create_checkout_request(
    asset_id: str = Body(..., description="Asset ID"),
    reason: str | None = Body(None, description="Reason for checkout"),
    expected_return_date: datetime | None = Body(None, description="Expected return date"),
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> Workflow:
    """
    Create asset checkout request.

    Args:
        asset_id: Asset ID to checkout
        reason: Reason for checkout
        expected_return_date: Expected return date
        db: Database session
        current_user: Current authenticated user

    Returns:
        Created workflow object

    Raises:
        HTTPException: 404 if asset not found
        HTTPException: 400 if asset is not available
    """
    # Verify asset exists and is available
    result = await db.execute(
        select(AssetModel).where(AssetModel.id == asset_id)
    )
    asset = result.scalar_one_or_none()

    if asset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found",
        )

    if asset.status != AssetStatus.AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Asset is not available (current status: {asset.status})",
        )

    # Create workflow
    workflow = WorkflowModel(
        id=str(uuid.uuid4()),
        type=WorkflowType.CHECKOUT,
        status=WorkflowStatus.PENDING,
        asset_id=asset_id,
        requester_id=current_user.id,
        assignee_id=current_user.id,  # Requesting for self
        reason=reason,
        expected_return_date=expected_return_date,
    )

    db.add(workflow)
    await db.commit()
    await db.refresh(workflow)

    return Workflow.model_validate(workflow)


@router.post("/checkin", response_model=Workflow, status_code=status.HTTP_201_CREATED)
async def create_checkin_request(
    asset_id: str = Body(..., description="Asset ID"),
    reason: str | None = Body(None, description="Reason for checkin"),
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> Workflow:
    """
    Create asset checkin (return) request.

    Args:
        asset_id: Asset ID to return
        reason: Reason for return
        db: Database session
        current_user: Current authenticated user

    Returns:
        Created workflow object

    Raises:
        HTTPException: 404 if asset not found
        HTTPException: 400 if asset is not assigned to user
    """
    # Verify asset exists and is assigned to user
    result = await db.execute(
        select(AssetModel).where(AssetModel.id == asset_id)
    )
    asset = result.scalar_one_or_none()

    if asset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found",
        )

    if asset.assigned_to != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Asset is not assigned to you",
        )

    # Create workflow
    workflow = WorkflowModel(
        id=str(uuid.uuid4()),
        type=WorkflowType.CHECKIN,
        status=WorkflowStatus.PENDING,
        asset_id=asset_id,
        requester_id=current_user.id,
        reason=reason,
    )

    db.add(workflow)
    await db.commit()
    await db.refresh(workflow)

    return Workflow.model_validate(workflow)


@router.patch("/{workflow_id}/approve", response_model=Workflow)
async def approve_workflow(
    workflow_id: str,
    request: ApprovalRequest = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER)),
) -> Workflow:
    """
    Approve workflow request (Manager/Admin only).

    Args:
        workflow_id: Workflow ID
        request: Approval request with optional comment
        db: Database session
        current_user: Current authenticated manager/admin user

    Returns:
        Updated workflow object

    Raises:
        HTTPException: 404 if workflow not found
        HTTPException: 400 if workflow is not pending
    """
    # Query workflow
    result = await db.execute(
        select(WorkflowModel).where(WorkflowModel.id == workflow_id)
    )
    workflow = result.scalar_one_or_none()

    if workflow is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found",
        )

    if workflow.status != WorkflowStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Workflow is not pending (current status: {workflow.status})",
        )

    # Update workflow
    workflow.status = WorkflowStatus.APPROVED
    workflow.approver_id = current_user.id
    workflow.approved_at = datetime.now()

    # Query asset to update
    asset_result = await db.execute(
        select(AssetModel).where(AssetModel.id == workflow.asset_id)
    )
    asset = asset_result.scalar_one_or_none()

    if asset:
        # Update asset based on workflow type
        if workflow.type == WorkflowType.CHECKOUT:
            asset.status = AssetStatus.ASSIGNED
            asset.assigned_to = workflow.assignee_id

            # Create history entry
            history = AssetHistory(
                id=str(uuid.uuid4()),
                asset_id=asset.id,
                performed_by=current_user.id,
                action=HistoryAction.ASSIGNED,
                description=f"Asset assigned via workflow approval: {workflow.reason or 'No reason provided'}",
                to_user_id=workflow.assignee_id,
                workflow_id=workflow_id,
            )
            db.add(history)

        elif workflow.type == WorkflowType.CHECKIN:
            asset.status = AssetStatus.AVAILABLE
            asset.assigned_to = None

            # Create history entry
            history = AssetHistory(
                id=str(uuid.uuid4()),
                asset_id=asset.id,
                performed_by=current_user.id,
                action=HistoryAction.UNASSIGNED,
                description=f"Asset returned via workflow approval: {workflow.reason or 'No reason provided'}",
                from_user_id=workflow.requester_id,
                workflow_id=workflow_id,
            )
            db.add(history)

    await db.commit()
    await db.refresh(workflow)

    return Workflow.model_validate(workflow)


@router.patch("/{workflow_id}/reject", response_model=Workflow)
async def reject_workflow(
    workflow_id: str,
    reject_reason: str = Body(..., description="Reason for rejection"),
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER)),
) -> Workflow:
    """
    Reject workflow request (Manager/Admin only).

    Args:
        workflow_id: Workflow ID
        reject_reason: Reason for rejection
        db: Database session
        current_user: Current authenticated manager/admin user

    Returns:
        Updated workflow object

    Raises:
        HTTPException: 404 if workflow not found
        HTTPException: 400 if workflow is not pending
    """
    # Query workflow
    result = await db.execute(
        select(WorkflowModel).where(WorkflowModel.id == workflow_id)
    )
    workflow = result.scalar_one_or_none()

    if workflow is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found",
        )

    if workflow.status != WorkflowStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Workflow is not pending (current status: {workflow.status})",
        )

    # Update workflow
    workflow.status = WorkflowStatus.REJECTED
    workflow.approver_id = current_user.id
    workflow.rejected_at = datetime.now()
    workflow.reject_reason = reject_reason

    await db.commit()
    await db.refresh(workflow)

    return Workflow.model_validate(workflow)


@router.patch("/{workflow_id}/cancel", response_model=Workflow)
async def cancel_workflow(
    workflow_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> Workflow:
    """
    Cancel workflow request (requester only).

    Args:
        workflow_id: Workflow ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        Updated workflow object

    Raises:
        HTTPException: 404 if workflow not found
        HTTPException: 403 if user is not the requester
        HTTPException: 400 if workflow is not pending
    """
    # Query workflow
    result = await db.execute(
        select(WorkflowModel).where(WorkflowModel.id == workflow_id)
    )
    workflow = result.scalar_one_or_none()

    if workflow is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found",
        )

    # Check if user is the requester
    if workflow.requester_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the requester can cancel this workflow",
        )

    if workflow.status != WorkflowStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Workflow is not pending (current status: {workflow.status})",
        )

    # Update workflow
    workflow.status = WorkflowStatus.CANCELLED

    await db.commit()
    await db.refresh(workflow)

    return Workflow.model_validate(workflow)
