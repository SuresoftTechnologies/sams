# ADR-0002: PostgreSQL as Primary Database

## Status
**Status**: Accepted

## Context

자산관리 시스템(SAMS)은 다음과 같은 데이터 요구사항이 있습니다:

- **1,182개 자산** (초기), 향후 10,000개까지 확장
- **복잡한 관계**: 사용자, 자산, 이력, 워크플로우, 승인 등
- **트랜잭션 보장**: 자산 배정, 반납 등 ACID 트랜잭션 필요
- **이력 관리**: 모든 변경 사항 추적 (감사 로그)
- **검색 기능**: 자산 이름, 모델명, 시리얼넘버 등 다양한 검색
- **JSON 데이터**: 자산 이력의 old_values/new_values (유연한 스키마)

## Decision

**PostgreSQL 15**를 Primary Database로 선정합니다.

### Configuration
- **Version**: PostgreSQL 15.4
- **Extensions**:
  - `uuid-ossp`: UUID 생성
  - `pg_trgm`: 유사 문자열 검색 (Trigram)
  - `btree_gin`: GIN 인덱스 최적화
- **Connection Pooling**: PgBouncer (Max 100 connections)

## Consequences

### Positive
- ✅ **ACID 트랜잭션**: 데이터 무결성 보장
- ✅ **JSONB 타입**: 유연한 스키마 (asset_history.old_values)
- ✅ **고급 인덱싱**: B-Tree, GIN, GiST 지원
- ✅ **Full-Text Search**: 한국어 검색 지원 (`to_tsvector`)
- ✅ **Foreign Key Constraints**: 데이터 무결성 강제
- ✅ **Window Functions**: 복잡한 통계 쿼리 (ROW_NUMBER, LAG 등)
- ✅ **CTE (Common Table Expressions)**: 재귀 쿼리 (조직도)
- ✅ **Row-Level Security**: 사용자별 데이터 접근 제어
- ✅ **오픈소스**: 라이선스 비용 없음
- ✅ **풍부한 생태계**: Prisma, TypeORM, pg 등 ORM 지원

### Negative
- ⚠️ **운영 복잡도**: MySQL 대비 설정 복잡
- ⚠️ **메모리 사용**: 캐시, 버퍼 등 메모리 소모 큼
- ⚠️ **Vacuum 관리**: 정기적인 VACUUM 작업 필요

### Risks
- **성능 저하**: 부적절한 인덱싱 시 쿼리 속도 저하
  - **Mitigation**: EXPLAIN ANALYZE 정기 점검, 자동 인덱스 추천 도구 활용
- **백업 용량**: JSONB 사용 시 백업 크기 증가
  - **Mitigation**: 증분 백업, 압축, 오래된 데이터 아카이브

## Alternatives Considered

### Alternative 1: MySQL 8.0
**Pros**:
- 더 널리 사용됨 (점유율 높음)
- 간단한 설정 및 운영
- InnoDB 성능 우수

**Cons**:
- JSON 지원 약함 (MySQL JSON vs PostgreSQL JSONB)
- Full-Text Search 한국어 지원 부족
- Window Functions 지원 늦음 (MySQL 8.0부터)
- Foreign Key 성능 이슈 (대량 INSERT 시)

**Decision**: Rejected - JSONB 및 고급 기능 필요

---

### Alternative 2: MongoDB (NoSQL)
**Pros**:
- Schema-less, 유연한 데이터 모델
- 수평 확장 용이 (Sharding)
- JSON 네이티브 지원

**Cons**:
- 트랜잭션 지원 약함 (Multi-Document Transaction 제한적)
- JOIN 성능 저하
- 복잡한 관계형 데이터 모델링 어려움
- 팀 내 NoSQL 경험 부족

**Decision**: Rejected - 관계형 데이터 모델 필수

---

### Alternative 3: SQLite
**Pros**:
- 초경량, 설정 불필요
- 빠른 프로토타이핑

**Cons**:
- 동시 쓰기 제한
- 확장성 없음 (단일 파일)
- 프로덕션 부적합

**Decision**: Rejected - 프로덕션 사용 불가

---

### Alternative 4: CockroachDB (Distributed SQL)
**Pros**:
- PostgreSQL 호환
- 자동 샤딩 및 복제
- 높은 가용성

**Cons**:
- 운영 복잡도 매우 높음
- 현재 규모에서 Over-Engineering
- 팀 경험 없음

**Decision**: Rejected - Phase 1에서 불필요, 향후 고려

## Implementation Details

### Database Configuration
```yaml
# postgresql.conf
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1  # SSD 최적화
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB
```

### Backup Strategy
- **Full Backup**: 매일 02:00 AM (pg_dump)
- **Incremental Backup**: 6시간마다
- **WAL Archiving**: Continuous
- **Retention**: 30일

### Monitoring
- **Metrics**: pg_stat_statements, pg_stat_activity
- **Tools**: pgAdmin, Prometheus postgres_exporter
- **Alerts**:
  - Connection pool 80% 사용 시
  - Replication lag > 1분
  - Disk usage > 80%

## Related Decisions
- [ADR-0001: Technology Stack Selection](./0001-technology-stack-selection.md)
- [ADR-0004: Caching Strategy with Redis](./0004-caching-strategy.md)

## Metadata
- **Date**: 2025-10-29
- **Author**: Backend Team
- **Reviewers**: DBA, Tech Lead
- **Tags**: database, postgresql, data-storage
