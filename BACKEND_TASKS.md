# Backend Setup Tasks - SureSoft SAMS

백엔드 앱 생성 및 설정 작업 목록

---

## 📦 Phase 1: 프로젝트 초기화 ✅

### 1.1 Python 환경 설정
- [x] Python 3.12 설치 확인
- [x] uv 설치 확인
  ```bash
  curl -LsSf https://astral.sh/uv/install.sh | sh
  # 또는
  brew install uv
  ```
- [x] apps/backend 디렉토리 생성
- [x] .python-version 파일 생성 (내용: `3.12`)

### 1.2 pyproject.toml 설정
- [x] pyproject.toml 생성
- [x] 프로젝트 메타데이터 설정
  - [x] name: "sams-backend"
  - [x] version: "1.0.0"
  - [x] requires-python: ">=3.12"
- [x] 핵심 의존성 추가
  - [x] fastapi>=0.109.0
  - [x] uvicorn[standard]>=0.27.0
  - [x] pydantic>=2.0.0
  - [x] python-multipart>=0.0.6
- [x] 데이터베이스 의존성 추가
  - [x] sqlalchemy>=2.0.0
  - [x] psycopg[binary]>=3.1.0 (asyncpg 사용)
  - [x] greenlet>=3.0.3 (SQLAlchemy async 지원)
  - [x] alembic>=1.13.0
- [x] 인증 의존성 추가
  - [x] python-jose[cryptography]>=3.3.0
  - [x] passlib[bcrypt]>=1.7.4
- [x] 캐시/작업 큐
  - [x] redis>=4.5.0
  - [ ] celery>=5.3.0 (선택적)
- [x] 유틸리티
  - [x] qrcode[pil]>=7.4.0
  - [x] openpyxl>=3.1.0
  - [x] python-dotenv>=1.0.0 (pydantic-settings 사용)
  - [x] httpx>=0.24.0

### 1.3 개발 도구 설치
- [x] Dev dependencies 추가
  - [x] pytest>=7.4.3
  - [x] pytest-asyncio>=0.21.0
  - [x] pytest-cov>=4.1.0
  - [x] ruff>=0.1.0 (린팅 + 포맷팅 통합)
  - [x] mypy>=1.7.0
- [x] 의존성 설치 실행
  ```bash
  uv sync
  ```

### 1.4 스크립트 설정
- [x] pyproject.toml에 스크립트 추가
  ```toml
  [project.scripts]
  dev = "uvicorn src.main:app --reload"
  ```
- [x] package.json 생성 (Turborepo 통합)
  ```json
  {
    "name": "@sams/backend",
    "version": "1.0.0",
    "private": true,
    "scripts": {
      "dev": "uv run uvicorn src.main:app --reload",
      "build": "uv sync",
      "lint": "uv run ruff check src tests",
      "lint:fix": "uv run ruff check --fix src tests",
      "format": "uv run ruff format src tests",
      "format:check": "uv run ruff format --check src tests",
      "typecheck": "uv run mypy src",
      "test": "uv run pytest",
      "db:migrate": "uv run alembic upgrade head",
      "db:migrate:create": "uv run alembic revision --autogenerate -m",
      "generate:openapi": "uv run python scripts/export_openapi.py"
    }
  }
  ```

---

## ⚙️ Phase 2: 프로젝트 구조 생성 ✅

### 2.1 디렉토리 구조 생성
```
apps/backend/
├── .python-version
├── pyproject.toml
├── uv.lock
├── .env.example
├── .gitignore
├── src/
│   ├── __init__.py
│   ├── main.py              # FastAPI 앱 진입점
│   ├── config.py            # 설정 관리
│   ├── database.py          # DB 연결
│   ├── api/
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py     # 라우터 통합
│   │       └── endpoints/
│   │           ├── __init__.py
│   │           ├── auth.py
│   │           ├── users.py
│   │           ├── assets.py
│   │           ├── categories.py
│   │           ├── locations.py
│   │           ├── workflows.py
│   │           ├── qrcode.py
│   │           └── statistics.py
│   ├── models/              # SQLAlchemy ORM 모델
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── asset.py
│   │   ├── category.py
│   │   ├── location.py
│   │   ├── workflow.py
│   │   └── asset_history.py
│   ├── schemas/             # Pydantic 스키마
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── asset.py
│   │   ├── auth.py
│   │   └── common.py
│   ├── services/            # 비즈니스 로직
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── asset_service.py
│   │   ├── workflow_service.py
│   │   └── qrcode_service.py
│   ├── repositories/        # 데이터 접근 계층
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── user_repository.py
│   │   └── asset_repository.py
│   ├── middlewares/         # 미들웨어
│   │   ├── __init__.py
│   │   ├── cors.py
│   │   ├── logging.py
│   │   └── auth.py
│   ├── exceptions/          # 커스텀 예외
│   │   ├── __init__.py
│   │   └── http_exceptions.py
│   └── utils/               # 유틸리티
│       ├── __init__.py
│       ├── security.py      # JWT, 비밀번호 해싱
│       ├── validators.py
│       └── helpers.py
├── alembic/                 # 마이그레이션
│   ├── versions/
│   ├── env.py
│   └── script.py.mako
├── scripts/
│   ├── export_openapi.py    # OpenAPI 스펙 생성
│   ├── seed.py              # 시드 데이터
│   └── migrate_excel.py     # Excel 데이터 마이그레이션
└── tests/
    ├── __init__.py
    ├── conftest.py
    ├── test_auth.py
    └── test_assets.py
```

