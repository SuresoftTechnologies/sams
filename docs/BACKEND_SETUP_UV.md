# Backend Setup Guide - FastAPI + Python (uv)

Complete guide to setting up the SureSoft AMS backend with **uv** - the blazing fast Python package manager.

## 📋 Prerequisites

### Required Software

1. **uv** (Python 패키지 관리자)
   ```bash
   # macOS/Linux
   curl -LsSf https://astral.sh/uv/install.sh | sh

   # Or with Homebrew
   brew install uv

   # Or with pip
   pip install uv

   # Verify installation
   uv --version
   ```

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

4. **pnpm** (for Turborepo)
   ```bash
   npm install -g pnpm
   ```

> **Note**: uv는 자동으로 적절한 Python 버전을 다운로드하고 관리합니다. 별도로 Python을 설치할 필요가 없습니다!

## 🚀 Quick Start

### 1. Install Dependencies with uv

```bash
# Navigate to backend directory
cd apps/backend

# uv가 자동으로:
# 1. Python 3.12 다운로드 (필요한 경우)
# 2. 가상환경 생성 (.venv/)
# 3. 모든 의존성 설치
# 4. uv.lock 파일 생성
pnpm setup

# Or directly with uv:
uv sync
```

**That's it!** uv가 모든 것을 자동으로 처리합니다. 🎉

### 2. Set Up Database

```bash
# Create PostgreSQL database
psql -U postgres

# In psql prompt:
CREATE DATABASE ams;
CREATE USER ams WITH PASSWORD 'ams';
GRANT ALL PRIVILEGES ON DATABASE ams TO ams;
\q
```

### 3. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Generate secure JWT secrets
python -c "import secrets; print('JWT_ACCESS_SECRET=' + secrets.token_urlsafe(64))"
python -c "import secrets; print('JWT_REFRESH_SECRET=' + secrets.token_urlsafe(64))"

# Edit .env with generated secrets and your database credentials
```

### 4. Start Development Server

```bash
# Using pnpm (recommended - integrates with Turborepo)
pnpm dev

# Or using uv directly
uv run uvicorn src.main:app --reload
```

The server will start at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🎯 Why uv?

### Speed Comparison

```bash
# Traditional pip
pip install -e ".[dev]"  # ~45 seconds

# uv
uv sync                   # ~3 seconds  ⚡️
```

### Key Features

✅ **10-100x faster** than pip (Rust로 작성됨)
✅ **통합 도구**: pip + venv + pip-tools를 하나로
✅ **자동 Python 설치**: 올바른 Python 버전 자동 다운로드
✅ **Lockfile**: `uv.lock`으로 재현 가능한 빌드
✅ **Zero config**: `.python-version` 자동 인식
✅ **호환성**: pip와 100% 호환

## 📦 Common Commands

### Dependency Management

```bash
# Install all dependencies (from pyproject.toml)
uv sync

# Add new dependency
uv add fastapi-limiter

# Add dev dependency
uv add --dev pytest-asyncio

# Update all dependencies
uv sync --upgrade

# Remove dependency
uv remove some-package

# Install specific version
uv add "fastapi>=0.110.0"
```

### Running Commands

```bash
# Run Python script
uv run python scripts/export_openapi.py

# Run with specific Python version (example)
uv run --python 3.12 python src/main.py

# Run tests
uv run pytest

# Run uvicorn
uv run uvicorn src.main:app --reload
```

### Virtual Environment

```bash
# uv는 자동으로 .venv를 생성/관리하지만, 수동으로도 가능:

# Create virtual environment
uv venv

# Activate (if needed for IDE)
source .venv/bin/activate  # macOS/Linux
.venv\Scripts\activate     # Windows

# uv run은 자동으로 .venv를 사용하므로 activate 불필요!
```

## 🔄 Type Generation Workflow

### 1. Export OpenAPI Spec

```bash
# Backend generates OpenAPI spec
pnpm generate:openapi

# Or with uv:
uv run python scripts/export_openapi.py
```

### 2. Generate TypeScript Types

From project root:

```bash
# API client generates TypeScript types
pnpm --filter=@sams/api-client generate

# Full workflow (automatic with Turborepo)
pnpm dev
```

Turborepo automatically handles the dependency chain:
```
Backend FastAPI → OpenAPI JSON → TypeScript Types → Frontend
```

## 🛠️ Development

### Code Quality

```bash
# Format code
pnpm format
# → uv run ruff format src tests

# Check formatting (without changes)
pnpm format:check
# → uv run ruff format --check src tests

# Lint code
pnpm lint
# → uv run ruff check src tests

# Lint with auto-fix
pnpm lint:fix
# → uv run ruff check --fix src tests

# Type check
pnpm typecheck
# → uv run mypy src

# Run all checks
pnpm format && pnpm lint && pnpm typecheck
```

### Testing

```bash
# Run all tests
pnpm test
# → uv run pytest

# Run with coverage
uv run pytest --cov=src --cov-report=html

# Run specific test
uv run pytest tests/test_auth.py::test_login

# Watch mode
pnpm test:watch
```

### Database

```bash
# Run migrations
pnpm db:migrate

# Create migration
pnpm db:migrate:create "add_users_table"

# Reset database
pnpm db:reset

