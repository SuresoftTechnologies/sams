"""add_rental_return_workflow_types

Revision ID: cb29c8bac60f
Revises: 87fbb6a534f4
Create Date: 2025-10-31 03:36:25.717307

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cb29c8bac60f'
down_revision: Union[str, Sequence[str], None] = '87fbb6a534f4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # No database changes needed since WorkflowType is stored as string
    # The new enum values ('rental', 'return', 'disposal') will work automatically
    # This migration is just for documentation purposes
    pass


def downgrade() -> None:
    """Downgrade schema."""
    # No database changes needed for downgrade
    pass
