/**
 * Hook to fetch count of unviewed completed workflows for the current user.
 *
 * Returns the number of workflows requested by the current user
 * that have been approved or rejected but not yet viewed.
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useRole } from './useRole';

interface UnviewedCountResponse {
  count: number;
}

export function useMyUnviewedCompletedCount() {
  const { role } = useRole();

  // Only fetch for employees (admin/manager don't need this notification)
  const enabled = role === 'employee';

  return useQuery({
    queryKey: ['workflows', 'my-unviewed-count'],
    queryFn: async () => {
      const response = await apiClient.get<UnviewedCountResponse>('/api/v1/workflows/my-unviewed-count');
      return response.count;
    },
    enabled,
    staleTime: 20 * 1000, // 20 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    placeholderData: 0, // Show 0 while loading
  });
}