# Seed data
pnpm db:seed
```

## 📝 Project Structure

```
apps/backend/
├── .python-version        # Python version for uv
├── pyproject.toml         # Project config + dependencies
├── uv.lock               # Lockfile (auto-generated)
├── .venv/                # Virtual environment (auto-created)
├── src/
│   ├── main.py           # FastAPI app
│   ├── config.py         # Settings
│   ├── api/
│   │   └── v1/
│   │       ├── router.py
│   │       └── endpoints/
│   └── schemas/          # Pydantic models
├── scripts/
│   └── export_openapi.py
└── tests/
```

## 🔧 Configuration

### pyproject.toml

```toml
[project]
name = "ams-backend"
version = "1.0.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.109.0",
    "uvicorn[standard]>=0.27.0",
    # ... more dependencies
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.3",
    "pytest-asyncio>=0.21.0",
    "pytest-cov>=4.1.0",
    "ruff>=0.1.0",  # Linting + Formatting (replaces Black + Flake8 + isort)
    "mypy>=1.7.0",
]
```

### .python-version

```
3.12
```

uv는 이 파일을 읽고 자동으로 Python 3.12를 사용합니다.

## 🐛 Troubleshooting

### uv 재설치

```bash
# Cache 정리
uv cache clean

# 가상환경 재생성
rm -rf .venv uv.lock
uv sync
```

### Python 버전 변경

```bash
# 특정 버전 사용
echo "3.13" > .python-version
uv sync

# 또는
uv venv --python 3.13
```

### 의존성 충돌

```bash
# Lockfile 재생성
rm uv.lock
uv sync

# 강제 업데이트
uv sync --upgrade
```

### Database Connection

```bash
# PostgreSQL 상태 확인
brew services list | grep postgresql  # macOS
systemctl status postgresql           # Linux

# PostgreSQL 재시작
brew services restart postgresql@15   # macOS
sudo systemctl restart postgresql     # Linux
```

### Redis Connection

```bash
# Redis 상태 확인
redis-cli ping  # Should return "PONG"

# Redis 시작
brew services start redis              # macOS
sudo systemctl start redis             # Linux
```

## 📚 Migration from pip/venv

기존 프로젝트에서 uv로 마이그레이션:

```bash
# 1. 기존 가상환경 제거
rm -rf venv/

# 2. uv 설치
curl -LsSf https://astral.sh/uv/install.sh | sh

# 3. 의존성 설치
uv sync

# 4. 테스트
uv run python -c "import fastapi; print('Success!')"
```

## 🎨 IDE Integration

### VS Code

`.vscode/settings.json`:

```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/apps/backend/.venv/bin/python",
  "python.terminal.activateEnvironment": false
}
```

uv run을 사용하므로 가상환경 자동 활성화 불필요!

### PyCharm

1. Settings → Project → Python Interpreter
2. Add Interpreter → Existing Environment
3. Select: `apps/backend/.venv/bin/python`

## 🚀 Performance Tips

### Use uv run for Everything

```bash
# ❌ Don't activate venv manually
source .venv/bin/activate
python src/main.py

# ✅ Use uv run (faster + automatic)
uv run python src/main.py
```

### Cache Optimization

```bash
# View cache size
uv cache dir

# Clean old cache (keeps recent)
uv cache prune

# Full clean (frees all space)
uv cache clean
```

## 🔐 Security Checklist

- [ ] Generate strong JWT secrets
- [ ] Set `APP_DEBUG=false` in production
- [ ] Use environment-specific `.env` files
- [ ] Enable HTTPS in production
- [ ] Configure proper CORS origins
- [ ] Use strong database passwords
- [ ] Review `uv.lock` before deployment

## 📖 Additional Resources

### Official Documentation

- [uv Documentation](https://docs.astral.sh/uv/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pydantic Documentation](https://docs.pydantic.dev/)

### Project Documentation

- [ADR-0005: Python Backend with Type Sync](../../docs/architecture/adr/0005-python-backend-with-type-sync.md)
- [Backend README](./README.md)
- [API Client README](../../packages/api-client/README.md)

## 💡 Pro Tips

### 1. Fast Dependency Updates

```bash
# Update single package
uv add --upgrade fastapi

# Update all packages
uv sync --upgrade
```

### 2. Multiple Python Versions

```bash
# Use specific version for one command
uv run --python 3.12 python script.py

# Switch project version
echo "3.12" > .python-version
uv sync
```

### 3. Debugging

```bash
# Verbose output
uv sync -v

# Very verbose (shows all operations)
uv sync -vv

# Check what would be installed
uv sync --dry-run
```

### 4. CI/CD Integration

```yaml
# GitHub Actions example
- name: Install uv
  run: curl -LsSf https://astral.sh/uv/install.sh | sh

- name: Install dependencies
  run: uv sync

- name: Run tests
  run: uv run pytest
```

## 🎯 Next Steps

1. ✅ Set up uv environment
2. ✅ Start development server
3. ⬜ Implement SQLAlchemy models
4. ⬜ Set up Alembic migrations
5. ⬜ Implement authentication
6. ⬜ Write tests
7. ⬜ Deploy to production

---

**Questions?** Check [uv documentation](https://docs.astral.sh/uv/) or [FastAPI docs](https://fastapi.tiangolo.com/).

**Loving uv?** It's 100% open source! ⭐️ [astral-sh/uv](https://github.com/astral-sh/uv)
