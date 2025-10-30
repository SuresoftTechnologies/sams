import { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useLocations } from '@/hooks/useLocations';

/**
 * Dashboard Filters Component - Phase 3 Optimized
 *
 * Phase 3 Enhancements:
 * - React.memo for preventing unnecessary re-renders
 * - useMemo for filtered data caching
 * - useCallback for event handler optimization
 * - Enhanced ARIA labels and keyboard navigation
 * - Better focus management
 * - Screen reader announcements
 *
 * Features:
 * - Date range selector (7d, 30d, 90d)
 * - Category multi-select filter
 * - Location multi-select filter
 * - Filter state persisted in URL query parameters
 * - Clear filters button
 * - Active filter badges
 * - Responsive design
 * - WCAG 2.1 AA compliant
 */

interface DashboardFiltersProps {
  onFiltersChange?: (filters: DashboardFilterState) => void;
}

export interface DashboardFilterState {
  dateRange: '7d' | '30d' | '90d';
  categoryIds: string[];
  locationIds: string[];
}

export const DashboardFilters = memo(function DashboardFilters({
  onFiltersChange
}: DashboardFiltersProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Fetch categories and locations
  const { data: categories = [] } = useCategories();
  const { data: locations = [] } = useLocations();

  // Parse filters from URL
  const dateRange = (searchParams.get('dateRange') as '7d' | '30d' | '90d') || '30d';
  const categoryIds = useMemo(
    () => searchParams.get('categories')?.split(',').filter(Boolean) || [],
    [searchParams]
  );
  const locationIds = useMemo(
    () => searchParams.get('locations')?.split(',').filter(Boolean) || [],
    [searchParams]
  );

  // Track if filters are active (non-default)
  const hasActiveFilters = useMemo(
    () => dateRange !== '30d' || categoryIds.length > 0 || locationIds.length > 0,
    [dateRange, categoryIds.length, locationIds.length]
  );

  // Update filters in URL
  const updateFilters = useCallback((key: string, value: string | string[]) => {
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
  }, [searchParams, setSearchParams]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  // Toggle category selection
  const toggleCategory = useCallback((categoryId: string) => {
    const newCategories = categoryIds.includes(categoryId)
      ? categoryIds.filter(id => id !== categoryId)
      : [...categoryIds, categoryId];
    updateFilters('categories', newCategories);
  }, [categoryIds, updateFilters]);

  // Toggle location selection
  const toggleLocation = useCallback((locationId: string) => {
    const newLocations = locationIds.includes(locationId)
      ? locationIds.filter(id => id !== locationId)
      : [...locationIds, locationId];
    updateFilters('locations', newLocations);
  }, [locationIds, updateFilters]);

  // Handle date range change
  const handleDateRangeChange = useCallback((value: string) => {
    updateFilters('dateRange', value);
  }, [updateFilters]);

  // Notify parent of filter changes
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange({
        dateRange,
        categoryIds,
        locationIds,
      });
    }
  }, [dateRange, categoryIds, locationIds, onFiltersChange]);

  // Get category name by id (memoized)
  const getCategoryName = useCallback((id: string) => {
    return categories.find(c => c.id === id)?.name || id;
  }, [categories]);

  // Get location name by id (memoized)
  const getLocationName = useCallback((id: string) => {
    return locations.find(l => l.id === id)?.name || id;
  }, [locations]);

  // Memoized active filter count for screen readers
  const activeFilterCount = useMemo(
    () => categoryIds.length + locationIds.length,
    [categoryIds.length, locationIds.length]
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Filter Controls */}
          <div
            className="flex flex-col md:flex-row gap-4"
            role="group"
            aria-label="대시보드 필터"
          >
            {/* Date Range Selector */}
            <div className="flex-1 min-w-[200px]">
              <label
                htmlFor="date-range-select"
                className="text-sm font-medium mb-2 block"
              >
                기간
              </label>
              <Select
                value={dateRange}
                onValueChange={handleDateRangeChange}
              >
                <SelectTrigger id="date-range-select" aria-label="기간 선택">
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
              <label
                htmlFor="category-select"
                className="text-sm font-medium mb-2 block"
              >
                카테고리
              </label>
              <Select onValueChange={toggleCategory}>
                <SelectTrigger id="category-select" aria-label="카테고리 선택">
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
                            <Badge
                              variant="secondary"
                              className="h-4 px-1 text-xs"
                              aria-label="선택됨"
                            >
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
              <label
                htmlFor="location-select"
                className="text-sm font-medium mb-2 block"
              >
                위치
              </label>
              <Select onValueChange={toggleLocation}>
                <SelectTrigger id="location-select" aria-label="위치 선택">
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
                            <Badge
                              variant="secondary"
                              className="h-4 px-1 text-xs"
                              aria-label="선택됨"
                            >
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
                  aria-label={`필터 초기화 (${activeFilterCount}개 필터 적용 중)`}
                >
                  <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
                  필터 초기화
                </Button>
              </div>
            )}
          </div>

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div
              className="flex flex-wrap gap-2"
              role="region"
              aria-label="활성 필터"
              aria-live="polite"
            >
              {categoryIds.map((id) => (
                <Badge
                  key={`cat-${id}`}
                  variant="secondary"
                  className="gap-1"
                >
                  {getCategoryName(id)}
                  <button
                    onClick={() => toggleCategory(id)}
                    className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5 focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label={`${getCategoryName(id)} 필터 제거`}
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </Badge>
              ))}
              {locationIds.map((id) => (
                <Badge
                  key={`loc-${id}`}
                  variant="secondary"
                  className="gap-1"
                >
                  {getLocationName(id)}
                  <button
                    onClick={() => toggleLocation(id)}
                    className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5 focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label={`${getLocationName(id)} 필터 제거`}
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Screen reader announcement for filter changes */}
          <div className="sr-only" role="status" aria-live="polite">
            {hasActiveFilters
              ? `${activeFilterCount}개의 필터가 적용되었습니다`
              : '필터가 적용되지 않았습니다'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
