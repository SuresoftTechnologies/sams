import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  ArrowLeft,
  Package,
  User,
  Calendar,
  Clock,
  FileText,
  MessageSquare,
  CheckCircle,
  XCircle,
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import WorkflowComments from '@/components/WorkflowComments';
import { workflowService, type Workflow } from '@/services/workflow-service';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
  completed: 'bg-blue-100 text-blue-800',
};

const statusIcons = {
  pending: <Clock className="h-5 w-5" />,
  approved: <CheckCircle className="h-5 w-5" />,
  rejected: <XCircle className="h-5 w-5" />,
  cancelled: <AlertCircle className="h-5 w-5" />,
  completed: <CheckCircle className="h-5 w-5" />,
};

const typeLabels: Record<string, string> = {
  checkout: '반출',
  checkin: '반입',
  transfer: '이관',
  maintenance: '유지보수',
  rental: '대여',
  return: '반납',
  disposal: '불용처리',
};

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadWorkflow(id);
    }
  }, [id]);

  const loadWorkflow = async (workflowId: string) => {
    try {
      setIsLoading(true);
      const data = await workflowService.getWorkflow(workflowId);
      setWorkflow(data);
    } catch (error) {
      console.error('Failed to load workflow:', error);
      toast.error('오류', {
        description: '신청 정보를 불러오는데 실패했습니다.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'yyyy년 MM월 dd일 HH:mm', { locale: ko });
  };

  const handleCancel = async () => {
    if (!workflow) return;

    if (workflow.status !== 'pending') {
      toast.error('취소 불가', {
        description: '대기중인 신청만 취소할 수 있습니다.',
      });
      return;
    }

    try {
      await workflowService.cancelWorkflow(workflow.id);
      toast.success('취소 완료', {
        description: '신청이 취소되었습니다.',
      });
      loadWorkflow(workflow.id);
    } catch (error) {
      console.error('Failed to cancel workflow:', error);
      toast.error('오류', {
        description: '신청 취소에 실패했습니다.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">신청을 찾을 수 없습니다</h3>
            <p className="text-sm text-muted-foreground mb-4">
              요청하신 신청 정보를 찾을 수 없습니다.
            </p>
            <Button variant="outline" onClick={() => navigate('/requests')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/requests')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">신청 상세</h1>
            <p className="text-muted-foreground">
              신청 ID: {workflow.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {statusIcons[workflow.status]}
          <Badge
            variant="secondary"
            className={statusColors[workflow.status]}
          >
            {workflow.status === 'pending' && '대기중'}
            {workflow.status === 'approved' && '승인됨'}
            {workflow.status === 'rejected' && '반려됨'}
            {workflow.status === 'cancelled' && '취소됨'}
            {workflow.status === 'completed' && '완료'}
          </Badge>
        </div>
      </div>

      {/* Workflow Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            신청 정보
          </CardTitle>
          <CardDescription>
            {typeLabels[workflow.type]} 신청 상세 정보
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">신청 유형</p>
              <Badge variant="outline" className="text-base">
                {typeLabels[workflow.type]}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">신청일시</p>
              <p className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(workflow.created_at)}
              </p>
            </div>
          </div>

          <Separator />

          {/* Asset Info */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              자산 정보
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">자산명</p>
                <p className="font-medium">{workflow.asset?.name || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">자산코드</p>
                <p className="font-medium">{workflow.asset?.asset_code || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">모델</p>
                <p className="font-medium">{workflow.asset?.model || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">제조사</p>
                <p className="font-medium">{workflow.asset?.manufacturer || '-'}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Request Details */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              신청 상세
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">신청자</p>
                <p className="font-medium">{workflow.requester?.name || '-'}</p>
              </div>
              {workflow.type === 'checkout' && workflow.expected_return_date && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">반납 예정일</p>
                  <p className="font-medium">
                    {format(new Date(workflow.expected_return_date), 'yyyy년 MM월 dd일', { locale: ko })}
                  </p>
                </div>
              )}
              {workflow.reason && (
                <div className="space-y-1 md:col-span-2">
                  <p className="text-sm text-muted-foreground">사유</p>
                  <p className="font-medium">{workflow.reason}</p>
                </div>
              )}
            </div>
          </div>

          {/* Approval Info */}
          {(workflow.approved_at || workflow.rejected_at) && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold">처리 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                  {workflow.approver && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">처리자</p>
                      <p className="font-medium">{workflow.approver.name}</p>
                    </div>
                  )}
                  {workflow.approved_at && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">승인일시</p>
                      <p className="font-medium">{formatDate(workflow.approved_at)}</p>
                    </div>
                  )}
                  {workflow.rejected_at && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">반려일시</p>
                      <p className="font-medium">{formatDate(workflow.rejected_at)}</p>
                    </div>
                  )}
                  {workflow.reject_reason && (
                    <div className="space-y-1 md:col-span-2">
                      <p className="text-sm text-muted-foreground">반려 사유</p>
                      <p className="font-medium text-red-600">{workflow.reject_reason}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          {workflow.status === 'pending' && (
            <>
              <Separator />
              <div className="flex justify-end gap-2">
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                >
                  신청 취소
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            커뮤니케이션
          </CardTitle>
          <CardDescription>
            관리자와 메시지를 주고받을 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorkflowComments workflowId={workflow.id} />
        </CardContent>
      </Card>
    </div>
  );
}