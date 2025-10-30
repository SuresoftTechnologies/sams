import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Edit, Trash2, QrCode, Loader2, Calendar, DollarSign } from 'lucide-react';
import { useGetAsset, useDeleteAsset } from '@/hooks/useAssets';
import { format } from 'date-fns';

/**
 * Asset Detail Page
 *
 * Features:
 * - Display complete asset information
 * - QR code placeholder (to be implemented)
 * - Edit and delete actions
 * - Confirmation dialog for deletion
 * - Activity history (placeholder)
 */
export default function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: asset, isLoading, error } = useGetAsset(id!);
  const deleteMutation = useDeleteAsset();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = () => {
    if (id) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-16 w-full" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/assets')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">자산을 찾을 수 없습니다</h1>
          </div>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">
              요청한 자산을 찾을 수 없습니다. 삭제되었을 수 있습니다.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      issued: { variant: 'default' as const, label: '지급장비' },
      loaned: { variant: 'secondary' as const, label: '대여용' },
      general: { variant: 'outline' as const, label: '일반장비' },
      stock: { variant: 'secondary' as const, label: '재고' },
      server_room: { variant: 'default' as const, label: '서버실' },
      disposed: { variant: 'destructive' as const, label: '불용' },
    };
    const config = variants[status as keyof typeof variants] || variants.general;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <>
      <div className="space-y-4 md:space-y-6 px-4 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/assets')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{asset.name}</h1>
            <p className="text-sm text-muted-foreground">자산 ID: {asset.id}</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              className="gap-2 flex-1 sm:flex-initial"
              onClick={() => navigate(`/assets/${id}/edit`)}
            >
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">편집</span>
            </Button>
            <Button
              variant="destructive"
              className="gap-2 flex-1 sm:flex-initial"
              onClick={() => setShowDeleteDialog(true)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">삭제</span>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Info */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>자산 정보</CardTitle>
              <CardDescription>이 자산에 대한 상세 정보</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">상태</p>
                  <div className="mt-1">{getStatusBadge(asset.status)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">시리얼 번호</p>
                  <p className="text-base mt-1">{asset.serialNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">카테고리</p>
                  <p className="text-base mt-1">{asset.category_name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">위치</p>
                  <p className="text-base mt-1">{asset.location_name || '-'}</p>
                </div>
              </div>

              {asset.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">설명</p>
                  <p className="text-base mt-1">{asset.description}</p>
                </div>
              )}

              <div className="pt-4 border-t space-y-3">
                <h4 className="font-medium text-sm">구매 정보</h4>
                <div className="grid grid-cols-2 gap-4">
                  {asset.purchaseDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">구매일</p>
                        <p className="text-sm">
                          {format(new Date(asset.purchaseDate), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  )}
                  {asset.purchasePrice && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">구매 가격</p>
                        <p className="text-sm">
                          {new Intl.NumberFormat('ko-KR', {
                            style: 'currency',
                            currency: 'KRW',
                          }).format(asset.purchasePrice)}
                        </p>
                      </div>
                    </div>
                  )}
                  {asset.warrantyUntil && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">보증 기간</p>
                        <p className="text-sm">
                          {format(new Date(asset.warrantyUntil), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR 코드
              </CardTitle>
              <CardDescription>스캔하여 자산 보기</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/50">
                <div className="text-center">
                  <QrCode className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">QR 코드 곧 제공 예정</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* History */}
        <Card>
          <CardHeader>
            <CardTitle>활동 이력</CardTitle>
            <CardDescription>반입 및 반출 기록</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-8">
              활동 이력이 아직 없습니다. 반입/반출 기능은 Phase 8에 추가 예정입니다.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>자산 삭제</DialogTitle>
            <DialogDescription>
              "{asset.name}"을(를) 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  삭제 중...
                </>
              ) : (
                '삭제'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
