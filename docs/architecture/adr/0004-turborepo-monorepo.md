# ADR-0004: Turborepo Monorepo Architecture

## Status
**Status**: Accepted

## Context

자산관리 시스템(SAMS)은 프론트엔드(React)와 백엔드(NestJS)로 구성됩니다. 두 애플리케이션 간에 다음과 같은 공유 요구사항이 있습니다:

- **타입 정의**: API 요청/응답 타입, DTO, Enum 등
- **유틸리티 함수**: 날짜 포맷, 유효성 검증, 상수 등
- **비즈니스 로직**: 자산 등급 계산, 권한 검증 등
- **설정 파일**: ESLint, TypeScript, Prettier 등

### Current Pain Points
- 타입 정의 중복 (frontend/backend에 동일 타입 작성)
- 코드 동기화 어려움 (API 변경 시 양쪽 수동 업데이트)
- 빌드 및 테스트 비효율 (전체 재빌드)
- 의존성 관리 복잡도 (각 프로젝트별 package.json)

### Requirements
- 코드 공유 및 재사용성
- 빌드 캐싱 및 최적화
- 개발 경험 향상 (DX)
- CI/CD 파이프라인 효율화
- 타입 안정성 보장

## Decision

**Turborepo**를 사용한 모노레포 아키텍처를 채택합니다.

### Monorepo Structure

```
suresoft-sams/
├── apps/
│   ├── frontend/          # React 프론트엔드
│   └── backend/           # NestJS 백엔드
├── packages/
│   ├── shared-types/      # 공유 타입 정의
│   ├── ui/                # 공유 UI 컴포넌트
│   ├── utils/             # 공유 유틸리티
│   ├── config/            # 공유 설정 (ESLint, TS)
│   └── database/          # Prisma 스키마 및 클라이언트
├── turbo.json             # Turborepo 설정
├── package.json           # Root package.json
└── pnpm-workspace.yaml    # pnpm workspace 설정
```

### Package Manager: pnpm

pnpm을 선택한 이유:
- **디스크 공간 효율**: 중복 제거를 통한 저장 공간 절약
- **빠른 설치**: npm/yarn 대비 2-3배 빠름
- **엄격한 의존성**: phantom dependencies 방지
- **Turborepo 최적화**: 공식 권장 패키지 매니저

## Consequences

### Positive

#### ✅ 코드 공유 및 재사용
```typescript
// packages/shared-types/src/asset.types.ts
export interface Asset {
  id: string;
  assetTag: string;
  model: string;
  status: AssetStatus;
  // ...
}

// apps/frontend/src/services/api.ts
import { Asset } from '@sams/shared-types';

// apps/backend/src/modules/assets/entities/asset.entity.ts
import { Asset } from '@sams/shared-types';
```

#### ✅ 빌드 캐싱 및 병렬 처리
- **Remote Caching**: 팀 전체가 빌드 결과 공유
- **Parallel Execution**: 독립적인 태스크 동시 실행
- **Incremental Builds**: 변경된 패키지만 재빌드

```bash
# Turborepo가 자동으로 최적화
$ turbo run build
# ✓ packages/shared-types:build (cached)
# ✓ packages/utils:build (cached)
# → apps/frontend:build (building...)
# → apps/backend:build (building...)
```

#### ✅ 일관된 개발 환경
- 모든 프로젝트가 동일한 Node.js, TypeScript, ESLint 버전 사용
- 공유 설정으로 코딩 스타일 통일
- 단일 `package.json`으로 의존성 관리

#### ✅ 타입 안정성
```typescript
// API 스펙 변경 시 자동으로 타입 에러 발생
// packages/shared-types/src/dto/create-asset.dto.ts
export interface CreateAssetDto {
  assetTag: string;
  model: string;
  // purchasePrice 필드 제거 시
}

// apps/frontend에서 즉시 타입 에러 발생
const asset = await api.createAsset({
  assetTag: 'SRS-001',
  model: 'MacBook Pro',
  purchasePrice: 3000000, // ❌ Type error!
});
```

#### ✅ CI/CD 최적화
```yaml
# Affected 파일만 테스트/빌드
- name: Test changed packages
  run: turbo run test --filter=[HEAD^1]

- name: Build changed apps
  run: turbo run build --filter=[HEAD^1]
```

### Negative

#### ⚠️ 초기 설정 복잡도
- Turborepo, pnpm 학습 필요
- 패키지 간 의존성 설정
- 빌드 파이프라인 구성

**Mitigation**: 초기 설정 가이드 작성, 템플릿 제공

#### ⚠️ 저장소 크기 증가
- 모든 코드가 단일 저장소에 존재
- Git 히스토리 복잡도 증가

**Mitigation**: 적절한 .gitignore, Git LFS 사용

#### ⚠️ 빌드 시간 (초기)
- 전체 빌드 시 모든 패키지 빌드 필요

