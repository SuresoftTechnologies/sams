/**
 * Enhanced Asset List Page
 *
 * Implements Priority 1 UX Improvements:
 * 1. Enhanced Pagination System (50 items/page, with controls)
 * 2. Enhanced Search Functionality (debounced, multi-field)
 * 3. Loading States & Skeletons
 * 4. Improved Asset Display (category/location names, status colors)
 *
 * Based on UX Design Specification for handling 2,213 assets
 * Performance target: <300ms page changes, <500ms search
 */

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

type ViewMode = 'table' | 'cards';

export default function AssetListEnhanced() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [filters, setFilters] = useState<AssetFilterValues>({});
  const [qrAsset, setQrAsset] = useState<Asset | null>(null);

  // Enhanced Pagination Hook
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

  // Enhanced Search Hook with debouncing
  const {
    searchQuery,
    debouncedSearchQuery,
    setSearchQuery,
    isDebouncing,
  } = useSearch({
    debounceMs: 300,
    syncWithUrl: true,
    minLength: 0, // Search from first character
  });

  // Fetch assets with pagination
  const paginationParams = getPaginationParams();
  const { data, isLoading } = useGetAssets({
    ...paginationParams,
    search: debouncedSearchQuery,
    status: filters.status,
    category_id: filters.categoryId,
    location_id: filters.locationId,
  });

  const deleteAssetMutation = useDeleteAsset();

  // Calculate pagination metadata
  const totalItems = data?.total ?? 0;
  const totalPages = Math.ceil(totalItems / pageSize);
  const assets = data?.items ?? [];

  // Reset to page 1 when filters change
  const handleFiltersChange = (newFilters: AssetFilterValues) => {
    setFilters(newFilters);
    resetPage();
  };

  // Reset to page 1 when search changes
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    resetPage();
  };

  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    // resetPage is called automatically in usePagination
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

  // Check if any filters are active
  const hasActiveFilters =
    !!filters.status || !!filters.categoryId || !!filters.locationId || !!searchQuery;

  return (
    <div className="container mx-auto py-4 md:py-6 space-y-4 md:space-y-6 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Assets</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage and track all your company assets
          </p>
        </div>
        <ManagerOrAbove>
          <Button onClick={() => navigate('/assets/new')} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            New Asset
          </Button>
        </ManagerOrAbove>
      </div>

      {/* Enhanced Search Bar */}
      <div className="w-full">
        <SearchInput
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search by asset number, model, or serial number..."
          isLoading={isDebouncing || isLoading}
          enableShortcut={true}
          aria-label="Search assets"
        />
        <div className="mt-2 text-xs text-muted-foreground">
          <span className="inline-block mr-4">
            Press <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted border border-border rounded">/</kbd> to focus search
          </span>
          <span className="inline-block">
            Press <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted border border-border rounded">Esc</kbd> to clear
          </span>
        </div>
      </div>

      {/* Filters */}
      <AssetFilters filters={filters} onFiltersChange={handleFiltersChange} />

      {/* Content */}
      <div className="space-y-4">
          {/* Toolbar: Count + View Toggle */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {isLoading ? (
                <span>Loading assets...</span>
              ) : (
                <>
                  <span className="font-medium">{totalItems}</span>{' '}
                  {totalItems === 1 ? 'asset' : 'assets'}
                  {hasActiveFilters && ' found'}
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
                aria-label="Table view"
              >
                <LayoutList className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Table</span>
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
                aria-label="Card view"
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Cards</span>
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
                Array.from({ length: pageSize }).map((_, i) => (
                  <AssetCardSkeleton key={i} />
                ))
              ) : assets.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <div className="text-muted-foreground space-y-2">
                    <p className="text-lg font-medium">No assets found</p>
                    {hasActiveFilters ? (
                      <p className="text-sm">
                        Try adjusting your filters or search query
                      </p>
                    ) : (
                      <p className="text-sm">Create your first asset to get started</p>
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
                      Clear all filters
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

          {/* Enhanced Pagination */}
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

        {/* Performance Info (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-muted-foreground border-t pt-4 mt-4">
            <div>Page: {currentPage} / {totalPages}</div>
            <div>Page Size: {pageSize}</div>
            <div>Total Items: {totalItems}</div>
            <div>Items Shown: {assets.length}</div>
            <div>Search: {debouncedSearchQuery || 'None'}</div>
            <div>Is Loading: {isLoading ? 'Yes' : 'No'}</div>
            <div>Is Debouncing: {isDebouncing ? 'Yes' : 'No'}</div>
          </div>
        )}
      </div>

      {/* QR Code Dialog */}
      <Dialog open={!!qrAsset} onOpenChange={(open) => !open && setQrAsset(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Asset QR Code</DialogTitle>
          </DialogHeader>
          {qrAsset && <AssetQRCode asset={qrAsset} size={256} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
