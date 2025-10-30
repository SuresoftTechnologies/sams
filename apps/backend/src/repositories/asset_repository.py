"""
Asset repository for asset-specific database operations.

This module provides the AssetRepository class with custom methods for
querying and managing assets beyond basic CRUD operations.
"""

from datetime import UTC, datetime

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from src.models.asset import Asset, AssetGrade, AssetStatus
from src.repositories.base import CRUDBase
from src.schemas.asset import CreateAssetRequest, UpdateAssetRequest


class AssetRepository(CRUDBase[Asset, CreateAssetRequest, UpdateAssetRequest]):
    """
    Repository for Asset model with custom query methods.

    Extends CRUDBase to provide asset-specific operations such as:
    - Query by asset tag or QR code
    - Search and filtering
    - User-based queries
    - Soft delete support
    """

    def __init__(self) -> None:
        """Initialize asset repository."""
        super().__init__(Asset)

    def get_by_asset_tag(self, db: Session, *, asset_tag: str) -> Asset | None:
        """
        Query asset by asset tag (e.g., "SRS-11-2024-0001").

        Args:
            db: Database session
            asset_tag: Unique asset tag identifier

        Returns:
            Asset if found, None otherwise
        """
        return (
            db.query(Asset)
            .filter(
                Asset.asset_tag == asset_tag,
                Asset.deleted_at.is_(None),  # Exclude soft-deleted
            )
            .first()
        )

    def get_by_qr_code(self, db: Session, *, qr_code: str) -> Asset | None:
        """
        Query asset by QR code.

        Args:
            db: Database session
            qr_code: QR code identifier

        Returns:
            Asset if found, None otherwise
        """
        return (
            db.query(Asset)
            .filter(
                Asset.qr_code == qr_code,
                Asset.deleted_at.is_(None),  # Exclude soft-deleted
            )
            .first()
        )

    def get_by_user(
        self, db: Session, *, user_id: str, skip: int = 0, limit: int = 100
    ) -> list[Asset]:
        """
        Query assets assigned to a specific user.

        Args:
            db: Database session
            user_id: User ID to filter by
            skip: Number of records to skip (pagination)
            limit: Maximum number of records to return

        Returns:
            List of assets assigned to the user
        """
        return (
            db.query(Asset)
            .filter(
                Asset.assigned_to == user_id,
                Asset.deleted_at.is_(None),  # Exclude soft-deleted
            )
            .offset(skip)
            .limit(limit)
            .all()
        )

    def search(
        self, db: Session, *, search_term: str, skip: int = 0, limit: int = 100
    ) -> list[Asset]:
        """
        Search assets by name, asset_tag, model, or serial number.

        Args:
            db: Database session
            search_term: Search string to match against multiple fields
            skip: Number of records to skip (pagination)
            limit: Maximum number of records to return

        Returns:
            List of matching assets
        """
        search_pattern = f"%{search_term}%"

        return (
            db.query(Asset)
            .filter(
                and_(
                    or_(
                        Asset.name.ilike(search_pattern),
                        Asset.asset_tag.ilike(search_pattern),
                        Asset.model.ilike(search_pattern),
                        Asset.serial_number.ilike(search_pattern),
                        Asset.manufacturer.ilike(search_pattern),
                    ),
                    Asset.deleted_at.is_(None),  # Exclude soft-deleted
                )
            )
            .offset(skip)
            .limit(limit)
            .all()
        )

    def filter_assets(
        self,
        db: Session,
        *,
        status: AssetStatus | None = None,
        category_id: str | None = None,
        location_id: str | None = None,
        assigned_to: str | None = None,
        grade: AssetGrade | None = None,
        search: str | None = None,
        skip: int = 0,
        limit: int = 100,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> tuple[list[Asset], int]:
        """
        Filter assets with multiple criteria and return paginated results with total count.

        Args:
            db: Database session
            status: Filter by asset status
            category_id: Filter by category
            location_id: Filter by location
            assigned_to: Filter by assigned user
            grade: Filter by asset grade
            search: Search term for name/tag/model
            skip: Number of records to skip (pagination)
            limit: Maximum number of records to return
            sort_by: Field to sort by (default: created_at)
            sort_order: Sort order 'asc' or 'desc' (default: desc)

        Returns:
            Tuple of (list of assets, total count)
        """
        # Start with base query (exclude soft-deleted)
        query = db.query(Asset).filter(Asset.deleted_at.is_(None))

        # Apply filters
        if status:
            query = query.filter(Asset.status == status)

        if category_id:
            query = query.filter(Asset.category_id == category_id)

        if location_id:
            query = query.filter(Asset.location_id == location_id)

        if assigned_to:
            query = query.filter(Asset.assigned_to == assigned_to)

        if grade:
            query = query.filter(Asset.grade == grade)

        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Asset.name.ilike(search_pattern),
                    Asset.asset_tag.ilike(search_pattern),
                    Asset.model.ilike(search_pattern),
                    Asset.serial_number.ilike(search_pattern),
                    Asset.manufacturer.ilike(search_pattern),
                )
            )

        # Get total count before pagination
        total = query.count()

        # Apply sorting
        sort_column = getattr(Asset, sort_by, Asset.created_at)
        if sort_order.lower() == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        # Apply pagination
        assets = query.offset(skip).limit(limit).all()

        return assets, total

    def get_with_pagination(
        self, db: Session, *, skip: int = 0, limit: int = 100, include_deleted: bool = False
    ) -> tuple[list[Asset], int]:
        """
        Get assets with pagination and total count.

        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return
            include_deleted: Whether to include soft-deleted assets

        Returns:
            Tuple of (list of assets, total count)
        """
        query = db.query(Asset)

        # Exclude soft-deleted unless specified
        if not include_deleted:
            query = query.filter(Asset.deleted_at.is_(None))

        # Get total count
        total = query.count()

        # Get paginated results
        assets = query.order_by(Asset.created_at.desc()).offset(skip).limit(limit).all()

        return assets, total

    def get_by_category(
        self, db: Session, *, category_id: str, skip: int = 0, limit: int = 100
    ) -> list[Asset]:
        """
        Get assets by category.

        Args:
            db: Database session
            category_id: Category ID to filter by
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of assets in the category
        """
        return (
            db.query(Asset)
            .filter(Asset.category_id == category_id, Asset.deleted_at.is_(None))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_location(
        self, db: Session, *, location_id: str, skip: int = 0, limit: int = 100
    ) -> list[Asset]:
        """
        Get assets by location.

        Args:
            db: Database session
            location_id: Location ID to filter by
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of assets in the location
        """
        return (
            db.query(Asset)
            .filter(Asset.location_id == location_id, Asset.deleted_at.is_(None))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def soft_delete(self, db: Session, *, id: str) -> Asset | None:
        """
        Soft delete an asset by setting deleted_at timestamp.

        Args:
            db: Database session
            id: Asset ID to delete

        Returns:
            Soft-deleted asset if found, None otherwise
        """
        asset = db.query(Asset).filter(Asset.id == id, Asset.deleted_at.is_(None)).first()

        if asset:
            asset.deleted_at = datetime.now(UTC)
            db.add(asset)
            db.commit()
            db.refresh(asset)

        return asset

    def restore(self, db: Session, *, id: str) -> Asset | None:
        """
        Restore a soft-deleted asset.

        Args:
            db: Database session
            id: Asset ID to restore

        Returns:
            Restored asset if found, None otherwise
        """
        asset = db.query(Asset).filter(Asset.id == id, Asset.deleted_at.isnot(None)).first()

        if asset:
            asset.deleted_at = None
            db.add(asset)
            db.commit()
            db.refresh(asset)

        return asset

    def count_by_status(self, db: Session, *, status: AssetStatus) -> int:
        """
        Count assets by status.

        Args:
            db: Database session
            status: Asset status to count

        Returns:
            Number of assets with the given status
        """
        return db.query(Asset).filter(Asset.status == status, Asset.deleted_at.is_(None)).count()

    def count_by_category(self, db: Session, *, category_id: str) -> int:
        """
        Count assets in a category.

        Args:
            db: Database session
            category_id: Category ID

        Returns:
            Number of assets in the category
        """
        return (
            db.query(Asset)
            .filter(Asset.category_id == category_id, Asset.deleted_at.is_(None))
            .count()
        )

    def get_available_assets(self, db: Session, *, skip: int = 0, limit: int = 100) -> list[Asset]:
        """
        Get all available (not assigned) assets.

        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of available assets
        """
        return (
            db.query(Asset)
            .filter(Asset.status.in_([AssetStatus.LOANED, AssetStatus.STOCK]), Asset.deleted_at.is_(None))
            .offset(skip)
            .limit(limit)
            .all()
        )


# Singleton instance
asset_repository = AssetRepository()
