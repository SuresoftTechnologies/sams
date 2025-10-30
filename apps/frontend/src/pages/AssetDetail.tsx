import { useState, useMemo } from 'react';
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
import { useGetAsset, useDeleteAsset, useGetAssetHistory } from '@/hooks/useAssets';
import { useCategories } from '@/hooks/useCategories';
import { useLocations } from '@/hooks/useLocations';
import { format, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  getHistoryActionIcon,
  getHistoryActionColor,
  getHistoryActionLabel,
  formatChangeValue,
  getFieldLabel,
} from '@/lib/asset-history-utils';

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
  const { data: historyData, isLoading: isHistoryLoading } = useGetAssetHistory(id!, { limit: 10 });
  const { data: categories } = useCategories();
  const { data: locations } = useLocations();
  const deleteMutation = useDeleteAsset();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Create lookup maps for locations and categories
  const locationMap = useMemo(() => {
    if (!locations) return {};
    return locations.reduce((acc, loc) => {
      acc[loc.id] = loc.name;
      return acc;
    }, {} as Record<string, string>);
  }, [locations]);

  const categoryMap = useMemo(() => {
    if (!categories) return {};
    return categories.reduce((acc, cat) => {
      acc[cat.id] = cat.name;
      return acc;
    }, {} as Record<string, string>);
  }, [categories]);

  // Helper function to check if two values are effectively equal
  const areValuesEqual = (key: string, val1: unknown, val2: unknown): boolean => {
    // Handle null/undefined
    if (val1 === val2) return true;
    if (val1 == null && val2 == null) return true;
    if (val1 == null || val2 == null) return false;

    // Handle date fields - compare normalized date strings
    const dateFields = ['purchase_date', 'warranty_expiry', 'created_at', 'updated_at'];
    if (dateFields.includes(key)) {
      try {
        const date1 = new Date(String(val1));
        const date2 = new Date(String(val2));
        // Compare dates (ignoring time)
        return date1.toISOString().split('T')[0] === date2.toISOString().split('T')[0];
      } catch {
        return String(val1) === String(val2);
      }
    }

    return val1 === val2;
  };

  // Helper function to format change values with lookup maps
  const formatDisplayValue = (key: string, value: unknown): string => {
    // Handle location_id lookup
    if (key === 'location_id' && typeof value === 'string') {
      return locationMap[value] || value;
    }

    // Handle category_id lookup
    if (key === 'category_id' && typeof value === 'string') {
      return categoryMap[value] || value;
    }

    // Use default formatter for other fields
    return formatChangeValue(key, value);
  };

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

        {/* Activity History */}
        <Card>
          <CardHeader>
            <CardTitle>활동 이력</CardTitle>
            <CardDescription>자산의 변경 및 이동 기록</CardDescription>
          </CardHeader>
          <CardContent>
            {isHistoryLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : historyData && historyData.items.length > 0 ? (
              <div className="space-y-4">
                {historyData.items.map((event) => {
                  const Icon = getHistoryActionIcon(event.action);
                  const colorClass = getHistoryActionColor(event.action);
                  const timeAgo = formatDistanceToNow(new Date(event.created_at), {
                    addSuffix: true,
                    locale: ko,
                  });

                  return (
                    <div key={event.id} className="flex gap-4 pb-4 border-b last:border-0">
                      <div className={`p-2 rounded-full h-fit ${colorClass}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-sm">
                              {event.description || getHistoryActionLabel(event.action)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {event.user_name} · {timeAgo}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {getHistoryActionLabel(event.action)}
                          </Badge>
                        </div>

                        {/* Show change details if available */}
                        {event.old_values && event.new_values && (
                          <div className="mt-2 p-2 bg-muted/50 rounded-md text-xs space-y-1">
                            {Object.keys(event.new_values).map((key) => {
                              const oldVal = event.old_values?.[key];
                              const newVal = event.new_values?.[key];

                              // Skip if values are equal (using smart comparison for dates)
                              if (areValuesEqual(key, oldVal, newVal)) return null;

                              return (
                                <div key={key} className="flex items-center gap-2">
                                  <span className="text-muted-foreground">{getFieldLabel(key)}:</span>
                                  <span className="line-through text-muted-foreground">
                                    {formatDisplayValue(key, oldVal)}
                                  </span>
                                  <span>→</span>
                                  <span className="font-medium">
                                    {formatDisplayValue(key, newVal)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {historyData.total > 10 && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      // TODO: Show all history in a modal or separate page
                      alert('전체 이력 보기 기능은 준비 중입니다.');
                    }}
                  >
                    전체 이력 보기 ({historyData.total}개)
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                활동 이력이 없습니다.
              </p>
            )}
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