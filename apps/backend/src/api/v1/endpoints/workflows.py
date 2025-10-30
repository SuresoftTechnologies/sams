"""
Workflow (asset request) management endpoints.
"""

import uuid
from datetime import datetime

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.middlewares.auth import get_current_user, require_role
from src.models.asset import Asset as AssetModel
from src.models.asset import AssetStatus
from src.models.asset_history import AssetHistory, HistoryAction
from src.models.user import User as UserModel
from src.models.user import UserRole
from src.models.workflow import Workflow as WorkflowModel
from src.models.workflow import WorkflowStatus, WorkflowType
from src.schemas.common import PaginatedResponse
from src.schemas.workflow import (
    ApprovalRequest,
    CreateWorkflowRequest,
    RejectionRequest,
    Workflow,
)
from src.schemas.common import PaginatedResponse, MessageResponse
from src.services.email_service import email_service

router = APIRouter()


async def _notify_managers_of_workflow(
    db: AsyncSession,
    workflow_type: WorkflowType,
    current_user: UserModel,
    asset: AssetModel,
    reason: str | None,
) -> None:
    """Send workflow notification email to active managers."""

    try:
        manager_result = await db.execute(
            select(UserModel).where(
                UserModel.role == UserRole.MANAGER,
                UserModel.is_active == True,
            )
        )
        managers = manager_result.scalars().all()

        manager_emails = [manager.email for manager in managers if manager.email]

        if not manager_emails:
            return

        # 안전하게 처리: Enum이면 .value, 문자열이면 그대로 사용
        workflow_type_value = workflow_type.value if hasattr(workflow_type, 'value') else workflow_type

        # Asset name 안전하게 처리
        asset_name = (
            getattr(asset, "name", None)
            or getattr(asset, "model", None)
            or getattr(asset, "asset_tag", "알 수 없음")
        )

        success, message, _ = email_service.send_workflow_notification(
            workflow_type=workflow_type_value,
            requester_name=current_user.name,
            requester_email=current_user.email,
            requester_department=current_user.department,
            asset_name=asset_name,
            asset_tag=asset.asset_tag,
            asset_model=asset.model,
            reason=reason,
            manager_emails=manager_emails,
        )

        if not success:
            print(f"Failed to send manager notification email: {message}")
        else:
            print(f"Manager notification email sent: {message}")
    except Exception as exc:  # pragma: no cover - notification failure should not block workflow
        print(f"Failed to send email notification: {exc}")


async def _notify_requester_of_workflow_decision(
    db: AsyncSession,
    workflow: WorkflowModel,
    asset: AssetModel | None,
    approver: UserModel,
    decision: str,
    comment: str | None,
) -> None:
    """Send notification to requester about workflow decision."""

    try:
        requester_result = await db.execute(
            select(UserModel).where(UserModel.id == workflow.requester_id)
        )
        requester = requester_result.scalar_one_or_none()

        if not requester or not requester.email:
            return

        asset_name = (
            getattr(asset, "name", None)
            or getattr(asset, "model", None)
            or getattr(asset, "asset_tag", "알 수 없음")
        )
        asset_tag = getattr(asset, "asset_tag", "알 수 없음")
        asset_model = getattr(asset, "model", None)

        expected_return_date = None
        if workflow.expected_return_date:
            expected_return_date = workflow.expected_return_date.strftime("%Y-%m-%d")

        # 안전하게 처리: Enum이면 .value, 문자열이면 그대로 사용
        workflow_type_value = workflow.type.value if hasattr(workflow.type, 'value') else workflow.type

        success, message, _ = email_service.send_workflow_decision_notification(
            requester_email=requester.email,
            requester_name=requester.name,
            workflow_type=workflow_type_value,
            decision=decision,
            asset_name=asset_name,
            asset_tag=asset_tag,
            asset_model=asset_model,
            approver_name=approver.name,
            reason=workflow.reason,
            expected_return_date=expected_return_date,
            comment=comment,
        )

        if not success:
            print(f"Failed to send requester notification email: {message}")
        else:
            print(f"Requester notification email sent: {message}")
    except Exception as exc:  # pragma: no cover
        print(f"Failed to send workflow decision email: {exc}")


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


