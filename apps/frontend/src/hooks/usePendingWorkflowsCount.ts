import { useQuery } from '@tanstack/react-query';
import { workflowService } from '@/services/workflow-service';
import { useRole } from '@/hooks/useRole';

/**
 * Custom hook to fetch the count of pending workflows
 * Only fetches for admin and manager roles
 *
 * @returns Query result with pending count
 */
export function usePendingWorkflowsCount() {
  const { hasRole } = useRole();
  const canViewWorkflows = hasRole('admin', 'manager');

  return useQuery({
    queryKey: ['workflows', 'pending-count'],
    queryFn: async () => {
      // Fetch only pending workflows with minimal data (limit 1 just to get total)
      const result = await workflowService.getAllWorkflows({
        status: 'pending',
        skip: 0,
        limit: 1,
      });
      return result.total || 0;
    },
    // Enable only if user has proper role
    enabled: canViewWorkflows,
    // Refetch every 30 seconds to keep count updated
    refetchInterval: 30000,
    // Keep previous data while refetching for smoother UX
    placeholderData: (previousData) => previousData,
    // Stale time of 20 seconds
    staleTime: 20000,
  });
}
