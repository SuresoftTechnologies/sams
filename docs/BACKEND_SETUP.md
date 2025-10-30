# Backend Setup Guide - FastAPI + Python

Complete guide to setting up and running the SureSoft SAMS backend.

## 📋 Prerequisites

### Required Software

1. **Python 3.12**
   ```bash
   # Check version
   python --version  # or python3 --version

   # Install on macOS
   brew install python@3.12

   # Install on Ubuntu/Debian
   sudo apt install python3.12 python3.12-venv
   ```

   > **Note**: For faster setup with automatic Python management, consider using [uv](./BACKEND_SETUP_UV.md) instead.

2. **PostgreSQL 15**
   ```bash
   # macOS
   brew install postgresql@15
   brew services start postgresql@15

   # Ubuntu/Debian
   sudo apt install postgresql-15
   sudo systemctl start postgresql

   # Verify
   psql --version
   ```

3. **Redis 7**
   ```bash
   # macOS
   brew install redis
   brew services start redis

   # Ubuntu/Debian
   sudo apt install redis
   sudo systemctl start redis

   # Verify
   redis-cli ping  # Should return "PONG"
   ```

4. **pnpm** (for Turborepo integration)
   ```bash
   npm install -g pnpm
   ```

## 🚀 Quick Start

### 1. Create Virtual Environment

```bash
# Navigate to backend directory
cd apps/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# macOS/Linux:
source venv/bin/activate

# Windows:
venv\Scripts\activate

# You should see (venv) in your prompt
```

### 2. Install Dependencies

```bash
# Install with dev dependencies
pip install -e ".[dev]"

# Verify installation
python -c "import fastapi; print(fastapi.__version__)"
```

### 3. Set Up Database

```bash
# Create PostgreSQL database
psql -U postgres

# In psql prompt:
CREATE DATABASE sams;
CREATE USER sams WITH PASSWORD 'ams';
GRANT ALL PRIVILEGES ON DATABASE ams TO ams;
\q

# Test connection
psql -U sams -d ams -h localhost
```

### 4. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings
# Required changes:
# - DATABASE_URL (if using different credentials)
# - JWT_ACCESS_SECRET (use a strong random string)
# - JWT_REFRESH_SECRET (use a different strong random string)
```

**Generate secure secrets**:
```bash
# Generate random secrets for JWT
python -c "import secrets; print(secrets.token_urlsafe(32))"
# Copy output to JWT_ACCESS_SECRET

python -c "import secrets; print(secrets.token_urlsafe(32))"
# Copy output to JWT_REFRESH_SECRET
```

### 5. Run Database Migrations

```bash
# TODO: After Alembic is set up
pnpm db:migrate
```

### 6. Start Development Server

```bash
# Option 1: Using pnpm (recommended - integrates with Turborepo)
pnpm dev

# Option 2: Using Python directly
python src/main.py

# Option 3: Using uvicorn directly
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

The server will start at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔄 Type Generation Workflow

### Generate OpenAPI Spec

```bash
# Export OpenAPI specification for frontend
pnpm generate:openapi

# This creates: ../../packages/api-client/openapi.json
```

### Full Type Sync Flow

From project root:

```bash
# 1. Backend generates OpenAPI spec
pnpm --filter=@sams/backend generate:openapi

# 2. API client generates TypeScript types
pnpm --filter=@sams/api-client generate

# 3. Build everything (automatic dependency order)
pnpm build
```

With Turborepo, dependencies are automatic:
```bash
# Just run dev - Turborepo handles the rest
pnpm dev
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test -- --cov-report=html

# Open coverage report
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
```

### Run Specific Tests

```bash
# Test specific file
pytest tests/test_auth.py

# Test specific function
pytest tests/test_auth.py::test_login

# With verbose output
pytest -v
```

## 🔧 Development Tools

### Code Formatting

```bash
# Format code with Ruff
pnpm format

# Or manually:
uv run ruff format src tests

# Check formatting without changing files
uv run ruff format --check src tests
```

### Linting

```bash
# Lint with Ruff
pnpm lint

# Auto-fix issues
ruff check --fix src tests
```

### Type Checking

```bash
# Type check with mypy
pnpm typecheck

# Or manually:
mypy src
```

### Pre-commit Checks

```bash
# Run all checks before committing
pnpm format && pnpm lint && pnpm typecheck && pnpm test

# With auto-fix
uv run ruff format src tests && uv run ruff check --fix src tests && uv run mypy src && uv run pytest
```

## 🗄️ Database Management

### Alembic Migrations

```bash
# Create new migration
pnpm db:migrate:create "add_users_table"

# Apply all migrations
pnpm db:migrate

# Rollback one migration
alembic downgrade -1

# Rollback all migrations
alembic downgrade base

# Reset database (drop all + reapply)
pnpm db:reset

# View migration history
alembic history
```

### Seed Data

```bash
# Run seed script (TODO: implement)
pnpm db:seed
```

