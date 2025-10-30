import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';
import { ASSET_STATUSES } from '@/lib/constants';
import { useGetCategories } from '@/hooks/useCategories';
import { useGetLocations } from '@/hooks/useLocations';

/**
 * AssetFilters Component
 *
 * Horizontal filtering UI for asset list
 * - Status filter
 * - Category filter
 * - Location filter
 * - Clear all filters
 *
 * Usage:
 * <AssetFilters
 *   filters={filters}
 *   onFiltersChange={setFilters}
 * />
 */

export interface AssetFilterValues {
  search?: string; // Kept for compatibility but not used in this component
  status?: string;
  categoryId?: string;
  locationId?: string;
}

interface AssetFiltersProps {
  filters: AssetFilterValues;
  onFiltersChange: (filters: AssetFilterValues) => void;
  className?: string;
}

export function AssetFilters({
  filters,
  onFiltersChange,
  className = '',
}: AssetFiltersProps) {
  // Fetch categories and locations from API
  const { data: categoriesData, isLoading: categoriesLoading, error: categoriesError } = useGetCategories();
  const { data: locationsData, isLoading: locationsLoading, error: locationsError } = useGetLocations();

  // Ensure we always have arrays
  const categories = Array.isArray(categoriesData) ? categoriesData : [];
  const locations = Array.isArray(locationsData) ? locationsData : [];

  // Debug logging
  console.log('AssetFilters - categoriesData:', categoriesData);
  console.log('AssetFilters - categoriesLoading:', categoriesLoading);
  console.log('AssetFilters - categoriesError:', categoriesError);
  console.log('AssetFilters - categories:', categories);
  console.log('AssetFilters - categories.length:', categories.length);
  console.log('AssetFilters - locationsData:', locationsData);
  console.log('AssetFilters - locationsLoading:', locationsLoading);
  console.log('AssetFilters - locationsError:', locationsError);
  console.log('AssetFilters - locations:', locations);
  console.log('AssetFilters - locations.length:', locations.length);

  const handleStatusChange = (value: string) => {
    onFiltersChange({ ...filters, status: value === 'all' ? undefined : value });
  };

  const handleCategoryChange = (value: string) => {
    onFiltersChange({ ...filters, categoryId: value === 'all' ? undefined : value });
  };

  const handleLocationChange = (value: string) => {
    onFiltersChange({ ...filters, locationId: value === 'all' ? undefined : value });
  };

  const handleClearFilters = () => {
    onFiltersChange({ categoryId: undefined, locationId: undefined, status: undefined });
  };

  const hasActiveFilters = filters.status || filters.categoryId || filters.locationId;

  return (
    <div className={`flex flex-wrap items-end gap-3 ${className}`}>
      {/* Status Filter */}
      <div className="flex-1 min-w-[180px] space-y-1.5">
        <Label htmlFor="status" className="text-sm font-medium">
          상태
        </Label>
        <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
          <SelectTrigger id="status" className="w-full">
            <SelectValue placeholder="모든 상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 상태</SelectItem>
            {ASSET_STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category Filter */}
      <div className="flex-1 min-w-[180px] space-y-1.5">
        <Label htmlFor="category" className="text-sm font-medium">
          카테고리
        </Label>
        <Select 
          value={filters.categoryId || 'all'} 
          onValueChange={handleCategoryChange}
          disabled={categoriesLoading}
        >
          <SelectTrigger id="category" className="w-full">
            <SelectValue placeholder={categoriesLoading ? "로딩 중..." : "모든 카테고리"} />
          </SelectTrigger>
          <SelectContent className="max-h-[300px] overflow-y-auto">
            <SelectItem value="all">모든 카테고리</SelectItem>
            {categoriesError ? (
              <SelectItem value="error" disabled>
                오류: 데이터를 불러올 수 없습니다
              </SelectItem>
            ) : categories.length === 0 && !categoriesLoading ? (
              <SelectItem value="empty" disabled>
                카테고리가 없습니다
              </SelectItem>
            ) : (
              categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Location Filter */}
      <div className="flex-1 min-w-[180px] space-y-1.5">
        <Label htmlFor="location" className="text-sm font-medium">
          위치
        </Label>
        <Select 
          value={filters.locationId || 'all'} 
          onValueChange={handleLocationChange}
          disabled={locationsLoading}
        >
          <SelectTrigger id="location" className="w-full">
            <SelectValue placeholder={locationsLoading ? "로딩 중..." : "모든 위치"} />
          </SelectTrigger>
          <SelectContent className="max-h-[300px] overflow-y-auto">
            <SelectItem value="all">모든 위치</SelectItem>
            {locationsError ? (
              <SelectItem value="error" disabled>
                오류: 데이터를 불러올 수 없습니다
              </SelectItem>
            ) : locations.length === 0 && !locationsLoading ? (
              <SelectItem value="empty" disabled>
                위치가 없습니다
              </SelectItem>
            ) : (
              locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="default"
          onClick={handleClearFilters}
          className="shrink-0"
        >
          <X className="h-4 w-4 mr-2" />
          필터 지우기
        </Button>
      )}
    </div>
  );
}