- [x] 모든 디렉토리 생성
- [x] 각 디렉토리에 `__init__.py` 생성

### 2.2 .gitignore 설정
- [x] .gitignore 파일 생성
  ```
  # Python
  __pycache__/
  *.py[cod]
  *$py.class
  *.so
  .Python

  # Virtual Environment
  .venv/
  venv/
  ENV/

  # uv
  uv.lock

  # Environment
  .env
  .env.local

  # Database
  *.db
  *.sqlite

  # IDEs
  .vscode/
  .idea/
  *.swp

  # Testing
  .pytest_cache/
  .coverage
  htmlcov/

  # Build
  dist/
  build/
  *.egg-info/
  ```

### 2.3 환경 변수 템플릿
- [x] .env.example 파일 생성
  ```bash
  # Application
  APP_NAME=SureSoft SAMS
  APP_VERSION=1.0.0
  APP_DEBUG=true
  APP_ENVIRONMENT=development
  LOG_LEVEL=INFO

  # Server
  HOST=0.0.0.0
  PORT=8000

  # Database
  DATABASE_URL=postgresql://sams:sams@localhost:5432/sams

  # Redis
  REDIS_URL=redis://localhost:6379/0

  # JWT
  JWT_ACCESS_SECRET=your-secret-key-here-min-32-chars
  JWT_REFRESH_SECRET=your-refresh-secret-key-here-min-32-chars
  JWT_ALGORITHM=HS256
  JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
  JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

  # CORS
  CORS_ORIGINS=http://localhost:5173,http://localhost:3000

  # Email (선택적)
  SMTP_SERVER=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=
  SMTP_PASSWORD=
  SMTP_FROM_EMAIL=noreply@suresoft.com

  # Object Storage (선택적)
  MINIO_URL=http://localhost:9000
  MINIO_ACCESS_KEY=minioadmin
  MINIO_SECRET_KEY=minioadmin
  MINIO_BUCKET=sams-assets
  ```

---

## 🔧 Phase 3: 핵심 설정 파일 생성 ✅

### 3.1 설정 관리 (src/config.py)
- [x] Pydantic Settings 기반 설정 클래스 생성
- [x] 환경 변수 로드
- [x] 설정 검증
  ```python
  from pydantic_settings import BaseSettings

  class Settings(BaseSettings):
      app_name: str = "SureSoft SAMS"
      app_version: str = "1.0.0"
      debug: bool = False

      database_url: str
      redis_url: str

      jwt_access_secret: str
      jwt_refresh_secret: str
      jwt_algorithm: str = "HS256"
      jwt_access_token_expire_minutes: int = 15

      class Config:
          env_file = ".env"

  settings = Settings()
  ```

### 3.2 데이터베이스 설정 (src/database.py)
- [x] SQLAlchemy Engine 생성
- [x] SessionLocal 생성
- [x] Base 클래스 정의
- [x] get_db() 의존성 함수
  ```python
  from sqlalchemy import create_engine
  from sqlalchemy.ext.declarative import declarative_base
  from sqlalchemy.orm import sessionmaker

  engine = create_engine(settings.database_url)
  SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
  Base = declarative_base()

  def get_db():
      db = SessionLocal()
      try:
          yield db
      finally:
          db.close()
  ```

