import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
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
import { MoreHorizontal, Edit, Trash2, Eye, QrCode } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Asset } from '@/hooks/useAssets';

/**
 * AssetTable Component
 *
 * Displays assets in a table format with sorting and filtering
 * - Desktop-optimized view
 * - Column sorting
 * - Row actions (view, edit, delete)
 * - Status badges
 *
 * Usage:
 * <AssetTable
 *   assets={assets}
 *   onEdit={(id) => navigate(`/assets/${id}/edit`)}
 *   onDelete={(id) => deleteAsset(id)}
 * />
 */

interface AssetTableProps {
  assets: Asset[];
  isLoading?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onViewQR?: (id: string) => void;
}

type SortField = 'name' | 'serialNumber' | 'status' | 'purchaseDate';
type SortOrder = 'asc' | 'desc';

export function AssetTable({
  assets,
  isLoading = false,
  onEdit,
  onDelete,
  onViewQR,
}: AssetTableProps) {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Sort assets
  const sortedAssets = [...assets].sort((a, b) => {
    let aValue: string | number | null | undefined = a[sortField];
    let bValue: string | number | null | undefined = b[sortField];

    if (sortField === 'purchaseDate') {
      aValue = a.purchaseDate ? new Date(a.purchaseDate).getTime() : 0;
      bValue = b.purchaseDate ? new Date(b.purchaseDate).getTime() : 0;
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

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>자산 이름</TableHead>
              <TableHead>시리얼 번호</TableHead>
              <TableHead>카테고리</TableHead>
              <TableHead>위치</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>구매일</TableHead>
              <TableHead>가격</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>자산 이름</TableHead>
              <TableHead>시리얼 번호</TableHead>
              <TableHead>카테고리</TableHead>
              <TableHead>위치</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>구매일</TableHead>
              <TableHead>가격</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                자산을 찾을 수 없습니다. 첫 번째 자산을 생성하여 시작하세요.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort('name')}
            >
              자산 이름 {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort('serialNumber')}
            >
              시리얼 번호{' '}
              {sortField === 'serialNumber' && (sortOrder === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead>카테고리</TableHead>
            <TableHead>위치</TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort('status')}
            >
              상태 {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort('purchaseDate')}
            >
              구매일{' '}
              {sortField === 'purchaseDate' && (sortOrder === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead>가격</TableHead>
            <TableHead className="text-right">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedAssets.map((asset) => (
            <TableRow
              key={asset.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => navigate(`/assets/${asset.id}`)}
            >
              <TableCell className="font-medium">{asset.name}</TableCell>
              <TableCell>
                {asset.serial_number ? (
                  <code className="text-sm">{asset.serial_number}</code>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>{asset.category_name || '-'}</TableCell>
              <TableCell>{asset.location_name || '-'}</TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(asset.status)}>
                  {getStatusLabel(asset.status)}
                </Badge>
              </TableCell>
              <TableCell>
                {asset.purchaseDate ? formatDate(asset.purchaseDate) : '-'}
              </TableCell>
              <TableCell>
                {asset.purchasePrice ? formatCurrency(asset.purchasePrice) : '-'}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
