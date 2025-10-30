import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

/**
 * Location Management Hooks
 *
 * Custom hooks for location operations
 */

/**
 * Fetch all locations
 */
export function useGetLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: () => api.locations.list(),
    staleTime: 5 * 60 * 1000, // 5 minutes - locations don't change often
  });
}