### 3.3 FastAPI 앱 생성 (src/main.py)
- [x] FastAPI 인스턴스 생성
- [x] CORS 미들웨어 설정
- [x] 라우터 등록
- [x] 헬스 체크 엔드포인트
- [x] OpenAPI 문서 설정
  ```python
  from fastapi import FastAPI
  from fastapi.middleware.cors import CORSMiddleware
  from src.api.v1.router import api_router
  from src.config import settings

  app = FastAPI(
      title=settings.app_name,
      version=settings.app_version,
      docs_url="/docs",
      redoc_url="/redoc",
  )

  # CORS
  app.add_middleware(
      CORSMiddleware,
      allow_origins=settings.cors_origins,
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )

  # Health check
  @app.get("/health")
  async def health_check():
      return {"status": "ok"}

  # API Router
  app.include_router(api_router, prefix="/api/v1")
  ```

---

## 🗄️ Phase 4: 데이터베이스 모델 생성 ✅

### 4.1 사용자 모델 (src/models/user.py)
- [x] User 모델 생성
- [x] 필드: id, email, name, password_hash, role, department_id
- [x] is_active, created_at, updated_at
- [x] 관계: department, assets (소유 자산)

### 4.2 자산 모델 (src/models/asset.py)
- [x] Asset 모델 생성
- [x] 필드: id, asset_number, name, category_id, model, serial_number
- [x] status, grade, current_user_id, location_id
- [x] purchase_price, purchase_date, supplier
- [x] qr_code, notes
- [x] created_at, updated_at, deleted_at (소프트 삭제)
- [x] 관계: category, location, current_user, history

### 4.3 카테고리 모델 (src/models/category.py)
- [x] Category 모델 생성
- [x] 필드: id, name, code, description
- [x] is_active, created_at

### 4.4 위치 모델 (src/models/location.py)
- [x] Location 모델 생성
- [x] 필드: id, name, code, site, building, floor, room
- [x] is_active, created_at

### 4.5 워크플로우 모델 (src/models/workflow.py)
- [x] Workflow 모델 생성
- [x] 필드: id, type (checkout/checkin), status
- [x] asset_id, requester_id, assignee_id
- [x] requested_date, expected_return_date
- [x] reason, reject_reason
- [x] approved_at, approved_by, created_at, updated_at

### 4.6 자산 이력 모델 (src/models/asset_history.py)
- [x] AssetHistory 모델 생성
- [x] 필드: id, asset_id, action, from_user_id, to_user_id
- [x] from_location_id, to_location_id
- [x] old_values (JSONB), new_values (JSONB)
- [x] created_by, created_at

### 4.7 Enum 타입 정의
- [x] AssetStatus Enum (available, assigned, maintenance, disposed)
- [x] AssetGrade Enum (A, B, C)
- [x] UserRole Enum (admin, manager, employee)
- [x] WorkflowType Enum (checkout, checkin)
- [x] WorkflowStatus Enum (pending, approved, rejected, cancelled)

---

## 📝 Phase 5: Pydantic 스키마 생성 ✅

### 5.1 공통 스키마 (src/schemas/common.py)
- [x] PaginationParams (skip, limit)
- [x] PaginatedResponse (items, total, page, pages)
- [x] MessageResponse (message)
- [x] ErrorResponse (detail, code)

### 5.2 사용자 스키마 (src/schemas/user.py)
- [x] User (email, name, role)
- [x] CreateUserRequest (+ password)
- [x] UpdateUserRequest (선택적 필드)
- [x] UserResponse (비밀번호 제외)

### 5.3 자산 스키마 (src/schemas/asset.py)
- [x] Asset (name, category_id, model 등)
- [x] CreateAssetRequest
- [x] UpdateAssetRequest
- [x] AssetListResponse (페이지네이션 포함)
- [x] AssetFilterParams (검색, 필터링)

### 5.4 인증 스키마 (src/schemas/auth.py)
- [x] LoginRequest (email, password)
- [x] LoginResponse (access_token, refresh_token, token_type)
- [x] TokenPayload (sub, exp, role)
- [x] RefreshTokenRequest (refresh_token)
- [x] RegisterRequest

### 5.5 워크플로우 스키마 (src/schemas/workflow.py)
- [x] Workflow
- [x] CreateWorkflowRequest (asset_id, reason, expected_return_date)
- [x] UpdateWorkflowRequest (status, reject_reason)
- [x] ApprovalRequest (comment)

### 5.6 카테고리 스키마 (src/schemas/category.py)
- [x] Category
- [x] CreateCategoryRequest
- [x] UpdateCategoryRequest

### 5.7 위치 스키마 (src/schemas/location.py)
- [x] Location
- [x] CreateLocationRequest
- [x] UpdateLocationRequest

---

## 🔐 Phase 6: 인증/보안 구현 ✅

### 6.1 보안 유틸리티 (src/utils/security.py)
- [x] 비밀번호 해싱 함수 (bcrypt)
  ```python
  from passlib.context import CryptContext

  pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

  def hash_password(password: str) -> str:
      return pwd_context.hash(password)

  def verify_password(plain_password: str, hashed_password: str) -> bool:
      return pwd_context.verify(plain_password, hashed_password)
  ```
