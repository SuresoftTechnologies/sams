# SureSoft 자산관리 시스템 (AMS) - 문서 인덱스

## 프론트엔드 기술 스택 검토 결과

해커톤용 자산관리 시스템의 프론트엔드 기술 스택을 종합적으로 검토하고, 최적화된 권장안을 제공합니다.

---

## 문서 목록

### 1. 핵심 문서

#### [FRONTEND_STACK_SUMMARY.md](./FRONTEND_STACK_SUMMARY.md) ⭐
- **용도**: 빠른 참조용 요약본
- **내용**:
  - 핵심 변경사항 (4가지)
  - 선택 이유 한 줄 요약
  - 번들 사이즈 예상
  - 해커톤 적합성 평가
  - 타임라인 (18시간)
- **읽는 시간**: 5분

#### [FRONTEND_STACK_RECOMMENDATION.md](./FRONTEND_STACK_RECOMMENDATION.md) 📘
- **용도**: 상세 기술 분석 및 권장안
- **내용**:
  - 각 기술 스택별 상세 검토
  - 대안 비교 (Material-UI, SWR 등)
  - 통합 검토 (백엔드 호환성)
  - 성능 분석
  - 접근성 체크리스트
  - 프로젝트 구조 예시
  - 최종 package.json
- **읽는 시간**: 20분

#### [FRONTEND_SETUP_GUIDE.md](./FRONTEND_SETUP_GUIDE.md) 🛠️
- **용도**: 실제 설치 가이드
- **내용**:
  - 단계별 설치 명령어
  - 설정 파일 생성
  - shadcn/ui 초기화
  - 페이지 생성 예시
  - 문제 해결
- **읽는 시간**: 10분 + 설치 30분

---

### 2. 설정 파일

#### [frontend-package.json](./frontend-package.json)
- 복사해서 바로 사용 가능한 package.json
- 모든 의존성 포함

#### [frontend-configs/](./frontend-configs/)
**설정 파일**:
- `vite.config.ts` - Vite 설정 (HMR, 프록시, 번들링)
- `tsconfig.json` - TypeScript 설정
- `tsconfig.node.json` - Node 환경 TypeScript 설정
- `tailwind.config.js` - Tailwind CSS 설정
- `globals.css` - shadcn/ui 스타일

**라이브러리 파일**:
- `query-client.ts` - TanStack Query 설정
- `api-client.ts` - FastAPI 연동 클라이언트
- `useAssets.ts` - Assets API hooks 예시

**컴포넌트 예시**:
- `App.tsx` - 루트 컴포넌트
- `routes.tsx` - React Router 설정
- `AssetTable.tsx` - TanStack Table 예시
- `AssetForm.tsx` - React Hook Form + Zod 예시

---

## 핵심 변경사항 요약

| 항목 | 원래 제안 | 최종 권장 | 변경 이유 |
|------|-----------|-----------|-----------|
| **React Router** | v7 | **v6.22+** | v7은 아직 불안정 (Remix 통합 중) |
| **Tailwind CSS** | v4 | **v3.4+** | v4는 Alpha/Beta 단계 |
| **Vite** | 7.0 | **6.x** | 7.0은 아직 미출시 |
| **Zod** | v4 | **v3.22+** | v4는 아직 미출시 |

### 추가된 라이브러리
- **QR코드**: `qrcode.react`, `@zxing/browser`
- **테이블**: `@tanstack/react-table`, `@tanstack/react-virtual`
- **차트**: `recharts`
- **날짜**: `date-fns`, `react-day-picker`
- **알림**: `sonner`

---

## 종합 평가

| 카테고리 | 점수 | 평가 |
|----------|------|------|
| 해커톤 적합성 | 9.5/10 | ✅ 매우 우수 |
| 기술 선택 | 9/10 | ✅ 우수 (버전 조정 필요) |
| 백엔드 통합 | 10/10 | ✅ 완벽 (FastAPI + OpenAPI) |
| 생태계 호환성 | 10/10 | ✅ 완벽 |
| 성능 | 9/10 | ✅ 우수 (~250KB gzipped) |
| 개발자 경험 | 10/10 | ✅ 완벽 (타입 안전성) |
| **총점** | **9.6/10** | ✅ **매우 우수** |

