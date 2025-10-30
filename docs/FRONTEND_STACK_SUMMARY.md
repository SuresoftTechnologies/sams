# 프론트엔드 기술 스택 - 빠른 참조

## 핵심 변경사항 요약

| 항목 | 원래 제안 | 최종 권장 | 변경 이유 |
|------|-----------|-----------|-----------|
| React Router | v7 | **v6.22+** | v7은 아직 불안정, v6는 검증됨 |
| Tailwind CSS | v4 | **v3.4+** | v4는 Beta, v3.4가 프로덕션 레디 |
| Vite | 7.0 | **6.x** | 7.0은 아직 미출시, 6.x가 최신 안정화 |
| Zod | v4 | **v3.22+** | v4는 아직 미출시 |

## 평가 결과

### ✅ 그대로 유지 (우수함)
- React 18.3
- TypeScript 5.3+
- shadcn/ui + Radix UI
- TanStack Query v5
- React Hook Form
- Zustand
- date-fns
- lucide-react
- pnpm + Turborepo

### ⚠️ 버전 조정 필요
- React Router v7 → v6.22
- Tailwind v4 → v3.4
- Vite 7.0 → 6.x
- Zod v4 → v3.22

### ➕ 추가 필요
- **QR코드**: qrcode.react, @zxing/browser
- **테이블**: @tanstack/react-table, @tanstack/react-virtual
- **차트**: recharts
- **날짜**: react-day-picker
- **알림**: sonner

---

## 선택 이유 한 줄 요약

| 라이브러리 | 선택 이유 |
|-----------|-----------|
| shadcn/ui | 복사-붙여넣기로 빠른 개발 + 완전한 커스터마이징 |
| TanStack Query | 서버 상태 관리의 표준, 자동 캐싱 |
| React Hook Form | 성능 최적화된 폼 (uncontrolled) |
| Zod | FastAPI Pydantic과 개념적 일치 |
| TanStack Table | Headless 테이블, 1,000+ 아이템 처리 |
| React Router v6 | 안정적, Data APIs 지원 |
| Zustand | Redux보다 10배 간단 |

---

## 번들 사이즈 예상

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

**목표**: < 300KB (달성 가능)

---

## 해커톤 적합성

| 평가 항목 | 점수 | 비고 |
|----------|------|------|
| 개발 속도 | 9.5/10 | shadcn/ui로 컴포넌트 즉시 사용 |
| 학습 곡선 | 9/10 | 대부분의 개발자가 익숙함 |
| 안정성 | 10/10 | 모든 라이브러리 프로덕션 검증됨 |
| 백엔드 통합 | 10/10 | FastAPI와 완벽한 시너지 |
| 성능 | 9/10 | 1,000+ 자산도 부드럽게 처리 |
| 타입 안전성 | 10/10 | OpenAPI → TypeScript 자동 생성 |

**종합 점수**: 9.6/10 (매우 우수)

---

## 타임라인 예상

| 작업 | 소요 시간 |
|------|-----------|
| 프로젝트 설정 | 1시간 |
| 레이아웃 구성 | 2시간 |
| 자산 목록 (테이블) | 3시간 |
| 자산 등록/수정 (폼) | 3시간 |
| QR코드 기능 | 2시간 |
| 체크인/아웃 | 3시간 |
| 대시보드 (차트) | 2시간 |
| 통합 테스트 | 2시간 |
| **총계** | **18시간** (2-3일) |

---

## 빠른 시작 가이드

### 1. 의존성 설치
```bash
cd /Users/chsong/Documents/my-projects/suresoft-sams/apps/frontend
pnpm install
```

### 2. shadcn/ui 설정
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button form table dialog input
```

### 3. 개발 시작
```bash
# 프론트엔드만
pnpm dev