- [x] JWT 토큰 생성 함수
  ```python
  from jose import jwt
  from datetime import datetime, timedelta

  def create_access_token(data: dict) -> str:
      to_encode = data.copy()
      expire = datetime.utcnow() + timedelta(minutes=settings.jwt_access_token_expire_minutes)
      to_encode.update({"exp": expire})
      return jwt.encode(to_encode, settings.jwt_access_secret, algorithm=settings.jwt_algorithm)
  ```
- [x] JWT 토큰 검증 함수
- [x] Refresh 토큰 생성/검증

### 6.2 인증 의존성 (src/middlewares/auth.py)
- [x] get_current_user() 의존성 함수
  ```python
  from fastapi import Depends, HTTPException, status
  from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

  security = HTTPBearer()

  async def get_current_user(
      credentials: HTTPAuthorizationCredentials = Depends(security),
      db: Session = Depends(get_db)
  ) -> User:
      token = credentials.credentials
      # JWT 검증 및 사용자 조회
      ...
  ```
- [x] require_role() 데코레이터
  ```python
  def require_role(*roles: str):
      def role_checker(current_user: User = Depends(get_current_user)):
          if current_user.role not in roles:
              raise HTTPException(status_code=403, detail="Insufficient permissions")
          return current_user
      return role_checker
  ```

### 6.3 인증 서비스 (src/services/auth_service.py)
- [x] login() - 로그인 처리
- [x] refresh_token() - 토큰 갱신
- [x] change_password() - 비밀번호 변경
- [ ] verify_email() - 이메일 검증 (선택적)

---

## 🌐 Phase 7: API 엔드포인트 구현 ✅

### 7.1 인증 API (src/api/v1/endpoints/auth.py) ✅
- [x] POST /auth/login - 로그인
- [x] POST /auth/refresh - 토큰 갱신
- [x] POST /auth/logout - 로그아웃
- [x] GET /auth/me - 현재 사용자 정보
- [x] PUT /auth/change-password - 비밀번호 변경
- [x] POST /auth/register - 회원가입 (추가 구현)

### 7.2 사용자 API (src/api/v1/endpoints/users.py) ✅
- [x] GET /users - 사용자 목록 (Admin)
- [x] GET /users/:id - 사용자 상세
- [x] POST /users - 사용자 생성 (Admin)
- [x] PUT /users/:id - 사용자 수정 (Admin)
- [x] DELETE /users/:id - 사용자 삭제 (Admin)
- [x] PATCH /users/:id/role - 역할 변경 (Admin)

### 7.3 자산 API (src/api/v1/endpoints/assets.py) ✅
- [x] GET /assets - 자산 목록 (검색, 필터링, 페이지네이션)
  - [x] 쿼리 파라미터: skip, limit, search, category_id, status, location_id, grade
  - [x] 정렬: sort_by, sort_order
- [x] GET /assets/:id - 자산 상세
- [x] GET /assets/by-number/:assetNumber - 자산번호로 조회 (QR 스캔용, MVP)
- [x] POST /assets - 자산 생성 (Admin/Manager)
- [x] PUT /assets/:id - 자산 수정 (Admin/Manager)
- [x] DELETE /assets/:id - 자산 삭제 (소프트 삭제, Admin)
- [x] GET /assets/:id/history - 자산 이력 조회
- [x] PATCH /assets/:id/status - 상태 변경
- [x] PATCH /assets/:id/location - 위치 변경
- [x] PATCH /assets/:id/user - 사용자 배정/회수

### 7.4 카테고리 API (src/api/v1/endpoints/categories.py) ✅
- [x] GET /categories - 카테고리 목록
- [x] GET /categories/:id - 카테고리 상세
- [x] POST /categories - 카테고리 생성 (Admin)
- [x] PUT /categories/:id - 카테고리 수정 (Admin)
- [x] DELETE /categories/:id - 카테고리 삭제 (Admin)

### 7.5 위치 API (src/api/v1/endpoints/locations.py) ✅
- [x] GET /locations - 위치 목록
- [x] GET /locations/:id - 위치 상세
- [x] POST /locations - 위치 생성 (Admin)
- [x] PUT /locations/:id - 위치 수정 (Admin)
- [x] DELETE /locations/:id - 위치 삭제 (Admin)

