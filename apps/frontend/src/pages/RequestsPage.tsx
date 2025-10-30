import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Package,
  ArrowRight,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Plus
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { workflowService, type Workflow } from '@/services/workflow-service';

const statusColors = {
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

const typeLabels: Record<string, string> = {
  checkout: '반출',
  checkin: '반입',
  transfer: '이관',
  maintenance: '유지보수',
  rental: '대여',
  return: '반납',
  disposal: '불용처리',
};

export default function RequestsPage() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    skip: 0,
    limit: 20,
  });

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      setIsLoading(true);
      const response = await workflowService.getMyRequests({
        skip: pagination.skip,
        limit: pagination.limit,
      });
      setWorkflows(response.items);
      setPagination({
        total: response.total,
        skip: response.skip,
        limit: response.limit,
      });
    } catch (error) {
      console.error('Failed to load workflows:', error);
      toast.error('오류', {
        description: '신청 목록을 불러오는데 실패했습니다.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRowClick = (workflowId: string) => {
    navigate(`/requests/${workflowId}`);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'yyyy-MM-dd HH:mm', { locale: ko });
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

  return (
    <TooltipProvider>
      <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">내 신청 내역</h1>
          <p className="text-muted-foreground">
            자산 대여/반납 신청 내역을 확인할 수 있습니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            전체 {pagination.total}건
          </Badge>
          <Button onClick={() => navigate('/requests/new')}>
            <Plus className="h-4 w-4 mr-2" />
            신청하기
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            신청 목록
          </CardTitle>
          <CardDescription>
            클릭하여 상세 정보를 확인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          {workflows.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">신청 내역이 없습니다</h3>
              <p className="text-sm text-muted-foreground">
                자산 대여 또는 반납 신청을 하시면 여기에 표시됩니다.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">유형</TableHead>
                  <TableHead className="min-w-[180px] max-w-[250px]">자산명</TableHead>
                  <TableHead className="w-[140px]">자산코드</TableHead>
                  <TableHead className="min-w-[200px] max-w-[300px]">사유</TableHead>
                  <TableHead className="w-[100px]">상태</TableHead>
                  <TableHead className="w-[160px]">신청일시</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workflows.map((workflow) => (
                  <TableRow
                    key={workflow.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleRowClick(workflow.id)}
                  >
                    <TableCell>
                      <Badge variant="outline">
                        {typeLabels[workflow.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {(() => {
                        const assetName = workflow.asset?.name || workflow.asset?.model || workflow.asset?.manufacturer || '-';
                        const isLongName = assetName.length > 25;

                        return isLongName ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="truncate block cursor-help">
                                {assetName}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[300px]">
                              <p>{assetName}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="truncate block">{assetName}</span>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {(() => {
                        const assetCode = workflow.asset?.asset_code || workflow.asset?.asset_tag || '-';
                        const isLongCode = assetCode.length > 15;

                        return isLongCode ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="truncate block cursor-help">
                                {assetCode}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{assetCode}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="truncate block">{assetCode}</span>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const reason = workflow.reason || '-';
                        const isLongReason = reason.length > 30;

                        return isLongReason ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="line-clamp-2 cursor-help">
                                {reason}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[400px]">
                              <p className="whitespace-pre-wrap">{reason}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="line-clamp-2">{reason}</span>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
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
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(workflow.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {pagination.skip + 1} - {Math.min(pagination.skip + pagination.limit, pagination.total)} /
            전체 {pagination.total}건
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.skip === 0}
              onClick={() => {
                setPagination(prev => ({ ...prev, skip: Math.max(0, prev.skip - prev.limit) }));
                loadWorkflows();
              }}
            >
              이전
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.skip + pagination.limit >= pagination.total}
              onClick={() => {
                setPagination(prev => ({ ...prev, skip: prev.skip + prev.limit }));
                loadWorkflows();
              }}
            >
              다음
            </Button>
          </div>
        </div>
      )}
      </div>
    </TooltipProvider>
  );
}