"""restore critical indexes for performance

Revision ID: restore_indexes_001
Revises: ac73feb093d2
Create Date: 2025-10-31

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'restore_indexes_001'
down_revision: Union[str, Sequence[str], None] = 'ac73feb093d2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Restore critical indexes for query performance."""
    # Asset table indexes
    op.create_index('idx_assets_tag', 'assets', ['asset_tag'])
    op.create_index('idx_assets_category', 'assets', ['category_id'])
    op.create_index('idx_assets_status', 'assets', ['status'])
    op.create_index('idx_assets_assigned_to', 'assets', ['assigned_to'])
    op.create_index('idx_assets_location', 'assets', ['location_id'])
    op.create_index('idx_assets_serial', 'assets', ['serial_number'])

    # Partial index for non-deleted assets (most common query pattern)
    op.create_index(
        'idx_assets_deleted',
        'assets',
        ['deleted_at'],
        postgresql_where=sa.text('deleted_at IS NULL')
    )

    # Composite index for common search patterns
    op.create_index(
        'idx_assets_search',
        'assets',
        ['category_id', 'status', 'assigned_to']
    )

    # AssetHistory indexes
    op.create_index('idx_history_asset', 'asset_history', ['asset_id'])
    op.create_index('idx_history_created_at', 'asset_history', ['created_at'])
    op.create_index('idx_history_action', 'asset_history', ['action'])

    # Composite index for history queries
    op.create_index(
        'idx_history_asset_date',
        'asset_history',
        ['asset_id', 'created_at']
    )

    # Workflow indexes
    op.create_index('idx_workflows_asset', 'workflows', ['asset_id'])
    op.create_index('idx_workflows_requester', 'workflows', ['requester_id'])
    op.create_index('idx_workflows_status', 'workflows', ['status'])
    op.create_index('idx_workflows_type', 'workflows', ['type'])
    op.create_index('idx_workflows_created', 'workflows', ['created_at'])


def downgrade() -> None:
    """Remove indexes."""
    # Workflow indexes
    op.drop_index('idx_workflows_created', 'workflows')
    op.drop_index('idx_workflows_type', 'workflows')
    op.drop_index('idx_workflows_status', 'workflows')
    op.drop_index('idx_workflows_requester', 'workflows')
    op.drop_index('idx_workflows_asset', 'workflows')

    # AssetHistory indexes
    op.drop_index('idx_history_asset_date', 'asset_history')
    op.drop_index('idx_history_action', 'asset_history')
    op.drop_index('idx_history_created_at', 'asset_history')
    op.drop_index('idx_history_asset', 'asset_history')

    # Asset indexes
    op.drop_index('idx_assets_search', 'assets')
    op.drop_index('idx_assets_deleted', 'assets')
    op.drop_index('idx_assets_serial', 'assets')
    op.drop_index('idx_assets_location', 'assets')
    op.drop_index('idx_assets_assigned_to', 'assets')
    op.drop_index('idx_assets_status', 'assets')
    op.drop_index('idx_assets_category', 'assets')
    op.drop_index('idx_assets_tag', 'assets')