### 7.6 워크플로우 API (src/api/v1/endpoints/workflows.py) ✅
- [x] GET /workflows - 요청 목록 (본인 또는 담당 요청)
- [x] GET /workflows/:id - 요청 상세
- [x] POST /workflows/checkout - 반출 요청
- [x] POST /workflows/checkin - 반납 요청
- [x] PATCH /workflows/:id/approve - 요청 승인 (Manager/Admin)
- [x] PATCH /workflows/:id/reject - 요청 거부 (Manager/Admin)
- [x] PATCH /workflows/:id/cancel - 요청 취소

### 7.7 QR코드 기능 (MVP: assets.py에 통합) ✅
- [x] GET /assets/by-number/:assetNumber - 자산번호로 조회 (QR 스캔용)
  - QR 스캔 결과(예: "14-2022-23")로 자산 정보 조회
  - 대여/반납 화면 연결용
  - 기존 QR 코드 활용 (새로 생성하지 않음)

> **Note**: QR 생성 기능은 MVP 범위 밖 (Phase 2+)
> - QR 이미지 생성/재발급 기능은 추후 구현
> - 현재는 기존에 부착된 QR 코드 스캔만 지원

### 7.8 통계 API (src/api/v1/endpoints/statistics.py) ✅
- [x] GET /statistics/overview - 대시보드 요약
- [x] GET /statistics/assets-by-category - 카테고리별 통계
- [x] GET /statistics/assets-by-location - 위치별 통계
- [x] GET /statistics/assets-by-status - 상태별 통계
- [x] GET /statistics/assets-by-grade - 등급별 통계
- [x] GET /statistics/workflow-stats - 워크플로우 통계

### 7.9 라우터 통합 (src/api/v1/router.py) ✅
- [x] 모든 엔드포인트 라우터 import
- [x] api_router에 include_router로 등록
- [x] 각 라우터에 적절한 prefix와 tags 설정

---

## 💼 Phase 8: 비즈니스 로직 구현 ✅

### 8.1 자산 서비스 (src/services/asset_service.py) ✅
- [x] create_asset() - 자산 생성 로직
  - [x] 자산 번호 자동 생성 (YY-CATEGORY-SEQ)
  - [x] 등급 자동 계산 (구매 연도 기반)
  - [x] 이력 생성
- [x] update_asset() - 자산 수정 로직
  - [x] 변경 사항 추적
  - [x] 이력 기록
- [x] delete_asset() - 소프트 삭제
- [x] assign_asset() - 자산 배정
- [x] unassign_asset() - 자산 회수
- [x] get_asset_history() - 이력 조회

### 8.2 워크플로우 서비스 (src/services/workflow_service.py) ✅
- [x] create_checkout_request() - 반출 요청 생성
- [x] create_checkin_request() - 반납 요청 생성
- [x] approve_workflow() - 요청 승인
  - [x] 자산 상태 변경
  - [x] 사용자 배정
  - [ ] 이메일 알림 (선택적)
- [x] reject_workflow() - 요청 거부
- [x] cancel_workflow() - 요청 취소
- [x] get_user_workflows() - 사용자 요청 목록

### 8.3 QR코드 서비스 (MVP 범위 밖 - Phase 2+)

> **MVP에서는 구현하지 않음**
> - 기존 QR 코드 활용 (자산번호로 조회만 지원)
> - GET /assets/by-number/:assetNumber로 충분

**Phase 2+ 구현 예정**:
- [ ] generate_qr_code() - QR 이미지 재발급
- [ ] generate_bulk_qr_codes() - 대량 재발급
- [ ] generate_printable_label() - 인쇄용 라벨 생성

### 8.4 통계 서비스 (src/services/statistics_service.py) ✅
- [x] get_dashboard_overview() - 대시보드 통계
  - [x] 총 자산 수
  - [x] 상태별 자산 수
  - [x] 최근 활동
  - [x] 대기 중인 요청 수
- [x] get_assets_by_category() - 카테고리별 통계
- [x] get_assets_by_location() - 위치별 통계
- [x] get_workflow_statistics() - 워크플로우 통계

---

## 🗃️ Phase 9: Repository 패턴 구현 ✅

### 9.1 Base Repository (src/repositories/base.py) ✅
- [x] CRUDBase 클래스 생성 (Python 3.12 type parameter syntax 사용)
- [x] get() - Get single record by ID
- [x] get_multi() - Get multiple records with pagination
- [x] create() - Create new record
- [x] update() - Update existing record (supports both dict and Pydantic schema)
- [x] delete() - Delete record (hard delete)
- [x] count() - Count total records
- [x] exists() - Check if record exists

