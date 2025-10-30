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

type SortField = 'name' | 'asset_tag' | 'model' | 'serial_number' | 'status' | 'purchase_date' | 'grade' | 'supplier';
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
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[120px]">자산번호</TableHead>
              <TableHead className="min-w-[150px]">자산명</TableHead>
              <TableHead className="min-w-[120px]">모델</TableHead>
              <TableHead className="min-w-[120px]">시리얼번호</TableHead>
              <TableHead className="min-w-[60px]">등급</TableHead>
              <TableHead className="min-w-[100px]">카테고리</TableHead>
              <TableHead className="min-w-[80px]">상태</TableHead>
              <TableHead className="min-w-[100px]">사용자</TableHead>
              <TableHead className="min-w-[100px]">위치</TableHead>
              <TableHead className="min-w-[120px]">공급업체</TableHead>
              <TableHead className="text-right min-w-[80px]">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
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
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[120px]">자산번호</TableHead>
              <TableHead className="min-w-[150px]">자산명</TableHead>
              <TableHead className="min-w-[120px]">모델</TableHead>
              <TableHead className="min-w-[120px]">시리얼번호</TableHead>
              <TableHead className="min-w-[60px]">등급</TableHead>
              <TableHead className="min-w-[100px]">카테고리</TableHead>
              <TableHead className="min-w-[80px]">상태</TableHead>
              <TableHead className="min-w-[100px]">사용자</TableHead>
              <TableHead className="min-w-[100px]">위치</TableHead>
              <TableHead className="min-w-[120px]">공급업체</TableHead>
              <TableHead className="text-right min-w-[80px]">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                자산을 찾을 수 없습니다. 첫 번째 자산을 생성하여 시작하세요.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer select-none min-w-[120px]"
              onClick={() => handleSort('asset_tag')}
            >
              자산번호 {sortField === 'asset_tag' && (sortOrder === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead
              className="cursor-pointer select-none min-w-[150px]"
              onClick={() => handleSort('name')}
            >
              자산명 {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead
              className="cursor-pointer select-none min-w-[120px]"
              onClick={() => handleSort('model')}
            >
              모델 {sortField === 'model' && (sortOrder === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead
              className="cursor-pointer select-none min-w-[120px]"
              onClick={() => handleSort('serial_number')}
            >
              시리얼번호{' '}
              {sortField === 'serial_number' && (sortOrder === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead
              className="cursor-pointer select-none min-w-[60px]"
              onClick={() => handleSort('grade')}
            >
              등급 {sortField === 'grade' && (sortOrder === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead className="min-w-[100px]">카테고리</TableHead>
            <TableHead
              className="cursor-pointer select-none min-w-[80px]"
              onClick={() => handleSort('status')}
            >
              상태 {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead className="min-w-[100px]">사용자</TableHead>
            <TableHead className="min-w-[100px]">위치</TableHead>
            <TableHead
              className="cursor-pointer select-none min-w-[120px]"
              onClick={() => handleSort('supplier')}
            >
              공급업체 {sortField === 'supplier' && (sortOrder === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead className="text-right min-w-[80px]">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedAssets.map((asset) => (
            <TableRow
              key={asset.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => navigate(`/assets/${asset.id}`)}
            >
              <TableCell>
                <code className="text-sm font-medium">{asset.asset_tag}</code>
              </TableCell>
              <TableCell className="font-medium">{asset.name}</TableCell>
              <TableCell>
                {asset.model ? (
                  <span className="text-sm">{asset.model}</span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {asset.serial_number ? (
                  <code className="text-sm">{asset.serial_number}</code>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {asset.grade ? (
                  <Badge variant={getGradeBadgeVariant(asset.grade)}>
                    {asset.grade}급
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>{asset.category_name || '-'}</TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(asset.status)}>
                  {getStatusLabel(asset.status)}
                </Badge>
              </TableCell>
              <TableCell>
                {asset.assigned_to ? (
                  <span className="text-sm">{asset.assigned_to}</span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>{asset.location_name || '-'}</TableCell>
              <TableCell>
                {asset.supplier ? (
                  <span className="text-sm">{asset.supplier}</span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
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
