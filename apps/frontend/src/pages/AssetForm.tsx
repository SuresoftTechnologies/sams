import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { AssetStatus } from '@sams/shared-types';
import { useQueryClient } from '@tanstack/react-query';
import type { CreateAssetDto } from '@sams/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
import {
  ArrowLeft,
  Save,
  Loader2,
  ChevronDown,
  Info,
  Upload,
  Check,
} from 'lucide-react';
import { assetSchema, type AssetFormData } from '@/lib/validators';
import { useCreateAsset, useUpdateAsset, useGetAsset } from '@/hooks/useAssets';
import { useGetCategories } from '@/hooks/useCategories';
import { useGetLocations } from '@/hooks/useLocations';
import { useGetUsers } from '@/hooks/useUsers';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RECEIPT_UPLOAD } from '@/lib/constants';
import type { AnalyzeReceiptFromImageResponse } from '@/types/receipt';
import { analyzeReceiptFromImage } from '@/services/receipt-service';
import { api } from '@/lib/api';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

/**
 * Asset Form Page
 *
 * Complete asset form with all 23+ fields from database schema
 * Organized into collapsible sections for better UX
 */

// Helper function to calculate grade from purchase date
const calculateGrade = (purchaseDate?: string): string => {
  if (!purchaseDate) return '';
  const year = new Date(purchaseDate).getFullYear();
  if (year >= 2022) return 'A';
  if (year >= 2018) return 'B';
  return 'C';
};

interface BulkEditableLineItem {
  id: string;
  name: string;
  extractedName: string;
  quantity: number;
  unitPrice: string;
  categoryId: string;
  purchaseDate: string;
  model: string;
  specifications: string;
  itemType: string;
  locationId: string;
  isSelected: boolean;
}

type BulkCreationStatus = 'idle' | 'processing' | 'success' | 'partial' | 'error';

interface CreatedAssetSummary {
  id: string;
  assetTag: string;
}

interface BulkCreationResultEntry {
  totalRequested: number;
  successCount: number;
  failureCount: number;
  status: BulkCreationStatus;
  createdAssets: CreatedAssetSummary[];
  errors: string[];
}

const normalizeUnitPrice = (value?: string | null): string => {
  if (!value) return '';
  const digitsOnly = value.replace(/[^0-9]/g, '');
  return digitsOnly;
};

const normalizeDateForInput = (value?: string | null): string => {
  if (!value) return '';
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  const match = value.match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : '';
};

