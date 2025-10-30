import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { Plus, LayoutGrid, LayoutList } from 'lucide-react';
import {
  AssetTable,
  AssetCard,
  AssetCardGrid,
  AssetCardSkeleton,
  AssetFilters,
  type AssetFilterValues,
} from '@/components/features';
import { useGetAssets, useDeleteAsset } from '@/hooks/useAssets';
import { usePagination } from '@/hooks/usePagination';
import { useSearch } from '@/hooks/useSearch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AssetQRCode } from '@/components/features/AssetQRCode';
import type { Asset } from '@/hooks/useAssets';
import { ManagerOrAbove } from '@/components/layout/RoleGuard';

/**
 * AssetList Page - Enhanced Version
 *
 * Main page for displaying and managing assets
 * Implements Priority 1 UX Improvements:
 * - Enhanced Pagination System (50 items/page with controls)
 * - Enhanced Search Functionality (debounced, multi-field, keyboard shortcuts)
 * - Loading States & Skeletons
 * - Improved Asset Display (with category/location names, status colors)
 *
 * Features:
 * - Table and card view toggle
 * - Server-side pagination with URL sync
 * - Debounced search (300ms)
 * - Advanced filtering
 * - Create, edit, delete actions (manager/admin only)
 * - QR code viewing
 * - Keyboard shortcuts (/ for search, Esc to clear)
 *
 * Performance targets:
 * - Page load: <2s
 * - Page change: <300ms
 * - Search: <500ms
 */

type ViewMode = 'table' | 'cards';

export default function AssetList() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [filters, setFilters] = useState<AssetFilterValues>({});
  const [qrAsset, setQrAsset] = useState<Asset | null>(null);

  // Enhanced Pagination Hook with URL sync
  const {
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    getPaginationParams,
    resetPage,
  } = usePagination({
    defaultPageSize: 50,
    syncWithUrl: true,
  });

  // Enhanced Search Hook with debouncing and URL sync
  const {
    searchQuery,
    debouncedSearchQuery,
    setSearchQuery,
    isDebouncing,
  } = useSearch({
    debounceMs: 300,
    syncWithUrl: true,
  });

  // Fetch assets with server-side pagination
  const paginationParams = getPaginationParams();
  const { data, isLoading } = useGetAssets({
    ...paginationParams,
    search: debouncedSearchQuery,
    status: filters.status,
    category_id: filters.categoryId,
    location_id: filters.locationId,
  });

  const deleteAssetMutation = useDeleteAsset();

  // Get assets and pagination info from response
  const assets = data?.items ?? [];
  const totalItems = data?.total ?? 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Reset to page 1 when filters or search changes
  const handleFiltersChange = (newFilters: AssetFilterValues) => {
    setFilters(newFilters);
    resetPage();
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    resetPage();
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    // resetPage is called automatically in usePagination hook
  };

  // Asset actions
  const handleEdit = (id: string) => {
    navigate(`/assets/${id}/edit`);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      deleteAssetMutation.mutate(id);
    }
  };

  const handleViewQR = (id: string) => {
    const asset = assets.find((a) => a.id === id);
    if (asset) {
      setQrAsset(asset);
    }
  };

  // Check if any filters/search are active
  const hasActiveFilters =
    !!filters.status || !!filters.categoryId || !!filters.locationId || !!searchQuery;

  return (
    <div className="container mx-auto py-4 md:py-6 space-y-4 md:space-y-6 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">자산</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            회사의 모든 자산을 관리하고 추적합니다
          </p>
        </div>
        {/* Only managers and admins can create assets */}
        <ManagerOrAbove>
          <Button onClick={() => navigate('/assets/new')} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            새 자산
          </Button>
        </ManagerOrAbove>
      </div>

      {/* Enhanced Search Bar with keyboard shortcuts */}
      <div className="w-full">
        <SearchInput
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="자산 태그, 이름, 모델 또는 시리얼 번호로 검색..."
          isLoading={isDebouncing || isLoading}
          enableShortcut={true}
          aria-label="자산 검색"
        />
        <div className="mt-2 text-xs text-muted-foreground">
          <span className="inline-block mr-4">
            <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted border border-border rounded">/</kbd> 키를 눌러 검색 포커스
          </span>
          <span className="inline-block">
            <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted border border-border rounded">Esc</kbd> 키를 눌러 초기화
          </span>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="lg:w-64 shrink-0">
          <AssetFilters filters={filters} onFiltersChange={handleFiltersChange} />
        </div>

        <div className="flex-1 space-y-4">
          {/* Toolbar: Count + View Toggle */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {isLoading ? (
                <span>자산 로딩 중...</span>
              ) : (
                <>
                  <span className="font-medium">{totalItems}</span>개 {totalItems === 1 ? '자산' : '자산'}
                  {hasActiveFilters && ' 발견됨'}
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
                aria-label="테이블 뷰"
              >
                <LayoutList className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">테이블</span>
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
                aria-label="카드 뷰"
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">카드</span>
              </Button>
            </div>
          </div>

          {/* Asset Display */}
          {viewMode === 'table' ? (
            <AssetTable
              assets={assets}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewQR={handleViewQR}
            />
          ) : (
            <AssetCardGrid>
              {isLoading ? (
                // Show skeleton loaders matching page size
                Array.from({ length: pageSize }).map((_, i) => (
                  <AssetCardSkeleton key={i} />
                ))
              ) : assets.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <div className="text-muted-foreground space-y-2">
                    <p className="text-lg font-medium">자산을 찾을 수 없습니다</p>
                    {hasActiveFilters ? (
                      <p className="text-sm">
                        필터나 검색어를 조정해 보세요
                      </p>
                    ) : (
                      <p className="text-sm">첫 번째 자산을 생성하여 시작하세요</p>
                    )}
                  </div>
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setFilters({});
                        setSearchQuery('');
                      }}
                    >
                      모든 필터 지우기
                    </Button>
                  )}
                </div>
              ) : (
                assets.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    onClick={() => navigate(`/assets/${asset.id}`)}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onViewQR={handleViewQR}
                  />
                ))
              )}
            </AssetCardGrid>
          )}

          {/* Enhanced Pagination Controls */}
          {totalPages > 1 && !isLoading && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={handlePageSizeChange}
              showPageSize={true}
              pageSizeOptions={[25, 50, 100, 200]}
            />
          )}
        </div>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={!!qrAsset} onOpenChange={(open) => !open && setQrAsset(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>자산 QR 코드</DialogTitle>
          </DialogHeader>
          {qrAsset && <AssetQRCode asset={qrAsset} size={256} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