@router.post("", response_model=Workflow, status_code=status.HTTP_201_CREATED)
async def create_workflow(
    request: CreateWorkflowRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> Workflow:
    """
    Create a new workflow (rental, return, disposal, maintenance).

    Validation logic:
    - RENTAL: Asset must be LOANED status and not assigned
    - RETURN: Asset must be assigned to current user
    - DISPOSAL/MAINTENANCE: Admin/Manager only

    Args:
        request: Workflow creation request
        db: Database session
        current_user: Current authenticated user

    Returns:
        Created workflow object

    Raises:
        HTTPException: 404 if asset not found
        HTTPException: 400 if validation fails
    """
    # Verify asset exists
    result = await db.execute(
        select(AssetModel).where(AssetModel.id == request.asset_id)
    )
    asset = result.scalar_one_or_none()

    if asset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found",
        )

    # Validate based on workflow type
    if request.type == WorkflowType.RENTAL:
        # Check if asset is available for rental
        if asset.status != AssetStatus.LOANED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이 자산은 대여할 수 없습니다. 대여용 자산만 대여 가능합니다.",
            )
        if asset.assigned_to is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이 자산은 이미 대여 중입니다.",
            )
        # Rental requires expected return date
        if request.expected_return_date is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="대여 신청 시 반납 예정일은 필수입니다.",
            )

    elif request.type == WorkflowType.RETURN:
        # Check if asset is assigned to current user
        if asset.assigned_to != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="본인이 대여한 자산만 반납할 수 있습니다.",
            )

    elif request.type == WorkflowType.DISPOSAL:
        # Only admins and managers can request disposal
        if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="불용 신청은 관리자만 가능합니다.",
            )

    elif request.type == WorkflowType.MAINTENANCE:
        # Only admins and managers can request maintenance
        if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="유지보수 신청은 관리자만 가능합니다.",
            )

    # Create workflow
    workflow = WorkflowModel(
        id=str(uuid.uuid4()),
        type=request.type,
        status=WorkflowStatus.PENDING,
        asset_id=request.asset_id,
        requester_id=current_user.id,
        assignee_id=request.assignee_id if request.type == WorkflowType.TRANSFER else (
            current_user.id if request.type == WorkflowType.RENTAL else None
        ),
        reason=request.reason,
        expected_return_date=request.expected_return_date,
    )

    db.add(workflow)
    await db.commit()
    await db.refresh(workflow)

    await _notify_managers_of_workflow(
        db=db,
        workflow_type=workflow.type,
        current_user=current_user,
        asset=asset,
        reason=request.reason,
    )

    return Workflow.model_validate(workflow)


