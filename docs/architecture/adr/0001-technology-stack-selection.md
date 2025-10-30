# ADR-0001: Technology Stack Selection

## Status
**Status**: Partially Superseded

> **Note**: 백엔드 기술 스택이 NestJS에서 Python/FastAPI로 변경되었습니다.
> - Backend 관련 내용은 [ADR-0005: Python Backend with Type Sync](./0005-python-backend-with-type-sync.md)를 참조하세요.
> - Frontend, Database, DevOps 관련 내용은 여전히 유효합니다.

## Context

슈어소프트 자산관리 시스템(SAMS)을 구축하기 위해 프론트엔드, 백엔드, 데이터베이스 등 전체 기술 스택을 선정해야 합니다.

### Requirements
- **개발 속도**: 해커톤 프로젝트로 빠른 프로토타입 개발 필요
- **확장성**: 향후 사용자 및 데이터 증가 대응
- **유지보수성**: 팀 내 기술 스택 숙련도 고려
- **비용**: 오픈소스 우선, 라이선스 비용 최소화
- **생태계**: 풍부한 라이브러리 및 커뮤니티 지원

### Constraints
- 팀 기술 스택: JavaScript/TypeScript 중심
- 배포 환경: Docker, Kubernetes 지원 필요
- 개발 기간: 4-6주 (MVP)

## Decision

다음과 같은 기술 스택을 선정합니다:

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **UI Library**: Material-UI (MUI)
- **Routing**: React Router v6
- **Form Handling**: React Hook Form + Zod
- **API Client**: Axios + React Query

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: NestJS (TypeScript)
- **ORM**: Prisma
- **Authentication**: Passport.js + JWT
- **Validation**: class-validator + class-transformer
- **API Documentation**: Swagger/OpenAPI

### Database
- **Primary DB**: PostgreSQL 15
- **Cache**: Redis 7
- **Object Storage**: MinIO (Self-hosted S3-compatible)
- **Search** (Optional): Elasticsearch 8

### DevOps
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: Winston + Loki

## Consequences

### Positive
- ✅ **TypeScript 전면 도입**: 타입 안정성, 개발 생산성 향상
- ✅ **풍부한 생태계**: React, NestJS 모두 활발한 커뮤니티
- ✅ **개발 속도**: Vite (빠른 빌드), Prisma (타입 안전 ORM)
- ✅ **확장성**: NestJS 모듈 아키텍처, PostgreSQL 수평 확장
- ✅ **비용 효율**: 모두 오픈소스, 무료

### Negative
- ⚠️ **학습 곡선**: NestJS, Prisma 초기 학습 필요
- ⚠️ **리소스 소모**: TypeScript 컴파일, Elasticsearch (선택 시)
- ⚠️ **의존성 관리**: Node.js 생태계의 빠른 변화

### Risks
- **Node.js 성능**: CPU 집약적 작업 시 성능 한계 (대량 데이터 처리)
  - **Mitigation**: Background Worker 분리, 필요 시 Go/Rust 마이크로서비스 추가
- **PostgreSQL 단일 장애점**: Primary DB 장애 시 전체 시스템 중단
  - **Mitigation**: Primary-Replica 구성, Automatic Failover (Patroni)

## Alternatives Considered

### Alternative 1: Django (Python) + Vue.js
- **Pros**: Django Admin 기본 제공, Python 팀 내 숙련도 높음
- **Cons**: 비동기 처리 약함, 프론트엔드 분리 시 TypeScript 불일치
- **Rejected**: JavaScript/TypeScript 풀스택 통일성 우선

### Alternative 2: Spring Boot (Java) + Angular
- **Pros**: 엔터프라이즈급 안정성, 강력한 타입 시스템
- **Cons**: 개발 속도 느림, 보일러플레이트 많음, 팀 Java 경험 부족
- **Rejected**: 빠른 개발 속도 필요

### Alternative 3: Go + React
- **Pros**: Go 성능 우수, 간결한 문법
- **Cons**: ORM 생태계 약함, 팀 Go 경험 없음
- **Rejected**: 학습 곡선 및 개발 속도 이슈

### Alternative 4: MySQL instead of PostgreSQL
- **Pros**: 더 널리 사용됨, 간단한 설정
- **Cons**: JSON 지원 약함, Full-Text Search 한국어 지원 부족
- **Rejected**: PostgreSQL의 고급 기능 필요 (JSONB, GIN 인덱스)

## Related Decisions
- [ADR-0002: Database Selection Rationale](./0002-database-selection.md)
- [ADR-0003: Authentication Strategy](./0003-authentication-strategy.md)

## Metadata
- **Date**: 2025-10-29
- **Author**: Architecture Team
- **Reviewers**: Tech Lead, Backend Lead, Frontend Lead
- **Tags**: tech-stack, frontend, backend, database
