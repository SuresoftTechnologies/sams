import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Edit,
  Trash2,
  QrCode,
  Loader2,
  Calendar,
  DollarSign,
  User,
  MapPin,
  Package,
  FileText,
  History,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { useGetAsset, useDeleteAsset } from '@/hooks/useAssets';
import { format } from 'date-fns';

/**
 * Asset Detail Page
 *
 * Complete asset information display with all 23+ fields
 * Organized into logical sections for better readability
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
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                ))}
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

  const getGradeBadge = (grade?: string) => {
    if (!grade) return null;
    const variant = grade === 'A' ? 'default' : grade === 'B' ? 'secondary' : 'outline';
    return <Badge variant={variant}>{grade}급</Badge>;
  };

  const formatPrice = (price?: number) => {
    if (!price) return '-';
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(price);
  };

  const formatDateString = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'yyyy년 MM월 dd일');
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <div className="space-y-4 md:space-y-6 pb-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/assets')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{asset.model || asset.asset_tag}</h1>
              {getGradeBadge(asset.grade)}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
              <code className="font-mono">{asset.asset_tag}</code>
              <span>•</span>
              <span>ID: {asset.id}</span>
            </div>
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

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Main Info Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  기본 정보
                </CardTitle>
                <CardDescription>자산의 기본 정보 및 현재 상태</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">상태</p>
                    <div>{getStatusBadge(asset.status)}</div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">모델/규격</p>
                    <p className="text-base">{asset.model || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">시리얼번호</p>
                    <p className="text-base font-mono">{asset.serial_number || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">카테고리</p>
                    <p className="text-base">{asset.category_name || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">위치</p>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <p className="text-base">{asset.location_name || '-'}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">현 사용자</p>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <p className="text-base">{asset.assigned_user_name || '미지정'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Purchase Info Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  구매 정보
                </CardTitle>
                <CardDescription>구매 및 계약 관련 정보</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">구매일</p>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="text-base">{formatDateString(asset.purchase_date)}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">구매가</p>
                    <p className="text-base font-semibold">{formatPrice(asset.purchase_price)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">구매 품의</p>
                    <p className="text-base">{asset.purchase_request || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">세금계산서 발행일</p>
                    <p className="text-base">{formatDateString(asset.tax_invoice_date)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">공급업체</p>
                    <p className="text-base">{asset.supplier || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">보증기간</p>
                    <p className="text-base">{formatDateString(asset.warranty_end)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category Details Section */}
            {(asset.furniture_category || asset.detailed_category) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    분류 상세
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">집기품목</p>
                      <p className="text-base">{asset.furniture_category || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">상세품목</p>
                      <p className="text-base">{asset.detailed_category || '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Checkout/Return Section */}
            {(asset.checkout_date || asset.return_date) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    반출/반납 정보
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">반출날짜</p>
                      <p className="text-base">{formatDateString(asset.checkout_date)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">반납날짜</p>
                      <p className="text-base">{formatDateString(asset.return_date)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* User History Section */}
            {(asset.first_user || asset.previous_user_1 || asset.previous_user_2) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    사용자 이력
                  </CardTitle>
                  <CardDescription>이전 사용자 기록</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {asset.first_user && (
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">최초 사용자</p>
                          <p className="text-base">{asset.first_user}</p>
                        </div>
                      </div>
                    )}
                    {asset.previous_user_1 && (
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">이전 사용자 1</p>
                          <p className="text-base">{asset.previous_user_1}</p>
                        </div>
                      </div>
                    )}
                    {asset.previous_user_2 && (
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">이전 사용자 2</p>
                          <p className="text-base">{asset.previous_user_2}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Info Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  추가 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {asset.old_asset_number && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">기존번호</p>
                      <p className="text-base font-mono">{asset.old_asset_number}</p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">QR코드 유무</p>
                    <p className="text-base">
                      {asset.qr_code_exists === 'Y' ? '있음' : asset.qr_code_exists === 'N' ? '없음' : '-'}
                    </p>
                  </div>
                </div>

                {(asset.notes || asset.special_notes) && <Separator />}

                {asset.notes && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">비고</p>
                    <p className="text-base whitespace-pre-wrap">{asset.notes}</p>
                  </div>
                )}

                {asset.special_notes && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">특이사항</p>
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                      <p className="text-base whitespace-pre-wrap">{asset.special_notes}</p>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="font-medium text-muted-foreground">생성일시</p>
                    <p>{formatDateString(asset.created_at)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-muted-foreground">수정일시</p>
                    <p>{formatDateString(asset.updated_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
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
                    <p className="text-sm text-muted-foreground">
                      {asset.qr_code_exists === 'Y'
                        ? 'QR 코드 있음'
                        : asset.qr_code_exists === 'N'
                        ? 'QR 코드 없음'
                        : 'QR 코드 곧 제공 예정'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>빠른 작업</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => navigate(`/assets/${id}/history`)}
                  disabled
                >
                  <History className="h-4 w-4" />
                  변경 이력 보기
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => navigate(`/assets/${id}/checkout`)}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  반출/반납 신청
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => window.print()}
                >
                  <FileText className="h-4 w-4" />
                  인쇄
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Activity History (placeholder) */}
        <Card>
          <CardHeader>
            <CardTitle>활동 이력</CardTitle>
            <CardDescription>자산의 변경 및 이동 기록</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-8">
              활동 이력이 아직 없습니다. 변경 추적 기능은 곧 추가 예정입니다.
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
              "{asset.model || asset.asset_tag}"을(를) 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.
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