"""
Asset service - business logic for asset management.
"""

from datetime import datetime
from typing import Any
from uuid import uuid4

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.asset import Asset, AssetGrade, AssetStatus
from src.models.asset_history import AssetHistory, HistoryAction
from src.models.category import Category
from src.schemas.asset import CreateAssetRequest, UpdateAssetRequest


CATEGORY_CODE_OVERRIDES: dict[str, str] = {
    "DESKTOP": "11",
    "NOTEBOOK": "12",
    "LAPTOP": "12",
    "MONITOR": "14",
}


class AssetService:
    """Service class for asset business logic."""

    @staticmethod
    async def generate_asset_number(
        db: AsyncSession, category_id: str, purchase_date: datetime | None = None
    ) -> str:
        """
        Generate asset number in format: CATEGORY-YYYY-SEQ.

        Args:
            db: Database session
            category_id: Category ID
            purchase_date: Purchase date (default: now)

        Returns:
            Generated asset number (e.g., "11-2024-0001")

        Example:
            >>> await generate_asset_number(db, category_id, datetime(2024, 1, 15))
            "11-2024-0001"
        """
        # Get category code
        category_result = await db.execute(select(Category).where(Category.id == category_id))
        category = category_result.scalar_one_or_none()
        if not category:
            raise ValueError(f"Category not found: {category_id}")

        raw_code = category.code.upper()
        category_code = CATEGORY_CODE_OVERRIDES.get(raw_code, category.code)

        # Get year (4 digits)
        year = (purchase_date or datetime.now()).year

        # Get sequence number (count existing assets with same year and category)
        count_result = await db.execute(
            select(func.count(Asset.id)).where(
                Asset.category_id == category_id,
                Asset.asset_tag.like(f"{category_code}-{year}-%"),
            )
        )
        count = count_result.scalar_one() or 0
        seq = count + 1

        return f"{category_code}-{year}-{seq:04d}"

    @staticmethod
    def calculate_grade(purchase_date: datetime | None) -> AssetGrade:
        """
        Calculate asset grade based on purchase date.

        Grade A: 0-2 years
        Grade B: 2-4 years
        Grade C: 4+ years

        Args:
            purchase_date: Purchase date

        Returns:
            Asset grade (A, B, or C)

        Example:
            >>> calculate_grade(datetime(2024, 1, 1))  # If now is 2024
            AssetGrade.A
        """
        if not purchase_date:
            return AssetGrade.A

        years_old = (datetime.now() - purchase_date).days / 365.25

        if years_old < 2:
            return AssetGrade.A
        elif years_old < 4:
            return AssetGrade.B
        else:
            return AssetGrade.C

    @staticmethod
    async def create_asset(
        db: AsyncSession, asset_data: CreateAssetRequest, created_by: str
    ) -> Asset:
        """
        Create a new asset with auto-generated asset number and grade.

        Args:
            db: Database session
            asset_data: Asset creation data
            created_by: User ID who creates the asset

        Returns:
            Created asset

        Raises:
            ValueError: If category not found or asset_tag already exists
        """
        # Check if asset_tag already exists
        existing_result = await db.execute(
            select(Asset).where(Asset.asset_tag == asset_data.asset_tag)
        )
        if existing_result.scalar_one_or_none():
            raise ValueError(f"Asset tag already exists: {asset_data.asset_tag}")

        # Calculate grade
        grade = AssetService.calculate_grade(asset_data.purchase_date)

        # Create asset
        asset = Asset(
            id=str(uuid4()),
            asset_tag=asset_data.asset_tag,
            model=asset_data.model,
            serial_number=asset_data.serial_number,
            category_id=asset_data.category_id,
            location_id=asset_data.location_id,
            status=asset_data.status,
            grade=grade,
            purchase_date=asset_data.purchase_date,
            purchase_price=asset_data.purchase_price,
            supplier=asset_data.supplier,
            notes=asset_data.notes,
        )

        db.add(asset)
        await db.flush()

        # Create history record
        await AssetService.create_history(
            db=db,
            asset_id=asset.id,
            action=HistoryAction.CREATED,
            performed_by=created_by,
            description=f"Asset created: {asset.model or asset.asset_tag}",
            new_values={
                "category_id": asset.category_id,
                "status": asset.status if isinstance(asset.status, str) else asset.status.value,
                "grade": asset.grade if isinstance(asset.grade, str) else asset.grade.value,
            },
        )

        await db.commit()
        await db.refresh(asset)

        return asset

    @staticmethod
    async def update_asset(
        db: AsyncSession, asset_id: str, asset_data: UpdateAssetRequest, updated_by: str
    ) -> Asset:
        """
        Update an asset and track changes in history.

        Args:
            db: Database session
            asset_id: Asset ID to update
            asset_data: Update data
            updated_by: User ID who updates the asset

        Returns:
            Updated asset

        Raises:
            ValueError: If asset not found
        """
        # Get existing asset
        result = await db.execute(select(Asset).where(Asset.id == asset_id))
        asset = result.scalar_one_or_none()
        if not asset:
            raise ValueError(f"Asset not found: {asset_id}")

        # Track old values
        old_values: dict[str, Any] = {}
        new_values: dict[str, Any] = {}

        # Update fields and track changes
        update_data = asset_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None and hasattr(asset, field):
                old_value = getattr(asset, field)
                if old_value != value:
                    old_values[field] = (
                        old_value.value if hasattr(old_value, "value") else old_value
                    )
                    new_values[field] = value.value if hasattr(value, "value") else value
                    setattr(asset, field, value)

        # Recalculate grade if purchase_date changed
        if "purchase_date" in update_data and asset.purchase_date:
            new_grade = AssetService.calculate_grade(asset.purchase_date)
            if asset.grade != new_grade:
                old_values["grade"] = asset.grade if isinstance(asset.grade, str) else asset.grade.value
                new_values["grade"] = new_grade.value
                asset.grade = new_grade

        if old_values:
            # Create history record
            await AssetService.create_history(
                db=db,
                asset_id=asset.id,
                action=HistoryAction.UPDATED,
                performed_by=updated_by,
                description=f"Asset updated: {asset.model or asset.asset_tag}",
                old_values=old_values,
                new_values=new_values,
            )

        await db.commit()
        await db.refresh(asset)

        return asset

    @staticmethod
    async def delete_asset(db: AsyncSession, asset_id: str, deleted_by: str) -> Asset:
        """
        Soft delete an asset.

        Args:
            db: Database session
            asset_id: Asset ID to delete
            deleted_by: User ID who deletes the asset

        Returns:
            Deleted asset

        Raises:
            ValueError: If asset not found or already deleted
        """
        result = await db.execute(select(Asset).where(Asset.id == asset_id))
        asset = result.scalar_one_or_none()
        if not asset:
            raise ValueError(f"Asset not found: {asset_id}")

        if asset.deleted_at:
            raise ValueError(f"Asset already deleted: {asset_id}")

        # Soft delete
        asset.deleted_at = datetime.now()
        asset.status = AssetStatus.DISPOSED

        # Create history record
        await AssetService.create_history(
            db=db,
            asset_id=asset.id,
            action=HistoryAction.DELETED,
            performed_by=deleted_by,
            description=f"Asset deleted: {asset.model or asset.asset_tag}",
            old_values={"deleted_at": None},
            new_values={"deleted_at": asset.deleted_at.isoformat()},
        )

        await db.commit()
        await db.refresh(asset)

        return asset

    @staticmethod
    async def assign_asset(
        db: AsyncSession, asset_id: str, user_id: str, assigned_by: str, reason: str | None = None
    ) -> Asset:
        """
        Assign an asset to a user.

        Args:
            db: Database session
            asset_id: Asset ID to assign
            user_id: User ID to assign to
            assigned_by: User ID who performs the assignment
            reason: Optional reason for assignment

        Returns:
            Updated asset

        Raises:
            ValueError: If asset not found, already assigned, or not available
        """
        result = await db.execute(select(Asset).where(Asset.id == asset_id))
        asset = result.scalar_one_or_none()
        if not asset:
            raise ValueError(f"Asset not found: {asset_id}")

        if asset.status not in [AssetStatus.LOANED, AssetStatus.STOCK]:
            raise ValueError(f"Asset not available for assignment: {asset.status}")

        # Track old values
        old_assigned_to = asset.assigned_to
        old_status = asset.status

        # Update assignment
        asset.assigned_to = user_id
        asset.status = AssetStatus.ISSUED

        # Create history record
        await AssetService.create_history(
            db=db,
            asset_id=asset.id,
            action=HistoryAction.ASSIGNED,
            performed_by=assigned_by,
            description=reason or f"Asset assigned to user {user_id}",
            to_user_id=user_id,
            from_user_id=old_assigned_to,
            old_values={
                "assigned_to": old_assigned_to,
                "status": old_status if isinstance(old_status, str) else old_status.value,
            },
            new_values={
                "assigned_to": user_id,
                "status": AssetStatus.ISSUED.value,
            },
        )

        await db.commit()
        await db.refresh(asset)

        return asset

    @staticmethod
    async def unassign_asset(
        db: AsyncSession, asset_id: str, unassigned_by: str, reason: str | None = None
    ) -> Asset:
        """
        Unassign an asset from a user (return).

        Args:
            db: Database session
            asset_id: Asset ID to unassign
            unassigned_by: User ID who performs the unassignment
            reason: Optional reason for unassignment

        Returns:
            Updated asset

        Raises:
            ValueError: If asset not found or not assigned
        """
        result = await db.execute(select(Asset).where(Asset.id == asset_id))
        asset = result.scalar_one_or_none()
        if not asset:
            raise ValueError(f"Asset not found: {asset_id}")

        if asset.status != AssetStatus.ISSUED:
            raise ValueError(f"Asset is not assigned: {asset.status}")

        # Track old values
        old_assigned_to = asset.assigned_to

        # Update assignment
        asset.assigned_to = None
        asset.status = AssetStatus.LOANED

        # Create history record
        await AssetService.create_history(
            db=db,
            asset_id=asset.id,
            action=HistoryAction.UNASSIGNED,
            performed_by=unassigned_by,
            description=reason or f"Asset returned from user {old_assigned_to}",
            from_user_id=old_assigned_to,
            old_values={
                "assigned_to": old_assigned_to,
                "status": AssetStatus.ISSUED.value,
            },
            new_values={
                "assigned_to": None,
                "status": AssetStatus.LOANED.value,
            },
        )

        await db.commit()
        await db.refresh(asset)

        return asset

    @staticmethod
    async def get_asset_history(
        db: AsyncSession, asset_id: str, limit: int = 50, offset: int = 0
    ) -> list[AssetHistory]:
        """
        Get asset history with pagination.

        Args:
            db: Database session
            asset_id: Asset ID
            limit: Maximum number of records to return
            offset: Number of records to skip

        Returns:
            List of asset history records
        """
        result = await db.execute(
            select(AssetHistory)
            .where(AssetHistory.asset_id == asset_id)
            .order_by(AssetHistory.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all())

    @staticmethod
    async def create_history(
        db: AsyncSession,
        asset_id: str,
        action: HistoryAction,
        performed_by: str,
        description: str | None = None,
        from_user_id: str | None = None,
        to_user_id: str | None = None,
        from_location_id: str | None = None,
        to_location_id: str | None = None,
        old_values: dict[str, Any] | None = None,
        new_values: dict[str, Any] | None = None,
        workflow_id: str | None = None,
    ) -> AssetHistory:
        """
        Create an asset history record.

        Args:
            db: Database session
            asset_id: Asset ID
            action: History action type
            performed_by: User ID who performed the action
            description: Optional description
            from_user_id: Previous user (for assignments)
            to_user_id: New user (for assignments)
            from_location_id: Previous location
            to_location_id: New location
            old_values: Old values (JSON)
            new_values: New values (JSON)
            workflow_id: Related workflow ID

        Returns:
            Created history record
        """
        history = AssetHistory(
            id=str(uuid4()),
            asset_id=asset_id,
            action=action,
            performed_by=performed_by,
            description=description,
            from_user_id=from_user_id,
            to_user_id=to_user_id,
            from_location_id=from_location_id,
            to_location_id=to_location_id,
            old_values=old_values,
            new_values=new_values,
            workflow_id=workflow_id,
        )

        db.add(history)
        await db.flush()

        return history
