import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@/components/ui/table';
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
import { Skeleton } from '@/components/ui/skeleton';
import { SortIndicator } from '@/components/ui/sort-indicator';
import { MoreHorizontal, Edit, Trash2, Eye, QrCode } from 'lucide-react';
import type { Asset } from '@/hooks/useAssets';

/**
 * AssetTable Component - Fixed Scroll & Sticky Header Version
 *
 * Responsive table with dual sticky positioning (header + action column)
 *
 * UX Improvements:
 * - FIXED: Sticky header remains visible during vertical scroll
 * - FIXED: Horizontal scrollbar immediately accessible at top
 * - Single overflow container for both X and Y scroll
 * - Optimized column widths that respect container boundaries
 * - Sticky action column with visual separator shadow
 * - Improved loading skeletons
 * - Better responsive behavior
 *
 * Layout Strategy:
 * - Individual sticky positioning on each TableHead cell
 * - min-w-[XXXpx] for minimum column widths
 * - max-w-0 on cells for proper truncation with ellipsis
 * - Single overflow-auto container (no nested overflow contexts)
 * - Table set to min-w-full to respect parent width
 *
 * Technical Details:
 * - Each header cell has: sticky top-0 z-20 bg-background shadow-[0_2px_0_0_hsl(var(--border))]
 * - Action column header has: sticky top-0 right-0 z-30 (highest z-index)
 * - Action column cells have: sticky right-0 z-10
 * - Z-index hierarchy: Action header (30) > Headers (20) > Action cells (10)
 * - Removed TableHeader-level sticky (moved to individual cells)
 * - Single overflow context ensures predictable scroll behavior
 *
 * Scroll Behavior:
 * - Vertical scroll: Headers stay fixed at top
 * - Horizontal scroll: Action column stays fixed at right
 * - Scrollbar visible immediately without scrolling down
 *
 * Responsive Design:
 * - Desktop (>1024px): Full table with all columns
 * - Tablet (768px-1024px): Horizontal scroll enabled
 * - Mobile (<768px): Optimized for card view (handled in parent)
 *
 * Usage:
 * <AssetTable
 *   assets={assets}
 *   isLoading={isLoading}
 *   onEdit={(id) => navigate(`/assets/${id}/edit`)}
 *   onDelete={(id) => deleteAsset(id)}
 *   onViewQR={(id) => showQRDialog(id)}
 * />
 */

interface AssetTableProps {
  assets: Asset[];
  isLoading?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onViewQR?: (id: string) => void;
}

type SortField = 'asset_tag' | 'model' | 'serial_number' | 'status' | 'purchase_date' | 'grade' | 'supplier';
type SortOrder = 'asc' | 'desc';

