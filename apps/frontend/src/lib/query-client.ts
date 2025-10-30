import { QueryClient } from '@tanstack/react-query';

/**
 * TanStack Query Client Configuration
 *
 * Global settings for data fetching, caching, and refetching behavior
 * Includes retry logic and error handling
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 1000 * 60 * 5,
      // Cache data for 10 minutes
      gcTime: 1000 * 60 * 10,
      // Retry failed requests 3 times with exponential backoff
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error instanceof Error && 'status' in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < 3;
      },
      // Refetch on window focus in production
      refetchOnWindowFocus: import.meta.env.PROD,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Global error handler for queries
      throwOnError: false, // We handle errors in onError instead
    },
    mutations: {
      // Retry failed mutations once (except for 4xx errors)
      retry: (failureCount, error) => {
        if (error instanceof Error && 'status' in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < 1;
      },
      // Global error handler for mutations (handled per-mutation for better UX)
    },
  },
});
