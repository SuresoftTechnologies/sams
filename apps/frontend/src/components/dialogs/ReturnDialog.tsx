/**
 * Return Dialog Component
 *
 * Dialog for creating return requests for borrowed assets
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowApi } from '@/services/workflowApi';
import type { Asset } from '@/types/api';
import type { CreateWorkflowRequest } from '@/types/workflow';

interface ReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: Asset;
  onSuccess?: () => void;
}

const returnSchema = z.object({
  reason: z.string().max(1000, '반납 사유는 1000자 이내로 입력해주세요').optional(),
});

type ReturnFormData = z.infer<typeof returnSchema>;

export function ReturnDialog({ open, onOpenChange, asset, onSuccess }: ReturnDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<ReturnFormData>({
    resolver: zodResolver(returnSchema),
    defaultValues: {
      reason: '',
    },
  });

  const createReturnMutation = useMutation({
    mutationFn: (data: CreateWorkflowRequest) => workflowApi.createWorkflow(data),
    onSuccess: () => {
      toast.success('반납 신청이 완료되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error('Return request failed:', error);
      const errorMessage = error.response?.data?.detail || '반납 신청 중 오류가 발생했습니다.';
      toast.error(errorMessage);
    },
  });

  const onSubmit = (data: ReturnFormData) => {
    createReturnMutation.mutate({
      type: 'return',
      asset_id: asset.id,
      reason: data.reason || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>자산 반납 신청</DialogTitle>
          <DialogDescription>
            {asset.asset_tag} ({asset.model}) 자산을 반납 신청합니다.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>반납 사유 (선택)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="반납 사유를 입력하세요. (선택사항)"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createReturnMutation.isPending}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={createReturnMutation.isPending}
              >
                {createReturnMutation.isPending ? '신청 중...' : '반납 신청'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}