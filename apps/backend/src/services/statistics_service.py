"""
Statistics service - business logic for dashboard and analytics.
"""

from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.asset import Asset, AssetGrade, AssetStatus
from src.models.asset_history import AssetHistory
from src.models.category import Category
from src.models.location import Location
from src.models.workflow import Workflow, WorkflowStatus, WorkflowType


class StatisticsService:
    """Service class for statistics and analytics."""

    @staticmethod
    async def get_dashboard_overview(db: AsyncSession) -> dict[str, Any]:
        """
        Get dashboard overview statistics.

        Returns:
            - total_assets: Total number of assets (excluding deleted)
            - assets_by_status: Count of assets by status
            - recent_activities: Recent asset history (last 10)
            - pending_workflows: Number of pending workflow requests

        Args:
            db: Database session

        Returns:
            Dictionary with overview statistics

        Example:
            {
                "total_assets": 150,
                "assets_by_status": {
                    "available": 80,
                    "assigned": 60,
                    "maintenance": 5,
                    "disposed": 5
                },
                "recent_activities_count": 10,
                "pending_workflows": 5
            }
        """
        # Total assets (excluding soft deleted)
        total_result = await db.execute(
            select(func.count(Asset.id)).where(Asset.deleted_at.is_(None))
        )
        total_assets = total_result.scalar_one()

        # Assets by status
        status_result = await db.execute(
            select(Asset.status, func.count(Asset.id))
            .where(Asset.deleted_at.is_(None))
            .group_by(Asset.status)
        )
        assets_by_status = {status.value: count for status, count in status_result.all()}

        # Ensure all statuses are present
        for status in AssetStatus:
            if status.value not in assets_by_status:
                assets_by_status[status.value] = 0

        # Recent activities count (last 7 days)
        seven_days_ago = datetime.now() - timedelta(days=7)
        recent_activities_result = await db.execute(
            select(func.count(AssetHistory.id)).where(AssetHistory.created_at >= seven_days_ago)
        )
        recent_activities_count = recent_activities_result.scalar_one()

        # Pending workflows
        pending_workflows_result = await db.execute(
            select(func.count(Workflow.id)).where(Workflow.status == WorkflowStatus.PENDING)
        )
        pending_workflows = pending_workflows_result.scalar_one()

        return {
            "total_assets": total_assets,
            "assets_by_status": assets_by_status,
            "recent_activities_count": recent_activities_count,
            "pending_workflows": pending_workflows,
        }

    @staticmethod
    async def get_assets_by_category(db: AsyncSession) -> list[dict[str, Any]]:
        """
        Get asset count by category.

        Args:
            db: Database session

        Returns:
            List of category statistics

        Example:
            [
                {
                    "category_id": "uuid",
                    "category_name": "Desktop",
                    "category_code": "DT",
                    "asset_count": 50
                },
                ...
            ]
        """
        result = await db.execute(
            select(
                Category.id,
                Category.name,
                Category.code,
                func.count(Asset.id).label("asset_count"),
            )
            .outerjoin(Asset, Asset.category_id == Category.id)
            .where(Asset.deleted_at.is_(None))
            .group_by(Category.id, Category.name, Category.code)
            .order_by(func.count(Asset.id).desc())
        )

        return [
            {
                "category_id": category_id,
                "category_name": category_name,
                "category_code": category_code,
                "asset_count": asset_count,
            }
            for category_id, category_name, category_code, asset_count in result.all()
        ]

    @staticmethod
    async def get_assets_by_location(db: AsyncSession) -> list[dict[str, Any]]:
        """
        Get asset count by location.

        Args:
            db: Database session

        Returns:
            List of location statistics

        Example:
            [
                {
                    "location_id": "uuid",
                    "location_name": "판교 R&D센터",
                    "location_code": "PG-RD",
                    "asset_count": 80
                },
                ...
            ]
        """
        result = await db.execute(
            select(
                Location.id,
                Location.name,
                Location.code,
                func.count(Asset.id).label("asset_count"),
            )
            .outerjoin(Asset, Asset.location_id == Location.id)
            .where(Asset.deleted_at.is_(None))
            .group_by(Location.id, Location.name, Location.code)
            .order_by(func.count(Asset.id).desc())
        )

        return [
            {
                "location_id": location_id,
                "location_name": location_name,
                "location_code": location_code,
                "asset_count": asset_count,
            }
            for location_id, location_name, location_code, asset_count in result.all()
        ]

    @staticmethod
    async def get_assets_by_status(db: AsyncSession) -> dict[str, int]:
        """
        Get asset count by status.

        Args:
            db: Database session

        Returns:
            Dictionary of status counts

        Example:
            {
                "available": 80,
                "assigned": 60,
                "maintenance": 5,
                "disposed": 5
            }
        """
        result = await db.execute(
            select(Asset.status, func.count(Asset.id))
            .where(Asset.deleted_at.is_(None))
            .group_by(Asset.status)
        )

        status_counts = {status.value: count for status, count in result.all()}

        # Ensure all statuses are present
        for status in AssetStatus:
            if status.value not in status_counts:
                status_counts[status.value] = 0

        return status_counts

    @staticmethod
    async def get_assets_by_grade(db: AsyncSession) -> dict[str, int]:
        """
        Get asset count by grade (A/B/C).

        Args:
            db: Database session

        Returns:
            Dictionary of grade counts

        Example:
            {
                "A": 100,
                "B": 40,
                "C": 10
            }
        """
        result = await db.execute(
            select(Asset.grade, func.count(Asset.id))
            .where(Asset.deleted_at.is_(None))
            .group_by(Asset.grade)
        )

        grade_counts = {grade.value: count for grade, count in result.all()}

        # Ensure all grades are present
        for grade in AssetGrade:
            if grade.value not in grade_counts:
                grade_counts[grade.value] = 0

        return grade_counts

    @staticmethod
    async def get_workflow_statistics(db: AsyncSession) -> dict[str, Any]:
        """
        Get workflow statistics.

        Args:
            db: Database session

        Returns:
            Dictionary with workflow statistics

        Example:
            {
                "total_workflows": 200,
                "by_status": {
                    "pending": 5,
                    "approved": 180,
                    "rejected": 10,
                    "cancelled": 5
                },
                "by_type": {
                    "checkout": 100,
                    "checkin": 100
                },
                "pending_checkout": 3,
                "pending_checkin": 2
            }
        """
        # Total workflows
        total_result = await db.execute(select(func.count(Workflow.id)))
        total_workflows = total_result.scalar_one()

        # By status
        status_result = await db.execute(
            select(Workflow.status, func.count(Workflow.id)).group_by(Workflow.status)
        )
        by_status = {status.value: count for status, count in status_result.all()}

        # Ensure all statuses are present
        for status in WorkflowStatus:
            if status.value not in by_status:
                by_status[status.value] = 0

        # By type
        type_result = await db.execute(
            select(Workflow.type, func.count(Workflow.id)).group_by(Workflow.type)
        )
        by_type = {wf_type.value: count for wf_type, count in type_result.all()}

        # Ensure all types are present
        for wf_type in WorkflowType:
            if wf_type.value not in by_type:
                by_type[wf_type.value] = 0

        # Pending by type
        pending_result = await db.execute(
            select(Workflow.type, func.count(Workflow.id))
            .where(Workflow.status == WorkflowStatus.PENDING)
            .group_by(Workflow.type)
        )
        pending_by_type = {wf_type.value: count for wf_type, count in pending_result.all()}

        return {
            "total_workflows": total_workflows,
            "by_status": by_status,
            "by_type": by_type,
            "pending_checkout": pending_by_type.get(WorkflowType.CHECKOUT.value, 0),
            "pending_checkin": pending_by_type.get(WorkflowType.CHECKIN.value, 0),
        }

    @staticmethod
    async def get_recent_activities(
        db: AsyncSession, limit: int = 10, offset: int = 0
    ) -> list[AssetHistory]:
        """
        Get recent asset activities.

        Args:
            db: Database session
            limit: Maximum number of records
            offset: Number of records to skip

        Returns:
            List of recent asset history records
        """
        result = await db.execute(
            select(AssetHistory)
            .order_by(AssetHistory.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_asset_value_statistics(db: AsyncSession) -> dict[str, Any]:
        """
        Get asset value statistics (purchase price based).

        Args:
            db: Database session

        Returns:
            Dictionary with value statistics

        Example:
            {
                "total_value": 150000000,
                "average_value": 1000000,
                "by_category": {
                    "Desktop": 50000000,
                    "Laptop": 100000000
                }
            }
        """
        # Total and average value
        value_result = await db.execute(
            select(
                func.sum(Asset.purchase_price).label("total_value"),
                func.avg(Asset.purchase_price).label("avg_value"),
            ).where(Asset.deleted_at.is_(None), Asset.purchase_price.is_not(None))
        )
        total_value, avg_value = value_result.one()

        # Value by category
        category_value_result = await db.execute(
            select(Category.name, func.sum(Asset.purchase_price).label("total_value"))
            .join(Asset, Asset.category_id == Category.id)
            .where(Asset.deleted_at.is_(None), Asset.purchase_price.is_not(None))
            .group_by(Category.name)
            .order_by(func.sum(Asset.purchase_price).desc())
        )

        by_category = {
            category_name: float(total_value) if total_value else 0.0
            for category_name, total_value in category_value_result.all()
        }

        return {
            "total_value": float(total_value) if total_value else 0.0,
            "average_value": float(avg_value) if avg_value else 0.0,
            "by_category": by_category,
        }
