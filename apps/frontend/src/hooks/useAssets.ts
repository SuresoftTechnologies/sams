import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import type { AssetFormData } from '@/lib/validators';

/**
 * Asset Management Hooks
 *
 * Custom hooks for asset CRUD operations using TanStack Query
 * - useGetAssets: Fetch assets list
 * - useGetAsset: Fetch single asset
 * - useCreateAsset: Create new asset
 * - useUpdateAsset: Update existing asset
 * - useDeleteAsset: Delete asset
 *
 * TODO Phase 12: Connect to actual API endpoints using @sams/api-client
 */

export interface Asset {
  id: string;
  name: string;
  serialNumber?: string;
  description?: string;
  categoryId: string;
  categoryName?: string;
  locationId: string;
  locationName?: string;
  status: 'available' | 'in_use' | 'maintenance' | 'retired';
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyUntil?: string;
  createdAt: string;
  updatedAt: string;
}

interface AssetsResponse {
  data: Asset[];
  total: number;
  page: number;
  pageSize: number;
}

// Mock data
const mockAssets: Asset[] = [
  {
    id: '1',
    name: 'MacBook Pro 16"',
    serialNumber: 'MBP123456',
    description: 'High-performance laptop for development',
    categoryId: 'cat-1',
    categoryName: 'Computer',
    locationId: 'loc-1',
    locationName: 'Office 1F',
    status: 'available',
    purchaseDate: '2024-01-15',
    purchasePrice: 2500000,
    warrantyUntil: '2027-01-15',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '2',
    name: 'Dell Monitor 27"',
    serialNumber: 'MON987654',
    categoryId: 'cat-2',
    categoryName: 'Monitor',
    locationId: 'loc-1',
    locationName: 'Office 1F',
    status: 'in_use',
    purchaseDate: '2024-02-01',
    purchasePrice: 450000,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
];

// Mock API calls
const fetchAssets = async (): Promise<AssetsResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    data: mockAssets,
    total: mockAssets.length,
    page: 1,
    pageSize: 10,
  };
};

const fetchAsset = async (id: string): Promise<Asset> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const asset = mockAssets.find((a) => a.id === id);
  if (!asset) throw new Error('Asset not found');
  return asset;
};

const createAsset = async (data: AssetFormData): Promise<Asset> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return {
    id: String(Date.now()),
    name: data.name,
    serialNumber: data.serialNumber,
    description: data.description,
    categoryId: data.categoryId,
    categoryName: 'Computer',
    locationId: data.locationId,
    locationName: 'Office 1F',
    status: 'available',
    purchaseDate: data.purchaseDate,
    purchasePrice: data.purchasePrice ?? undefined,
    warrantyUntil: data.warrantyUntil,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

const updateAsset = async ({ id, data }: { id: string; data: AssetFormData }): Promise<Asset> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const asset = mockAssets.find((a) => a.id === id);
  if (!asset) throw new Error('Asset not found');
  return {
    ...asset,
    ...data,
    purchasePrice: data.purchasePrice ?? undefined,
    updatedAt: new Date().toISOString(),
  };
};

const deleteAsset = async (id: string): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  const index = mockAssets.findIndex((a) => a.id === id);
  if (index === -1) throw new Error('Asset not found');
};

/**
 * Fetch all assets
 */
export function useGetAssets() {
  return useQuery({
    queryKey: ['assets'],
    queryFn: fetchAssets,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch single asset by ID
 */
export function useGetAsset(id: string) {
  return useQuery({
    queryKey: ['asset', id],
    queryFn: () => fetchAsset(id),
    enabled: !!id,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Create new asset
 */
export function useCreateAsset() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAsset,
    onSuccess: (data) => {
      // Invalidate assets list to refetch
      queryClient.invalidateQueries({ queryKey: ['assets'] });

      toast.success('Asset created successfully', {
        description: `${data.name} has been added to the system.`,
      });

      // Navigate to asset detail page
      navigate(`/assets/${data.id}`);
    },
    onError: (error: Error) => {
      toast.error('Failed to create asset', {
        description: error.message,
      });
    },
  });
}

/**
 * Update existing asset
 */
export function useUpdateAsset(id: string) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AssetFormData) => updateAsset({ id, data }),
    onSuccess: (data) => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset', id] });

      toast.success('Asset updated successfully', {
        description: `${data.name} has been updated.`,
      });

      // Navigate to asset detail page
      navigate(`/assets/${id}`);
    },
    onError: (error: Error) => {
      toast.error('Failed to update asset', {
        description: error.message,
      });
    },
  });
}

/**
 * Delete asset
 */
export function useDeleteAsset() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => {
      // Invalidate assets list
      queryClient.invalidateQueries({ queryKey: ['assets'] });

      toast.success('Asset deleted successfully');

      // Navigate to assets list
      navigate('/assets');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete asset', {
        description: error.message,
      });
    },
  });
}
