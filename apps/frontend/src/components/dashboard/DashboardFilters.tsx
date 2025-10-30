import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useLocations } from '@/hooks/useLocations';

/**
 * Dashboard Filters Component
 *
 * Features:
 * - Date range selector (7d, 30d, 90d)
 * - Category multi-select filter
 * - Location multi-select filter
 * - Filter state persisted in URL query parameters
 * - Clear filters button
 * - Active filter badges
 * - Responsive design
 */

interface DashboardFiltersProps {
  onFiltersChange?: (filters: DashboardFilterState) => void;
}

export interface DashboardFilterState {
  dateRange: '7d' | '30d' | '90d';
  categoryIds: string[];
  locationIds: string[];
}

export function DashboardFilters({ onFiltersChange }: DashboardFiltersProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Fetch categories and locations
  const { data: categories = [] } = useCategories();
  const { data: locations = [] } = useLocations();

  // Parse filters from URL
  const dateRange = (searchParams.get('dateRange') as '7d' | '30d' | '90d') || '30d';
  const categoryIds = searchParams.get('categories')?.split(',').filter(Boolean) || [];
  const locationIds = searchParams.get('locations')?.split(',').filter(Boolean) || [];

  // Track if filters are active (non-default)
  const hasActiveFilters = dateRange !== '30d' || categoryIds.length > 0 || locationIds.length > 0;

  // Update filters in URL
  const updateFilters = (key: string, value: string | string[]) => {
    const newParams = new URLSearchParams(searchParams);

    if (Array.isArray(value)) {
      if (value.length > 0) {
        newParams.set(key, value.join(','));
      } else {
        newParams.delete(key);
      }
    } else {
      if (value && value !== '30d') {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    }

    setSearchParams(newParams);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  // Toggle category selection
  const toggleCategory = (categoryId: string) => {
    const newCategories = categoryIds.includes(categoryId)
      ? categoryIds.filter(id => id !== categoryId)
      : [...categoryIds, categoryId];
    updateFilters('categories', newCategories);
  };

  // Toggle location selection
  const toggleLocation = (locationId: string) => {
    const newLocations = locationIds.includes(locationId)
      ? locationIds.filter(id => id !== locationId)
      : [...locationIds, locationId];
    updateFilters('locations', newLocations);
  };

  // Notify parent of filter changes
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange({
        dateRange,
        categoryIds,
        locationIds,
      });
    }
  }, [dateRange, categoryIds.join(','), locationIds.join(','), onFiltersChange]);

  // Get category name by id
  const getCategoryName = (id: string) => {
    return categories.find(c => c.id === id)?.name || id;
  };

  // Get location name by id
  const getLocationName = (id: string) => {
    return locations.find(l => l.id === id)?.name || id;
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Filter Controls */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Date Range Selector */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">
                기간
              </label>
              <Select
                value={dateRange}
                onValueChange={(value) => updateFilters('dateRange', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">최근 7일</SelectItem>
                  <SelectItem value="30d">최근 30일</SelectItem>
                  <SelectItem value="90d">최근 90일</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Selector */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">
                카테고리
              </label>
              <Select onValueChange={toggleCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  {categories.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      카테고리가 없습니다
                    </div>
                  ) : (
                    categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <span>{category.name}</span>
                          {categoryIds.includes(category.id) && (
                            <Badge variant="secondary" className="h-4 px-1 text-xs">
                              선택됨
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Location Selector */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">
                위치
              </label>
              <Select onValueChange={toggleLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="위치 선택" />
                </SelectTrigger>
                <SelectContent>
                  {locations.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      위치가 없습니다
                    </div>
                  ) : (
                    locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        <div className="flex items-center gap-2">
                          <span>{location.name}</span>
                          {locationIds.includes(location.id) && (
                            <Badge variant="secondary" className="h-4 px-1 text-xs">
                              선택됨
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="default"
                  onClick={clearFilters}
                  className="whitespace-nowrap"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  필터 초기화
                </Button>
              </div>
            )}
          </div>

          {/* Active Filters Display */}
          {(categoryIds.length > 0 || locationIds.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {categoryIds.map((id) => (
                <Badge key={`cat-${id}`} variant="secondary" className="gap-1">
                  {getCategoryName(id)}
                  <button
                    onClick={() => toggleCategory(id)}
                    className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {locationIds.map((id) => (
                <Badge key={`loc-${id}`} variant="secondary" className="gap-1">
                  {getLocationName(id)}
                  <button
                    onClick={() => toggleLocation(id)}
                    className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