**Mitigation**: Turborepo 캐싱, Remote Cache 활용

### Risks

#### Risk 1: 팀 학습 곡선
**Impact**: Medium
**Probability**: High
**Mitigation**:
- 단계적 마이그레이션
- 문서화 및 교육 세션
- 초기 설정 자동화

#### Risk 2: 의존성 충돌
**Impact**: Medium
**Probability**: Medium
**Mitigation**:
- pnpm의 엄격한 의존성 관리
- 정기적인 의존성 업데이트
- Renovate Bot 활용

## Alternatives Considered

### Alternative 1: Polyrepo (별도 저장소)

**Pros**:
- 간단한 구조
- 독립적인 배포
- 팀별 저장소 소유

**Cons**:
- 코드 중복
- 타입 동기화 어려움
- 의존성 관리 복잡
- CI/CD 중복

**Decision**: Rejected - 코드 공유의 이점이 더 큼

---

### Alternative 2: Nx Monorepo

**Pros**:
- 강력한 기능 (affected, graph)
- 풍부한 플러그인
- 대규모 프로젝트 지원

**Cons**:
- 복잡한 설정
- 학습 곡선 높음
- 무거운 의존성

**Decision**: Rejected - Turborepo가 더 간단하고 충분함

---

### Alternative 3: Lerna + Yarn Workspaces

**Pros**:
- 성숙한 생태계
- 많은 레퍼런스

**Cons**:
- Lerna 개발 중단 (2022)
- Turborepo 대비 느린 빌드
- 캐싱 기능 부족

**Decision**: Rejected - Turborepo가 더 현대적

---

### Alternative 4: npm Workspaces

**Pros**:
- 추가 도구 불필요
- 간단한 설정

**Cons**:
- 빌드 최적화 없음
- 캐싱 없음
- 병렬 처리 제한적

**Decision**: Rejected - 빌드 최적화 필요

## Implementation Details

### Root Package Configuration

```json
{
  "name": "@sams/root",
  "version": "1.0.0",
  "private": true,
  "packageManager": "pnpm@8.15.0",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "format": "prettier --write \"**/*.{ts,tsx,md}\"",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "^1.11.0",
    "prettier": "^3.1.0",
    "typescript": "^5.3.0"
  }
}
```

### Turborepo Configuration

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### pnpm Workspace Configuration

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### Package Naming Convention

- `@sams/frontend` - Frontend app
- `@sams/backend` - Backend app
- `@sams/shared-types` - Shared types
- `@sams/ui` - UI components
- `@sams/utils` - Utilities
- `@sams/config` - Configurations
- `@sams/database` - Prisma client

### Shared Types Package Example

```json
// packages/shared-types/package.json
{
  "name": "@sams/shared-types",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "devDependencies": {
    "@sams/config": "workspace:*",
    "typescript": "^5.3.0"
  }
}
```

### Usage in Apps

```json
// apps/frontend/package.json
{
  "name": "@sams/frontend",
  "dependencies": {
    "@sams/shared-types": "workspace:*",
    "@sams/ui": "workspace:*",
    "@sams/utils": "workspace:*",
    "react": "^18.2.0"
  }
}
```

```json
// apps/backend/package.json
{
  "name": "@sams/backend",
  "dependencies": {
    "@sams/shared-types": "workspace:*",
    "@sams/utils": "workspace:*",
    "@sams/database": "workspace:*",
    "@nestjs/core": "^10.0.0"
  }
}
```

## Migration Plan

### Phase 1: Setup (Week 1)
1. Initialize Turborepo
2. Create workspace structure
3. Configure pnpm workspaces
4. Set up build pipeline

### Phase 2: Shared Packages (Week 2)
1. Extract shared types
2. Create utils package
3. Set up ESLint/TS config
4. Create database package (Prisma)

### Phase 3: Apps Migration (Week 3)
1. Move frontend to apps/frontend
2. Move backend to apps/backend
3. Update imports
4. Test build pipeline

### Phase 4: Optimization (Week 4)
1. Configure Remote Cache
2. Optimize CI/CD
3. Documentation
4. Team training

## Success Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Build Time (Full) | N/A | < 5 min | CI/CD logs |
| Build Time (Incremental) | N/A | < 2 min | CI/CD logs |
| Code Duplication | High | < 5% | SonarQube |
| Type Coverage | 60% | 90% | TypeScript |
| Developer Satisfaction | N/A | 4/5 | Survey |

## Related Decisions
- [ADR-0001: Technology Stack Selection](./0001-technology-stack-selection.md)
- [ADR-0002: Database Selection](./0002-database-selection.md)

## Metadata
- **Date**: 2025-10-29
- **Author**: Architecture Team
- **Reviewers**: Tech Lead, Frontend Lead, Backend Lead
- **Tags**: monorepo, turborepo, architecture, tooling
