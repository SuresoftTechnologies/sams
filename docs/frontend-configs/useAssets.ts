// src/features/assets/api/useAssets.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Asset, AssetCreate, AssetUpdate } from '@/lib/api-client';
import { toast } from 'sonner';

// Query keys
export const assetKeys = {
  all: ['assets'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...assetKeys.lists(), { filters }] as const,
  details: () => [...assetKeys.all, 'detail'] as const,
  detail: (id: string) => [...assetKeys.details(), id] as const,
};

// List assets
export function useAssets(params?: { skip?: number; limit?: number; category?: string }) {
  return useQuery({
    queryKey: assetKeys.list(params || {}),
    queryFn: () => apiClient.assets.list(params),
  });
}

// Get single asset
export function useAsset(id: string) {
  return useQuery({
    queryKey: assetKeys.detail(id),
    queryFn: () => apiClient.assets.get(id),
    enabled: !!id,
  });
}

// Create asset
export function useCreateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AssetCreate) => apiClient.assets.create(data),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      toast.success('자산이 등록되었습니다');
    },
    onError: (error: Error) => {
      toast.error(`등록 실패: ${error.message}`);
    },
  });
}

// Update asset
export function useUpdateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssetUpdate }) =>
      apiClient.assets.update(id, data),
    onSuccess: (data) => {
      // Update cache
      queryClient.setQueryData(assetKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      toast.success('자산이 수정되었습니다');
    },
    onError: (error: Error) => {
      toast.error(`수정 실패: ${error.message}`);
    },
  });
}

// Delete asset
export function useDeleteAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.assets.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      toast.success('자산이 삭제되었습니다');
    },
    onError: (error: Error) => {
      toast.error(`삭제 실패: ${error.message}`);
    },
  });
}
