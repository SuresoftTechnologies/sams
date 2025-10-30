import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, Eye, QrCode, MapPin, Calendar } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Asset } from '@/hooks/useAssets';

/**
 * AssetCard Component
 *
 * Mobile-friendly card view for displaying asset information
 * - Responsive design
 * - Status badges
 * - Quick actions
 * - Essential information at a glance
 *
 * Usage:
 * <AssetCard
 *   asset={asset}
 *   onClick={() => navigate(`/assets/${asset.id}`)}
 *   onEdit={(id) => navigate(`/assets/${id}/edit`)}
 *   onDelete={(id) => deleteAsset(id)}
 * />
 */

interface AssetCardProps {
  asset: Asset;
  onClick?: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onViewQR?: (id: string) => void;
}

export function AssetCard({ asset, onClick, onEdit, onDelete, onViewQR }: AssetCardProps) {
  const getStatusBadgeVariant = (status: Asset['status']) => {
    switch (status) {
      case 'available':
        return 'default';
      case 'in_use':
        return 'secondary';
      case 'maintenance':
        return 'outline';
      case 'retired':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: Asset['status']) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'in_use':
        return 'In Use';
      case 'maintenance':
        return 'Maintenance';
      case 'retired':
        return 'Retired';
      default:
        return status;
    }
  };

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg">{asset.name}</CardTitle>
            {asset.serialNumber && (
              <code className="text-xs text-muted-foreground">{asset.serialNumber}</code>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusBadgeVariant(asset.status)}>
              {getStatusLabel(asset.status)}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick?.();
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                {onViewQR && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewQR(asset.id);
                    }}
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    View QR Code
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {onEdit && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(asset.id);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(asset.id);
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-2 text-sm">
          {asset.categoryName && (
            <div className="flex items-center text-muted-foreground">
              <span className="font-medium min-w-20">Category:</span>
              <span>{asset.categoryName}</span>
            </div>
          )}

          {asset.locationName && (
            <div className="flex items-center text-muted-foreground">
              <MapPin className="mr-1.5 h-3.5 w-3.5" />
              <span className="font-medium min-w-20">Location:</span>
              <span>{asset.locationName}</span>
            </div>
          )}

          {asset.purchaseDate && (
            <div className="flex items-center text-muted-foreground">
              <Calendar className="mr-1.5 h-3.5 w-3.5" />
              <span className="font-medium min-w-20">Purchased:</span>
              <span>{formatDate(asset.purchaseDate)}</span>
            </div>
          )}

          {asset.description && (
            <div className="pt-2 text-muted-foreground">
              <p className="text-sm line-clamp-2">{asset.description}</p>
            </div>
          )}
        </div>
      </CardContent>

      {asset.purchasePrice && (
        <CardFooter className="pt-3 border-t">
          <div className="flex items-center justify-between w-full">
            <span className="text-sm text-muted-foreground">Purchase Price</span>
            <span className="text-base font-semibold">
              {formatCurrency(asset.purchasePrice)}
            </span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

/**
 * AssetCardSkeleton - Loading state for AssetCard
 */
export function AssetCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-5 w-40 bg-muted rounded animate-pulse" />
            <div className="h-3 w-24 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-6 w-16 bg-muted rounded animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-2">
          <div className="h-4 w-full bg-muted rounded animate-pulse" />
          <div className="h-4 w-full bg-muted rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
        </div>
      </CardContent>
      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full">
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          <div className="h-4 w-20 bg-muted rounded animate-pulse" />
        </div>
      </CardFooter>
    </Card>
  );
}

/**
 * AssetCardGrid - Grid container for AssetCard components
 * Responsive grid layout
 */
interface AssetCardGridProps {
  children: React.ReactNode;
  className?: string;
}

export function AssetCardGrid({ children, className = '' }: AssetCardGridProps) {
  return (
    <div
      className={`grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${className}`}
    >
      {children}
    </div>
  );
}
