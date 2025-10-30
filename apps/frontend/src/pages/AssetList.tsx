import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AssetQRCode } from '@/components/features/AssetQRCode';
import type { Asset } from '@/hooks/useAssets';
import { ManagerOrAbove } from '@/components/layout/RoleGuard';

/**
 * AssetList Page
 *
 * Main page for displaying and managing assets
 * - Table and card view toggle
 * - Filtering and search
 * - Create, edit, delete actions (manager/admin only)
 * - QR code viewing
 *
 * Demonstrates usage of all Phase 8 components and role-based access
 */

type ViewMode = 'table' | 'cards';

export default function AssetList() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [filters, setFilters] = useState<AssetFilterValues>({});
  const [qrAsset, setQrAsset] = useState<Asset | null>(null);

  // Fetch assets
  const { data, isLoading } = useGetAssets();
  const deleteAssetMutation = useDeleteAsset();

  // Filter assets based on filters
  const filteredAssets = data?.items.filter((asset) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesName = asset.name.toLowerCase().includes(searchLower);
      const matchesSerial = asset.serialNumber?.toLowerCase().includes(searchLower);
      if (!matchesName && !matchesSerial) return false;
    }

    if (filters.status && asset.status !== filters.status) {
      return false;
    }

    if (filters.categoryId && asset.category_id !== filters.categoryId) {
      return false;
    }

    if (filters.locationId && asset.location_id !== filters.locationId) {
      return false;
    }

    return true;
  }) || [];

  const handleEdit = (id: string) => {
    navigate(`/assets/${id}/edit`);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      deleteAssetMutation.mutate(id);
    }
  };

  const handleViewQR = (id: string) => {
    const asset = data?.items.find((a) => a.id === id);
    if (asset) {
      setQrAsset(asset);
    }
  };

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
        {/* Only managers and admins can create assets */}
        <ManagerOrAbove>
          <Button onClick={() => navigate('/assets/new')} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            New Asset
          </Button>
        </ManagerOrAbove>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="lg:w-64 shrink-0">
          <AssetFilters filters={filters} onFiltersChange={setFilters} />
        </div>

        <div className="flex-1 space-y-4">
          {/* View Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {filteredAssets.length} {filteredAssets.length === 1 ? 'asset' : 'assets'}{' '}
              {filters.search || filters.status || filters.categoryId || filters.locationId
                ? 'found'
                : 'total'}
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <LayoutList className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Asset Display */}
          {viewMode === 'table' ? (
            <AssetTable
              assets={filteredAssets}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewQR={handleViewQR}
            />
          ) : (
            <AssetCardGrid>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => <AssetCardSkeleton key={i} />)
              ) : filteredAssets.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No assets found. Try adjusting your filters or create a new asset.
                </div>
              ) : (
                filteredAssets.map((asset) => (
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
        </div>
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