@router.get("/my-requests", response_model=PaginatedResponse[Workflow])
async def get_my_requests(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    workflow_type: WorkflowType | None = Query(None, description="Filter by type"),
    status: WorkflowStatus | None = Query(None, description="Filter by status"),
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> PaginatedResponse[Workflow]:
    """
    Get list of workflows created by the current user.

    Args:
        skip: Number of items to skip
        limit: Number of items per page
        workflow_type: Filter by workflow type
        status: Filter by status
        db: Database session
        current_user: Current authenticated user

    Returns:
        Paginated list of user's workflows
    """
    query = select(WorkflowModel).where(WorkflowModel.requester_id == current_user.id)

    # Apply filters
    if workflow_type:
        query = query.where(WorkflowModel.type == workflow_type)
    if status:
        query = query.where(WorkflowModel.status == status)

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

    if asset.status not in [AssetStatus.LOANED, AssetStatus.STOCK]:
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

    await _notify_managers_of_workflow(
        db=db,
        workflow_type=WorkflowType.CHECKOUT,
        current_user=current_user,
        asset=asset,
        reason=reason,
    )

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

    await _notify_managers_of_workflow(
        db=db,
        workflow_type=WorkflowType.CHECKIN,
        current_user=current_user,
        asset=asset,
        reason=reason,
    )

    return Workflow.model_validate(workflow)


@router.post("/{workflow_id}/approve", response_model=Workflow)
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
            asset.status = AssetStatus.ISSUED
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
            asset.status = AssetStatus.LOANED
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

        elif workflow.type == WorkflowType.RENTAL:
            # Assign the loaned asset to the requester
            asset.assigned_to = workflow.requester_id
            # Keep status as LOANED since it's a temporary loan

            # Create history entry
            history = AssetHistory(
                id=str(uuid.uuid4()),
                asset_id=asset.id,
                performed_by=current_user.id,
                action=HistoryAction.ASSIGNED,
                description=f"Asset rented via workflow approval: {workflow.reason or 'No reason provided'}",
                to_user_id=workflow.requester_id,
                workflow_id=workflow_id,
            )
            db.add(history)

        elif workflow.type == WorkflowType.RETURN:
            # Return the asset, make it available for rental again
            asset.assigned_to = None
            # Keep status as LOANED so it's available for others

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

        elif workflow.type == WorkflowType.DISPOSAL:
            # Mark asset as disposed
            asset.status = AssetStatus.DISPOSED
            asset.assigned_to = None

            # Create history entry
            history = AssetHistory(
                id=str(uuid.uuid4()),
                asset_id=asset.id,
                performed_by=current_user.id,
                action=HistoryAction.STATUS_CHANGED,
                description=f"Asset disposed via workflow approval: {workflow.reason or 'No reason provided'}",
                workflow_id=workflow_id,
            )
            db.add(history)

    await db.commit()
    await db.refresh(workflow)

    await _notify_requester_of_workflow_decision(
        db=db,
        workflow=workflow,
        asset=asset,
        approver=current_user,
        decision="approved",
        comment=request.comment,
    )

    return Workflow.model_validate(workflow)


@router.post("/{workflow_id}/reject", response_model=Workflow)
async def reject_workflow(
    workflow_id: str,
    request: RejectionRequest = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER)),
) -> Workflow:
    """
    Reject workflow request (Manager/Admin only).

    Args:
        workflow_id: Workflow ID
        request: Rejection request with reason
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
    workflow.reject_reason = request.reason

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


@router.get("/my-unviewed-count", response_model=dict)
async def get_my_unviewed_completed_count(
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> dict:
    """
    Get count of unviewed completed workflows for the current user.

    Returns the number of workflows requested by the current user
    that have been approved or rejected but not yet viewed.

    Args:
        db: Database session
        current_user: Current authenticated user

    Returns:
        Dictionary with 'count' key
    """
    query = (
        select(func.count())
        .select_from(WorkflowModel)
        .where(WorkflowModel.requester_id == current_user.id)
        .where(WorkflowModel.viewed_by_requester == False)
        .where(
            (WorkflowModel.status == WorkflowStatus.APPROVED)
            | (WorkflowModel.status == WorkflowStatus.REJECTED)
        )
    )

    result = await db.execute(query)
    count = result.scalar_one()

    return {"count": count}


@router.patch("/{workflow_id}/mark-viewed", response_model=Workflow)
async def mark_workflow_viewed(
    workflow_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> Workflow:
    """
    Mark a workflow as viewed by the requester.

    Args:
        workflow_id: Workflow ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        Updated workflow

    Raises:
        HTTPException: If workflow not found or user is not the requester
    """
    # Get workflow
    query = select(WorkflowModel).where(WorkflowModel.id == workflow_id)
    result = await db.execute(query)
    workflow = result.scalar_one_or_none()

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow with id {workflow_id} not found",
        )

    # Check if current user is the requester
    if workflow.requester_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the requester can mark this workflow as viewed",
        )

    # Mark as viewed
    workflow.viewed_by_requester = True

    await db.commit()
    await db.refresh(workflow)

    return Workflow.model_validate(workflow)