### Database Shell

```bash
# Open PostgreSQL shell
psql -U sams -d ams -h localhost

# List tables
\dt

# Describe table
\d assets

# Query
SELECT * FROM assets LIMIT 10;
```

## 📝 API Development

### Create New Endpoint

1. **Define Pydantic schema** in `src/schemas/`:

```python
# src/schemas/category.py
from pydantic import BaseModel

class Category(BaseModel):
    id: str
    name: str
    description: str | None
```

2. **Create endpoint** in `src/api/v1/endpoints/`:

```python
# src/api/v1/endpoints/categories.py
from fastapi import APIRouter
from src.schemas.category import Category

router = APIRouter()

@router.get("", response_model=list[Category])
async def get_categories() -> list[Category]:
    # TODO: Implement
    return []
```

3. **Register router** in `src/api/v1/router.py`:

```python
from src.api.v1.endpoints import categories

api_router.include_router(
    categories.router,
    prefix="/categories",
    tags=["Categories"]
)
```

4. **Export OpenAPI**:

```bash
pnpm generate:openapi
```

5. **Generate TypeScript types**:

```bash
pnpm --filter=@sams/api-client generate
```

### Test Endpoint

```bash
# Using curl
curl http://localhost:8000/api/v1/categories

# Using httpie (recommended)
http GET localhost:8000/api/v1/categories

# Using Interactive Docs
# Open http://localhost:8000/docs
```

## 🐛 Troubleshooting

### Virtual Environment Issues

```bash
# Deactivate and recreate
deactivate
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -e ".[dev]"
```

### Database Connection Errors

```bash
# Check PostgreSQL is running
brew services list | grep postgresql  # macOS
systemctl status postgresql  # Linux

# Restart PostgreSQL
brew services restart postgresql@15  # macOS
sudo systemctl restart postgresql  # Linux

# Check if user exists
psql -U postgres -c "\du"

# Recreate user
psql -U postgres
DROP USER IF EXISTS sams;
CREATE USER sams WITH PASSWORD 'ams';
```

### Redis Connection Errors

```bash
# Check Redis is running
redis-cli ping

# Start Redis
brew services start redis  # macOS
sudo systemctl start redis  # Linux

# Check Redis status
redis-cli INFO server
```

### Import Errors

```bash
# Reinstall dependencies
pip install -e ".[dev]" --force-reinstall

# Check Python path
python -c "import sys; print('\n'.join(sys.path))"

# Verify src is in path
cd apps/backend
python -c "import src; print(src)"
```

### Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
```

### OpenAPI Generation Fails

```bash
# Check if src/main.py runs
python src/main.py

# Run export script directly
python scripts/export_openapi.py

# Check for syntax errors
python -m py_compile src/main.py
```

## 🔐 Security Checklist

### Before Deployment

- [ ] Change `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Set `APP_DEBUG=false`
- [ ] Use strong database password
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS
- [ ] Set up database backups
- [ ] Configure rate limiting
- [ ] Review environment variables

### Generate Production Secrets

```bash
# Strong JWT secrets
python -c "import secrets; print('JWT_ACCESS_SECRET=' + secrets.token_urlsafe(64))"
python -c "import secrets; print('JWT_REFRESH_SECRET=' + secrets.token_urlsafe(64))"

# Strong database password
python -c "import secrets; print('DB_PASSWORD=' + secrets.token_urlsafe(32))"
```

## 📚 Next Steps

1. ✅ Set up development environment
2. ✅ Start development server
3. ⬜ Implement SQLAlchemy models
4. ⬜ Set up Alembic migrations
5. ⬜ Implement authentication service
6. ⬜ Create business logic services
7. ⬜ Write unit tests
8. ⬜ Set up CI/CD

## 🔗 Related Documentation

- [ADR-0005: Python Backend with Type Sync](./docs/architecture/adr/0005-python-backend-with-type-sync.md)
- [Backend README](./apps/backend/README.md)
- [API Client README](./packages/api-client/README.md)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [SQLAlchemy 2.0 Documentation](https://docs.sqlalchemy.org/en/20/)

## 💡 Tips

### Development Workflow

1. **Always activate virtual environment** before working
2. **Use pnpm dev from root** for Turborepo integration
3. **Export OpenAPI after schema changes**
4. **Run tests before committing**
5. **Use interactive docs** for API exploration

### FastAPI Features

- **Auto-reload**: Changes are reflected immediately
- **Interactive docs**: Test APIs without Postman
- **Type hints**: IDE autocomplete for everything
- **Async support**: Use `async def` for database calls
- **Dependency injection**: Use FastAPI's `Depends()`

### Debugging

```python
# Add breakpoint in code
import pdb; pdb.set_trace()

# Or use better debugger
import ipdb; ipdb.set_trace()

# Print debugging
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
logger.debug(f"User: {user}")
```

---

**Need help?** Check the [Troubleshooting](#-troubleshooting) section or refer to official FastAPI docs.
