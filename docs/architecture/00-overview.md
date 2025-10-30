# Asset Management System (AMS) - Architecture Overview

## 문서 정보
- **프로젝트명**: SureSoft Asset Management System (AMS)
- **버전**: 1.0.0
- **작성일**: 2025-10-29
- **작성자**: Architecture Team
- **목적**: 슈어소프트 IT 자산관리 시스템 구축

## 📋 Executive Summary

슈어소프트 자산관리 시스템(AMS)은 기존 Excel 기반의 수작업 자산관리를 현대적인 웹/모바일 기반 시스템으로 전환하는 디지털 전환 프로젝트입니다.

### 비즈니스 목표
- 1,182개 IT 자산(데스크탑 198개, 노트북 396개, 모니터 588개)의 효율적 관리
- 실시간 자산 추적 및 이력 관리
- QR코드 스캔을 통한 빠른 대여/반납 (기존 QR 활용)
- 자산 생애주기 관리 (구매 → 배정 → 반납 → 폐기)
- 자산 등급 자동 분류 (A/B/C 등급, 구매연도 기반)

### 핵심 기능
1. **자산 관리**: CRUD, 검색, 필터링, 통계
2. **자산 이력 추적**: 사용자 변경, 위치 이동, 상태 변경
3. **QR코드 스캔**: 기존 QR 스캔 후 대여/반납 (MVP)
4. **워크플로우**: 반출/반납 프로세스, 승인 관리
5. **대시보드**: 실시간 통계, 리포팅, 알림

### 주요 이해관계자
- **사용자**: 전 직원 (자산 조회, 반출/반납 요청)
- **담당자**: 컬쳐앤인프라팀 (자산 관리, 승인, 재고 관리)
- **관리자**: IT 팀 (시스템 관리, 권한 관리)

## 🏗️ Architecture Principles

### 1. 확장성 (Scalability)
- 마이크로서비스 아키텍처 준비 (초기: 모놀리식, 추후 분리 가능)
- 수평 확장 가능한 컨테이너 기반 배포
- 데이터베이스 샤딩 및 레플리케이션 지원

### 2. 보안 (Security)
- 역할 기반 접근 제어 (RBAC)
- JWT 기반 인증/인가
- 데이터 암호화 (전송 중: TLS, 저장: AES-256)
- 감사 로그 및 추적 기능

### 3. 가용성 (Availability)
- 99.9% 가동률 목표
- 자동 장애 복구 (Health Check, Auto Restart)
- 백업 및 재해 복구 계획

### 4. 유지보수성 (Maintainability)
- 클린 아키텍처 패턴 적용
- 의존성 주입 (Dependency Injection)
- 테스트 자동화 (단위, 통합, E2E 테스트)
- 문서화 자동화 (OpenAPI, JSDoc)

### 5. 성능 (Performance)
- API 응답 시간 < 500ms (P95)
- 캐싱 전략 (Redis, CDN)
- 데이터베이스 인덱싱 최적화
- 비동기 처리 (메시지 큐)

## 🎯 Architectural Styles and Patterns

### Primary Architecture Style
- **Layered Architecture** (레이어드 아키텍처)
  - Presentation Layer (UI)
  - Application Layer (Business Logic)
  - Domain Layer (Core Business Rules)
  - Infrastructure Layer (Data Access, External Services)

### Design Patterns
- **Repository Pattern**: 데이터 접근 추상화
- **Service Pattern**: 비즈니스 로직 캡슐화
- **Factory Pattern**: 객체 생성 관리
- **Observer Pattern**: 이벤트 기반 통신
- **Strategy Pattern**: 알고리즘 선택 유연화

### API Design
- **RESTful API**: 자원 중심 설계
- **GraphQL** (Optional): 유연한 데이터 조회
- **WebSocket**: 실시간 알림 및 업데이트

## 📊 Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **State Management**: Zustand or Redux Toolkit
- **UI Library**: Material-UI (MUI) or Ant Design
- **Mobile**: React Native or Progressive Web App (PWA)
- **Build Tool**: Vite
- **Testing**: Vitest, React Testing Library, Playwright