export function AssetTable({
  assets,
  isLoading = false,
  onEdit,
  onDelete,
  onViewQR,
}: AssetTableProps) {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>('asset_tag');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Sort assets
  const sortedAssets = [...assets].sort((a, b) => {
    let aValue: string | number | null | undefined = a[sortField as keyof Asset];
    let bValue: string | number | null | undefined = b[sortField as keyof Asset];

    if (sortField === 'purchase_date') {
      aValue = a.purchase_date ? new Date(a.purchase_date).getTime() : 0;
      bValue = b.purchase_date ? new Date(b.purchase_date).getTime() : 0;
    }

    if (aValue === undefined || aValue === null) return 1;
    if (bValue === undefined || bValue === null) return -1;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getStatusBadgeVariant = (status: Asset['status']) => {
    switch (status) {
      case 'issued':
        return 'default'; // blue
      case 'loaned':
        return 'secondary'; // purple
      case 'general':
        return 'outline'; // green
      case 'stock':
        return 'secondary'; // gray
      case 'server_room':
        return 'default'; // cyan
      case 'disposed':
        return 'destructive'; // red
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: Asset['status']) => {
    switch (status) {
      case 'issued':
        return '지급장비';
      case 'loaned':
        return '대여용';
      case 'general':
        return '일반장비';
      case 'stock':
        return '재고';
      case 'server_room':
        return '서버실';
      case 'disposed':
        return '불용';
      default:
        return status;
    }
  };

  const getGradeBadgeVariant = (grade?: Asset['grade']) => {
    switch (grade) {
      case 'A':
        return 'default'; // blue
      case 'B':
        return 'secondary'; // gray
      case 'C':
        return 'outline'; // outline
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="w-full rounded-md border bg-background">
        <div className="relative overflow-auto max-h-[calc(100vh-24rem)] scrollbar-thin smooth-scroll">
          <table className="w-full caption-bottom text-sm min-w-full">
            <thead>
              <TableRow>
                  <TableHead className="min-w-[140px] sticky top-0 z-20 bg-background shadow-[0_2px_0_0_hsl(var(--border))]">자산번호</TableHead>
                  <TableHead className="min-w-[180px] sticky top-0 z-20 bg-background shadow-[0_2px_0_0_hsl(var(--border))]">모델</TableHead>
                  <TableHead className="min-w-[150px] sticky top-0 z-20 bg-background shadow-[0_2px_0_0_hsl(var(--border))]">시리얼번호</TableHead>
                  <TableHead className="min-w-[80px] sticky top-0 z-20 bg-background shadow-[0_2px_0_0_hsl(var(--border))]">등급</TableHead>
                  <TableHead className="min-w-[120px] sticky top-0 z-20 bg-background shadow-[0_2px_0_0_hsl(var(--border))]">카테고리</TableHead>
                  <TableHead className="min-w-[100px] sticky top-0 z-20 bg-background shadow-[0_2px_0_0_hsl(var(--border))]">상태</TableHead>
                  <TableHead className="min-w-[120px] sticky top-0 z-20 bg-background shadow-[0_2px_0_0_hsl(var(--border))]">사용자</TableHead>
                  <TableHead className="min-w-[150px] sticky top-0 z-20 bg-background shadow-[0_2px_0_0_hsl(var(--border))]">위치</TableHead>
                  <TableHead className="min-w-[120px] sticky top-0 z-20 bg-background shadow-[0_2px_0_0_hsl(var(--border))]">공급업체</TableHead>
                  <TableHead className="min-w-[80px] text-right sticky top-0 right-0 z-30 bg-background shadow-[-4px_0_8px_rgba(0,0,0,0.04),0_2px_0_0_hsl(var(--border))]">작업</TableHead>
                </TableRow>
            </thead>
              <TableBody>
                {Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell className="sticky right-0 z-10 bg-background shadow-[-4px_0_8px_rgba(0,0,0,0.04)]">
                      <Skeleton className="h-8 w-8 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </table>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-md border bg-background">
      <div className="relative overflow-auto max-h-[calc(100vh-24rem)] scrollbar-thin smooth-scroll">
        <table className="w-full caption-bottom text-sm min-w-full">
          <thead>
              <TableRow>
                <TableHead
                  className="cursor-pointer select-none min-w-[140px] hover:bg-muted transition-colors sticky top-0 z-20 bg-background shadow-[0_2px_0_0_hsl(var(--border))]"
                  onClick={() => handleSort('asset_tag')}
                >
                  자산번호
                  <SortIndicator
                    active={sortField === 'asset_tag'}
                    direction={sortOrder}
                  />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none min-w-[180px] hover:bg-muted transition-colors sticky top-0 z-20 bg-background shadow-[0_2px_0_0_hsl(var(--border))]"
                  onClick={() => handleSort('model')}
                >
                  모델
                  <SortIndicator
                    active={sortField === 'model'}
                    direction={sortOrder}
                  />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none min-w-[150px] hover:bg-muted transition-colors sticky top-0 z-20 bg-background shadow-[0_2px_0_0_hsl(var(--border))]"
                  onClick={() => handleSort('serial_number')}
                >
                  시리얼번호
                  <SortIndicator
                    active={sortField === 'serial_number'}
                    direction={sortOrder}
                  />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none min-w-[80px] hover:bg-muted transition-colors sticky top-0 z-20 bg-background shadow-[0_2px_0_0_hsl(var(--border))]"
                  onClick={() => handleSort('grade')}
                >
                  등급
                  <SortIndicator
                    active={sortField === 'grade'}
                    direction={sortOrder}
                  />
                </TableHead>
                <TableHead className="min-w-[120px] sticky top-0 z-20 bg-background shadow-[0_2px_0_0_hsl(var(--border))]">카테고리</TableHead>
                <TableHead
                  className="cursor-pointer select-none min-w-[100px] hover:bg-muted transition-colors sticky top-0 z-20 bg-background shadow-[0_2px_0_0_hsl(var(--border))]"
                  onClick={() => handleSort('status')}
                >
                  상태
                  <SortIndicator
                    active={sortField === 'status'}
                    direction={sortOrder}
                  />
                </TableHead>
                <TableHead className="min-w-[120px] sticky top-0 z-20 bg-background shadow-[0_2px_0_0_hsl(var(--border))]">사용자</TableHead>
                <TableHead className="min-w-[150px] sticky top-0 z-20 bg-background shadow-[0_2px_0_0_hsl(var(--border))]">위치</TableHead>
                <TableHead
                  className="cursor-pointer select-none min-w-[120px] hover:bg-muted transition-colors sticky top-0 z-20 bg-background shadow-[0_2px_0_0_hsl(var(--border))]"
                  onClick={() => handleSort('supplier')}
                >
                  공급업체
                  <SortIndicator
                    active={sortField === 'supplier'}
                    direction={sortOrder}
                  />
                </TableHead>
                <TableHead className="min-w-[80px] text-right sticky top-0 right-0 z-30 bg-background shadow-[-4px_0_8px_rgba(0,0,0,0.04),0_2px_0_0_hsl(var(--border))]">
                  작업
                </TableHead>
              </TableRow>
            </thead>
            <TableBody>
              {sortedAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                    자산이 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                sortedAssets.map((asset) => (
                  <TableRow
                    key={asset.id}
                    className="cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => navigate(`/assets/${asset.id}`)}
                  >
                    <TableCell className="font-mono text-sm font-medium">
                      {asset.asset_tag}
                    </TableCell>
                    <TableCell className="max-w-0 truncate" title={asset.model || undefined}>
                    {asset.model ? (
                      <span className="text-sm">{asset.model}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs max-w-0 truncate" title={asset.serial_number || undefined}>
                    {asset.serial_number ? (
                      asset.serial_number
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {asset.grade ? (
                      <Badge variant={getGradeBadgeVariant(asset.grade)} className="font-medium">
                        {asset.grade}급
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-0 truncate" title={asset.category_name || undefined}>
                    {asset.category_name || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(asset.status)} className="whitespace-nowrap">
                      {getStatusLabel(asset.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-0 truncate" title={asset.assigned_user_name || undefined}>
                    {asset.assigned_user_name ? (
                      <span className="text-sm">{asset.assigned_user_name}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-0 truncate" title={asset.location_name || undefined}>
                    {asset.location_name || '-'}
                  </TableCell>
                  <TableCell className="max-w-0 truncate" title={asset.supplier || undefined}>
                    {asset.supplier ? (
                      <span className="text-sm">{asset.supplier}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right sticky right-0 z-10 bg-background shadow-[-4px_0_8px_rgba(0,0,0,0.04)]">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">메뉴 열기</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>작업</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/assets/${asset.id}`);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          상세 보기
                        </DropdownMenuItem>
                        {onViewQR && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewQR(asset.id);
                            }}
                          >
                            <QrCode className="mr-2 h-4 w-4" />
                            QR 코드 보기
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
                            편집
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
                            삭제
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </table>
      </div>
    </div>
  );
}
