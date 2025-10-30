# Database Migrations Guide

This guide explains how to manage database schema changes using Alembic in the SureSoft SAMS backend.

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Common Commands](#common-commands)
- [Migration Workflow](#migration-workflow)
- [Seeding Data](#seeding-data)
- [Troubleshooting](#troubleshooting)

## Overview

The project uses Alembic for database migrations with async SQLAlchemy support. All database schema changes should be managed through migrations to ensure consistency across environments.

### Migration Files Location

- Configuration: `alembic.ini`
- Environment: `alembic/env.py`
- Migrations: `alembic/versions/`

## Setup

### 1. Database Connection

Ensure your `.env` file has the correct database URL:

```bash
DATABASE_URL=postgresql+asyncpg://sams:sams@localhost:5432/sams
```

### 2. Install Dependencies

```bash
npm run setup
# or
uv sync
```

## Common Commands

### Apply Migrations

Apply all pending migrations to the database:

```bash
npm run db:migrate
# or
uv run alembic upgrade head
```

### Create New Migration

Generate a new migration file based on model changes:

```bash
npm run db:migrate:create "description of changes"
# or
uv run alembic revision --autogenerate -m "description of changes"
```

### Rollback Migration

Revert the last migration:

```bash
uv run alembic downgrade -1
```

Revert all migrations:

```bash
uv run alembic downgrade base
```

### Reset Database

Drop all tables and reapply all migrations:

```bash
npm run db:reset
# or
uv run alembic downgrade base && uv run alembic upgrade head
```

### View Migration History

Show current migration status:

```bash
uv run alembic current
```

Show migration history:

```bash
uv run alembic history
```

## Migration Workflow

### 1. Modify Models

Make changes to your SQLAlchemy models in `src/models/`:

```python
# src/models/asset.py
class Asset(Base):
    __tablename__ = "assets"

    # Add new field
    warranty_months: Mapped[int | None] = mapped_column(Integer)
```

### 2. Generate Migration

Create a migration file:

```bash
npm run db:migrate:create "add warranty_months to assets"
```

This creates a file like: `alembic/versions/20251030_1234-002_add_warranty_months_to_assets.py`

### 3. Review Migration

Always review the generated migration file before applying:

```python
def upgrade() -> None:
    op.add_column('assets', sa.Column('warranty_months', sa.Integer(), nullable=True))

def downgrade() -> None:
    op.drop_column('assets', 'warranty_months')
```

### 4. Apply Migration

Apply the migration to your database:

```bash
npm run db:migrate
```

### 5. Commit Migration

Commit the migration file to version control:

```bash
git add alembic/versions/
git commit -m "Add warranty_months field to assets"
```

## Seeding Data

### Initial Seed

Populate the database with initial data (users, categories, locations):

```bash
npm run db:seed
# or
uv run python scripts/seed.py
```

### What Gets Seeded

The seed script creates:

1. **Users**
   - Admin: `admin@suresoft.com` (configurable password)
   - Manager: `manager@suresoft.com` (password: `manager123!`)
   - Employee: `employee@suresoft.com` (password: `employee123!`)

2. **Categories** (3 types for OCR)
   - 데스크탑 (11), 노트북 (12), 모니터 (14)
   - 영수증 OCR 시스템에서 자동 인식용

3. **Locations** (16 locations)
   - 판교: Main Building (3 floors), Research Building (2 floors), Storage
   - 대전: Main Office (3 floors), Research Lab (2 floors), Storage

### Custom Admin Password

Set a custom admin password via environment variable:

```bash
ADMIN_PASSWORD=your-secure-password npm run db:seed
```

### Idempotent Seeding

The seed script is idempotent - running it multiple times won't create duplicates. It checks for existing records before inserting.

## Troubleshooting

### Migration Out of Sync

If your database is out of sync with migrations:

```bash
# Check current state
uv run alembic current

# Stamp database to a specific revision
uv run alembic stamp head
```

### Database Connection Errors

Ensure PostgreSQL is running:

```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Or check with docker
docker ps | grep postgres
```

### Failed Migration

If a migration fails:

1. Fix the issue in the migration file
2. Rollback: `uv run alembic downgrade -1`
3. Reapply: `uv run alembic upgrade head`

### Clean State

For development, to start with a clean database:

```bash
# Drop and recreate all tables
npm run db:reset

# Seed initial data
npm run db:seed
```

## Best Practices

1. **Always Review**: Review auto-generated migrations before applying
2. **Test Migrations**: Test migrations in development before production
3. **Backup Data**: Always backup production data before migrations
4. **Incremental Changes**: Make small, incremental migration changes
5. **Reversible**: Ensure migrations can be rolled back (proper `downgrade()`)
6. **Version Control**: Always commit migration files to git
7. **Documentation**: Document complex migrations in the file

## Migration File Structure

```python
"""Brief description of the migration

Revision ID: 001
Revises:
Create Date: 2025-10-30 18:09:00.000000
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# Revision identifiers
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    """Apply migration changes."""
    # Your upgrade logic here
    pass

def downgrade() -> None:
    """Revert migration changes."""
    # Your downgrade logic here
    pass
```

## Environment Configuration

The `alembic/env.py` file is configured for:

- Async SQLAlchemy support
- Automatic model discovery
- Database URL from environment variables
- Type comparison for schema changes
- Server default comparison

## Production Deployment

For production deployments:

1. **Backup Database**: Always backup before migrations
2. **Test in Staging**: Test migrations in staging environment first
3. **Plan Downtime**: Plan for downtime if needed
4. **Monitor**: Monitor the migration process
5. **Rollback Plan**: Have a rollback plan ready

```bash
# Production migration example
ADMIN_PASSWORD=secure-prod-password npm run db:migrate
npm run db:seed
```

## Additional Resources

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [SQLAlchemy 2.0 Documentation](https://docs.sqlalchemy.org/en/20/)
- [FastAPI with SQLAlchemy](https://fastapi.tiangolo.com/tutorial/sql-databases/)
