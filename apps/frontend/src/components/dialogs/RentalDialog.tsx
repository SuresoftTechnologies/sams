/**
 * Rental Dialog Component
 *
 * Dialog for creating rental requests for loaned assets
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowApi } from '@/services/workflowApi';
import type { Asset } from '@/types/api';
import type { CreateWorkflowRequest } from '@/types/workflow';

interface RentalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: Asset;
  onSuccess?: () => void;
}

const rentalSchema = z.object({
  reason: z.string().min(1, '대여 사유를 입력해주세요').max(1000, '대여 사유는 1000자 이내로 입력해주세요'),
  expected_return_date: z.date({
    required_error: '반납 예정일을 선택해주세요',
  }).refine((date) => date > new Date(), {
    message: '반납 예정일은 오늘 이후여야 합니다',
  }),
});

type RentalFormData = z.infer<typeof rentalSchema>;

export function RentalDialog({ open, onOpenChange, asset, onSuccess }: RentalDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<RentalFormData>({
    resolver: zodResolver(rentalSchema),
    defaultValues: {
      reason: '',
      expected_return_date: addDays(new Date(), 7), // Default to 1 week from now
    },
  });

  const createRentalMutation = useMutation({
    mutationFn: (data: CreateWorkflowRequest) => workflowApi.createWorkflow(data),
    onSuccess: () => {
      toast.success('대여 신청이 완료되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error('Rental request failed:', error);
      const errorMessage = error.response?.data?.detail || '대여 신청 중 오류가 발생했습니다.';
      toast.error(errorMessage);
    },
  });

  const onSubmit = (data: RentalFormData) => {
    createRentalMutation.mutate({
      type: 'rental',
      asset_id: asset.id,
      reason: data.reason,
      expected_return_date: data.expected_return_date.toISOString(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>자산 대여 신청</DialogTitle>
          <DialogDescription>
            {asset.asset_tag} ({asset.model}) 자산을 대여 신청합니다.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>대여 사유 *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="대여 사유를 입력하세요. (예: 프로젝트 진행, 출장, 테스트 등)"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expected_return_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>반납 예정일 *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP', { locale: ko })
                          ) : (
                            <span>날짜를 선택하세요</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                        locale={ko}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createRentalMutation.isPending}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={createRentalMutation.isPending}
              >
                {createRentalMutation.isPending ? '신청 중...' : '대여 신청'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}