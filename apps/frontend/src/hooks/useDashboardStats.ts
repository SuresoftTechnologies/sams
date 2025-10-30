import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useGetAssets } from './useAssets';
import { useGetCategories } from './useCategories';
import { useGetLocations } from './useLocations';
import { useMemo } from 'react';

/**
 * Dashboard Statistics Hook
 *
 * Aggregates data from multiple sources to provide dashboard statistics
 */

export interface DashboardStats {
  // Total counts
  totalAssets: number;
  totalCategories: number;
  totalLocations: number;

  // Status distribution
  statusDistribution: {
    available: number;
    in_use: number;
    maintenance: number;
    retired: number;
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
    name: string;
    asset_tag: string;
    status: string;
    category_name?: string;
    created_at: string;
  }>;
}

/**
 * Hook to fetch and calculate dashboard statistics
 */
export function useDashboardStats() {
  // Fetch all data (we need full data for aggregation)
  // Backend allows up to 5000 items per page
  const { data: assetsData, isLoading: assetsLoading, error: assetsError } = useGetAssets({ limit: 3000 });
  const { data: categoriesData, isLoading: categoriesLoading } = useGetCategories();
  const { data: locationsData, isLoading: locationsLoading } = useGetLocations();

  // Check if using statistics API endpoint
  const { data: statsApiData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.statistics.dashboard(),
    staleTime: 60 * 1000, // 1 minute
    retry: false, // Don't retry if endpoint doesn't exist
    enabled: false, // Disabled for now, using client-side aggregation
  });

  // Calculate statistics from assets data
  const stats = useMemo<DashboardStats | null>(() => {
    if (!assetsData || !categoriesData || !locationsData) {
      return null;
    }

    // Ensure data is in correct format
    const categories = Array.isArray(categoriesData) ? categoriesData : [];
    const locations = Array.isArray(locationsData) ? locationsData : [];

    if (categories.length === 0 || locations.length === 0) {
      console.warn('Categories or locations data is empty or invalid format');
      return null;
    }

    const assets = assetsData.items;

    // Status distribution
    const statusDistribution = {
      available: assets.filter(a => a.status === 'available').length,
      in_use: assets.filter(a => a.status === 'in_use').length,
      maintenance: assets.filter(a => a.status === 'maintenance').length,
      retired: assets.filter(a => a.status === 'retired').length,
    };

    // Category distribution
    const categoryMap = new Map<string, { name: string; count: number }>();
    assets.forEach(asset => {
      const category = categories.find(c => c.id === asset.category_id);
      if (category) {
        const existing = categoryMap.get(category.id);
        if (existing) {
          existing.count++;
        } else {
          categoryMap.set(category.id, { name: category.name, count: 1 });
        }
      }
    });

    const categoryDistribution = Array.from(categoryMap.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        count: data.count,
        percentage: Math.round((data.count / assets.length) * 100),
      }))
      .sort((a, b) => b.count - a.count); // Sort by count descending

    // Location distribution (top 10)
    const locationMap = new Map<string, { name: string; count: number }>();
    assets.forEach(asset => {
      const location = locations.find(l => l.id === asset.location_id);
      if (location) {
        const existing = locationMap.get(location.id);
        if (existing) {
          existing.count++;
        } else {
          locationMap.set(location.id, { name: location.name, count: 1 });
        }
      }
    });

    const locationDistribution = Array.from(locationMap.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10

    // Recent assets (latest 5 by created_at)
    const recentAssets = [...assets]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(asset => {
        const category = categories.find(c => c.id === asset.category_id);
        return {
          id: asset.id,
          name: asset.name,
          asset_tag: asset.asset_tag,
          status: asset.status,
          category_name: category?.name,
          created_at: asset.created_at,
        };
      });

    return {
      totalAssets: assetsData.total,
      totalCategories: categories.length,
      totalLocations: locations.length,
      statusDistribution,
      categoryDistribution,
      locationDistribution,
      recentAssets,
    };
  }, [assetsData, categoriesData, locationsData]);

  return {
    data: stats,
    isLoading: assetsLoading || categoriesLoading || locationsLoading,
    error: assetsError,
  };
}
