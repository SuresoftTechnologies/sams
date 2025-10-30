"""add_indexes_for_asset_performance

Revision ID: 97b54c3e6d34
Revises: 001
Create Date: 2025-10-30 22:24:31.268154

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '97b54c3e6d34'
down_revision: Union[str, Sequence[str], None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add indexes to assets table for improved query performance.

    These indexes optimize:
    - Search queries (asset_tag, name, serial_number, model)
    - Filter queries (status, category_id, location_id)
    - Assignment queries (assigned_to)
    """
    # Index for asset_tag (used in search and QR code lookup)
    op.create_index('idx_assets_asset_tag', 'assets', ['asset_tag'])

    # Index for name (used in search)
    op.create_index('idx_assets_name', 'assets', ['name'])

    # Index for serial_number (used in search)
    op.create_index('idx_assets_serial_number', 'assets', ['serial_number'])

    # Index for model (used in search)
    op.create_index('idx_assets_model', 'assets', ['model'])

    # Index for status (used in filtering)
    op.create_index('idx_assets_status', 'assets', ['status'])

    # Index for category_id (used in filtering and joins)
    op.create_index('idx_assets_category_id', 'assets', ['category_id'])

    # Index for location_id (used in filtering and joins)
    op.create_index('idx_assets_location_id', 'assets', ['location_id'])

    # Index for assigned_to (used in filtering)
    op.create_index('idx_assets_assigned_to', 'assets', ['assigned_to'])

    # Index for grade (used in filtering)
    op.create_index('idx_assets_grade', 'assets', ['grade'])

    # Composite index for common query patterns
    # (deleted_at, status) - for filtering active assets by status
    op.create_index('idx_assets_deleted_status', 'assets', ['deleted_at', 'status'])


def downgrade() -> None:
    """Remove performance indexes."""
    op.drop_index('idx_assets_deleted_status', 'assets')
    op.drop_index('idx_assets_grade', 'assets')
    op.drop_index('idx_assets_assigned_to', 'assets')
    op.drop_index('idx_assets_location_id', 'assets')
    op.drop_index('idx_assets_category_id', 'assets')
    op.drop_index('idx_assets_status', 'assets')
    op.drop_index('idx_assets_model', 'assets')
    op.drop_index('idx_assets_serial_number', 'assets')
    op.drop_index('idx_assets_name', 'assets')
    op.drop_index('idx_assets_asset_tag', 'assets')
