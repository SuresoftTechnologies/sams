import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AssetStatus } from '@sams/shared-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ArrowLeft, Save, Loader2, ChevronDown, Info } from 'lucide-react';
import { assetSchema, type AssetFormData } from '@/lib/validators';
import { useCreateAsset, useUpdateAsset, useGetAsset } from '@/hooks/useAssets';

/**
 * Asset Form Page
 *
 * Complete asset form with all 23+ fields from database schema
 * Organized into collapsible sections for better UX
 */

// Mock data - TODO: fetch from API
const MOCK_CATEGORIES = [
  { id: 'cat-1', name: '데스크탑', code: '11' },
  { id: 'cat-2', name: '노트북', code: '12' },
  { id: 'cat-3', name: '태블릿', code: '13' },
  { id: 'cat-4', name: '모니터', code: '14' },
  { id: 'cat-5', name: '주변기기', code: '15' },
];

const MOCK_LOCATIONS = [
  { id: 'loc-1', name: '판교 1F' },
  { id: 'loc-2', name: '판교 2F' },
  { id: 'loc-3', name: '판교 3F' },
  { id: 'loc-4', name: '대전 본사' },
  { id: 'loc-5', name: '서버실' },
];

const MOCK_USERS = [
  { id: 'user-1', name: '김철수' },
  { id: 'user-2', name: '이영희' },
  { id: 'user-3', name: '박민수' },
  { id: 'user-4', name: '정수진' },
];

// Helper function to calculate grade from purchase date
const calculateGrade = (purchaseDate?: string): string => {
  if (!purchaseDate) return '';
  const year = new Date(purchaseDate).getFullYear();
  if (year >= 2022) return 'A';
  if (year >= 2018) return 'B';
  return 'C';
};