---

## 최종 기술 스택

### Core
```
React: 18.3.1
TypeScript: 5.3.3
Vite: 6.x
pnpm: 8.15.0
Turborepo: 1.11.0
```

### UI/Styling
```
shadcn/ui (Radix UI primitives)
Tailwind CSS: 3.4.1
lucide-react: 0.309.0
```

### Routing
```
React Router: 6.22.0 (v6, NOT v7)
```

### State Management
```
TanStack Query: 5.17.0 (서버 상태)
Zustand: 4.4.7 (클라이언트 상태)
```

### Forms & Validation
```
React Hook Form: 7.49.3
Zod: 3.22.4
@hookform/resolvers: 3.3.4
```

### Data Display
```
@tanstack/react-table: 8.11.0
@tanstack/react-virtual: 3.0.0
recharts: 2.10.0
```

### QR Code
```
qrcode.react: 3.1.0
@zxing/browser: 0.1.5
```

### Utilities
```
date-fns: 3.0.0
react-day-picker: 8.10.0
sonner: 1.3.0
clsx + tailwind-merge
```

---

## 빠른 시작

```bash
# 1. 프론트엔드 디렉토리로 이동
cd /Users/chsong/Documents/my-projects/suresoft-ams/apps/frontend

# 2. package.json 복사
cp /Users/chsong/Documents/my-projects/suresoft-ams/docs/frontend-package.json package.json

# 3. 의존성 설치
pnpm install

# 4. shadcn/ui 초기화
npx shadcn-ui@latest init

# 5. 필수 컴포넌트 추가
npx shadcn-ui@latest add button form table dialog input label card badge select

# 6. 개발 서버 시작
pnpm dev
```

상세한 설치 가이드는 [FRONTEND_SETUP_GUIDE.md](./FRONTEND_SETUP_GUIDE.md)를 참고하세요.

---

## 타임라인 예상 (해커톤)

| 작업 | 소요 시간 | 누적 |
|------|-----------|------|
| 프로젝트 설정 | 1시간 | 1h |
| 레이아웃 구성 | 2시간 | 3h |
| 자산 목록 (테이블) | 3시간 | 6h |
| 자산 등록/수정 (폼) | 3시간 | 9h |
| QR코드 기능 | 2시간 | 11h |
| 체크인/아웃 | 3시간 | 14h |
| 대시보드 (차트) | 2시간 | 16h |
| 통합 테스트 | 2시간 | 18h |
| **총계** | **18시간** | **2-3일** |

---

## 예상 번들 사이즈

```
Total: ~250KB (gzipped)

├── React + ReactDOM: 130KB
├── TanStack Query: 15KB
├── React Hook Form: 8KB
├── Zod: 12KB
├── shadcn/ui components: 30KB
├── React Router: 20KB
└── Utilities: 35KB
```

**목표**: < 300KB (✅ 달성 가능)

---

## 성능 목표

| 지표 | 예상값 | 목표 | 상태 |
|------|--------|------|------|
| 번들 사이즈 (gzipped) | 250KB | <300KB | ✅ |
| First Load | <1초 | <3초 | ✅ |
| HMR | <50ms | <100ms | ✅ |
| Table (1,000+ rows) | 60fps | 30fps+ | ✅ |

---

## 권장 워크플로우

### 1. 백엔드 API 먼저 개발
```bash
cd /Users/chsong/Documents/my-projects/suresoft-ams/apps/backend
pnpm dev
```

### 2. OpenAPI spec 자동 생성
```bash
pnpm --filter @ams/backend generate:openapi
```

### 3. TypeScript 타입 자동 생성
```bash
pnpm --filter @ams/api-client generate
```

### 4. 프론트엔드에서 타입 안전하게 API 호출
```typescript
import { apiClient } from '@/lib/api-client';

const { data } = useQuery({
  queryKey: ['assets'],
  queryFn: () => apiClient.assets.list(),
});
// data는 자동으로 타입 추론됨!
```

---

## 대안 라이브러리 비교

