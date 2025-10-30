# 백엔드 개발 도구 비교 및 선택 근거

**작성일**: 2025-10-29
**프로젝트**: SureSoft SAMS

---

## 📋 선정된 개발 도구 스택

```
uv + Ruff (Format + Lint) + mypy + pytest + Alembic
```

---

## 🔍 도구별 비교 분석

### 1. 패키지 관리: uv vs Poetry vs pip

| 항목 | uv ⭐ | Poetry | pip |
|------|-------|--------|-----|
| **속도** | 10-100배 빠름 | 보통 | 기본 |
| **의존성 해결** | 매우 빠름 | 느림 (대형 프로젝트) | 기본 |
| **Python 버전 관리** | 자동 | 수동 | 수동 |
| **Lockfile** | uv.lock | poetry.lock | requirements.txt |
| **성숙도** | 2024년+ | 2018년+ | 표준 |
| **CI/CD 효율** | 매우 높음 | 보통 | 낮음 |

**선택 이유:**
- ✅ CI/CD 시간 대폭 단축 (25분 → 수분)
- ✅ Rust 기반으로 매우 빠름
- ✅ Python 버전 자동 관리
- ✅ 2025년 트렌드

---

### 2. 포맷팅: Ruff Format vs Black

| 항목 | Ruff Format ⭐ | Black |
|------|----------------|-------|
| **속도** | 10-100배 빠름 | 기본 |
| **Black 호환성** | 99.9% | 100% |
| **추가 설정** | 있음 (quote, indent) | 없음 (opinionated) |
| **통합** | Ruff 린터와 통합 | 별도 도구 |
| **성숙도** | 2023년+ | 2018년+ |

**선택 이유:**
- ✅ Black과 거의 동일한 출력 (99.9%)
- ✅ 린터와 통합으로 도구 수 감소
- ✅ 매우 빠른 속도
- ✅ 2025년 주요 프로젝트들이 마이그레이션 중

**마이그레이션:**
```bash
# Black에서 Ruff로 전환
uv run ruff format src tests

# 차이 확인 (거의 없음)
git diff
```

---

### 3. 린팅: Ruff vs Flake8 vs Pylint

| 항목 | Ruff ⭐ | Flake8 | Pylint |
|------|---------|---------|---------|
| **속도** | 1000배 빠름 | 기본 | 느림 |
| **규칙 수** | 800+ | 300+ | 400+ |
| **자동 수정** | ✅ | ❌ | ❌ |
| **통합** | Format + Lint | 별도 | 별도 |
| **대체 도구** | Flake8, isort, pyupgrade 등 | - | - |

**선택 이유:**
- ✅ 압도적인 속도 (250k LOC: 2.5분 → 0.4초)
- ✅ 여러 도구를 하나로 통합
- ✅ 자동 수정 기능
- ✅ Apache Airflow, FastAPI, pandas 등 주요 프로젝트 채택

**Ruff가 대체하는 도구들:**
- Flake8 (+ 수십 개 플러그인)
- isort (import 정렬)
- pyupgrade (Python 버전별 최적화)
- pydocstyle (docstring 체크)
- autoflake (미사용 import 제거)

---

### 4. 타입 체크: mypy vs Pyright

| 항목 | mypy ⭐ | Pyright |
|------|---------|----------|
| **속도** | 기본 | 3-5배 빠름 |
| **생태계** | 성숙 | 성장 중 |
| **VSCode 통합** | 보통 | 매우 좋음 (Pylance) |
| **미주석 코드 체크** | 선택적 | 기본 |
| **커뮤니티** | 크고 성숙 | 중간 |

**선택 이유:**
- ✅ 성숙한 생태계와 커뮤니티
- ✅ 안정적이고 검증됨
- ✅ 대부분의 프로젝트에서 사용
- ⚠️ Pyright는 선택적 고려 (특히 VSCode 사용 시)

**향후 고려사항:**
- 대규모 코드베이스에서는 Pyright 고려
- 개발 시 Pyright, CI에서 mypy 병행 가능

