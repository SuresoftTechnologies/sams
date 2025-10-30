"""add_departments_and_fix_users_schema

Revision ID: a8522d40e5cd
Revises: af78095d1436
Create Date: 2025-10-31 02:28:07.428674

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a8522d40e5cd'
down_revision: Union[str, Sequence[str], None] = 'af78095d1436'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create departments table
    op.create_table(
        'departments',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('code', sa.String(length=20), nullable=False),
        sa.Column('parent_id', sa.String(length=36), nullable=True),
        sa.Column('manager_id', sa.String(length=36), nullable=True),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['manager_id'], ['users.id'], name=op.f('fk_departments_manager_id_users')),
        sa.ForeignKeyConstraint(['parent_id'], ['departments.id'], name=op.f('fk_departments_parent_id_departments')),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_departments'))
    )
    op.create_index(op.f('ix_departments_code'), 'departments', ['code'], unique=True)
    op.create_index(op.f('ix_departments_id'), 'departments', ['id'], unique=False)
    op.create_index('idx_departments_parent', 'departments', ['parent_id'], unique=False)
    op.create_index(op.f('ix_departments_name'), 'departments', ['name'], unique=True)
    
    # Modify users table using batch mode for SQLite compatibility
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('department_id', sa.String(length=36), nullable=True))
        batch_op.add_column(sa.Column('avatar_url', sa.String(length=500), nullable=True))
        batch_op.drop_column('department')
        batch_op.create_foreign_key('fk_users_department_id_departments', 'departments', ['department_id'], ['id'])
        batch_op.create_index('idx_users_department', ['department_id'], unique=False)
        batch_op.create_index('ix_users_role', ['role'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Revert users table changes
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_index('ix_users_role')
        batch_op.drop_index('idx_users_department')
        batch_op.drop_constraint('fk_users_department_id_departments', type_='foreignkey')
        batch_op.add_column(sa.Column('department', sa.String(length=100), nullable=True))
        batch_op.drop_column('avatar_url')
        batch_op.drop_column('department_id')
    
    # Drop departments table
    op.drop_index('ix_departments_name', table_name='departments')
    op.drop_index('idx_departments_parent', table_name='departments')
    op.drop_index(op.f('ix_departments_id'), table_name='departments')
    op.drop_index(op.f('ix_departments_code'), table_name='departments')
    op.drop_table('departments')