export default function AssetForm() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const queryClient = useQueryClient();

  const { data: asset, isLoading: isLoadingAsset } = useGetAsset(id || '');
  const createMutation = useCreateAsset();
  const updateMutation = useUpdateAsset(id!);

  const [bulkCreationResults, setBulkCreationResults] = useState<Record<string, BulkCreationResultEntry>>({});
  const [isBulkCreating, setIsBulkCreating] = useState(false);
  const [bulkCreationProgress, setBulkCreationProgress] = useState({ completed: 0, total: 0 });

  // Fetch categories, locations, and users from API
  const { data: categoriesData, isLoading: categoriesLoading } = useGetCategories();
  const { data: locationsData, isLoading: locationsLoading } = useGetLocations();
  const { data: usersData, isLoading: usersLoading } = useGetUsers({ limit: 100 });

  // Ensure we always have arrays
  const categories = Array.isArray(categoriesData) ? categoriesData : [];
  const locations = Array.isArray(locationsData) ? locationsData : [];
  const users = usersData?.items || [];

  // Section collapse states
  const [sectionsOpen, setSectionsOpen] = useState({
    basic: true,
    purchase: true,
    category: false,
    checkout: false,
    userHistory: false,
    additional: false,
  });
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkFileInputKey, setBulkFileInputKey] = useState(0);
  const [bulkUrl, setBulkUrl] = useState('');
  const [bulkMessage, setBulkMessage] = useState<
    { tone: 'error' | 'info' | 'success'; text: string } | null
  >(null);
  const [bulkIsAnalyzing, setBulkIsAnalyzing] = useState(false);
  const [bulkResult, setBulkResult] = useState<AnalyzeReceiptFromImageResponse | null>(null);
  const [bulkEditableItems, setBulkEditableItems] = useState<BulkEditableLineItem[]>([]);
  const [bulkDefaultLocationId, setBulkDefaultLocationId] = useState<string | null>(null);
  const initialBulkItemsRef = useRef<BulkEditableLineItem[]>([]);

  const validateBulkFile = (file: File): string | null => {
    const extension = file.name?.split('.').pop()?.toLowerCase() ?? '';
    const fileExtension = extension ? `.${extension}` : '';
    const hasAllowedExtension =
      extension.length > 0 &&
      RECEIPT_UPLOAD.ALLOWED_EXTENSIONS.some((allowedExtension) => allowedExtension === fileExtension);
    const hasAllowedMime =
      !file.type ||
      RECEIPT_UPLOAD.ALLOWED_MIME_TYPES.some((allowedMime) => allowedMime === file.type);

    if (!hasAllowedExtension || !hasAllowedMime) {
      return '지원하지 않는 파일 형식입니다. PDF, JPG, PNG, WEBP만 업로드할 수 있습니다.';
    }

    if (file.size > RECEIPT_UPLOAD.MAX_FILE_SIZE) {
      const maxSizeMb = Math.round(RECEIPT_UPLOAD.MAX_FILE_SIZE / (1024 * 1024));
      return `파일 용량이 너무 큽니다. 최대 ${maxSizeMb}MB까지 업로드할 수 있습니다.`;
    }

    return null;
  };

  const validateBulkUrl = (value: string): string | null => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return '이미지 URL을 입력해 주세요.';
    }

    try {
      const parsed = new URL(trimmedValue);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return '이미지 URL은 http 또는 https로 시작해야 합니다.';
      }
    } catch (error) {
      return '올바른 형식의 이미지 URL을 입력해 주세요.';
    }

    return null;
  };

  const getBulkMessageClassName = (tone: 'error' | 'info' | 'success') => {
    switch (tone) {
      case 'error':
        return 'text-destructive';
      case 'success':
        return 'text-emerald-600 dark:text-emerald-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const parseUnitPriceToNumber = (value: string): number | undefined => {
    if (!value) {
      return undefined;
    }

    const numericValue = Number.parseInt(value, 10);
    if (Number.isNaN(numericValue) || numericValue <= 0) {
      return undefined;
    }

    return numericValue;
  };

  const getBulkItemLabel = (item: BulkEditableLineItem) => {
    const trimmedName = item.name?.trim();
    if (trimmedName) {
      return trimmedName;
    }

    const normalizedExtractedName = item.extractedName?.trim();
    if (normalizedExtractedName) {
      return normalizedExtractedName;
    }

    const index = bulkEditableItems.findIndex((entry) => entry.id === item.id);
    return index >= 0 ? `항목 ${index + 1}` : '영수증 항목';
  };

  const buildCreateAssetPayload = (
    item: BulkEditableLineItem,
    sequenceIndex: number,
    totalCount: number,
  ): CreateAssetDto => {
    const modelName = item.model?.trim() || item.name?.trim() || item.extractedName;
    const supplierFromAnalysis = bulkResult?.analysis.supplier?.trim() || undefined;
    const purchaseDate = item.purchaseDate?.trim() || undefined;
    const purchasePrice = parseUnitPriceToNumber(item.unitPrice);
    const itemLabel = getBulkItemLabel(item);

    const notesParts: string[] = [];
    if (itemLabel) {
      notesParts.push(`세금계산서 항목: ${itemLabel}`);
    }
    if (totalCount > 1) {
      notesParts.push(`분할 ${sequenceIndex + 1}/${totalCount}`);
    }
    if (item.specifications) {
      notesParts.push(`규격 ${item.specifications}`);
    }

    const notes = notesParts.length > 0 ? notesParts.join(' • ') : undefined;

    return {
      category_id: item.categoryId,
      location_id: item.locationId || undefined,
      status: AssetStatus.STOCK,
      model: modelName || undefined,
      purchase_date: purchaseDate,
      purchase_price: purchasePrice,
      supplier: supplierFromAnalysis,
      notes,
      special_notes: item.itemType ? `인식된 품목 유형: ${item.itemType}` : undefined,
    };
  };

  const form = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      assetTag: '',
      model: '',
      serialNumber: '',
      categoryId: '',
      locationId: 'UNSPECIFIED',
      status: AssetStatus.STOCK,
      grade: '',
      assignedTo: 'UNSPECIFIED',
      purchaseDate: '',
      purchasePrice: null,
      purchaseRequest: '',
      taxInvoiceDate: '',
      supplier: '',
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
        locationId: asset.location_id || 'UNSPECIFIED',
        status: asset.status,
        grade: asset.grade || '',
        assignedTo: asset.assigned_to || 'UNSPECIFIED',
        purchaseDate: asset.purchase_date || '',
        purchasePrice: asset.purchase_price ?? null,
        purchaseRequest: asset.purchase_request || '',
        taxInvoiceDate: asset.tax_invoice_date || '',
        supplier: asset.supplier || '',
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
    // The hooks handle the conversion to DTOs internally
    if (isEditMode) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const toggleSection = (section: keyof typeof sectionsOpen) => {
    setSectionsOpen((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!bulkDialogOpen) {
      setBulkFile(null);
      setBulkFileInputKey((prev) => prev + 1);
      setBulkUrl('');
      setBulkMessage(null);
      setBulkResult(null);
      setBulkEditableItems([]);
      setBulkDefaultLocationId(null);
      setBulkIsAnalyzing(false);
      setBulkCreationResults({});
      setIsBulkCreating(false);
      setBulkCreationProgress({ completed: 0, total: 0 });
      initialBulkItemsRef.current = [];
    }
  }, [bulkDialogOpen]);

  useEffect(() => {
    if (!bulkResult) {
      setBulkEditableItems([]);
      initialBulkItemsRef.current = [];
      return;
    }

    const defaultPurchaseDate = normalizeDateForInput(bulkResult.analysis.purchase_date);
    const lineItems = Array.isArray(bulkResult.analysis.line_items)
      ? bulkResult.analysis.line_items
      : [];

    const initialItems = lineItems.map((item, index) => {
        const initialQuantity = Number.isFinite(item.quantity) && item.quantity > 0
          ? Math.floor(item.quantity)
          : 1;

      const extractedName = item.name?.trim() || `항목 ${index + 1}`;

        return {
        id: `${index}-${extractedName || 'line-item'}`,
        name: '',
        extractedName,
          quantity: initialQuantity,
          unitPrice: normalizeUnitPrice(item.unit_price),
          categoryId: '',
          purchaseDate: defaultPurchaseDate,
          model: item.model ?? '',
          specifications: item.specifications ?? '',
          itemType: item.item_type ?? '',
        locationId: '',
        isSelected: true,
        } satisfies BulkEditableLineItem;
    });

    initialBulkItemsRef.current = initialItems.map((item) => ({ ...item }));
    setBulkEditableItems(initialItems);
    setBulkDefaultLocationId(null);
    setBulkCreationResults({});
    setBulkCreationProgress({ completed: 0, total: 0 });
  }, [bulkResult]);

  useEffect(() => {
    setBulkCreationResults((prev) => {
      const activeIds = new Set(bulkEditableItems.map((item) => item.id));
      const hasRemoved = Object.keys(prev).some((id) => !activeIds.has(id));

      if (!hasRemoved) {
        return prev;
      }

      const next: Record<string, BulkCreationResultEntry> = {};
      bulkEditableItems.forEach((item) => {
        if (prev[item.id]) {
          next[item.id] = prev[item.id];
        }
      });

      return next;
    });
  }, [bulkEditableItems]);

  useEffect(() => {
    if (!bulkResult || categories.length === 0) {
      return;
    }

    setBulkEditableItems((prev) =>
      prev.map((item) => {
        if (item.categoryId) {
          return item;
        }

        const matchedCategory =
          categories.find((category) => category.code === bulkResult.suggested_category_code) ??
          categories.find((category) => {
            const normalizedCategoryName = category.name.trim();
            const candidates = [item.extractedName, item.itemType]
              .map((value) => value?.trim())
              .filter((value): value is string => Boolean(value));
            return candidates.some((candidate) => candidate === normalizedCategoryName);
          });

    if (!matchedCategory) {
          return item;
    }

        return {
              ...item,
              categoryId: matchedCategory.id,
        };
      })
    );
  }, [bulkResult, categories]);

  const totalBulkAssetCount = useMemo(
    () =>
      bulkEditableItems.reduce((sum, item) => {
        if (!item.isSelected || !Number.isFinite(item.quantity)) {
          return sum;
        }
        return sum + Math.max(0, item.quantity);
      }, 0),
    [bulkEditableItems]
  );

  const selectedBulkItemCount = useMemo(
    () => bulkEditableItems.filter((item) => item.isSelected).length,
    [bulkEditableItems]
  );

  const selectedBulkItemsWithQuantity = useMemo(
    () =>
      bulkEditableItems.filter((item) =>
        item.isSelected && Math.max(0, Math.floor(item.quantity)) > 0
      ),
    [bulkEditableItems]
  );

  const hasBulkSelection = selectedBulkItemCount > 0;

  const allSelectedItemsCompleted = useMemo(() => {
    if (selectedBulkItemsWithQuantity.length === 0) {
      return false;
    }

    return selectedBulkItemsWithQuantity.every((item) => {
      const entry = bulkCreationResults[item.id];
      const targetCount = Math.max(0, Math.floor(item.quantity));

      if (!entry) {
        return false;
      }

      return (
        entry.status === 'success' &&
        entry.failureCount === 0 &&
        entry.successCount >= targetCount
      );
    });
  }, [selectedBulkItemsWithQuantity, bulkCreationResults]);

  const updateBulkItem = (
    itemId: string,
    updater: (item: BulkEditableLineItem) => BulkEditableLineItem,
  ) => {
    setBulkEditableItems((prev) =>
      prev.map((item) => (item.id === itemId ? updater(item) : item))
    );
  };

  const toggleBulkItemSelection = (itemId: string) => {
    setBulkEditableItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              isSelected: !item.isSelected,
            }
          : item
      )
    );
  };

  const applyBulkLocationToSelected = () => {
    if (bulkDefaultLocationId === null) {
      toast.error('적용할 위치를 선택해 주세요.');
      return;
    }

    if (!hasBulkSelection) {
      toast.error('위치를 적용할 항목을 먼저 선택해 주세요.');
      return;
    }

    setBulkEditableItems((prev) =>
      prev.map((item) =>
        item.isSelected
          ? {
              ...item,
              locationId: bulkDefaultLocationId || '',
            }
          : item
      )
    );

    const locationLabel =
      !bulkDefaultLocationId
        ? '미지정'
        : locations.find((location) => location.id === bulkDefaultLocationId)?.name || '선택된 위치';

    setBulkMessage({
      tone: 'success',
      text: `선택된 항목에 "${locationLabel}" 위치를 적용했습니다.`,
    });

    toast.success('위치를 적용했습니다.', {
      description: `선택된 항목에 ${locationLabel} 위치를 일괄 지정했어요.`,
    });
  };

  const clearLocationsFromSelected = () => {
    if (!hasBulkSelection) {
      toast.error('위치를 초기화할 항목을 먼저 선택해 주세요.');
      return;
    }

    setBulkEditableItems((prev) =>
      prev.map((item) =>
        item.isSelected
          ? {
              ...item,
              locationId: '',
            }
          : item
      )
    );

    setBulkMessage({
      tone: 'info',
      text: '선택된 항목의 위치를 초기화했습니다.',
    });

    toast.info('위치를 초기화했습니다.', {
      description: '선택된 항목이 다시 위치 미지정 상태가 되었습니다.',
    });
  };

  type BulkCreationTask = {
    itemId: string;
    itemLabel: string;
    total: number;
    sequenceIndex: number;
    createDto: CreateAssetDto;
  };

  const runBulkCreate = async (itemsToProcess: BulkEditableLineItem[]) => {
    if (isBulkCreating) {
      toast.info('이미 자산 생성이 진행 중입니다.', {
        description: '현재 작업이 완료된 후 다시 시도해 주세요.',
      });
      return;
    }

    const validItems = itemsToProcess
      .map((item) => ({
        ...item,
        quantity: Math.max(0, Math.floor(item.quantity)),
      }))
      .filter((item) => item.quantity > 0);

    if (validItems.length === 0) {
      setBulkMessage({
        tone: 'error',
        text: '생성할 수량이 설정된 항목이 없습니다.',
      });
      toast.error('생성할 항목이 없습니다.', {
        description: '수량이 0이거나 항목이 선택되지 않았습니다.',
      });
      return;
    }

    const missingCategoryItems = validItems.filter((item) => !item.categoryId);
    if (missingCategoryItems.length > 0) {
      const labels = missingCategoryItems.map((item) => getBulkItemLabel(item)).join(', ');
      const message = `카테고리가 지정되지 않은 항목이 있습니다: ${labels}`;

      setBulkMessage({ tone: 'error', text: message });
      toast.error('카테고리를 선택해 주세요.', {
        description: message,
      });
      return;
    }

    const missingLocationItems = validItems.filter((item) => !item.locationId);
    if (missingLocationItems.length > 0) {
      const labels = missingLocationItems.map((item) => getBulkItemLabel(item)).join(', ');
      const message = `위치가 지정되지 않은 항목이 있습니다: ${labels}`;

      setBulkMessage({ tone: 'error', text: message });
      toast.error('위치를 지정해 주세요.', {
        description: message,
      });
      return;
    }

    const nextResults: Record<string, BulkCreationResultEntry> = { ...bulkCreationResults };
    const tasks: BulkCreationTask[] = [];

    validItems.forEach((item) => {
      const targetCount = Math.max(0, Math.floor(item.quantity));
      const previousEntry = bulkCreationResults[item.id];
      const previousSuccess = Math.min(previousEntry?.successCount ?? 0, targetCount);
      const preservedAssets = previousEntry?.createdAssets.slice(0, previousSuccess > 0 ? previousSuccess : undefined) ?? [];
      const toCreate = Math.max(0, targetCount - previousSuccess);

      nextResults[item.id] = {
        totalRequested: targetCount,
        successCount: previousSuccess,
        failureCount: 0,
        status:
          toCreate > 0
            ? 'processing'
            : previousSuccess >= targetCount && targetCount > 0
            ? 'success'
            : previousSuccess > 0
            ? 'partial'
            : 'idle',
        createdAssets: preservedAssets,
        errors: [],
      };

      if (toCreate === 0) {
        return;
      }

      const itemLabel = getBulkItemLabel(item);

      for (let i = 0; i < toCreate; i += 1) {
        const sequenceIndex = previousSuccess + i;
        tasks.push({
          itemId: item.id,
          itemLabel,
          total: Math.max(1, targetCount),
          sequenceIndex,
          createDto: buildCreateAssetPayload(item, sequenceIndex, Math.max(1, targetCount)),
        });
      }
    });

    if (tasks.length === 0) {
      setBulkCreationResults(nextResults);
      setBulkMessage({
        tone: 'info',
        text: '모든 선택 항목이 이미 생성되었습니다. 수량을 조정하거나 새로운 항목을 선택해 주세요.',
      });
      toast.info('생성할 항목이 없습니다.', {
        description: '이미 생성된 항목이거나 수량이 0입니다.',
      });
      return;
    }

    setBulkCreationResults(nextResults);
    setIsBulkCreating(true);
    setBulkCreationProgress({ completed: 0, total: tasks.length });
    setBulkMessage({
      tone: 'info',
      text: `선택한 항목 ${tasks.length}건을 자산으로 생성 중입니다. 잠시만 기다려 주세요.`,
    });

    const loadingToastId = toast.loading('자산 생성 중...', {
      description: `총 ${tasks.length}건의 자산 생성 요청을 처리하고 있습니다.`,
    });

    let successCounter = 0;
    let failureCounter = 0;

    try {
      for (const task of tasks) {
        try {
          const createdAsset = await api.assets.create(task.createDto);

          successCounter += 1;

          setBulkCreationResults((prev) => {
            const entry = prev[task.itemId];
            if (!entry) {
              return prev;
            }

            const updatedSuccess = entry.successCount + 1;
            const remaining = Math.max(0, entry.totalRequested - updatedSuccess);
            const nextStatus: BulkCreationStatus =
              remaining === 0 && entry.failureCount === 0 ? 'success' : entry.failureCount > 0 || remaining > 0 ? 'partial' : entry.status;

            return {
              ...prev,
              [task.itemId]: {
                ...entry,
                successCount: updatedSuccess,
                status: nextStatus,
                createdAssets: [
                  ...entry.createdAssets,
                  { id: createdAsset.id, assetTag: createdAsset.asset_tag },
                ],
              },
            };
          });
        } catch (error) {
          failureCounter += 1;

          const errorMessage =
            error instanceof Error && error.message
              ? error.message
              : '자산 생성에 실패했습니다. 다시 시도해 주세요.';

          let shouldNotify = false;

          setBulkCreationResults((prev) => {
            const entry = prev[task.itemId];
            if (!entry) {
              shouldNotify = true;
              return prev;
            }

            if (entry.failureCount === 0) {
              shouldNotify = true;
            }

            return {
              ...prev,
              [task.itemId]: {
                ...entry,
                failureCount: entry.failureCount + 1,
                status: entry.successCount > 0 ? 'partial' : 'error',
                errors: [...entry.errors, errorMessage],
              },
            };
          });

          if (shouldNotify) {
            toast.error(`'${task.itemLabel}' 항목 생성 실패`, {
              description: `${task.sequenceIndex + 1}/${task.total}번째 요청: ${errorMessage}`,
            });
          }
        } finally {
          setBulkCreationProgress((prev) => ({
            completed: Math.min(prev.completed + 1, prev.total),
            total: prev.total,
          }));
        }
      }
    } finally {
      setIsBulkCreating(false);
      setBulkCreationProgress({ completed: 0, total: 0 });

      setBulkCreationResults((prev) => {
        const next = { ...prev };
        itemsToProcess.forEach((item) => {
          const entry = next[item.id];
          if (!entry) {
            return;
          }
          const remaining = Math.max(0, entry.totalRequested - entry.successCount);
          let finalStatus: BulkCreationStatus = entry.status;

          if (entry.failureCount === 0 && remaining === 0) {
            finalStatus = 'success';
          } else if (entry.failureCount > 0 && entry.successCount > 0) {
            finalStatus = 'partial';
          } else if (entry.failureCount > 0 && entry.successCount === 0) {
            finalStatus = 'error';
          }

          next[item.id] = {
            ...entry,
            status: finalStatus,
          };
        });
        return next;
      });

      if (successCounter > 0) {
        queryClient.invalidateQueries({ queryKey: ['assets'] }).catch(() => {});
      }

      if (failureCounter === 0) {
        toast.success('자산 생성이 완료되었습니다.', {
          id: loadingToastId,
          description: `총 ${successCounter}건의 자산이 생성되었습니다.`,
        });
        setBulkMessage({
          tone: 'success',
          text: `자산 생성 완료: 총 ${successCounter}건을 생성했습니다.`,
        });
      } else if (successCounter > 0) {
        toast.warning('일부 자산 생성에 실패했습니다.', {
          id: loadingToastId,
          description: `성공 ${successCounter}건 · 실패 ${failureCounter}건. 실패 항목에서 재시도할 수 있습니다.`,
        });
        setBulkMessage({
          tone: 'info',
          text: `성공 ${successCounter}건, 실패 ${failureCounter}건입니다. 실패한 항목에서 재시도해 주세요.`,
        });
      } else {
        toast.error('자산 생성에 실패했습니다.', {
          id: loadingToastId,
          description: '모든 요청이 실패했습니다. 입력값을 확인한 후 다시 시도해 주세요.',
        });
        setBulkMessage({
          tone: 'error',
          text: '자산 생성에 모두 실패했습니다. 입력 정보를 다시 확인한 뒤 재시도해 주세요.',
        });
      }
    }
  };

  const handleBulkConfirmSelection = () => {
    if (!hasBulkSelection) {
      const message = '등록할 항목을 최소 한 개 이상 선택해 주세요.';
      setBulkMessage({ tone: 'error', text: message });
      toast.error('선택된 항목이 없습니다.', { description: message });
      return;
    }

    const selectedItems = bulkEditableItems.filter((item) => item.isSelected);
    void runBulkCreate(selectedItems);
  };

  const handleBulkRetry = (itemId: string) => {
    const targetItem = bulkEditableItems.find((item) => item.id === itemId);
    if (!targetItem) {
      toast.error('재시도할 항목을 찾지 못했습니다.');
      return;
    }

    const entry = bulkCreationResults[itemId];
    const remaining = Math.max(0, targetItem.quantity - (entry?.successCount ?? 0));

    if (remaining === 0) {
      toast.info('재시도할 요청이 없습니다.', {
        description: '수량을 늘리거나 항목 정보를 수정한 후 다시 시도해 주세요.',
      });
      return;
    }

    void runBulkCreate([targetItem]);
  };

  const handleBulkAnalyze = async () => {
    if (bulkIsAnalyzing) {
      return;
    }

    const trimmedUrl = bulkUrl.trim();

    if (!bulkFile && !trimmedUrl) {
      const message = '파일 업로드 또는 URL 입력 중 하나를 선택해 주세요.';
      setBulkMessage({ tone: 'error', text: message });
      toast.error('입력값이 필요합니다', { description: message });
      return;
    }

    if (bulkFile) {
      const fileError = validateBulkFile(bulkFile);
      if (fileError) {
        setBulkMessage({ tone: 'error', text: fileError });
        toast.error('파일 검증 실패', { description: fileError });
        return;
      }
    }

    if (!bulkFile && trimmedUrl) {
      const urlError = validateBulkUrl(trimmedUrl);
      if (urlError) {
        setBulkMessage({ tone: 'error', text: urlError });
        toast.error('URL 검증 실패', { description: urlError });
        return;
      }
    }

    const loadingToastId = toast.loading('영수증 분석 중입니다...', {
      description: 'OCR 및 LLM 분석을 수행하고 있습니다.',
    });

    setBulkIsAnalyzing(true);
    setBulkMessage({ tone: 'info', text: '영수증을 분석 중입니다. 잠시만 기다려 주세요.' });

    try {
      const result = await analyzeReceiptFromImage({
        file: bulkFile,
        imageUrl: bulkFile ? null : trimmedUrl,
      });

      setBulkResult(result);
      setBulkMessage({
        tone: 'success',
        text: '분석이 완료되었습니다. 추출된 항목을 검토해 주세요.',
      });

      toast.success('영수증 분석 완료', {
        id: loadingToastId,
        description: `총 ${result.analysis.line_items.length}개 항목을 추출했어요.`,
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : '영수증 분석에 실패했습니다. 잠시 후 다시 시도해 주세요.';
      setBulkResult(null);
      setBulkMessage({ tone: 'error', text: message });
      toast.error('영수증 분석 실패', {
        id: loadingToastId,
        description: message,
      });
    } finally {
      setBulkIsAnalyzing(false);
    }
  };

  if (isEditMode && isLoadingAsset) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/assets')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isEditMode ? '자산 편집' : '새 자산 생성'}
            </h1>
            <p className="text-muted-foreground">
              {isEditMode
                ? `편집 중: ${asset?.model || asset?.asset_tag}`
                : '시스템에 새 자산을 추가합니다'}
            </p>
          </div>
        </div>
        {!isEditMode && (
          <Button variant="secondary" className="gap-2" onClick={() => setBulkDialogOpen(true)}>
            <Upload className="h-4 w-4" />
            세금계산서 기반 자산 일괄 등록
          </Button>
        )}
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
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                            disabled={categoriesLoading}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={categoriesLoading ? "로딩 중..." : "카테고리를 선택하세요"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-[300px] overflow-y-auto">
                              {categories.length === 0 && !categoriesLoading ? (
                                <SelectItem value="empty" disabled>
                                  카테고리가 없습니다
                                </SelectItem>
                              ) : (
                                categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                                ))
                              )}
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
                          <FormLabel>위치</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                            disabled={locationsLoading}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={locationsLoading ? "로딩 중..." : "위치를 선택하세요"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-[300px] overflow-y-auto">
                              <SelectItem value="UNSPECIFIED">미지정</SelectItem>
                              {locations.length === 0 && !locationsLoading ? (
                                <SelectItem value="empty" disabled>
                                  위치가 없습니다
                                </SelectItem>
                              ) : (
                                locations.map((loc) => (
                                <SelectItem key={loc.id} value={loc.id}>
                                  {loc.name}
                                </SelectItem>
                                ))
                              )}
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
                            <SelectContent className="max-h-[300px] overflow-y-auto">
                              <SelectItem value="UNSPECIFIED">미지정</SelectItem>
                              {users.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.name} {user.department && `(${user.department})`}
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

      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>세금계산서 기반 자산 일괄 등록</DialogTitle>
            <DialogDescription>
              세금계산서 파일 또는 전자세금계산서 열람 URL을 입력해 자산 정보를 일괄 분석할 준비를 합니다.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh] pr-2">
            <div className="space-y-5 pb-4 sm:pb-6">
            <div className="space-y-2">
              <Label htmlFor="bulk-receipt-file">세금계산서 파일 업로드</Label>
              <Input
                id="bulk-receipt-file"
                type="file"
                accept="application/pdf,image/*"
                key={bulkFileInputKey}
                disabled={Boolean(bulkUrl.trim())}
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  if (file) {
                    const validationMessage = validateBulkFile(file);
                    if (validationMessage) {
                      setBulkMessage({ tone: 'error', text: validationMessage });
                      setBulkFile(null);
                      setBulkResult(null);
                      setBulkFileInputKey((prev) => prev + 1);
                      return;
                    }
                  }

                  setBulkFile(file);
                  if (file) {
                    setBulkUrl('');
                  }
                  setBulkResult(null);
                  setBulkMessage(null);
                }}
              />
              <p className="text-sm text-muted-foreground">
                PDF, JPG, PNG 형식의 세금계산서 파일을 업로드하면 OCR 분석이 준비됩니다.
              </p>
              {bulkFile && (
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-primary">선택된 파일: {bulkFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setBulkFile(null);
                      setBulkFileInputKey((prev) => prev + 1);
                      setBulkUrl('');
                      setBulkMessage(null);
                    }}
                  >
                    선택 해제
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-receipt-url">세금계산서 URL</Label>
              <Input
                id="bulk-receipt-url"
                type="url"
                placeholder="https://example.com/invoice"
                value={bulkUrl}
                disabled={Boolean(bulkFile)}
                onChange={(event) => {
                  const value = event.target.value;
                  setBulkUrl(value);
                  if (value.trim()) {
                    setBulkFile(null);
                    setBulkFileInputKey((prev) => prev + 1);
                  }
                  setBulkResult(null);
                  setBulkMessage(null);
                }}
              />
              <p className="text-sm text-muted-foreground">
                전자세금계산서 열람 페이지 URL을 입력하면 원본 다운로드 없이도 분석을 준비합니다.
              </p>
            </div>

            {bulkMessage && (
              <p
                className={`text-sm ${getBulkMessageClassName(bulkMessage.tone)}`}
              >
                {bulkMessage.text}
              </p>
            )}

            {bulkResult && (
              <div className="space-y-4">
                <div className="space-y-3 rounded-md border border-dashed border-primary/40 bg-primary/5 p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-primary">분석 요약</p>
                    <p className="text-sm text-muted-foreground">
                      추천 자산명: <span className="font-medium text-foreground">{bulkResult.suggested_name}</span>
                    </p>
                    {bulkResult.suggested_notes && (
                      <p className="text-xs text-muted-foreground">{bulkResult.suggested_notes}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>추출 항목 {bulkResult.analysis.line_items.length}개</span>
                    <span>처리 시간 {bulkResult.processing_time.toFixed(1)}초</span>
                    <span>신뢰도 {(bulkResult.analysis.confidence * 100).toFixed(0)}%</span>
                  </div>

                  {bulkResult.warnings.length > 0 && (
                    <div className="rounded-md border border-dashed border-amber-400/60 bg-amber-100/60 p-3 text-xs text-amber-700 dark:border-amber-500/60 dark:bg-amber-950/40 dark:text-amber-200">
                      <p className="font-medium">주의가 필요한 항목</p>
                      <ul className="mt-1 space-y-1 list-disc list-inside">
                        {bulkResult.warnings.map((warning, index) => (
                          <li key={`${warning}-${index}`}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {bulkEditableItems.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">추출된 자산 항목</p>
                        <p className="text-xs text-muted-foreground">
                          {bulkEditableItems.length}건 • 선택 {selectedBulkItemCount}건 • 총 {totalBulkAssetCount}개 생성 예정
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="whitespace-nowrap">
                          선택 {selectedBulkItemCount}건
                        </Badge>
                      <Badge variant="outline" className="whitespace-nowrap">
                          생성 예정 {totalBulkAssetCount}개
                      </Badge>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      각 항목의 카테고리, 수량, 단가, 구매일을 검토하고 필요 시 수정하세요.
                    </p>

                    {isBulkCreating && (
                      <div className="flex items-center gap-2 rounded-md border border-dashed border-primary/40 bg-primary/5 p-3 text-xs font-medium text-primary sm:text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>
                          자산 생성 중... ({bulkCreationProgress.completed}/{bulkCreationProgress.total})
                        </span>
                      </div>
                    )}

                    <div className="space-y-2 rounded-md border border-dashed border-muted-foreground/40 bg-muted/10 p-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-1 flex-wrap items-center gap-2">
                          <Select
                            value={
                              bulkDefaultLocationId === null
                                ? LOCATION_UNASSIGNED
                                : bulkDefaultLocationId === ''
                                ? LOCATION_UNASSIGNED
                                : bulkDefaultLocationId
                            }
                            onValueChange={(value) =>
                              setBulkDefaultLocationId(value === LOCATION_UNASSIGNED ? '' : value)
                            }
                            disabled={locationsLoading || locations.length === 0}
                          >
                            <SelectTrigger className="w-full sm:w-[260px]">
                              <SelectValue
                                placeholder={
                                  locationsLoading
                                    ? '위치 목록 로딩 중...'
                                    : '공용으로 적용할 위치를 선택하세요'
                                }
                              />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              {locations.length === 0 ? (
                                <SelectItem value="__no-location" disabled>
                                  등록된 위치가 없습니다
                                </SelectItem>
                              ) : (
                                <>
                                  <SelectItem value={LOCATION_UNASSIGNED}>위치 미지정</SelectItem>
                                  {locations.map((location) => (
                                    <SelectItem key={location.id} value={location.id}>
                                      {location.name}
                                    </SelectItem>
                                  ))}
                                </>
                              )}
                            </SelectContent>
                          </Select>

                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={applyBulkLocationToSelected}
                            disabled={
                              locations.length === 0 ||
                              locationsLoading ||
                              !hasBulkSelection ||
                              bulkDefaultLocationId === null ||
                              isBulkCreating
                            }
                          >
                            선택 항목에 적용
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={clearLocationsFromSelected}
                            disabled={!hasBulkSelection || isBulkCreating}
                          >
                            선택 항목 위치 초기화
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground sm:max-w-sm sm:text-right">
                          위치 열을 제거한 대신 공용 위치를 선택해 적용합니다. 필요 시 선택된 항목의 위치를 초기화할 수 있습니다.
                        </p>
                      </div>
                    </div>

                    <div className="max-h-72 overflow-auto rounded-md border">
                      <div className="min-w-[900px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-16 text-center">등록</TableHead>
                              <TableHead className="w-12 text-center">#</TableHead>
                              <TableHead className="w-64">카테고리</TableHead>
                              <TableHead className="w-48">모델/규격</TableHead>
                              <TableHead className="w-28">수량</TableHead>
                              <TableHead className="w-32">단가(원)</TableHead>
                              <TableHead className="w-36">구매일</TableHead>
                              <TableHead className="w-64">생성 상태</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {bulkEditableItems.map((item, index) => {
                              const formattedUnitPrice = item.unitPrice ? Number(item.unitPrice) : 0;
                              const creationEntry = bulkCreationResults[item.id];
                              const targetCountForRow = Math.max(0, Math.floor(item.quantity));
                              const totalForRow = creationEntry?.totalRequested ?? targetCountForRow;
                              const successForRow = Math.min(creationEntry?.successCount ?? 0, totalForRow);
                              const failureForRow = creationEntry?.failureCount ?? 0;
                              const lastError = creationEntry?.errors.slice(-1)[0];
                              const statusForRow = creationEntry?.status ?? 'idle';
                              const createdAssetBadges = creationEntry?.createdAssets ?? [];
                              const totalDisplayCount = totalForRow > 0 ? totalForRow : targetCountForRow;

                              return (
                                <TableRow key={item.id}>
                                  <TableCell className="text-center align-middle">
                                    <label className="flex h-full items-center justify-center">
                                      <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        aria-label={`${item.extractedName || `항목 ${index + 1}`} 항목 등록 여부`}
                                        checked={item.isSelected}
                                        onChange={() => toggleBulkItemSelection(item.id)}
                                      />
                                    </label>
                                  </TableCell>
                                  <TableCell className="text-center align-top">{index + 1}</TableCell>
                                  <TableCell className="align-top">
                                    <Select
                                      value={item.categoryId}
                                      onValueChange={(value) =>
                                        updateBulkItem(item.id, (current) => ({
                                          ...current,
                                          categoryId: value,
                                        }))
                                      }
                                      disabled={categoriesLoading || categories.length === 0}
                                    >
                                      <SelectTrigger title={item.extractedName || undefined}>
                                        <SelectValue
                                          placeholder={
                                          categoriesLoading
                                            ? '카테고리 로딩 중...'
                                            : '카테고리를 선택하세요'
                                          }
                                        />
                                      </SelectTrigger>
                                      <SelectContent className="max-h-60">
                                        {categories.length === 0 ? (
                                          <SelectItem value="__no-category" disabled>
                                            등록된 카테고리가 없습니다
                                          </SelectItem>
                                        ) : (
                                          categories.map((category) => (
                                            <SelectItem key={category.id} value={category.id}>
                                              {category.name}
                                            </SelectItem>
                                          ))
                                        )}
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell className="align-top">
                                    <div className="space-y-1 text-sm">
                                      {item.model && (
                                        <p className="text-muted-foreground">
                                          <span className="font-medium text-foreground">모델</span>: {item.model}
                                        </p>
                                      )}
                                      {item.specifications && (
                                        <p className="text-muted-foreground">
                                          <span className="font-medium text-foreground">규격</span>: {item.specifications}
                                        </p>
                                      )}
                                      {!item.model && !item.specifications && (
                                        <span className="text-xs text-muted-foreground">-</span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="align-top">
                                    <Input
                                      type="number"
                                      min={0}
                                      step={1}
                                      value={item.quantity}
                                      onChange={(event) => {
                                        const value = Number(event.target.value);
                                        const nextQuantity = Number.isNaN(value) ? 0 : Math.max(0, Math.floor(value));
                                        updateBulkItem(item.id, (current) => ({
                                          ...current,
                                          quantity: nextQuantity,
                                        }));
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell className="align-top">
                                    <Input
                                      inputMode="numeric"
                                      value={item.unitPrice}
                                      placeholder="0"
                                      onChange={(event) => {
                                        const value = normalizeUnitPrice(event.target.value);
                                        updateBulkItem(item.id, (current) => ({
                                          ...current,
                                          unitPrice: value,
                                        }));
                                      }}
                                    />
                                    {item.unitPrice && (
                                      <p className="mt-1 text-xs text-muted-foreground">
                                        ≈ ₩{formattedUnitPrice.toLocaleString('ko-KR')}
                                      </p>
                                    )}
                                  </TableCell>
                                  <TableCell className="align-top">
                                    <Input
                                      type="date"
                                      value={item.purchaseDate}
                                      onChange={(event) =>
                                        updateBulkItem(item.id, (current) => ({
                                          ...current,
                                          purchaseDate: event.target.value,
                                        }))
                                      }
                                    />
                                  </TableCell>
                                  <TableCell className="align-top">
                                    <div className="space-y-1 text-xs">
                                      {statusForRow === 'processing' && (
                                        <span className="flex items-center gap-1 text-primary">
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                          생성 중...
                                        </span>
                                      )}
                                      {totalDisplayCount > 0 ? (
                                        <span
                                          className={
                                            statusForRow === 'success'
                                              ? 'font-medium text-emerald-600 dark:text-emerald-500'
                                              : 'font-medium text-foreground'
                                          }
                                        >
                                          성공 {Math.min(successForRow, totalDisplayCount)} / {totalDisplayCount}
                                        </span>
                                      ) : (
                                        <span className="text-muted-foreground">대상 없음</span>
                                      )}
                                      {failureForRow > 0 && (
                                        <span className="text-destructive">실패 {failureForRow}건</span>
                                      )}
                                      {createdAssetBadges.length > 0 && (
                                        <div className="flex flex-wrap gap-1 pt-1">
                                          {createdAssetBadges.slice(-3).map((asset) => (
                                            <Badge
                                              key={asset.id}
                                              variant="secondary"
                                              className="text-[10px] font-semibold"
                                            >
                                              {asset.assetTag}
                                            </Badge>
                                          ))}
                                          {createdAssetBadges.length > 3 && (
                                            <span className="text-[10px] text-muted-foreground">
                                              +{createdAssetBadges.length - 3}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                      {lastError && (
                                        <p className="text-[11px] text-destructive">
                                          최근 오류: {lastError}
                                        </p>
                                      )}
                                      {failureForRow > 0 && (
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="h-7 px-2 text-[11px]"
                                          onClick={() => handleBulkRetry(item.id)}
                                          disabled={isBulkCreating}
                                        >
                                          실패분 재시도
                                        </Button>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    분석 결과에서 추출된 항목이 없습니다. 다른 영수증으로 재시도해 주세요.
                  </p>
                )}
              </div>
            )}
            </div>
          </ScrollArea>

          <DialogFooter className="flex flex-col gap-2 pt-2 pb-2 sm:flex-row sm:items-center sm:justify-between sm:pt-4">
            <div className="flex flex-wrap gap-2">
              {bulkEditableItems.length > 0 && (
                allSelectedItemsCompleted ? (
                  <Button
                    type="button"
                    className="gap-2"
                    variant="secondary"
                    onClick={() => setBulkDialogOpen(false)}
                  >
                    <Check className="h-4 w-4" />
                    등록 완료
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="gap-2"
                    onClick={handleBulkConfirmSelection}
                    disabled={!hasBulkSelection || isBulkCreating}
                  >
                    {isBulkCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        생성 중...
                      </>
                    ) : (
                      '선택 항목 등록'
                    )}
                  </Button>
                )
              )}
            </div>
            <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setBulkDialogOpen(false)}>
              단일 자산 등록 계속
            </Button>
            <Button
              type="button"
              className="gap-2"
              onClick={handleBulkAnalyze}
              disabled={bulkIsAnalyzing || isBulkCreating || (!bulkFile && !bulkUrl.trim())}
            >
              {bulkIsAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  영수증 분석 실행
                </>
              )}
            </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}