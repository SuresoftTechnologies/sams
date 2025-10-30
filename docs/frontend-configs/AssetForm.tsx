// src/features/assets/components/AssetForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateAsset, useUpdateAsset } from '../api/useAssets';
import type { Asset } from '@/lib/api-client';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Zod schema
const assetSchema = z.object({
  name: z.string().min(1, '자산명은 필수입니다'),
  serial_number: z.string().min(1, '시리얼 번호는 필수입니다'),
  category: z.enum(['DESKTOP', 'LAPTOP', 'MONITOR'], {
    required_error: '분류를 선택해주세요',
  }),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  location: z.string().optional(),
  purchase_date: z.string().optional(),
  warranty_end_date: z.string().optional(),
  notes: z.string().optional(),
});

type AssetFormData = z.infer<typeof assetSchema>;

interface AssetFormProps {
  asset?: Asset;
  onSuccess?: () => void;
}

export function AssetForm({ asset, onSuccess }: AssetFormProps) {
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();

  const form = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: asset || {
      name: '',
      serial_number: '',
      category: 'DESKTOP',
    },
  });

  const onSubmit = async (data: AssetFormData) => {
    if (asset) {
      await updateAsset.mutateAsync({ id: asset.id, data });
    } else {
      await createAsset.mutateAsync(data);
    }
    onSuccess?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* 자산명 */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>자산명</FormLabel>
              <FormControl>
                <Input placeholder="MacBook Pro 14" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 시리얼 번호 */}
        <FormField
          control={form.control}
          name="serial_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>시리얼 번호</FormLabel>
              <FormControl>
                <Input placeholder="C02XY1234567" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 분류 */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>분류</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="분류 선택" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="DESKTOP">데스크톱</SelectItem>
                  <SelectItem value="LAPTOP">노트북</SelectItem>
                  <SelectItem value="MONITOR">모니터</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 제조사 */}
        <FormField
          control={form.control}
          name="manufacturer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>제조사</FormLabel>
              <FormControl>
                <Input placeholder="Apple" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 모델 */}
        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>모델</FormLabel>
              <FormControl>
                <Input placeholder="MacBook Pro 14 M3" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 위치 */}
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>위치</FormLabel>
              <FormControl>
                <Input placeholder="본사 3층 개발팀" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onSuccess}>
            취소
          </Button>
          <Button
            type="submit"
            disabled={createAsset.isPending || updateAsset.isPending}
          >
            {createAsset.isPending || updateAsset.isPending
              ? '저장 중...'
              : asset
              ? '수정'
              : '등록'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
