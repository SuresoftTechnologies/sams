import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { format, addDays } from 'date-fns';
import {
  Package,
  Wrench,
  Trash2,
  Calendar,
  FileText,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { workflowService, type WorkflowType, type CreateWorkflowRequest } from '@/services/workflow-service';
import { assetService } from '@/services/asset-service';
import { useAuthStore } from '@/stores/auth-store';
import { useRole } from '@/hooks/useRole';
import type { Asset } from '@/types/api';

interface WorkflowTypeOption {
  value: WorkflowType;
  label: string;
  description: string;
  icon: React.ReactNode;
  requiredRoles?: string[];
}

const workflowTypes: WorkflowTypeOption[] = [
  {
    value: 'rental',
    label: '대여',
    description: '자산을 일정 기간 대여합니다',
    icon: <Package className="h-5 w-5" />,
  },
  {
    value: 'return',
    label: '반납',
    description: '대여한 자산을 반납합니다',
    icon: <ArrowLeft className="h-5 w-5" />,
  },
  {
    value: 'checkout',
    label: '반출',
    description: '자산을 외부로 반출합니다',
    icon: <ArrowRight className="h-5 w-5" />,
    requiredRoles: ['admin', 'manager'],
  },
  {
    value: 'checkin',
    label: '반입',
    description: '반출한 자산을 반입합니다',
    icon: <ArrowLeft className="h-5 w-5" />,
  },
  {
    value: 'maintenance',
    label: '유지보수',
    description: '자산의 유지보수를 요청합니다',
    icon: <Wrench className="h-5 w-5" />,
    requiredRoles: ['admin', 'manager'],
  },
  {
    value: 'disposal',
    label: '불용처리',
    description: '자산을 불용처리 요청합니다',
    icon: <Trash2 className="h-5 w-5" />,
    requiredRoles: ['admin', 'manager'],
  },
];

export default function RequestFormPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { hasRole } = useRole();

  const [selectedType, setSelectedType] = useState<WorkflowType | ''>('');
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [reason, setReason] = useState('');
  const [returnDate, setReturnDate] = useState('');

  // Filter workflow types based on user role
  const availableTypes = workflowTypes.filter(type => {
    if (!type.requiredRoles || type.requiredRoles.length === 0) {
      return true;
    }
    return hasRole(...type.requiredRoles as any);
  });

  // Query for all assets - we'll filter client-side based on the workflow type
  const { data: assetsData, isLoading: assetsLoading, error: assetsError } = useQuery({
    queryKey: ['assets', 'all'],
    queryFn: () => assetService.getAssets({
      limit: 200, // Get more assets to ensure we have enough after filtering
    }),
    enabled: !!selectedType,
  });

  // Filter assets based on workflow type and user
  const filteredAssets = useMemo(() => {
    if (!assetsData?.items) return [];

    const assets = assetsData.items;
    const currentUserId = user?.id?.toString();

    switch (selectedType) {
      case 'rental':
        // RENTAL: 대여 가능한 자산 (loaned 상태 + 미할당)
        return assets.filter((asset: Asset) =>
          asset.status === 'loaned' &&
          (!asset.assigned_to || asset.assigned_to === null)
        );

      case 'return':
      case 'checkin':
        // RETURN/CHECKIN: 현재 사용자에게 할당된 자산
        if (!currentUserId) return [];
        return assets.filter((asset: Asset) =>
          asset.assigned_to === currentUserId
        );

      case 'checkout':
        // CHECKOUT: 반출 가능한 자산 (loaned/stock 상태 + 미할당)
        return assets.filter((asset: Asset) =>
          (asset.status === 'loaned' || asset.status === 'stock') &&
          (!asset.assigned_to || asset.assigned_to === null)
        );

      case 'maintenance':
      case 'disposal':
        // MAINTENANCE/DISPOSAL: 모든 자산
        return assets;

      default:
        return assets;
    }
  }, [assetsData?.items, selectedType, user?.id]);

  // Mutation for creating workflow
  const createMutation = useMutation({
    mutationFn: async (data: CreateWorkflowRequest) => {
      if (data.type === 'checkout') {
        return workflowService.createCheckout({
          asset_id: data.asset_id,
          reason: data.reason,
          expected_return_date: data.expected_return_date,
        });
      } else if (data.type === 'checkin') {
        return workflowService.createCheckin({
          asset_id: data.asset_id,
          reason: data.reason,
        });
      } else {
        return workflowService.createWorkflow(data);
      }
    },
    onSuccess: () => {
      toast.success('신청 완료', {
        description: '신청이 성공적으로 제출되었습니다.',
      });
      navigate('/requests');
    },
    onError: (error: any) => {
      toast.error('신청 실패', {
        description: error.message || '신청 제출에 실패했습니다.',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedType) {
      toast.error('신청 유형을 선택해주세요');
      return;
    }

    if (!selectedAsset) {
      toast.error('자산을 선택해주세요');
      return;
    }

    // Validate required fields based on type
    if ((selectedType === 'rental' || selectedType === 'checkout') && !returnDate) {
      toast.error('반납 예정일을 선택해주세요');
      return;
    }

    if ((selectedType === 'maintenance' || selectedType === 'disposal') && !reason) {
      toast.error('사유를 입력해주세요');
      return;
    }

    const requestData: CreateWorkflowRequest = {
      type: selectedType,
      asset_id: selectedAsset,
      reason: reason || undefined,
      expected_return_date: returnDate || undefined,
    };

    createMutation.mutate(requestData);
  };

  const requiresReturnDate = selectedType === 'rental' || selectedType === 'checkout';
  const requiresReason = selectedType === 'maintenance' || selectedType === 'disposal';

  // Set minimum date for return date (tomorrow)
  const minReturnDate = format(addDays(new Date(), 1), 'yyyy-MM-dd');

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/requests')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          내 신청 목록으로 돌아가기
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">신청하기</h1>
        <p className="text-muted-foreground">
          자산 관련 신청을 제출할 수 있습니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Select Request Type */}
        <Card>
          <CardHeader>
            <CardTitle>1. 신청 유형 선택</CardTitle>
            <CardDescription>
              원하시는 신청 유형을 선택해주세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={selectedType}
              onValueChange={(value: string) => {
                setSelectedType(value as WorkflowType);
                setSelectedAsset('');
                setReason('');
                setReturnDate('');
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableTypes.map((type) => (
                  <label
                    key={type.value}
                    htmlFor={type.value}
                    className={`
                      relative flex cursor-pointer rounded-lg border p-4
                      hover:bg-accent transition-colors
                      ${selectedType === type.value ? 'border-primary bg-accent' : 'border-border'}
                    `}
                  >
                    <RadioGroupItem
                      value={type.value}
                      id={type.value}
                      className="sr-only"
                    />
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {type.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{type.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {type.description}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Step 2: Select Asset */}
        {selectedType && (
          <Card>
            <CardHeader>
              <CardTitle>2. 자산 선택</CardTitle>
              <CardDescription>
                {selectedType === 'return' || selectedType === 'checkin'
                  ? '반납할 자산을 선택해주세요'
                  : '신청할 자산을 선택해주세요'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error Alert */}
              {assetsError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    자산 목록을 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.
                  </AlertDescription>
                </Alert>
              )}

              {/* Asset Selection */}
              <div className="space-y-2">
                <Label htmlFor="asset">자산 *</Label>
                <Select
                  value={selectedAsset}
                  onValueChange={setSelectedAsset}
                  disabled={assetsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      assetsLoading
                        ? '자산 목록 로딩 중...'
                        : filteredAssets.length === 0
                        ? '선택 가능한 자산이 없습니다'
                        : '자산을 선택하세요'
                    } />
                  </SelectTrigger>
                  <SelectContent className="max-h-[250px] overflow-y-auto">
                    {assetsLoading ? (
                      <SelectItem value="loading" disabled>
                        자산 목록 로딩 중...
                      </SelectItem>
                    ) : filteredAssets.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        <div className="py-2">
                          <span className="text-muted-foreground">
                            {selectedType === 'return' || selectedType === 'checkin'
                              ? '반납 가능한 자산이 없습니다'
                              : selectedType === 'rental'
                              ? '대여 가능한 자산이 없습니다'
                              : selectedType === 'checkout'
                              ? '반출 가능한 자산이 없습니다'
                              : '선택 가능한 자산이 없습니다'}
                          </span>
                        </div>
                      </SelectItem>
                    ) : (
                      filteredAssets.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          <div className="flex flex-col py-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {asset.model || asset.manufacturer || 'Unknown Model'}
                              </span>
                              {asset.serial_number && (
                                <span className="text-xs text-muted-foreground">
                                  S/N: {asset.serial_number}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground">
                                자산태그: {asset.asset_tag}
                              </span>
                              {asset.status && (
                                <span className={`
                                  text-xs px-1.5 py-0.5 rounded-full
                                  ${asset.status === 'loaned' ? 'bg-blue-100 text-blue-700' :
                                    asset.status === 'stock' ? 'bg-green-100 text-green-700' :
                                    asset.status === 'disposed' ? 'bg-red-100 text-red-700' :
                                    asset.status === 'general' ? 'bg-purple-100 text-purple-700' :
                                    'bg-gray-100 text-gray-700'}
                                `}>
                                  {asset.status === 'loaned' ? '대여가능' :
                                   asset.status === 'stock' ? '재고' :
                                   asset.status === 'disposed' ? '폐기' :
                                   asset.status === 'general' ? '일반' :
                                   asset.status}
                                </span>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                {/* Helper text */}
                {!assetsLoading && filteredAssets.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    총 {filteredAssets.length}개의 자산을 선택할 수 있습니다.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Additional Information */}
        {selectedType && selectedAsset && (
          <Card>
            <CardHeader>
              <CardTitle>3. 추가 정보</CardTitle>
              <CardDescription>
                신청에 필요한 추가 정보를 입력해주세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Return Date (for rental/checkout) */}
              {requiresReturnDate && (
                <div className="space-y-2">
                  <Label htmlFor="returnDate">
                    반납 예정일 *
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="returnDate"
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      min={minReturnDate}
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    최소 내일 이후 날짜를 선택해주세요
                  </p>
                </div>
              )}

              {/* Reason */}
              <div className="space-y-2">
                <Label htmlFor="reason">
                  사유 {requiresReason ? '*' : '(선택사항)'}
                </Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="신청 사유를 입력해주세요..."
                  rows={4}
                  required={requiresReason}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        {selectedType && selectedAsset && (
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/requests')}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  제출 중...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  신청 제출
                </>
              )}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}