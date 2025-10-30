"""
Statistics and analytics endpoints.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.middlewares.auth import get_current_user
from src.models.asset import Asset as AssetModel
from src.models.asset import AssetGrade, AssetStatus
from src.models.category import Category as CategoryModel
from src.models.location import Location as LocationModel
from src.models.user import User as UserModel
from src.models.workflow import Workflow as WorkflowModel
from src.models.workflow import WorkflowStatus

router = APIRouter()


@router.get("/overview")
async def get_dashboard_overview(
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> dict:
    """
    Get dashboard overview statistics.

    Args:
        db: Database session
        current_user: Current authenticated user

    Returns:
        Dashboard statistics including total assets, status breakdown, etc.
    """
    # Total assets (excluding deleted)
    total_assets_result = await db.execute(
        select(func.count(AssetModel.id)).where(AssetModel.deleted_at.is_(None))
    )
    total_assets = total_assets_result.scalar_one()

    # Assets by status
    status_counts = {}
    for asset_status in AssetStatus:
        result = await db.execute(
            select(func.count(AssetModel.id)).where(
                AssetModel.status == asset_status,
                AssetModel.deleted_at.is_(None)
            )
        )
        status_counts[asset_status.value] = result.scalar_one()

    # Pending workflow requests
    pending_workflows_result = await db.execute(
        select(func.count(WorkflowModel.id)).where(
            WorkflowModel.status == WorkflowStatus.PENDING
        )
    )
    pending_workflows = pending_workflows_result.scalar_one()

    # Total users
    total_users_result = await db.execute(
        select(func.count(UserModel.id)).where(UserModel.is_active)
    )
    total_users = total_users_result.scalar_one()

    # Total categories
    total_categories_result = await db.execute(
        select(func.count(CategoryModel.id)).where(CategoryModel.is_active)
    )
    total_categories = total_categories_result.scalar_one()

    # Total locations
    total_locations_result = await db.execute(
        select(func.count(LocationModel.id)).where(LocationModel.is_active)
    )
    total_locations = total_locations_result.scalar_one()

    return {
        "total_assets": total_assets,
        "assets_by_status": status_counts,
        "pending_workflows": pending_workflows,
        "total_users": total_users,
        "total_categories": total_categories,
        "total_locations": total_locations,
    }


@router.get("/assets-by-category")
async def get_assets_by_category(
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> list[dict]:
    """
    Get asset count by category.

    Args:
        db: Database session
        current_user: Current authenticated user

    Returns:
        List of categories with asset counts
    """
    # Query categories with asset counts
    query = (
        select(
            CategoryModel.id,
            CategoryModel.name,
            CategoryModel.code,
            func.count(AssetModel.id).label("asset_count")
        )
        .outerjoin(AssetModel, CategoryModel.id == AssetModel.category_id)
        .where(
            CategoryModel.is_active,
            (AssetModel.deleted_at.is_(None)) | (AssetModel.id.is_(None))
        )
        .group_by(CategoryModel.id, CategoryModel.name, CategoryModel.code)
        .order_by(func.count(AssetModel.id).desc())
    )

    result = await db.execute(query)
    categories = result.all()

    return [
        {
            "category_id": cat.id,
            "category_name": cat.name,
            "category_code": cat.code,
            "asset_count": cat.asset_count,
        }
        for cat in categories
    ]


@router.get("/assets-by-location")
async def get_assets_by_location(
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> list[dict]:
    """
    Get asset count by location.

    Args:
        db: Database session
        current_user: Current authenticated user

    Returns:
        List of locations with asset counts
    """
    # Query locations with asset counts
    query = (
        select(
            LocationModel.id,
            LocationModel.name,
            LocationModel.code,
            LocationModel.site,
            func.count(AssetModel.id).label("asset_count")
        )
        .outerjoin(AssetModel, LocationModel.id == AssetModel.location_id)
        .where(
            LocationModel.is_active,
            (AssetModel.deleted_at.is_(None)) | (AssetModel.id.is_(None))
        )
        .group_by(
            LocationModel.id,
            LocationModel.name,
            LocationModel.code,
            LocationModel.site
        )
        .order_by(func.count(AssetModel.id).desc())
    )

    result = await db.execute(query)
    locations = result.all()

    return [
        {
            "location_id": loc.id,
            "location_name": loc.name,
            "location_code": loc.code,
            "site": loc.site,
            "asset_count": loc.asset_count,
        }
        for loc in locations
    ]


@router.get("/assets-by-status")
async def get_assets_by_status(
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> list[dict]:
    """
    Get asset count by status.

    Args:
        db: Database session
        current_user: Current authenticated user

    Returns:
        List of statuses with asset counts
    """
    stats = []

    for asset_status in AssetStatus:
        result = await db.execute(
            select(func.count(AssetModel.id)).where(
                AssetModel.status == asset_status,
                AssetModel.deleted_at.is_(None)
            )
        )
        count = result.scalar_one()

        stats.append({
            "status": asset_status.value,
            "asset_count": count,
        })

    # Sort by count descending
    stats.sort(key=lambda x: x["asset_count"], reverse=True)

    return stats


@router.get("/assets-by-grade")
async def get_assets_by_grade(
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> list[dict]:
    """
    Get asset count by grade.

    Args:
        db: Database session
        current_user: Current authenticated user

    Returns:
        List of grades with asset counts
    """
    stats = []

    for grade in AssetGrade:
        result = await db.execute(
            select(func.count(AssetModel.id)).where(
                AssetModel.grade == grade,
                AssetModel.deleted_at.is_(None)
            )
        )
        count = result.scalar_one()

        stats.append({
            "grade": grade.value,
            "asset_count": count,
        })

    return stats


@router.get("/workflow-stats")
async def get_workflow_statistics(
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> dict:
    """
    Get workflow statistics.

    Args:
        db: Database session
        current_user: Current authenticated user

    Returns:
        Workflow statistics by status and type
    """
    # Count by status
    status_counts = {}
    for workflow_status in WorkflowStatus:
        result = await db.execute(
            select(func.count(WorkflowModel.id)).where(
                WorkflowModel.status == workflow_status
            )
        )
        status_counts[workflow_status.value] = result.scalar_one()

    # Count by type
    type_counts_query = (
        select(
            WorkflowModel.type,
            func.count(WorkflowModel.id).label("count")
        )
        .group_by(WorkflowModel.type)
    )
    type_result = await db.execute(type_counts_query)
    type_counts = {row.type.value: row.count for row in type_result.all()}

    # Total workflows
    total_result = await db.execute(select(func.count(WorkflowModel.id)))
    total_workflows = total_result.scalar_one()

    return {
        "total_workflows": total_workflows,
        "by_status": status_counts,
        "by_type": type_counts,
    }


@router.get("/workflow-timeline")
async def get_workflow_timeline(
    date_range: str = "30d",
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> dict:
    """
    Get workflow timeline data for specified date range.

    Args:
        date_range: Date range (7d, 30d, or 90d)
        db: Database session
        current_user: Current authenticated user

    Returns:
        Timeline data with workflow counts by date and type
    """
    from datetime import date, timedelta
    from src.models.workflow import WorkflowType

    # Parse date range
    days_map = {"7d": 7, "30d": 30, "90d": 90}
    days = days_map.get(date_range, 30)

    # Calculate date range
    end_date = date.today()
    start_date = end_date - timedelta(days=days - 1)

    # Query workflows grouped by date and type
    from sqlalchemy import cast, Date

    query = (
        select(
            cast(WorkflowModel.created_at, Date).label("date"),
            WorkflowModel.type,
            func.count(WorkflowModel.id).label("count")
        )
        .where(
            cast(WorkflowModel.created_at, Date) >= start_date,
            cast(WorkflowModel.created_at, Date) <= end_date
        )
        .group_by(
            cast(WorkflowModel.created_at, Date),
            WorkflowModel.type
        )
        .order_by(cast(WorkflowModel.created_at, Date))
    )

    result = await db.execute(query)
    rows = result.all()

    # Build timeline with all dates (fill gaps with zeros)
    timeline_dict = {}
    current = start_date
    while current <= end_date:
        timeline_dict[current] = {
            "date": current.isoformat(),
            "checkout": 0,
            "checkin": 0,
            "transfer": 0,
            "maintenance": 0,
            "rental": 0,
            "return": 0,
            "disposal": 0,
        }
        current += timedelta(days=1)

    # Fill in actual data
    for row in rows:
        if row.date in timeline_dict:
            timeline_dict[row.date][row.type.value] = row.count

    # Convert to sorted list
    timeline = [timeline_dict[d] for d in sorted(timeline_dict.keys())]

    return {
        "timeline": timeline,
        "date_range": date_range,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
    }