### 9.2 Asset Repository (src/repositories/asset_repository.py) ✅
- [x] AssetRepository 클래스 (CRUDBase 상속)
- [x] get_by_asset_tag() - 자산 태그로 조회 (asset_number → asset_tag)
- [x] get_by_qr_code() - QR 코드로 조회
- [x] get_by_user() - 사용자별 자산 조회
- [x] search() - 검색 기능 (name, asset_tag, model, serial_number, manufacturer)
- [x] filter_assets() - 필터링 기능 (status, category, location, assignee, grade, search)
- [x] get_with_pagination() - 페이지네이션 (with total count)
- [x] get_by_category() - 카테고리별 조회
- [x] get_by_location() - 위치별 조회
- [x] soft_delete() - 소프트 삭제 (deleted_at 설정)
- [x] restore() - 소프트 삭제 복원
- [x] count_by_status() - 상태별 개수
- [x] count_by_category() - 카테고리별 개수
- [x] get_available_assets() - 사용 가능한 자산 조회

### 9.3 User Repository (src/repositories/user_repository.py) ✅
- [x] UserRepository 클래스 (CRUDBase 상속)
- [x] get_by_email() - 이메일로 조회
- [x] authenticate() - 인증 확인 (password verification 포함)
- [x] create_with_password() - 비밀번호 해싱하여 사용자 생성
- [x] update_password() - 비밀번호 업데이트
- [x] get_by_role() - 역할별 조회
- [x] get_active_users() - 활성 사용자 조회
- [x] deactivate() - 사용자 비활성화
- [x] activate() - 사용자 활성화
- [x] verify_email() - 이메일 검증
- [x] count_by_role() - 역할별 개수
- [x] search_by_name_or_email() - 이름/이메일로 검색
- [x] exists_by_email() - 이메일 존재 여부 확인
- [x] update_last_login() - 마지막 로그인 시간 업데이트

---

## 🔄 Phase 10: 데이터베이스 마이그레이션 ✅

### 10.1 Alembic 초기화
- [x] Alembic 초기화
  ```bash
  uv run alembic init alembic
  ```
- [x] alembic.ini 설정
- [x] alembic/env.py 수정
  - [x] SQLAlchemy Base import (async support)
  - [x] target_metadata 설정

### 10.2 초기 마이그레이션 생성
- [x] 초기 테이블 마이그레이션 생성
  ```bash
  uv run alembic revision --autogenerate -m "Initial migration with all models"
  ```
- [x] 마이그레이션 파일 검토 (6개 테이블: users, categories, locations, assets, workflows, asset_history)
- [x] 마이그레이션 적용
  ```bash
  uv run alembic upgrade head
  ```

### 10.3 시드 데이터 (scripts/seed.py)
- [x] 관리자 계정 생성 (admin@suresoft.com, manager@suresoft.com, employee@suresoft.com)
- [x] 기본 카테고리 생성 (10개: 노트북, 데스크탑, 모니터, 네트워크장비, 소프트웨어, 키보드, 마우스, 서버장비, 주변기기, 기타)
- [x] 기본 위치 생성 (16개: 대전/판교, 본사/연구소, 층별 위치)
- [x] 시드 스크립트 실행 명령어 추가 (idempotent 설계)
- [x] Docker Compose로 PostgreSQL/Redis 구성
- [x] bcrypt 비밀번호 해싱 이슈 해결 (72-byte limit)
- [x] Pydantic schema from_attributes 설정 (User, Category, Location)
- [x] API 엔드포인트 테스트 완료 (test_api.py)

---

## 📤 Phase 11: OpenAPI 타입 동기화 ✅

### 11.1 OpenAPI 스펙 생성 (scripts/export_openapi.py)
- [x] FastAPI 앱에서 OpenAPI JSON 생성 스크립트 작성
  ```python
  import json
  from src.main import app

  def export_openapi():
      openapi_schema = app.openapi()
      output_path = "../../packages/api-client/openapi.json"
      with open(output_path, "w") as f:
          json.dump(openapi_schema, f, indent=2)
      print(f"OpenAPI schema exported to {output_path}")

  if __name__ == "__main__":
      export_openapi()
  ```
- [x] package.json에 스크립트 추가
  ```json
  "generate:openapi": "uv run python scripts/export_openapi.py"
  ```

### 11.2 Turborepo 통합
- [x] turbo.json에 의존성 설정
  ```json
  {
    "pipeline": {
      "generate:openapi": {
        "dependsOn": ["^build"],
        "outputs": ["../../packages/api-client/openapi.json"]
      }
    }
  }
  ```

---

## 🧪 Phase 12: 테스트 작성

