import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

/**
 * User Management Hooks
 *
 * Custom hooks for user operations using TanStack Query
 */

// Re-export User type from api-client
export type { User } from '@sams/api-client';

/**
 * Fetch all users with pagination and filtering
 */
export function useGetUsers(params?: {
  skip?: number;
  limit?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => api.users.list(params),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Fetch single user by ID
 */
export function useGetUser(id: string) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => api.users.get(id),
    enabled: !!id,
    staleTime: 60 * 1000, // 1 minute
  });
}