# 전체 모노레포 (백엔드 + 프론트엔드)
cd ../..
pnpm dev
```

---

## 주의사항

1. **React Router v7 사용 금지**: 아직 불안정함
2. **Tailwind v4 사용 금지**: 베타 버전임
3. **TypeScript strict 모드**: 해커톤에서는 너무 엄격할 수 있음
4. **번들 사이즈 모니터링**: `vite-bundle-visualizer` 사용 권장

---

## 대안 라이브러리 비교

### UI 프레임워크
| 라이브러리 | 번들 사이즈 | 커스터마이징 | 접근성 | 해커톤 적합성 |
|-----------|-------------|--------------|--------|---------------|
| **shadcn/ui** | ✅ 작음 | ✅ 완전 자유 | ✅ 자동 | ✅ 매우 높음 |
| Material-UI | ❌ 무거움 | ⚠️ 제한적 | ✅ 좋음 | ⚠️ 중간 |
| Ant Design | ⚠️ 중간 | ❌ 어려움 | ✅ 좋음 | ⚠️ 중간 |
| Chakra UI | ⚠️ 중간 | ✅ 좋음 | ✅ 좋음 | ✅ 높음 |

### 서버 상태 관리
| 라이브러리 | 기능 | 타입 안전성 | Devtools | 추천 |
|-----------|------|-------------|----------|------|
| **TanStack Query** | ✅ 풍부 | ✅ 우수 | ✅ 있음 | ✅ |
| SWR | ⚠️ 기본적 | ⚠️ 보통 | ❌ 없음 | ⚠️ |
| RTK Query | ✅ 풍부 | ✅ 우수 | ✅ 있음 | ⚠️ (무거움) |

### 폼 라이브러리
| 라이브러리 | 성능 | 사용성 | 타입 안전성 | 추천 |
|-----------|------|--------|-------------|------|
| **React Hook Form** | ✅ 최고 | ✅ 우수 | ✅ 우수 | ✅ |
| Formik | ⚠️ 느림 | ✅ 좋음 | ⚠️ 보통 | ❌ |

---

## 성능 최적화 팁

1. **Code Splitting**: React.lazy로 라우트별 분리
   ```typescript
   const Dashboard = lazy(() => import('./pages/Dashboard'));
   ```

2. **TanStack Virtual**: 큰 리스트에 필수
   ```typescript
   const rowVirtualizer = useVirtualizer({
     count: 1000,
     getScrollElement: () => parentRef.current,
     estimateSize: () => 50,
   });
   ```

3. **React.memo**: 불필요한 리렌더링 방지
   ```typescript
   export const AssetRow = memo(({ asset }) => {...});
   ```

4. **Debounce**: 검색 입력 최적화
   ```typescript
   const debouncedSearch = useMemo(
     () => debounce(handleSearch, 300),
     []
   );
   ```

---

## 접근성 자동 보장 (Radix UI)

shadcn/ui는 Radix UI 기반이므로 다음이 자동으로 보장됩니다:

- ✅ ARIA labels
- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ Focus management
- ✅ Screen reader support

**수동 확인 필요**:
- Color contrast (WCAG AA: 4.5:1)
- Text alternatives for images

---

## 최종 권장사항

### 1. 반드시 변경
- React Router v7 → v6
- Tailwind v4 → v3.4
- Vite 7.0 → 6.x
- Zod v4 → v3.22

### 2. 반드시 추가
- QR코드 라이브러리
- TanStack Table + Virtual
- recharts (대시보드)

### 3. 선택적 추가
- xlsx (Excel 임포트/익스포트)
- jspdf (PDF 리포트)
- @hello-pangea/dnd (드래그앤드롭)

---

## 결론

원래 제안된 스택은 **80%가 우수**했지만, **최신 버전의 불안정성**으로 인해 조정이 필요합니다.

**최종 스택은 해커톤에 완벽하게 적합합니다**:
- ✅ 빠른 개발 속도
- ✅ 안정성 보장
- ✅ FastAPI와 완벽한 통합
- ✅ 타입 안전성
- ✅ 우수한 성능
- ✅ 풍부한 커뮤니티 자료

**자신 있게 개발을 시작하세요!**

---

**상세 문서**: `/Users/chsong/Documents/my-projects/suresoft-sams/docs/FRONTEND_STACK_RECOMMENDATION.md`

**package.json**: `/Users/chsong/Documents/my-projects/suresoft-sams/docs/frontend-package.json`