### 12.1 테스트 설정 (tests/conftest.py)
- [ ] 테스트 DB 설정 (SQLite in-memory)
- [ ] pytest fixtures
  - [ ] test_db - 테스트 데이터베이스
  - [ ] test_client - FastAPI TestClient
  - [ ] test_user - 테스트 사용자
  - [ ] auth_headers - 인증 헤더

### 12.2 인증 테스트 (tests/test_auth.py)
- [ ] test_login_success() - 로그인 성공
- [ ] test_login_invalid_credentials() - 잘못된 자격증명
- [ ] test_refresh_token() - 토큰 갱신
- [ ] test_get_current_user() - 현재 사용자 조회
- [ ] test_unauthorized() - 인증 없이 접근

### 12.3 자산 API 테스트 (tests/test_assets.py)
- [ ] test_create_asset() - 자산 생성
- [ ] test_get_asset() - 자산 조회
- [ ] test_update_asset() - 자산 수정
- [ ] test_delete_asset() - 자산 삭제
- [ ] test_list_assets() - 자산 목록
- [ ] test_search_assets() - 자산 검색
- [ ] test_filter_assets() - 자산 필터링

### 12.4 권한 테스트
- [ ] test_admin_only_endpoints() - Admin 전용 엔드포인트
- [ ] test_manager_permissions() - Manager 권한
- [ ] test_employee_permissions() - Employee 권한

### 12.5 테스트 커버리지
- [ ] pytest-cov 실행
  ```bash
  uv run pytest --cov=src --cov-report=html
  ```
- [ ] 커버리지 80% 이상 목표

---

## 📊 Phase 13: 로깅 & 모니터링

### 13.1 로깅 설정
- [ ] Python logging 설정
- [ ] 로그 포맷 설정 (JSON 형식)
- [ ] 로그 레벨별 파일 분리 (선택적)
- [ ] 요청/응답 로깅 미들웨어

### 13.2 에러 핸들링
- [ ] 커스텀 예외 클래스 (src/exceptions/http_exceptions.py)
  - [ ] NotFoundException
  - [ ] UnauthorizedException
  - [ ] ForbiddenException
  - [ ] ValidationException
- [ ] 전역 예외 핸들러
  ```python
  from fastapi import Request
  from fastapi.responses import JSONResponse

  @app.exception_handler(NotFoundException)
  async def not_found_exception_handler(request: Request, exc: NotFoundException):
      return JSONResponse(
          status_code=404,
          content={"detail": exc.detail}
      )
  ```

### 13.3 감사 로그
- [ ] 자산 변경 이력 자동 기록
- [ ] 사용자 활동 로그
- [ ] API 접근 로그

---

## 🔒 Phase 14: 보안 강화

### 14.1 Rate Limiting
- [ ] slowapi 설치 및 설정 (선택적)
  ```python
  from slowapi import Limiter, _rate_limit_exceeded_handler
  from slowapi.util import get_remote_address

  limiter = Limiter(key_func=get_remote_address)
  app.state.limiter = limiter
  app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
  ```
- [ ] 로그인 엔드포인트에 rate limit 적용
  ```python
  @router.post("/login")
  @limiter.limit("5/minute")
  async def login(request: Request, ...):
      ...
  ```

### 14.2 입력 검증
- [ ] Pydantic validator로 입력 검증
- [ ] SQL Injection 방지 (SQLAlchemy ORM 사용)
- [ ] XSS 방지 (입력 sanitization)

### 14.3 HTTPS 설정
- [ ] 프로덕션 환경에서 HTTPS 강제
- [ ] HSTS 헤더 설정

### 14.4 비밀 정보 관리
- [ ] .env 파일 암호화 (선택적)
- [ ] AWS Secrets Manager / Vault 연동 (프로덕션)

---

## 🚀 Phase 15: 배포 준비

### 15.1 Docker 설정
- [ ] Dockerfile 작성
  ```dockerfile
  FROM python:3.12-slim

  WORKDIR /app

  # Install uv
  RUN pip install uv

  # Copy dependency files
  COPY pyproject.toml .
  COPY uv.lock .

  # Install dependencies
  RUN uv sync --no-dev

  # Copy application
  COPY src ./src

  EXPOSE 8000

  CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
  ```
- [ ] .dockerignore 작성
  ```
  __pycache__
  *.pyc
  .venv
  .env
  tests
  .git
  ```