---

### 5. 테스트: pytest vs unittest

| 항목 | pytest ⭐ | unittest |
|------|-----------|----------|
| **문법** | 간단 | 복잡 (클래스 기반) |
| **보일러플레이트** | 적음 | 많음 |
| **Fixture** | 강력 | 기본 (setUp/tearDown) |
| **플러그인** | 풍부 | 제한적 |
| **커뮤니티 순위** | 1위 | 5위 |

**선택 이유:**
- ✅ Python 테스트 프레임워크 사실상의 표준
- ✅ 간단하고 직관적
- ✅ 강력한 fixture 시스템
- ✅ FastAPI 공식 문서에서 권장

---

### 6. 마이그레이션: Alembic

**선택 이유:**
- ✅ SQLAlchemy 공식 마이그레이션 도구
- ✅ FastAPI + SQLAlchemy 표준 조합
- ✅ 자동 마이그레이션 생성
- ✅ 버전 관리 및 롤백 지원

---

## 🎯 최종 스택 vs 대안 비교

### Option 1: Black + Ruff + mypy (이전 선택)

```toml
[project.optional-dependencies]
dev = [
    "black>=23.12.0",
    "ruff>=0.1.0",
    "mypy>=1.7.0",
    "pytest>=7.4.3",
]
```

**장점:**
- Black이 더 성숙하고 안정적
- 검증된 조합

**단점:**
- 도구가 분산됨 (Black + Ruff)
- Black이 Ruff보다 느림
- CI/CD 시간 증가

---

### Option 2: Ruff Format + Ruff + mypy (선택 ⭐)

```toml
[project.optional-dependencies]
dev = [
    "ruff>=0.1.0",  # Format + Lint
    "mypy>=1.7.0",
    "pytest>=7.4.3",
]
```

**장점:**
- ✅ 도구 통합 (Format + Lint)
- ✅ 매우 빠른 속도
- ✅ Black 99.9% 호환
- ✅ 2025년 트렌드
- ✅ 설정 간소화

**단점:**
- Ruff Format이 Black보다 덜 성숙 (하지만 충분히 안정적)

---

### Option 3: Ruff + Pyright (공격적)

```toml
[project.optional-dependencies]
dev = [
    "ruff>=0.1.0",
    "pyright",
    "pytest>=7.4.3",
]
```

**장점:**
- 최고 성능
- 최소 도구 수

**단점:**
- 가장 검증 덜 됨
- mypy 생태계보다 작음

---

## 📊 성능 비교 (벤치마크)

### CI/CD 시간 비교

| 도구 조합 | 250k LOC 프로젝트 | CI/CD 시간 |
|-----------|-------------------|------------|
| **Poetry + Black + Flake8** | ~3분 | ~25분 |
| **uv + Black + Ruff** | ~15초 | ~8분 |
| **uv + Ruff (통합)** | ~5초 | ~3분 ⭐ |

### 린팅 속도 비교

| 도구 | 250k LOC | 상대 속도 |
|------|----------|----------|
| **Pylint** | 150초 | 1x |
| **Flake8** | 60초 | 2.5x |
| **Ruff** | 0.4초 | **375x** ⭐ |

---

## 🚀 실제 프로젝트 채택 사례

### Ruff를 채택한 주요 프로젝트 (2025년)

- **Apache Airflow** - 데이터 파이프라인
- **FastAPI** - 웹 프레임워크 (우리도 사용!)
- **pandas** - 데이터 분석
- **pydantic** - 데이터 검증
- **Pylint** - 린터 (자체적으로 Ruff 사용!)

---

## 🔄 마이그레이션 가이드

### Black → Ruff Format

**Step 1: Ruff 설치 및 설정**

```toml
# pyproject.toml
[tool.ruff]
line-length = 100
target-version = "py312"

[tool.ruff.format]
quote-style = "double"
indent-style = "space"

[tool.ruff.lint]
select = [
    "E",   # pycodestyle errors
    "W",   # pycodestyle warnings
    "F",   # pyflakes
    "I",   # isort
    "N",   # pep8-naming
    "UP",  # pyupgrade
]
```

