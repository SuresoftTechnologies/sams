import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@sams/api-client';
import { useGetAssets } from './useAssets';

/**
 * Dashboard Statistics Hook
 *
 * Uses backend statistics API for efficient server-side aggregation
 */

export interface DashboardStats {
  // Total counts
  totalAssets: number;
  totalCategories: number;
  totalLocations: number;

  // Status distribution
  statusDistribution: {
    issued: number;
    loaned: number;
    general: number;
    stock: number;
    server_room: number;
    disposed: number;
  };

  // Category distribution (top categories)
  categoryDistribution: Array<{
    id: string;
    name: string;
    count: number;
    percentage: number;
  }>;

  // Location distribution (top 10 locations)
  locationDistribution: Array<{
    id: string;
    name: string;
    count: number;
  }>;

  // Recent assets
  recentAssets: Array<{
    id: string;
    asset_tag: string;
    model?: string;
    status: string;
    category_name?: string;
    created_at: string;
  }>;
}

/**
 * Hook to fetch and calculate dashboard statistics
 * Now uses backend statistics API for better performance
 */
export function useDashboardStats() {
  // Fetch overview statistics from backend
  const { data: overview, isLoading: overviewLoading, error: overviewError } = useQuery({
    queryKey: ['statistics', 'overview'],
    queryFn: () => apiClient.statistics.overview(),
    staleTime: 60 * 1000, // 1 minute
  });

  // Fetch category distribution from backend
  const { data: categoryStats, isLoading: categoryLoading } = useQuery({
    queryKey: ['statistics', 'categories'],
    queryFn: () => apiClient.statistics.assetsByCategory(),
    staleTime: 60 * 1000, // 1 minute
  });

  // Fetch location distribution from backend
  const { data: locationStats, isLoading: locationLoading } = useQuery({
    queryKey: ['statistics', 'locations'],
    queryFn: () => apiClient.statistics.assetsByLocation(),
    staleTime: 60 * 1000, // 1 minute
  });

  // Fetch recent assets (only 5 items, sorted by created_at desc)
  const { data: recentAssetsData, isLoading: recentAssetsLoading } = useGetAssets({
    limit: 5,
    sort_by: 'created_at',
    sort_order: 'desc',
  });

  // Combine all data
  const stats: DashboardStats | null =
    overview && categoryStats && locationStats && recentAssetsData
      ? {
          // Total counts from overview API
          totalAssets: overview.total_assets,
          totalCategories: overview.total_categories,
          totalLocations: overview.total_locations,

          // Status distribution from overview API
          statusDistribution: {
            issued: overview.assets_by_status.issued || 0,
            loaned: overview.assets_by_status.loaned || 0,
            general: overview.assets_by_status.general || 0,
            stock: overview.assets_by_status.stock || 0,
            server_room: overview.assets_by_status.server_room || 0,
            disposed: overview.assets_by_status.disposed || 0,
          },

          // Category distribution from category stats API
          categoryDistribution: categoryStats.map(cat => ({
            id: cat.category_id,
            name: cat.category_name,
            count: cat.asset_count,
            percentage: overview.total_assets > 0
              ? Math.round((cat.asset_count / overview.total_assets) * 100)
              : 0,
          })).sort((a, b) => b.count - a.count), // Sort by count descending

          // Location distribution from location stats API (top 10)
          locationDistribution: locationStats
            .map(loc => ({
              id: loc.location_id,
              name: loc.location_name,
              count: loc.asset_count,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10), // Top 10

          // Recent assets
          recentAssets: recentAssetsData.items.map(asset => ({
            id: asset.id,
            asset_tag: asset.asset_tag,
            model: asset.model,
            status: asset.status,
            category_name: asset.category_name,
            created_at: asset.created_at,
          })),
        }
      : null;

  return {
    data: stats,
    isLoading: overviewLoading || categoryLoading || locationLoading || recentAssetsLoading,
    error: overviewError,
  };
}
