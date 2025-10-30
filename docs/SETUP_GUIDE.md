# SureSoft AMS - Setup Guide

## 📋 Overview

이 가이드는 Turborepo를 사용한 모노레포 프로젝트를 처음부터 설정하는 방법을 설명합니다.

## 🚀 Quick Start

### Option 1: Create-Turbo로 시작 (권장)

Turborepo 공식 템플릿으로 빠르게 시작:

```bash
npx create-turbo@latest
```

프롬프트에서:
- **Project name**: `suresoft-ams`
- **Package manager**: `pnpm`

### Option 2: 기존 프로젝트를 Turborepo로 변환

이미 프로젝트가 있다면:

```bash
# 1. Turborepo 설치
pnpm add turbo --save-dev

# 2. turbo.json 생성
npx @turbo/codemod migrate
```

## 📦 Manual Setup (이미 구조가 있는 경우)

### 1. Root Package.json 설정

```json
{
  "name": "@ams/root",
  "version": "1.0.0",
  "private": true,
  "packageManager": "pnpm@8.15.0",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "clean": "turbo run clean && rm -rf node_modules .turbo"
  },
  "devDependencies": {
    "turbo": "^1.11.0",
    "prettier": "^3.1.0",
    "typescript": "^5.3.0"
  }
}
```

### 2. pnpm Workspace 설정

**pnpm-workspace.yaml:**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### 3. Turborepo 설정

**turbo.json:**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    }
  }
}
```

### 4. 디렉토리 구조 생성

```bash
# Apps
mkdir -p apps/frontend apps/backend

# Packages
mkdir -p packages/shared-types/src
mkdir -p packages/ui/src
mkdir -p packages/utils/src
mkdir -p packages/config/{typescript,eslint}
mkdir -p packages/database/prisma
```

### 5. 공유 패키지 설정

#### @ams/shared-types

**packages/shared-types/package.json:**

```json
{
  "name": "@ams/shared-types",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist"
  },
  "devDependencies": {
    "@ams/config": "workspace:*",
    "typescript": "^5.3.0"
  }
}
```

**packages/shared-types/tsconfig.json:**

```json
{
  "extends": "@ams/config/typescript/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

#### @ams/config

**packages/config/package.json:**

```json
{
  "name": "@ams/config",
  "version": "1.0.0",
  "private": true,
  "exports": {
    "./typescript/base.json": "./typescript/base.json",
    "./typescript/react.json": "./typescript/react.json",
    "./typescript/node.json": "./typescript/node.json"
  }
}
```

**packages/config/typescript/base.json:**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

### 6. Frontend App 설정

**apps/frontend/package.json:**

```json
{
  "name": "@ams/frontend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@ams/shared-types": "workspace:*",
    "@ams/ui": "workspace:*",
    "@ams/utils": "workspace:*",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@ams/config": "workspace:*",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

**apps/frontend/tsconfig.json:**

```json
{
  "extends": "@ams/config/typescript/react.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [
    { "path": "../../packages/shared-types" }
  ]
}
```

### 7. Backend App 설정

> **Note**: 이 프로젝트는 **Python 3.12 + FastAPI**를 백엔드로 사용합니다.
> 자세한 설정은 다음 문서를 참조하세요:
> - [BACKEND_SETUP_UV.md](./BACKEND_SETUP_UV.md) (권장 - uv 사용)
> - [BACKEND_SETUP.md](./BACKEND_SETUP.md) (기본 pip 사용)
> - [ADR-0005: Python Backend with Type Sync](./architecture/adr/0005-python-backend-with-type-sync.md)

**apps/backend/pyproject.toml:**

```toml
[project]
name = "ams-backend"
version = "1.0.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.109.0",
    "uvicorn[standard]>=0.27.0",
    "sqlalchemy>=2.0.0",
    "psycopg[binary]>=3.1.0",
    "pydantic>=2.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.3",
    "pytest-asyncio>=0.21.0",
    "pytest-cov>=4.1.0",
    "ruff>=0.1.0",  # Linting + Formatting
    "mypy>=1.7.0",
]

[project.scripts]
dev = "uvicorn src.main:app --reload"
```

**apps/backend/.python-version:**

```
3.12
```

## 📥 Installation

### 1. 모든 의존성 설치

```bash
pnpm install
```

### 2. 공유 패키지 빌드

```bash
# 모든 패키지 빌드
pnpm build

# 특정 패키지만 빌드
pnpm build --filter=@ams/shared-types
```

### 3. 개발 서버 시작

```bash
# 모든 앱 동시 실행
pnpm dev

# 특정 앱만 실행
pnpm dev --filter=@ams/frontend
pnpm dev --filter=@ams/backend
```

## 🔧 Common Commands

### 패키지 관리

```bash
# 특정 앱에 의존성 추가
pnpm add axios --filter=@ams/frontend

# 공유 패키지 추가
pnpm add @ams/shared-types --filter=@ams/backend

# 전역 devDependencies 추가
pnpm add -D -w eslint

# 의존성 업데이트
pnpm update --filter=@ams/frontend
```

### 빌드 & 테스트

```bash
# 전체 빌드
pnpm build

# 변경된 패키지만 빌드
pnpm build --filter=[HEAD^1]

# 특정 패키지와 의존성 빌드
pnpm build --filter=@ams/frontend...

# 테스트 실행
pnpm test

# 린트 검사
pnpm lint
```

### Turborepo 유틸리티

```bash
# 새 workspace 생성
turbo gen workspace

# 기존 workspace 복사
turbo gen workspace --copy

# 캐시 정리
turbo prune
```

## 🎯 Best Practices

### 1. 패키지 네이밍

모든 내부 패키지는 `@ams/` 스코프 사용:

```json
{
  "name": "@ams/package-name"
}
```

### 2. Workspace Dependencies

pnpm을 사용하므로 `workspace:*` 사용:

```json
{
  "dependencies": {
    "@ams/shared-types": "workspace:*"
  }
}
```

### 3. TypeScript References

프로젝트 간 타입 체크를 위해 TypeScript References 사용:

```json
{
  "references": [
    { "path": "../../packages/shared-types" }
  ]
}
```

### 4. 빌드 순서

`turbo.json`의 `dependsOn`으로 자동 관리:

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"]  // 의존성 먼저 빌드
    }
  }
}
```

## 🐛 Troubleshooting

### pnpm-lock.yaml 충돌

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### 타입 오류

```bash
# TypeScript 캐시 정리
pnpm build --filter=@ams/shared-types
pnpm typecheck
```

### Turborepo 캐시 이슈

```bash
# 캐시 삭제
rm -rf .turbo node_modules/.cache

# 강제 재빌드
pnpm build --force
```

## 📚 Related Documents

- [ADR-0004: Turborepo Monorepo](./docs/architecture/adr/0004-turborepo-monorepo.md)
- [Project Structure](./docs/architecture/03-project-structure.md)
- [Turborepo 공식 문서](https://turbo.build/repo/docs)

## 📝 Next Steps

1. ✅ Turborepo 설치 및 설정
2. ✅ 공유 패키지 생성
3. ⬜ Frontend 앱 구현 (React + Vite)
4. ⬜ Backend 앱 구현 (NestJS)
5. ⬜ Prisma 데이터베이스 설정
6. ⬜ CI/CD 파이프라인 구성

---

**Created**: 2025-10-29
**Based on**: [Turborepo Official Documentation](https://turbo.build/repo/docs)
