# @sams/backend

SAMS (Suresoft Asset Management System) - Backend API (FastAPI + Python)

## 📦 Overview

High-performance async REST API built with FastAPI, providing backend services for SAMS.

**Tech Stack**:
- **Framework**: FastAPI 0.109+
- **Language**: Python 3.12
- **ORM**: SQLAlchemy 2.0 + Asyncpg
- **Validation**: Pydantic v2
- **Auth**: JWT (python-jose)
- **Database**: PostgreSQL 15
- **Cache**: Redis

## 🚀 Quick Start

### Prerequisites

- Python 3.12
- PostgreSQL 15
- Redis 7

### Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -e ".[dev]"

# Copy environment file
cp .env.example .env

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

The API will be available at:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 📁 Project Structure

```
apps/backend/
├── src/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/      # API endpoints
│   │       │   ├── auth.py
│   │       │   ├── users.py
│   │       │   └── assets.py
│   │       └── router.py       # Main router
│   ├── schemas/                # Pydantic models
│   │   ├── asset.py
│   │   ├── user.py
│   │   └── auth.py
│   ├── models/                 # SQLAlchemy models (TODO)
│   ├── services/               # Business logic (TODO)
│   ├── config.py               # Configuration
│   └── main.py                 # FastAPI app
├── scripts/
│   └── export_openapi.py       # OpenAPI export
├── tests/                      # Tests (TODO)
├── pyproject.toml              # Python config
├── package.json                # npm scripts
└── README.md
```

## 🔧 Development

### Run Development Server

```bash
pnpm dev
```

Auto-reloads on code changes.

### Export OpenAPI Spec

```bash
pnpm generate:openapi
```

Exports `openapi.json` to `packages/api-client/` for TypeScript type generation.

### Linting & Formatting

```bash
# Format code with Ruff
pnpm format

# Check formatting (without changes)
pnpm format:check

# Lint with Ruff
pnpm lint

# Lint with auto-fix
pnpm lint:fix

# Type check with mypy
pnpm typecheck
```

### Testing

```bash
# Run tests
pnpm test

# With coverage
pnpm test -- --cov-report=html
```

### Database Migrations

```bash
# Apply migrations
pnpm db:migrate

# Create new migration
pnpm db:migrate:create "description of changes"

# Seed initial data (users, categories, locations)
pnpm db:seed

# Reset database (drop all tables and reapply migrations)
pnpm db:reset

# Reset and seed
pnpm db:reset && pnpm db:seed
```

See [Database Migrations Guide](docs/DATABASE_MIGRATIONS.md) for detailed documentation.

## 🌐 API Documentation

### Interactive Docs

FastAPI provides auto-generated interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### OpenAPI Schema

- **JSON**: http://localhost:8000/openapi.json

## 🔐 Authentication

JWT-based authentication with access + refresh tokens.

### Login Flow

```bash
# Login
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password"
}

# Response
{
  "user": { ... },
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}

# Use access token
Authorization: Bearer eyJ...
```

### Token Lifecycle

- **Access Token**: 15 minutes
- **Refresh Token**: 7 days

## 📝 Pydantic Schemas

All request/response models are defined with Pydantic v2:

```python
from src.schemas.asset import Asset, CreateAssetRequest

# Create asset
request = CreateAssetRequest(
    asset_tag="SRS-11-2024-0001",
    name="Dell Latitude 5420",
    category_id="uuid-here"
)

# Response is validated Asset model
asset: Asset = await create_asset_service(request)
```

**Benefits**:
- Runtime validation
- Auto-generated OpenAPI schema
- Type safety (with mypy)
- Excellent error messages

## 🔄 Type Synchronization

Backend Pydantic models → OpenAPI spec → TypeScript types

### Workflow

1. Define Pydantic schemas in `src/schemas/`
2. FastAPI auto-generates OpenAPI spec
3. Run `pnpm generate:openapi` to export `openapi.json`
4. `@sams/api-client` generates TypeScript types
5. Frontend imports types from `@sams/api-client`

### Example

**Python**:
```python
# src/schemas/asset.py
class CreateAssetRequest(BaseModel):
    asset_tag: str
    name: str
    category_id: str
```

**TypeScript** (auto-generated):
```typescript
// packages/api-client/src/generated/types.ts
export interface CreateAssetRequest {
  asset_tag: string;
  name: string;
  category_id: string;
}
```

See [ADR-0005](../../docs/architecture/adr/0005-python-backend-with-type-sync.md) for details.

## ⚙️ Configuration

Environment variables in `.env`:

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/ams

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
```

See `.env.example` for all options.

## 🐛 Troubleshooting

### Import Errors

```bash
# Reinstall dependencies
pip install -e ".[dev]" --force-reinstall
```

### Database Connection

```bash
# Check PostgreSQL is running
psql -h localhost -U postgres

# Verify DATABASE_URL in .env
```

### Redis Connection

```bash
# Check Redis is running
redis-cli ping
```

## 📚 Related

- [ADR-0005: Python Backend with Type Sync](../../docs/architecture/adr/0005-python-backend-with-type-sync.md)
- [Project Structure](../../docs/architecture/03-project-structure.md)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Pydantic Docs](https://docs.pydantic.dev/)
