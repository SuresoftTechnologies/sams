import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, Package, Loader2, Eye, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { useGetAssets } from '@/hooks/useAssets';
import { useUser } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { RentalDialog } from '@/components/dialogs/RentalDialog';
import { ReturnDialog } from '@/components/dialogs/ReturnDialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Asset } from '@/types/api';

/**
 * Assets List Page
 *
 * Features:
 * - Asset table with sortable columns
 * - Search functionality
 * - Status badges
 * - Loading states
 * - Quick actions (view details)
 */
export default function Assets() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetAssets();
  const currentUser = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showRentalDialog, setShowRentalDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);

  // Filter assets by search query
  const filteredAssets = data?.items.filter((asset) => {
    const query = searchQuery.toLowerCase();
    return (
      (asset.model?.toLowerCase().includes(query) || asset.asset_tag?.toLowerCase().includes(query)) ||
      asset.serial_number?.toLowerCase().includes(query) ||
      asset.category_name?.toLowerCase().includes(query) ||
      asset.location_name?.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      issued: 'default',
      loaned: 'secondary',
      general: 'outline',
      stock: 'secondary',
      server_room: 'default',
      disposed: 'destructive',
    } as const;

    const labels = {
      issued: '지급장비',
      loaned: '대여용',
      general: '일반장비',
      stock: '재고',
      server_room: '서버실',
      disposed: '불용',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  // Check if user can rent this asset
  const canRentAsset = (asset: Asset): boolean => {
    if (!currentUser) return false;
    if (currentUser.role !== 'employee') return false; // Only employees can rent
    const assignedTo = asset.assigned_to || asset.assignee_id; // Support both field names
    return asset.status === 'loaned' && !assignedTo;
  };

  // Check if user can return this asset
  const canReturnAsset = (asset: Asset): boolean => {
    if (!currentUser) return false;
    if (currentUser.role !== 'employee') return false; // Only employees can return
    const assignedTo = asset.assigned_to || asset.assignee_id; // Support both field names
    return assignedTo === currentUser.id;
  };

  const handleRentalClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowRentalDialog(true);
  };

  const handleReturnClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowReturnDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
          <p className="text-muted-foreground">Manage all your company assets</p>
        </div>
        <Button onClick={() => navigate('/assets/new')} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Asset
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, serial number, category, or location..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assets Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Assets</CardTitle>
          <CardDescription>
            {filteredAssets
              ? `${filteredAssets.length} asset${filteredAssets.length !== 1 ? 's' : ''} found`
              : 'Loading assets...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-12 text-destructive">
              <p className="text-lg font-medium">Failed to load assets</p>
              <p className="text-sm">Please try again later</p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAssets && filteredAssets.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.map((asset) => (
                    <TableRow
                      key={asset.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/assets/${asset.id}`)}
                    >
                      <TableCell className="font-medium">{asset.model || asset.asset_tag}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {asset.serial_number || '-'}
                      </TableCell>
                      <TableCell>{asset.category_name || '-'}</TableCell>
                      <TableCell>{asset.location_name || '-'}</TableCell>
                      <TableCell>{getStatusBadge(asset.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(asset.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <TooltipProvider>
                            {/* Rental button */}
                            {canRentAsset(asset) && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRentalClick(asset);
                                    }}
                                  >
                                    <ArrowDownToLine className="h-4 w-4" />
                                    대여 신청
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>이 자산을 대여 신청합니다</p>
                                </TooltipContent>
                              </Tooltip>
                            )}

                            {/* Return button */}
                            {canReturnAsset(asset) && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReturnClick(asset);
                                    }}
                                  >
                                    <ArrowUpFromLine className="h-4 w-4" />
                                    반납 신청
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>이 자산을 반납 신청합니다</p>
                                </TooltipContent>
                              </Tooltip>
                            )}

                            {/* View button */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/assets/${asset.id}`);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                  상세
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>자산 상세 정보 보기</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">
                {searchQuery ? 'No assets match your search' : 'No assets found'}
              </p>
              <p className="text-sm mb-4">
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : 'Create your first asset to get started'}
              </p>
              {!searchQuery && (
                <Button onClick={() => navigate('/assets/new')} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Asset
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rental Dialog */}
      {selectedAsset && (
        <RentalDialog
          open={showRentalDialog}
          onOpenChange={setShowRentalDialog}
          asset={selectedAsset}
          onSuccess={() => {
            setSelectedAsset(null);
            setShowRentalDialog(false);
          }}
        />
      )}

      {/* Return Dialog */}
      {selectedAsset && (
        <ReturnDialog
          open={showReturnDialog}
          onOpenChange={setShowReturnDialog}
          asset={selectedAsset}
          onSuccess={() => {
            setSelectedAsset(null);
            setShowReturnDialog(false);
          }}
        />
      )}
    </div>
  );
}
