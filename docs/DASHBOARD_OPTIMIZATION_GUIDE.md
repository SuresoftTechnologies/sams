# SAMS 대시보드 최적화 가이드

## 빠른 참조

### 성능 최적화 패턴

#### 1. 컴포넌트 메모이제이션

```typescript
import { memo } from 'react';

// 간단한 비교 (shallow comparison)
export const MyChart = memo(function MyChart(props) {
  return <div>{/* 차트 내용 */}</div>;
});

// 커스텀 비교 함수 (deep comparison)
const arePropsEqual = (prevProps, nextProps) => {
  return (
    prevProps.data.length === nextProps.data.length &&
    prevProps.onClick === nextProps.onClick
  );
};

export const MyChart = memo(function MyChart(props) {
  return <div>{/* 차트 내용 */}</div>;
}, arePropsEqual);
```

#### 2. 데이터 변환 캐싱

```typescript
import { useMemo } from 'react';

function MyComponent({ rawData }) {
  // ❌ Bad: 매번 재계산
  const chartData = rawData.filter(/* ... */).map(/* ... */);

  // ✅ Good: 의존성 변경시만 재계산
  const chartData = useMemo(() => {
    return rawData
      .filter(item => item.value > 0)
      .map(item => transformItem(item));
  }, [rawData]);

  return <Chart data={chartData} />;
}
```

#### 3. 이벤트 핸들러 최적화

```typescript
import { useCallback } from 'react';

function Dashboard() {
  const navigate = useNavigate();

  // ❌ Bad: 매번 새 함수 생성
  const handleClick = (id) => {
    navigate(`/detail/${id}`);
  };

  // ✅ Good: 함수 재사용
  const handleClick = useCallback((id) => {
    navigate(`/detail/${id}`);
  }, [navigate]);

  return <Chart onClick={handleClick} />;
}
```

#### 4. Lazy Loading

```typescript
import { lazy, Suspense } from 'react';

// 동적 import
const HeavyChart = lazy(() => import('./HeavyChart'));

function Dashboard() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <HeavyChart data={data} />
    </Suspense>
  );
}
```

### 접근성 패턴

#### 1. 차트 ARIA 속성

```typescript
function Chart({ data, title }) {
  const accessibleSummary = useMemo(() => {
    return data.map(item => `${item.label}: ${item.value}`).join(', ');
  }, [data]);

  return (
    <div
      role="img"
      aria-labelledby="chart-title"
      aria-describedby="chart-desc"
    >
      <h3 id="chart-title">{title}</h3>
      <ResponsiveContainer>{/* 차트 */}</ResponsiveContainer>

      {/* 스크린 리더용 설명 */}
      <p id="chart-desc" className="sr-only">
        {accessibleSummary}
      </p>
    </div>
  );
}
```

#### 2. 키보드 네비게이션

```typescript
function InteractiveChart({ onItemClick }) {
  const handleKeyDown = (event, itemId) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onItemClick(itemId);
    }
  };

  return (
    <div>
      {items.map(item => (
        <div
          key={item.id}
          tabIndex={0}
          role="button"
          aria-label={`${item.label}: ${item.value}, 클릭하여 상세보기`}
          onClick={() => onItemClick(item.id)}
          onKeyDown={(e) => handleKeyDown(e, item.id)}
          className="focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}
```

#### 3. 스크린 리더용 데이터 테이블

```typescript
function ChartWithTable({ data }) {
  return (
    <>
      {/* 시각적 차트 */}
      <div role="img" aria-label="차트">
        <Chart data={data} />
      </div>

      {/* 스크린 리더용 테이블 */}
      <table className="sr-only" aria-label="차트 데이터">
        <caption>데이터 상세 정보</caption>
        <thead>
          <tr>
            <th scope="col">항목</th>
            <th scope="col">값</th>
          </tr>
        </thead>
        <tbody>
          {data.map(item => (
            <tr key={item.id}>
              <th scope="row">{item.label}</th>
              <td>{item.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
```

#### 4. 동적 콘텐츠 알림

```typescript
function FilterPanel({ activeFilters }) {
  return (
    <div>
      <div className="flex gap-2">
        {activeFilters.map(filter => (
          <Badge key={filter.id}>
            {filter.label}
            <button
              onClick={() => removeFilter(filter.id)}
              aria-label={`${filter.label} 필터 제거`}
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </Badge>
        ))}
      </div>

      {/* 스크린 리더 알림 */}
      <div className="sr-only" role="status" aria-live="polite">
        {activeFilters.length}개의 필터가 적용되었습니다
      </div>
    </div>
  );
}
```

### 다크 모드 패턴

#### 1. 색상 정의

```typescript
// HSL 색상 사용 (명도 조절 용이)
const CHART_COLORS = {
  primary: 'hsl(217, 91%, 60%)',     // 라이트 모드
  primaryDark: 'hsl(217, 91%, 65%)', // 다크 모드 (더 밝게)
};

// Tailwind 클래스 사용
const bgColor = 'bg-blue-50 dark:bg-blue-950/50';
const textColor = 'text-blue-600 dark:text-blue-500';
```

