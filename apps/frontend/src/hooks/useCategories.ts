import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

/**
 * Category Management Hooks
 *
 * Custom hooks for category operations
 */

/**
 * Fetch all categories
 */
export function useGetCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.list(),
    staleTime: 5 * 60 * 1000, // 5 minutes - categories don't change often
  });
}