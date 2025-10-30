"""fix date field types from datetime to date

Revision ID: fix_date_types_001
Revises: restore_indexes_001
Create Date: 2025-10-31

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'fix_date_types_001'
down_revision: Union[str, Sequence[str], None] = 'restore_indexes_001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Change DateTime fields to Date for date-only columns."""
    # Change purchase_date from DateTime to Date
    op.alter_column('assets', 'purchase_date',
                    type_=sa.Date(),
                    existing_type=sa.DateTime(timezone=True),
                    postgresql_using='purchase_date::date')

    # Change tax_invoice_date from DateTime to Date
    op.alter_column('assets', 'tax_invoice_date',
                    type_=sa.Date(),
                    existing_type=sa.DateTime(timezone=True),
                    postgresql_using='tax_invoice_date::date')

    # Change checkout_date from DateTime to Date
    op.alter_column('assets', 'checkout_date',
                    type_=sa.Date(),
                    existing_type=sa.DateTime(timezone=True),
                    postgresql_using='checkout_date::date')

    # Change return_date from DateTime to Date
    op.alter_column('assets', 'return_date',
                    type_=sa.Date(),
                    existing_type=sa.DateTime(timezone=True),
                    postgresql_using='return_date::date')

    # Note: warranty_end should also be Date if it represents just a date
    op.alter_column('assets', 'warranty_end',
                    type_=sa.Date(),
                    existing_type=sa.DateTime(timezone=True),
                    postgresql_using='warranty_end::date')

    # Workflow expected_return_date should be Date
    op.alter_column('workflows', 'expected_return_date',
                    type_=sa.Date(),
                    existing_type=sa.DateTime(timezone=True),
                    postgresql_using='expected_return_date::date')


def downgrade() -> None:
    """Revert Date fields back to DateTime."""
    op.alter_column('workflows', 'expected_return_date',
                    type_=sa.DateTime(timezone=True),
                    existing_type=sa.Date())

    op.alter_column('assets', 'warranty_end',
                    type_=sa.DateTime(timezone=True),
                    existing_type=sa.Date())

    op.alter_column('assets', 'return_date',
                    type_=sa.DateTime(timezone=True),
                    existing_type=sa.Date())

    op.alter_column('assets', 'checkout_date',
                    type_=sa.DateTime(timezone=True),
                    existing_type=sa.Date())

    op.alter_column('assets', 'tax_invoice_date',
                    type_=sa.DateTime(timezone=True),
                    existing_type=sa.Date())

    op.alter_column('assets', 'purchase_date',
                    type_=sa.DateTime(timezone=True),
                    existing_type=sa.Date())