#### 2. 차트 색상

```typescript
function ThemedChart({ data }) {
  // Recharts는 HSL 직접 사용
  return (
    <LineChart data={data}>
      <Line
        stroke="hsl(217, 91%, 60%)"  // 다크 모드 대응 밝기
        strokeWidth={2}
      />
    </LineChart>
  );
}
```

#### 3. 툴팁 테마

```typescript
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="bg-popover border border-border rounded-lg shadow-lg p-3"
      role="tooltip"
    >
      <p className="font-semibold text-foreground">{payload[0].name}</p>
      <p className="text-muted-foreground">{payload[0].value}</p>
    </div>
  );
}
```

## 체크리스트

### 성능 최적화
- [ ] React.memo로 컴포넌트 래핑
- [ ] useMemo로 무거운 연산 캐싱
- [ ] useCallback로 이벤트 핸들러 최적화
- [ ] Lazy loading으로 코드 스플리팅
- [ ] Suspense로 로딩 상태 처리

### 접근성
- [ ] 모든 차트에 role="img"
- [ ] aria-labelledby로 제목 연결
- [ ] aria-describedby로 설명 연결
- [ ] 키보드 네비게이션 지원 (Tab, Enter, Space)
- [ ] 포커스 스타일 명확화 (focus:ring-2)
- [ ] 스크린 리더용 데이터 테이블 제공
- [ ] aria-live로 동적 업데이트 알림
- [ ] aria-hidden으로 장식 요소 숨김
- [ ] 색상 대비 4.5:1 이상

### 다크 모드
- [ ] HSL 색상으로 정의
- [ ] 다크 모드에서 명도 증가
- [ ] bg-popover, border-border 사용
- [ ] text-foreground, text-muted-foreground 사용
- [ ] 투명도 조정 (dark:bg-blue-950/50)

## 디버깅 팁

### 1. 리렌더링 추적

```typescript
// React DevTools Profiler 사용
// 또는 커스텀 훅으로 추적
function useWhyDidYouUpdate(name, props) {
  const previousProps = useRef();

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps = {};

      allKeys.forEach(key => {
        if (previousProps.current[key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current[key],
            to: props[key]
          };
        }
      });

      if (Object.keys(changedProps).length) {
        console.log('[why-did-you-update]', name, changedProps);
      }
    }

    previousProps.current = props;
  });
}
```

### 2. 접근성 테스트

```bash
# Chrome DevTools
1. Lighthouse > Accessibility 실행
2. Issues 탭에서 접근성 문제 확인

# axe DevTools 확장 프로그램 사용
# https://www.deque.com/axe/devtools/
```

### 3. 성능 측정

```typescript
// Performance API 사용
const startTime = performance.now();
// ... 무거운 작업
const endTime = performance.now();
console.log(`소요 시간: ${endTime - startTime}ms`);

// React DevTools Profiler 컴포넌트
import { Profiler } from 'react';

<Profiler id="Chart" onRender={(id, phase, actualDuration) => {
  console.log(`${id} (${phase}): ${actualDuration}ms`);
}}>
  <Chart data={data} />
</Profiler>
```

## 일반적인 실수

### ❌ 피해야 할 패턴

```typescript
// 1. 인라인 함수 (메모이제이션 무효화)
<Chart onClick={(id) => navigate(`/detail/${id}`)} />

// 2. 인라인 객체/배열 (항상 새 참조)
<Chart config={{ color: 'blue' }} />
<Chart items={data.filter(x => x.active)} />

// 3. useMemo 없이 무거운 연산
const sortedData = data.sort().reverse().filter(/* ... */);

// 4. useCallback 없이 의존성 배열에 함수
useEffect(() => {
  fetchData();
}, [fetchData]); // fetchData가 매번 새로 생성됨
```

### ✅ 올바른 패턴

```typescript
// 1. useCallback으로 함수 메모이제이션
const handleClick = useCallback((id) => {
  navigate(`/detail/${id}`);
}, [navigate]);
<Chart onClick={handleClick} />

// 2. useMemo로 객체/배열 메모이제이션
const config = useMemo(() => ({ color: 'blue' }), []);
const items = useMemo(() => data.filter(x => x.active), [data]);

// 3. useMemo로 무거운 연산 캐싱
const sortedData = useMemo(() => {
  return data.sort().reverse().filter(/* ... */);
}, [data]);

// 4. useCallback으로 함수 안정화
const fetchData = useCallback(() => {
  // ...
}, []);
useEffect(() => {
  fetchData();
}, [fetchData]);
```

## 추가 리소스

### 공식 문서
- [React.memo](https://react.dev/reference/react/memo)
- [useMemo](https://react.dev/reference/react/useMemo)
- [useCallback](https://react.dev/reference/react/useCallback)
- [lazy](https://react.dev/reference/react/lazy)
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)

### 도구
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Lighthouse](https://developer.chrome.com/docs/lighthouse)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)

### 테스팅
- [Jest](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright](https://playwright.dev/)
- [jest-axe](https://github.com/nickcolley/jest-axe)

---

**마지막 업데이트:** 2025-10-31
**버전:** 1.0.0