### 15.2 Docker Compose (개발 환경)
- [ ] docker-compose.yml 작성
  ```yaml
  version: '3.8'

  services:
    backend:
      build: .
      ports:
        - "8000:8000"
      environment:
        - DATABASE_URL=postgresql://sams:sams@postgres:5432/sams
        - REDIS_URL=redis://redis:6379/0
      depends_on:
        - postgres
        - redis

    postgres:
      image: postgres:15
      environment:
        POSTGRES_USER: sams
        POSTGRES_PASSWORD: sams
        POSTGRES_DB: sams
      ports:
        - "5432:5432"
      volumes:
        - postgres_data:/var/lib/postgresql/data

    redis:
      image: redis:7
      ports:
        - "6379:6379"

  volumes:
    postgres_data:
  ```

### 15.3 환경별 설정
- [ ] .env.development
- [ ] .env.staging (선택적)
- [ ] .env.production
- [ ] 환경 변수 검증

### 15.4 CI/CD (GitHub Actions)
- [ ] .github/workflows/backend.yml 작성
  ```yaml
  name: Backend CI

  on:
    push:
      branches: [main]
      paths:
        - 'apps/backend/**'
    pull_request:
      branches: [main]
      paths:
        - 'apps/backend/**'

  jobs:
    test:
      runs-on: ubuntu-latest

      steps:
        - uses: actions/checkout@v3

        - name: Install uv
          run: curl -LsSf https://astral.sh/uv/install.sh | sh

        - name: Install dependencies
          run: uv sync
          working-directory: apps/backend

        - name: Run linters and format check
          run: |
            uv run ruff check src tests
            uv run ruff format --check src tests
            uv run mypy src
          working-directory: apps/backend

        - name: Run tests
          run: uv run pytest --cov=src
          working-directory: apps/backend
  ```

---

## 📚 Phase 16: 문서화

### 16.1 API 문서
- [ ] Swagger UI 활성화 (/docs)
- [ ] ReDoc 활성화 (/redoc)
- [ ] OpenAPI 스펙 설명 추가
- [ ] 예제 요청/응답 추가

### 16.2 README 작성
- [ ] apps/backend/README.md 작성
  - [ ] 프로젝트 소개
  - [ ] 설치 방법
  - [ ] 실행 방법
  - [ ] API 문서 링크
  - [ ] 환경 변수 설명

### 16.3 코드 주석
- [ ] 주요 함수에 docstring 추가
- [ ] 복잡한 로직 설명 주석

---

## 📋 Phase 17: 최종 점검

### 17.1 코드 품질
- [ ] Ruff 경고 해결
- [ ] Ruff 포맷팅 적용
- [ ] mypy 타입 에러 해결
- [ ] 불필요한 import 제거 (Ruff 자동 처리)
- [ ] 사용하지 않는 코드 제거

### 17.2 기능 테스트
- [ ] 로그인/로그아웃
- [ ] 자산 CRUD
- [ ] 워크플로우 (반출/반납)
- [ ] 권한별 접근 제어
- [ ] QR 코드 생성
- [ ] 통계 조회
- [ ] 검색/필터링
- [ ] 페이지네이션

### 17.3 성능 테스트
- [ ] 대용량 데이터 조회 테스트
- [ ] 동시 요청 처리 테스트
- [ ] 데이터베이스 쿼리 최적화
- [ ] 인덱스 추가

### 17.4 보안 점검
- [ ] JWT 토큰 만료 확인
- [ ] 비밀번호 해싱 확인
- [ ] CORS 설정 확인
- [ ] 민감 정보 로깅 제거
- [ ] SQL Injection 테스트
- [ ] 권한 우회 테스트

---

## 🎉 완료!

모든 체크리스트 완료 후:
- [ ] Turborepo 통합 확인 (`pnpm dev` from root)
- [ ] OpenAPI 타입 동기화 확인
- [ ] 프론트엔드와 연동 테스트
- [ ] Git commit & push
- [ ] 팀원과 공유

---

## 📊 Excel 데이터 마이그레이션 (추가 작업)

### Excel 마이그레이션 스크립트 (scripts/migrate_excel.py)
- [ ] openpyxl로 Excel 파일 읽기
- [ ] 데이터 정제 (중복 제거, 형식 통일)
- [ ] 카테고리/위치 마스터 데이터 생성
- [ ] 자산 데이터 배치 INSERT
- [ ] 이력 데이터 생성
- [ ] 실행 스크립트
  ```bash
  uv run python scripts/migrate_excel.py \
    --file "자산관리 데이터(슈커톤).xlsx" \
    --overwrite false
  ```

---

**예상 소요 시간**: 24-30시간 (3-4일)
**우선순위**: Phase 1-8 필수, Phase 9-17 단계적 진행

**생성일**: 2025-10-29
**프로젝트**: SureSoft SAMS (슈커톤 해커톤)
**기술 스택**: Python 3.12 + FastAPI + PostgreSQL + Redis + SQLAlchemy + uv
