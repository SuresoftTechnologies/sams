"""
Workflow service - business logic for checkout/checkin workflows.
"""

from datetime import datetime
from uuid import uuid4

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.asset import Asset, AssetStatus
from src.models.workflow import Workflow, WorkflowStatus, WorkflowType
from src.schemas.workflow import CreateWorkflowRequest
from src.services.asset_service import AssetService


class WorkflowService:
    """Service class for workflow business logic."""

    @staticmethod
    async def create_checkout_request(
        db: AsyncSession, workflow_data: CreateWorkflowRequest, requester_id: str
    ) -> Workflow:
        """
        Create a checkout (assignment) request.

        Args:
            db: Database session
            workflow_data: Workflow creation data
            requester_id: User ID who requests the checkout

        Returns:
            Created workflow

        Raises:
            ValueError: If asset not found or not available
        """
        # Validate asset exists and is available
        result = await db.execute(select(Asset).where(Asset.id == workflow_data.asset_id))
        asset = result.scalar_one_or_none()
        if not asset:
            raise ValueError(f"Asset not found: {workflow_data.asset_id}")

        if asset.status not in [AssetStatus.AVAILABLE, AssetStatus.IN_TRANSIT]:
            raise ValueError(f"Asset not available for checkout: {asset.status}")

        # Create workflow
        workflow = Workflow(
            id=str(uuid4()),
            type=WorkflowType.CHECKOUT,
            status=WorkflowStatus.PENDING,
            asset_id=workflow_data.asset_id,
            requester_id=requester_id,
            assignee_id=workflow_data.assignee_id or requester_id,  # Default to requester
            reason=workflow_data.reason,
            expected_return_date=workflow_data.expected_return_date,
        )

        db.add(workflow)
        await db.commit()
        await db.refresh(workflow)

        return workflow

    @staticmethod
    async def create_checkin_request(
        db: AsyncSession, workflow_data: CreateWorkflowRequest, requester_id: str
    ) -> Workflow:
        """
        Create a checkin (return) request.

        Args:
            db: Database session
            workflow_data: Workflow creation data
            requester_id: User ID who requests the checkin

        Returns:
            Created workflow

        Raises:
            ValueError: If asset not found or not assigned
        """
        # Validate asset exists and is assigned
        result = await db.execute(select(Asset).where(Asset.id == workflow_data.asset_id))
        asset = result.scalar_one_or_none()
        if not asset:
            raise ValueError(f"Asset not found: {workflow_data.asset_id}")

        if asset.status != AssetStatus.ASSIGNED:
            raise ValueError(f"Asset is not assigned, cannot check in: {asset.status}")

        # Verify requester is the assigned user
        if asset.assigned_to != requester_id:
            raise ValueError(
                f"Only the assigned user can request checkin. "
                f"Asset assigned to: {asset.assigned_to}, requester: {requester_id}"
            )

        # Create workflow
        workflow = Workflow(
            id=str(uuid4()),
            type=WorkflowType.CHECKIN,
            status=WorkflowStatus.PENDING,
            asset_id=workflow_data.asset_id,
            requester_id=requester_id,
            assignee_id=asset.assigned_to,  # Current assignee
            reason=workflow_data.reason,
        )

        db.add(workflow)
        await db.commit()
        await db.refresh(workflow)

        return workflow

    @staticmethod
    async def approve_workflow(
        db: AsyncSession, workflow_id: str, approver_id: str, comment: str | None = None
    ) -> Workflow:
        """
        Approve a workflow request and execute the asset operation.

        For CHECKOUT: Assign asset to user
        For CHECKIN: Unassign asset from user

        Args:
            db: Database session
            workflow_id: Workflow ID to approve
            approver_id: User ID who approves
            comment: Optional approval comment

        Returns:
            Approved workflow

        Raises:
            ValueError: If workflow not found, not pending, or asset operation fails
        """
        # Get workflow
        result = await db.execute(select(Workflow).where(Workflow.id == workflow_id))
        workflow = result.scalar_one_or_none()
        if not workflow:
            raise ValueError(f"Workflow not found: {workflow_id}")

        if workflow.status != WorkflowStatus.PENDING:
            raise ValueError(f"Workflow is not pending: {workflow.status}")

        # Execute based on workflow type
        try:
            if workflow.type == WorkflowType.CHECKOUT:
                # Assign asset to user
                await AssetService.assign_asset(
                    db=db,
                    asset_id=workflow.asset_id,
                    user_id=workflow.assignee_id or workflow.requester_id,
                    assigned_by=approver_id,
                    reason=f"Approved checkout request: {workflow.reason or 'No reason'}",
                )
            elif workflow.type == WorkflowType.CHECKIN:
                # Unassign asset
                await AssetService.unassign_asset(
                    db=db,
                    asset_id=workflow.asset_id,
                    unassigned_by=approver_id,
                    reason=f"Approved checkin request: {workflow.reason or 'No reason'}",
                )
            else:
                raise ValueError(f"Unsupported workflow type: {workflow.type}")

            # Update workflow status
            workflow.status = WorkflowStatus.APPROVED
            workflow.approver_id = approver_id
            workflow.approved_at = datetime.now()
            if comment:
                workflow.completion_notes = comment

            await db.commit()
            await db.refresh(workflow)

            return workflow

        except Exception as e:
            await db.rollback()
            raise ValueError(f"Failed to approve workflow: {str(e)}") from e

    @staticmethod
    async def reject_workflow(
        db: AsyncSession, workflow_id: str, approver_id: str, reject_reason: str
    ) -> Workflow:
        """
        Reject a workflow request.

        Args:
            db: Database session
            workflow_id: Workflow ID to reject
            approver_id: User ID who rejects
            reject_reason: Reason for rejection

        Returns:
            Rejected workflow

        Raises:
            ValueError: If workflow not found or not pending
        """
        # Get workflow
        result = await db.execute(select(Workflow).where(Workflow.id == workflow_id))
        workflow = result.scalar_one_or_none()
        if not workflow:
            raise ValueError(f"Workflow not found: {workflow_id}")

        if workflow.status != WorkflowStatus.PENDING:
            raise ValueError(f"Workflow is not pending: {workflow.status}")

        # Update workflow status
        workflow.status = WorkflowStatus.REJECTED
        workflow.approver_id = approver_id
        workflow.rejected_at = datetime.now()
        workflow.reject_reason = reject_reason

        await db.commit()
        await db.refresh(workflow)

        return workflow

    @staticmethod
    async def cancel_workflow(db: AsyncSession, workflow_id: str, user_id: str) -> Workflow:
        """
        Cancel a workflow request (only by requester).

        Args:
            db: Database session
            workflow_id: Workflow ID to cancel
            user_id: User ID who cancels (must be requester)

        Returns:
            Cancelled workflow

        Raises:
            ValueError: If workflow not found, not pending, or user not authorized
        """
        # Get workflow
        result = await db.execute(select(Workflow).where(Workflow.id == workflow_id))
        workflow = result.scalar_one_or_none()
        if not workflow:
            raise ValueError(f"Workflow not found: {workflow_id}")

        if workflow.status != WorkflowStatus.PENDING:
            raise ValueError(f"Workflow is not pending: {workflow.status}")

        # Verify requester
        if workflow.requester_id != user_id:
            raise ValueError("Only the requester can cancel this workflow")

        # Update workflow status
        workflow.status = WorkflowStatus.CANCELLED

        await db.commit()
        await db.refresh(workflow)

        return workflow

    @staticmethod
    async def get_user_workflows(
        db: AsyncSession,
        user_id: str,
        status: WorkflowStatus | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[Workflow], int]:
        """
        Get workflows for a user (requested by or assigned to).

        Args:
            db: Database session
            user_id: User ID
            status: Optional filter by status
            limit: Maximum number of records
            offset: Number of records to skip

        Returns:
            Tuple of (workflows, total_count)
        """
        # Build query
        query = select(Workflow).where(
            or_(Workflow.requester_id == user_id, Workflow.assignee_id == user_id)
        )

        if status:
            query = query.where(Workflow.status == status)

        # Get total count
        count_result = await db.execute(
            select(Workflow.id).where(
                or_(Workflow.requester_id == user_id, Workflow.assignee_id == user_id)
            )
        )
        total = len(list(count_result.scalars().all()))

        # Get paginated results
        query = query.order_by(Workflow.created_at.desc()).limit(limit).offset(offset)
        result = await db.execute(query)
        workflows = list(result.scalars().all())

        return workflows, total

    @staticmethod
    async def get_pending_workflows(
        db: AsyncSession, limit: int = 50, offset: int = 0
    ) -> tuple[list[Workflow], int]:
        """
        Get all pending workflows (for managers/admins).

        Args:
            db: Database session
            limit: Maximum number of records
            offset: Number of records to skip

        Returns:
            Tuple of (workflows, total_count)
        """
        # Get total count
        count_result = await db.execute(
            select(Workflow.id).where(Workflow.status == WorkflowStatus.PENDING)
        )
        total = len(list(count_result.scalars().all()))

        # Get paginated results
        query = (
            select(Workflow)
            .where(Workflow.status == WorkflowStatus.PENDING)
            .order_by(Workflow.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await db.execute(query)
        workflows = list(result.scalars().all())

        return workflows, total