### Backend
- **Runtime**: Node.js 20+ (TypeScript)
- **Framework**: NestJS or Express.js
- **ORM**: Prisma or TypeORM
- **Authentication**: Passport.js, JWT
- **Validation**: Zod or class-validator
- **Testing**: Jest, Supertest

### Database
- **Primary DB**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Search**: Elasticsearch (Optional)
- **Object Storage**: MinIO or AWS S3 (이미지, 첨부파일)

### DevOps & Infrastructure
- **Containerization**: Docker, Docker Compose
- **Orchestration**: Kubernetes (Production) or Docker Swarm
- **CI/CD**: GitHub Actions or GitLab CI
- **Monitoring**: Prometheus, Grafana, Loki
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **APM**: Sentry, New Relic

### Development Tools
- **Version Control**: Git, GitHub/GitLab
- **API Documentation**: Swagger/OpenAPI
- **Code Quality**:
  - Frontend: ESLint, Prettier
  - Backend: Ruff (linting + formatting), mypy (type checking)
  - Analysis: SonarQube
- **Package Manager**:
  - Frontend: pnpm
  - Backend: uv

## 🔗 Architecture Documentation Structure

```
docs/architecture/
├── 00-overview.md                    # 이 문서
├── 01-system-context.md              # C4 레벨 1: 시스템 컨텍스트
├── 02-container-architecture.md      # C4 레벨 2: 컨테이너 아키텍처
├── 03-component-architecture.md      # C4 레벨 3: 컴포넌트 아키텍처
├── 04-data-architecture.md           # 데이터 아키텍처 및 스키마
├── 05-security-architecture.md       # 보안 아키텍처
├── 06-deployment-architecture.md     # 배포 및 인프라
├── 07-quality-attributes.md          # 품질 속성 및 NFR
├── adr/                              # Architecture Decision Records
│   ├── 0001-choose-tech-stack.md
│   ├── 0002-database-selection.md
│   ├── 0003-authentication-strategy.md
│   └── template.md
├── diagrams/                         # Mermaid/PlantUML 다이어그램
│   ├── c4-context.mmd
│   ├── c4-container.mmd
│   ├── c4-component.mmd
│   ├── data-flow.mmd
│   ├── deployment.mmd
│   └── er-diagram.mmd
└── api/                              # API 문서
    ├── openapi.yaml
    └── endpoints.md
```

## 📈 Roadmap

### Phase 1: MVP (4-6주)
- [ ] 기본 자산 CRUD 기능
- [ ] 사용자 인증/인가
- [ ] QR코드 스캔 후 대여/반납 (기존 QR 활용)
- [ ] 기본 대시보드
- [ ] Excel 데이터 마이그레이션

### Phase 2: Enhanced Features (4-6주)
- [ ] 반출/반납 워크플로우
- [ ] 승인 프로세스
- [ ] 고급 검색 및 필터링
- [ ] 통계 및 리포팅
- [ ] 모바일 앱 (PWA)

### Phase 3: Advanced Features (8-12주)
- [ ] 자산 예측 분석
- [ ] AI 기반 자산 최적화 추천
- [ ] 통합 API (HR 시스템, 구매 시스템)
- [ ] 고급 알림 및 자동화
- [ ] 감사 로그 및 컴플라이언스

## 🎓 Related Documents

- [System Context](./01-system-context.md) - C4 모델 레벨 1
- [Container Architecture](./02-container-architecture.md) - C4 모델 레벨 2
- [Component Architecture](./03-component-architecture.md) - C4 모델 레벨 3
- [Data Architecture](./04-data-architecture.md) - 데이터베이스 설계
- [Security Architecture](./05-security-architecture.md) - 보안 설계
- [Deployment Architecture](./06-deployment-architecture.md) - 배포 전략
- [Architecture Decision Records](./adr/) - ADR 목록

## 📝 Version History

| Version | Date       | Author            | Changes                |
|---------|------------|-------------------|------------------------|
| 1.0.0   | 2025-10-29 | Architecture Team | Initial architecture   |
