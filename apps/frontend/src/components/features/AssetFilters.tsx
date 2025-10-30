import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, X, Filter } from 'lucide-react';
import { ASSET_STATUSES, ASSET_CATEGORIES, ASSET_LOCATIONS } from '@/lib/constants';

/**
 * AssetFilters Component
 *
 * Comprehensive filtering UI for asset list
 * - Text search
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
  search?: string;
  status?: string;
  categoryId?: string;
  locationId?: string;
}

interface AssetFiltersProps {
  filters: AssetFilterValues;
  onFiltersChange: (filters: AssetFilterValues) => void;
  className?: string;
  compact?: boolean; // Compact mode for mobile
}

export function AssetFilters({
  filters,
  onFiltersChange,
  className = '',
  compact = false,
}: AssetFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

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
    onFiltersChange({});
  };

  const hasActiveFilters =
    filters.search || filters.status || filters.categoryId || filters.locationId;

  if (compact && !isExpanded) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="자산 검색..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => handleSearchChange('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="shrink-0"
        >
          <Filter className="h-4 w-4 mr-2" />
          필터
          {hasActiveFilters && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">
              {[filters.status, filters.categoryId, filters.locationId].filter(Boolean).length}
            </span>
          )}
        </Button>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">필터</CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-8 px-2 text-muted-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              모두 지우기
            </Button>
          )}
          {compact && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="h-8 px-2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">검색</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="이름 또는 시리얼 번호로 검색..."
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-10"
            />
            {filters.search && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => handleSearchChange('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status">상태</Label>
          <Select
            value={filters.status || 'all'}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger id="status">
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
        <div className="space-y-2">
          <Label htmlFor="category">카테고리</Label>
          <Select
            value={filters.categoryId || 'all'}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="모든 카테고리" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 카테고리</SelectItem>
              {ASSET_CATEGORIES.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location Filter */}
        <div className="space-y-2">
          <Label htmlFor="location">위치</Label>
          <Select
            value={filters.locationId || 'all'}
            onValueChange={handleLocationChange}
          >
            <SelectTrigger id="location">
              <SelectValue placeholder="모든 위치" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 위치</SelectItem>
              {ASSET_LOCATIONS.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * AssetFiltersCompact - Mobile-optimized filters
 * Same functionality, different layout for mobile screens
 */
export function AssetFiltersCompact(props: Omit<AssetFiltersProps, 'compact'>) {
  return <AssetFilters {...props} compact={true} />;
}
