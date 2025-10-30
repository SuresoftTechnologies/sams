import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Calendar,
  Package,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { workflowService, type Workflow, type WorkflowType, type WorkflowStatus } from '@/services/workflow-service';
import { WorkflowTypeLabels, WorkflowStatusLabels } from '@/types/workflow';

const statusColors: Record<WorkflowStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
  completed: 'bg-blue-100 text-blue-800',
};

const statusIcons = {
  pending: <Clock className="h-4 w-4" />,
  approved: <CheckCircle className="h-4 w-4" />,
  rejected: <XCircle className="h-4 w-4" />,
  cancelled: <AlertCircle className="h-4 w-4" />,
  completed: <CheckCircle className="h-4 w-4" />,
};

export default function WorkflowApprovalsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<WorkflowStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<WorkflowType | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);

  // Modal states
  const [approvalModal, setApprovalModal] = useState<{ open: boolean; workflow?: Workflow }>({
    open: false,
  });
  const [rejectionModal, setRejectionModal] = useState<{ open: boolean; workflow?: Workflow }>({
    open: false,
  });
  const [approvalComment, setApprovalComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Query for fetching workflows
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['workflows', 'all', statusFilter, typeFilter, currentPage],
    queryFn: async () => {
      const filters: any = {
        skip: currentPage * pageSize,
        limit: pageSize,
      };

      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }

      if (typeFilter !== 'all') {
        filters.workflow_type = typeFilter;
      }

      return workflowService.getAllWorkflows(filters);
    },
  });

  // Mutation for approving workflow
  const approveMutation = useMutation({
    mutationFn: async ({ workflowId, comment }: { workflowId: string; comment?: string }) => {
      return workflowService.approveWorkflow(workflowId, comment);
    },
    onSuccess: () => {
      toast.success('승인 완료', {
        description: '신청이 성공적으로 승인되었습니다.',
      });
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      setApprovalModal({ open: false });
      setApprovalComment('');
    },
    onError: (error: any) => {
      toast.error('승인 실패', {
        description: error.message || '신청 승인에 실패했습니다.',
      });
    },
  });

  // Mutation for rejecting workflow
  const rejectMutation = useMutation({
    mutationFn: async ({ workflowId, reason }: { workflowId: string; reason: string }) => {
      return workflowService.rejectWorkflow(workflowId, reason);
    },
    onSuccess: () => {
      toast.success('거절 완료', {
        description: '신청이 거절되었습니다.',
      });
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      setRejectionModal({ open: false });
      setRejectionReason('');
    },
    onError: (error: any) => {
      toast.error('거절 실패', {
        description: error.message || '신청 거절에 실패했습니다.',
      });
    },
  });

  const handleApprove = () => {
    if (approvalModal.workflow) {
      approveMutation.mutate({
        workflowId: approvalModal.workflow.id,
        comment: approvalComment || undefined,
      });
    }
  };

  const handleReject = () => {
    if (rejectionModal.workflow && rejectionReason.trim()) {
      rejectMutation.mutate({
        workflowId: rejectionModal.workflow.id,
        reason: rejectionReason,
      });
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'yyyy-MM-dd HH:mm', { locale: ko });
  };

  const formatShortId = (id: string) => {
    return id.slice(0, 8);
  };

  const handleRowClick = (workflowId: string) => {
    navigate(`/requests/${workflowId}`);
  };

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">오류 발생</h3>
            <p className="text-sm text-muted-foreground">
              신청 목록을 불러오는데 실패했습니다.
            </p>
            <Button onClick={() => refetch()} className="mt-4">
              다시 시도
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const workflows = data?.items || [];

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">신청 관리</h1>
          <p className="text-muted-foreground">
            직원들의 자산 신청을 검토하고 승인/거절할 수 있습니다.
          </p>
        </div>
        <Badge variant="secondary">전체 {data?.total || 0}건</Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <CardTitle>신청 목록</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="상태 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 상태</SelectItem>
                  <SelectItem value="pending">대기중</SelectItem>
                  <SelectItem value="approved">승인됨</SelectItem>
                  <SelectItem value="rejected">거절됨</SelectItem>
                  <SelectItem value="cancelled">취소됨</SelectItem>
                  <SelectItem value="completed">완료됨</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="유형 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 유형</SelectItem>
                  <SelectItem value="rental">대여</SelectItem>
                  <SelectItem value="return">반납</SelectItem>
                  <SelectItem value="checkout">반출</SelectItem>
                  <SelectItem value="checkin">반입</SelectItem>
                  <SelectItem value="maintenance">유지보수</SelectItem>
                  <SelectItem value="disposal">불용처리</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <CardDescription>클릭하여 상세 정보를 확인하세요</CardDescription>
        </CardHeader>
        <CardContent>
          {workflows.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">신청 내역이 없습니다</h3>
              <p className="text-sm text-muted-foreground">
                {statusFilter !== 'all' || typeFilter !== 'all'
                  ? '선택한 필터에 해당하는 신청이 없습니다.'
                  : '아직 처리할 신청이 없습니다.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead className="w-[100px]">유형</TableHead>
                  <TableHead>자산명</TableHead>
                  <TableHead className="w-[100px]">자산코드</TableHead>
                  <TableHead>요청자</TableHead>
                  <TableHead className="w-[100px]">상태</TableHead>
                  <TableHead className="w-[150px]">신청일시</TableHead>
                  <TableHead className="w-[200px] text-center">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workflows.map((workflow) => (
                  <TableRow
                    key={workflow.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <TableCell
                      onClick={() => handleRowClick(workflow.id)}
                      className="font-mono text-xs"
                    >
                      {formatShortId(workflow.id)}
                    </TableCell>
                    <TableCell onClick={() => handleRowClick(workflow.id)}>
                      <Badge variant="outline">
                        {WorkflowTypeLabels[workflow.type as keyof typeof WorkflowTypeLabels] || workflow.type}
                      </Badge>
                    </TableCell>
                    <TableCell
                      onClick={() => handleRowClick(workflow.id)}
                      className="font-medium"
                    >
                      {workflow.asset?.name || '-'}
                    </TableCell>
                    <TableCell
                      onClick={() => handleRowClick(workflow.id)}
                      className="text-muted-foreground"
                    >
                      {workflow.asset?.asset_code || '-'}
                    </TableCell>
                    <TableCell onClick={() => handleRowClick(workflow.id)}>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span className="text-sm">
                          {workflow.requester?.name || '-'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell onClick={() => handleRowClick(workflow.id)}>
                      <div className="flex items-center gap-1">
                        {statusIcons[workflow.status]}
                        <Badge
                          variant="secondary"
                          className={statusColors[workflow.status]}
                        >
                          {WorkflowStatusLabels[workflow.status] || workflow.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell onClick={() => handleRowClick(workflow.id)}>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(workflow.created_at)}
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRowClick(workflow.id)}
                        >
                          상세보기
                        </Button>
                        {workflow.status === 'pending' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="default">
                                처리 <ChevronDown className="ml-1 h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setApprovalModal({ open: true, workflow })}
                              >
                                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                승인
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setRejectionModal({ open: true, workflow })}
                              >
                                <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                거절
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, data?.total || 0)} / 전체 {data?.total || 0}건
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            >
              이전
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              다음
            </Button>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      <Dialog open={approvalModal.open} onOpenChange={(open) => setApprovalModal({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>신청 승인</DialogTitle>
            <DialogDescription>
              이 신청을 승인하시겠습니까? 승인 코멘트를 추가할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="comment">승인 코멘트 (선택사항)</Label>
              <Textarea
                id="comment"
                placeholder="승인 관련 코멘트를 입력하세요..."
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setApprovalModal({ open: false });
                setApprovalComment('');
              }}
            >
              취소
            </Button>
            <Button
              onClick={handleApprove}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? '처리 중...' : '승인'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Modal */}
      <Dialog open={rejectionModal.open} onOpenChange={(open) => setRejectionModal({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>신청 거절</DialogTitle>
            <DialogDescription>
              이 신청을 거절하시겠습니까? 거절 사유를 반드시 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reason">거절 사유 *</Label>
              <Textarea
                id="reason"
                placeholder="거절 사유를 입력하세요..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectionModal({ open: false });
                setRejectionReason('');
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? '처리 중...' : '거절'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}