export default function AssetForm() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const { data: asset, isLoading: isLoadingAsset } = useGetAsset(id || '');
  const createMutation = useCreateAsset();
  const updateMutation = useUpdateAsset(id!);

  // Section collapse states
  const [sectionsOpen, setSectionsOpen] = useState({
    basic: true,
    purchase: true,
    category: false,
    checkout: false,
    userHistory: false,
    additional: false,
  });

  const form = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      assetTag: '',
      model: '',
      serialNumber: '',
      categoryId: '',
      locationId: '',
      status: AssetStatus.STOCK,
      grade: '',
      assignedTo: '',
      purchaseDate: '',
      purchasePrice: null,
      purchaseRequest: '',
      taxInvoiceDate: '',
      supplier: '',
      warrantyUntil: '',
      furnitureCategory: '',
      detailedCategory: '',
      checkoutDate: '',
      returnDate: '',
      firstUser: '',
      previousUser1: '',
      previousUser2: '',
      oldAssetNumber: '',
      qrCodeExists: '',
      notes: '',
      specialNotes: '',
    },
  });

  // Watch purchase date to auto-calculate grade
  const purchaseDate = form.watch('purchaseDate');
  useEffect(() => {
    const grade = calculateGrade(purchaseDate);
    form.setValue('grade', grade);
  }, [purchaseDate, form]);

  // Populate form when editing
  useEffect(() => {
    if (isEditMode && asset) {
      form.reset({
        assetTag: asset.asset_tag || '',
        model: asset.model || '',
        serialNumber: asset.serial_number || '',
        categoryId: asset.category_id,
        locationId: asset.location_id || '',
        status: asset.status,
        grade: asset.grade || '',
        assignedTo: asset.assigned_to || '',
        purchaseDate: asset.purchase_date || '',
        purchasePrice: asset.purchase_price ?? null,
        purchaseRequest: asset.purchase_request || '',
        taxInvoiceDate: asset.tax_invoice_date || '',
        supplier: asset.supplier || '',
        warrantyUntil: asset.warranty_end || '',
        furnitureCategory: asset.furniture_category || '',
        detailedCategory: asset.detailed_category || '',
        checkoutDate: asset.checkout_date || '',
        returnDate: asset.return_date || '',
        firstUser: asset.first_user || '',
        previousUser1: asset.previous_user_1 || '',
        previousUser2: asset.previous_user_2 || '',
        oldAssetNumber: asset.old_asset_number || '',
        qrCodeExists: asset.qr_code_exists || '',
        notes: asset.notes || '',
        specialNotes: asset.special_notes || '',
      });
    }
  }, [asset, isEditMode, form]);

  const onSubmit = (data: AssetFormData) => {
    // Convert form data to snake_case for API
    const apiData = {
      asset_tag: data.assetTag,
      model: data.model,
      serial_number: data.serialNumber,
      category_id: data.categoryId,
      location_id: data.locationId,
      status: data.status,
      assigned_to: data.assignedTo,
      purchase_date: data.purchaseDate,
      purchase_price: data.purchasePrice,
      purchase_request: data.purchaseRequest,
      tax_invoice_date: data.taxInvoiceDate,
      supplier: data.supplier,
      warranty_end: data.warrantyUntil,
      furniture_category: data.furnitureCategory,
      detailed_category: data.detailedCategory,
      checkout_date: data.checkoutDate,
      return_date: data.returnDate,
      first_user: data.firstUser,
      previous_user_1: data.previousUser1,
      previous_user_2: data.previousUser2,
      old_asset_number: data.oldAssetNumber,
      qr_code_exists: data.qrCodeExists,
      notes: data.notes,
      special_notes: data.specialNotes,
    };

    if (isEditMode) {
      updateMutation.mutate(apiData as UpdateAssetDto);
    } else {
      createMutation.mutate(apiData as CreateAssetDto);
    }
  };

  const toggleSection = (section: keyof typeof sectionsOpen) => {
    setSectionsOpen((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEditMode && isLoadingAsset) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/assets')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditMode ? '자산 편집' : '새 자산 생성'}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode ? `편집 중: ${asset?.model || asset?.asset_tag}` : '시스템에 새 자산을 추가합니다'}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Section 1: Basic Information */}
          <Card>
            <Collapsible open={sectionsOpen.basic} onOpenChange={() => toggleSection('basic')}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>기본 정보</CardTitle>
                      <CardDescription>자산의 기본 정보를 입력하세요</CardDescription>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 transition-transform ${
                        sectionsOpen.basic ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {isEditMode && (
                      <FormField
                        control={form.control}
                        name="assetTag"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>자산번호</FormLabel>
                            <FormControl>
                              <Input {...field} readOnly disabled className="bg-muted" />
                            </FormControl>
                            <FormDescription>자동 생성됨</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    

                    <FormField
                      control={form.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>모델/규격</FormLabel>
                          <FormControl>
                            <Input placeholder="예: A2991" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="serialNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>시리얼번호</FormLabel>
                          <FormControl>
                            <Input placeholder="예: ABC123456" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>카테고리 *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="카테고리를 선택하세요" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {MOCK_CATEGORIES.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name} ({cat.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="locationId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>위치 *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="위치를 선택하세요" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {MOCK_LOCATIONS.map((loc) => (
                                <SelectItem key={loc.id} value={loc.id}>
                                  {loc.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>상태</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={AssetStatus.ISSUED}>지급장비</SelectItem>
                              <SelectItem value={AssetStatus.LOANED}>대여용</SelectItem>
                              <SelectItem value={AssetStatus.GENERAL}>일반장비</SelectItem>
                              <SelectItem value={AssetStatus.STOCK}>재고</SelectItem>
                              <SelectItem value={AssetStatus.SERVER_ROOM}>서버실</SelectItem>
                              <SelectItem value={AssetStatus.DISPOSED}>불용</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="grade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>등급</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input {...field} readOnly disabled className="bg-muted" />
                              {field.value && (
                                <Badge variant={field.value === 'A' ? 'default' : field.value === 'B' ? 'secondary' : 'outline'}>
                                  {field.value}급
                                </Badge>
                              )}
                            </div>
                          </FormControl>
                          <FormDescription className="flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            구매일 기준 자동 계산 (A: 2022~, B: 2018~2021, C: ~2017)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="assignedTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>현 사용자</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="사용자 선택" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="UNSPECIFIED">미지정</SelectItem>
                              {MOCK_USERS.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Section 2: Purchase Information */}
          <Card>
            <Collapsible open={sectionsOpen.purchase} onOpenChange={() => toggleSection('purchase')}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>구매 정보</CardTitle>
                      <CardDescription>자산의 구매 관련 정보</CardDescription>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 transition-transform ${
                        sectionsOpen.purchase ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="purchaseDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>구매일</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="purchasePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>구매가 (원)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(value === '' ? null : Number(value));
                              }}
                            />
                          </FormControl>
                          <FormDescription>금액을 원화로 입력하세요</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="purchaseRequest"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>구매 품의</FormLabel>
                          <FormControl>
                            <Input placeholder="예: PR-2024-001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="taxInvoiceDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>세금계산서 발행일</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="supplier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>공급업체</FormLabel>
                          <FormControl>
                            <Input placeholder="예: 한국컴퓨터" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="warrantyUntil"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>보증기간</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Section 3: Category Details */}
          <Card>
            <Collapsible open={sectionsOpen.category} onOpenChange={() => toggleSection('category')}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>분류 상세</CardTitle>
                      <CardDescription>집기품목 및 상세 분류</CardDescription>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 transition-transform ${
                        sectionsOpen.category ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="furnitureCategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>집기품목</FormLabel>
                          <FormControl>
                            <Input placeholder="예: 사무용품" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="detailedCategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>상세품목</FormLabel>
                          <FormControl>
                            <Input placeholder="예: 노트북" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Section 4: Checkout/Return Info */}
          <Card>
            <Collapsible open={sectionsOpen.checkout} onOpenChange={() => toggleSection('checkout')}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>반출/반납 정보</CardTitle>
                      <CardDescription>자산의 반출 및 반납 기록</CardDescription>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 transition-transform ${
                        sectionsOpen.checkout ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="checkoutDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>반출날짜</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="returnDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>반납날짜</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Section 5: User History */}
          <Card>
            <Collapsible open={sectionsOpen.userHistory} onOpenChange={() => toggleSection('userHistory')}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>사용자 이력</CardTitle>
                      <CardDescription>이전 사용자 기록</CardDescription>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 transition-transform ${
                        sectionsOpen.userHistory ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="firstUser"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>최초 사용자</FormLabel>
                          <FormControl>
                            <Input placeholder="이름 입력" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="previousUser1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>이전 사용자 1</FormLabel>
                          <FormControl>
                            <Input placeholder="이름 입력" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="previousUser2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>이전 사용자 2</FormLabel>
                          <FormControl>
                            <Input placeholder="이름 입력" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Section 6: Additional Info */}
          <Card>
            <Collapsible open={sectionsOpen.additional} onOpenChange={() => toggleSection('additional')}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>추가 정보</CardTitle>
                      <CardDescription>기타 추가 정보</CardDescription>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 transition-transform ${
                        sectionsOpen.additional ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="oldAssetNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>기존번호</FormLabel>
                          <FormControl>
                            <Input placeholder="이전 자산번호" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="qrCodeExists"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>QR코드 유무</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="선택하세요" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="UNSPECIFIED">미지정</SelectItem>
                              <SelectItem value="Y">있음</SelectItem>
                              <SelectItem value="N">없음</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>비고</FormLabel>
                        <FormControl>
                          <Textarea
                            className="min-h-[100px]"
                            placeholder="일반적인 메모나 참고사항..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="specialNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>특이사항</FormLabel>
                        <FormControl>
                          <Textarea
                            className="min-h-[100px]"
                            placeholder="특별히 주의해야 할 사항..."
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>수리 이력, 손상 정보 등 특별한 사항</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/assets')}
              disabled={isPending}
            >
              취소
            </Button>
            <Button type="submit" className="gap-2" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isEditMode ? '수정 중...' : '생성 중...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isEditMode ? '자산 수정' : '자산 생성'}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}