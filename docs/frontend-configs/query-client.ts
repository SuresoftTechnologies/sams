// src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5분간 캐시 유지
      staleTime: 1000 * 60 * 5,

      // 실패시 1번만 재시도
      retry: 1,

      // 백그라운드에서 자동 재검증
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,

      // 에러 핸들링
      throwOnError: false,
    },
    mutations: {
      // 실패시 재시도 없음
      retry: 0,

      // 에러 핸들링
      throwOnError: false,
    },
  },
});