### UI 프레임워크
| 라이브러리 | 번들 | 커스터마이징 | 접근성 | 추천 |
|-----------|------|--------------|--------|------|
| **shadcn/ui** | ✅ 작음 | ✅ 완전 | ✅ 자동 | ✅ 최고 |
| Material-UI | ❌ 무거움 | ⚠️ 제한적 | ✅ 좋음 | ⚠️ |
| Ant Design | ⚠️ 중간 | ❌ 어려움 | ✅ 좋음 | ⚠️ |

### 서버 상태 관리
| 라이브러리 | 기능 | 타입 | Devtools | 추천 |
|-----------|------|------|----------|------|
| **TanStack Query** | ✅ 풍부 | ✅ 우수 | ✅ 있음 | ✅ 최고 |
| SWR | ⚠️ 기본 | ⚠️ 보통 | ❌ 없음 | ⚠️ |

### 폼 라이브러리
| 라이브러리 | 성능 | 사용성 | 추천 |
|-----------|------|--------|------|
| **React Hook Form** | ✅ 최고 | ✅ 우수 | ✅ 최고 |
| Formik | ⚠️ 느림 | ✅ 좋음 | ❌ |

---

## 접근성 (WCAG AA 준수)

### 자동 보장 (Radix UI 덕분)
- ✅ ARIA labels
- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ Focus management
- ✅ Screen reader support

### 수동 확인 필요
- [ ] Color contrast (4.5:1 비율)
- [ ] Text alternatives for images
- [ ] Form error messages

---

## 위험 요소 및 대응

| 위험 | 확률 | 영향 | 대응책 |
|------|------|------|--------|
| API 타입 불일치 | 낮음 | 중간 | OpenAPI 자동 생성으로 예방 |
| 성능 이슈 (1,000+ 자산) | 중간 | 높음 | TanStack Virtual 사용 |
| QR코드 스캔 실패 | 중간 | 중간 | 수동 입력 옵션 제공 |
| 브라우저 호환성 | 낮음 | 낮음 | 모던 브라우저만 지원 명시 |

---

## 추가 기능 (시간 있으면)

### 선택적 추가
```json
{
  "xlsx": "^0.18.5",              // Excel 임포트/익스포트
  "jspdf": "^2.5.1",              // PDF 리포트
  "jspdf-autotable": "^3.8.0",   // PDF 테이블
  "@hello-pangea/dnd": "^16.5.0" // 드래그앤드롭
}
```

---

## 최종 권장사항

### ✅ 반드시 변경
1. React Router v7 → v6.22
2. Tailwind v4 → v3.4
3. Vite 7.0 → 6.x
4. Zod v4 → v3.22

### ✅ 반드시 추가
1. QR코드 라이브러리
2. TanStack Table + Virtual
3. recharts (대시보드)
4. sonner (토스트)

### ✅ 그대로 유지
- React 18.3
- TypeScript 5.3
- shadcn/ui + Radix UI
- TanStack Query v5
- React Hook Form
- Zustand
- date-fns

---

## 결론

원래 제안된 스택은 **80%가 우수**했지만, **최신 버전의 불안정성**으로 인해 조정이 필요합니다.

**수정된 최종 스택은 해커톤에 완벽하게 적합합니다**:

- ✅ 빠른 개발 속도 (shadcn/ui, TanStack Query)
- ✅ 안정성 보장 (모든 라이브러리 프로덕션 검증)
- ✅ FastAPI와 완벽한 통합 (OpenAPI → TypeScript)
- ✅ 타입 안전성 (TypeScript + 자동 생성)
- ✅ 우수한 성능 (~250KB, 60fps)
- ✅ 풍부한 커뮤니티 자료

**자신 있게 개발을 시작하세요! 해커톤 우승을 기원합니다! 🏆**

---

## 문의

기술 스택 관련 질문이나 구현 중 문제가 발생하면:

1. [FRONTEND_SETUP_GUIDE.md](./FRONTEND_SETUP_GUIDE.md)의 "문제 해결" 섹션 참고
2. [FRONTEND_STACK_RECOMMENDATION.md](./FRONTEND_STACK_RECOMMENDATION.md)의 상세 분석 참고
3. 각 라이브러리 공식 문서 참고

---

**작성일**: 2025-01-29
**프로젝트**: SureSoft 자산관리 시스템 (슈커톤 해커톤)
**상태**: ✅ 검토 완료, 바로 사용 가능