**Step 2: 코드 포맷팅**

```bash
# Ruff로 포맷팅
uv run ruff format src tests

# 차이 확인 (거의 없어야 함)
git diff

# 문제 없으면 커밋
git add .
git commit -m "chore: migrate from Black to Ruff format"
```

**Step 3: CI/CD 업데이트**

```yaml
# .github/workflows/backend.yml
- name: Format check
  run: uv run ruff format --check src tests

- name: Lint
  run: uv run ruff check src tests
```

**Step 4: Black 제거 (선택적)**

```bash
# Black dependency 제거
uv remove black

# 또는 pyproject.toml에서 수동 제거
```

---

## 💡 VSCode 설정

### Option 2 (Ruff Format + mypy)

```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/apps/backend/.venv/bin/python",

  "[python]": {
    "editor.defaultFormatter": "charliermarsh.ruff",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.organizeImports": true,
      "source.fixAll": true
    }
  },

  "ruff.format.args": ["--line-length", "100"],
  "ruff.lint.args": ["--select", "E,F,W,I,N,UP"],
  "mypy-type-checker.args": ["--strict"]
}
```

### 권장 VSCode 확장

1. **Ruff** (charliermarsh.ruff) - 린팅 + 포맷팅
2. **Mypy Type Checker** (ms-python.mypy-type-checker) - 타입 체크
3. **Python** (ms-python.python) - Python 지원

---

## 📈 팀 도입 전략

### Phase 1: Ruff 린터 도입 (1일)
- ✅ 완료: 린터만 먼저 도입
- Black은 유지

### Phase 2: Ruff Format 테스트 (1일)
- ⬅️ **현재 단계**
- Ruff format으로 전체 코드베이스 포맷
- Black과 출력 비교 (99.9% 동일 확인)

### Phase 3: Black 제거 (선택적, 1시간)
- Ruff format이 안정적으로 작동하면
- Black dependency 제거

---

## 🎯 권장 사항

### 즉시 적용 (필수)
1. ✅ **uv** - 패키지 관리
2. ✅ **Ruff** - 린팅 + 포맷팅
3. ✅ **mypy** - 타입 체크
4. ✅ **pytest** - 테스트
5. ✅ **Alembic** - 마이그레이션

### 장기 고려 (선택적)
- **Pyright** 추가 (VSCode 사용 시)
- **basedpyright** (Pyright 개선 포크)

---

## 📚 참고 자료

### 공식 문서
- [uv](https://docs.astral.sh/uv/)
- [Ruff](https://docs.astral.sh/ruff/)
- [mypy](https://mypy.readthedocs.io/)
- [pytest](https://docs.pytest.org/)

### 비교 문서
- [Ruff vs Black](https://astral.sh/blog/the-ruff-formatter)
- [uv vs Poetry](https://fmind.medium.com/poetry-was-good-uv-is-better-an-mlops-migration-story-f52bf0c6c703)
- [Ruff vs Flake8/Pylint](https://trunk.io/learn/comparing-ruff-flake8-and-pylint-linting-speed)

---

## ✅ 최종 체크리스트

### 환경 설정
- [ ] uv 설치 확인
- [ ] Python 3.12 설정
- [ ] pyproject.toml 업데이트
- [ ] VSCode 설정 업데이트

### 코드 마이그레이션
- [ ] `uv run ruff format src tests` 실행
- [ ] git diff로 변경 확인
- [ ] 테스트 실행 (`pytest`)
- [ ] 커밋 및 푸시

### CI/CD 업데이트
- [ ] GitHub Actions 워크플로우 수정
- [ ] 로컬에서 `pnpm format && pnpm lint && pnpm typecheck` 테스트
- [ ] CI 성공 확인

---

**최종 업데이트**: 2025-10-29
**다음 리뷰**: 2026-01-01 (새로운 트렌드 확인)
