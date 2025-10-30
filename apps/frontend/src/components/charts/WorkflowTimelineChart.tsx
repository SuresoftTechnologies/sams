import { useState, memo, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@sams/api-client';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Workflow Timeline Chart Component - Phase 3 Optimized
 *
 * Phase 3 Enhancements:
 * - React.memo for preventing unnecessary re-renders
 * - useMemo for data processing and component caching
 * - useCallback for event handler optimization
 * - Enhanced ARIA labels and keyboard navigation
 * - Dark mode optimized line colors
 * - Screen reader support with data summary
 * - Loading state optimization
 *
 * Features:
 * - Line chart showing workflow request trends over time
 * - Multiple lines for different workflow types
 * - Date range selector (7d, 30d, 90d)
 * - Interactive tooltips with detailed information
 * - Responsive design
 * - Loading and error states
 * - Click interaction for navigation
 * - WCAG 2.1 AA compliant
 */

interface WorkflowTimelineChartProps {
  onDateClick?: (date: string) => void;
}

// Workflow type colors with dark mode optimization
const WORKFLOW_COLORS = {
  checkout: 'hsl(217, 91%, 60%)',    // blue-600 (lighter)
  checkin: 'hsl(142, 71%, 50%)',     // green-600 (lighter)
  transfer: 'hsl(271, 81%, 60%)',    // purple-600 (lighter)
  maintenance: 'hsl(24, 94%, 55%)',  // orange-600 (lighter)
  rental: 'hsl(188, 94%, 48%)',      // cyan-600 (lighter)
  return: 'hsl(78, 61%, 45%)',       // lime-600 (lighter)
  disposal: 'hsl(0, 72%, 55%)',      // red-600 (lighter)
};

// Workflow type labels in Korean
const WORKFLOW_LABELS: Record<string, string> = {
  checkout: '반출',
  checkin: '반입',
  transfer: '이관',
  maintenance: '유지보수',
  rental: '대여',
  return: '반납',
  disposal: '폐기',
};

export const WorkflowTimelineChart = memo(function WorkflowTimelineChart({
  onDateClick
}: WorkflowTimelineChartProps) {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Fetch workflow timeline data
  const { data, isLoading, error } = useQuery({
    queryKey: ['statistics', 'workflow-timeline', dateRange],
    queryFn: () => apiClient.statistics.workflowTimeline(dateRange),
    staleTime: 60 * 1000, // 1 minute
  });

  // Memoized workflow types that have data
  const activeWorkflowTypes = useMemo(() => {
    if (!data?.timeline) return [];

    const types = new Set<string>();
    data.timeline.forEach((item) => {
      Object.keys(WORKFLOW_LABELS).forEach((key) => {
        if ((item as any)[key] > 0) {
          types.add(key);
        }
      });
    });
    return Array.from(types);
  }, [data]);

  // Memoized accessible data summary
  const accessibleDataSummary = useMemo(() => {
    if (!data?.timeline || data.timeline.length === 0) return '';

    const total = data.timeline.reduce((sum, item) => {
      return sum + Object.keys(WORKFLOW_LABELS).reduce((daySum, key) => {
        return daySum + ((item as any)[key] || 0);
      }, 0);
    }, 0);

    return `총 ${total}건의 워크플로우 요청`;
  }, [data]);

  // Memoized custom tooltip
  const CustomTooltip = useMemo(() => {
    return ({ active, payload }: any) => {
      if (active && payload && payload.length) {
        const date = payload[0].payload.date;
        const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);

        return (
          <div
            className="bg-popover border border-border rounded-lg shadow-lg p-3 max-w-xs"
            role="tooltip"
          >
            <p className="font-semibold text-sm mb-2">
              {format(parseISO(date), 'yyyy년 MM월 dd일 (EEE)', { locale: ko })}
            </p>
            <div className="space-y-1">
              {payload
                .filter((entry: any) => entry.value > 0)
                .sort((a: any, b: any) => b.value - a.value)
                .map((entry: any, index: number) => (
                  <div key={index} className="flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: entry.color }}
                        aria-hidden="true"
                      />
                      <span className="text-muted-foreground">{WORKFLOW_LABELS[entry.dataKey]}</span>
                    </div>
                    <span className="font-medium">{entry.value}건</span>
                  </div>
                ))}
            </div>
            <div className="mt-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>합계</span>
                <span>{total}건</span>
              </div>
            </div>
          </div>
        );
      }
      return null;
    };
  }, []);

  // Memoized custom legend
  const CustomLegend = useMemo(() => {
    return ({ payload }: any) => (
      <div className="flex flex-wrap justify-center gap-3 mt-4" role="list">
        {payload
          .filter((entry: any) => activeWorkflowTypes.includes(entry.dataKey))
          .map((entry: any, index: number) => (
            <div
              key={`legend-${index}`}
              className="flex items-center gap-2"
              role="listitem"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
                aria-hidden="true"
              />
              <span className="text-xs text-muted-foreground">
                {WORKFLOW_LABELS[entry.dataKey]}
              </span>
            </div>
          ))}
      </div>
    );
  }, [activeWorkflowTypes]);

  // Optimized click handler with useCallback
  const handleClick = useCallback((data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const date = data.activePayload[0].payload.date;
      onDateClick?.(date);
    }
  }, [onDateClick]);

  // Optimized date range change handler
  const handleDateRangeChange = useCallback((value: string) => {
    setDateRange(value as '7d' | '30d' | '90d');
  }, []);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <CardTitle>워크플로우 추이</CardTitle>
          </div>
          <CardDescription>워크플로우 요청 추이 분석</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="flex items-center justify-center h-[300px] text-muted-foreground"
            role="alert"
            aria-live="assertive"
          >
            <div className="text-center">
              <p className="text-sm text-destructive">데이터를 불러올 수 없습니다</p>
              <p className="text-xs mt-1">
                {error instanceof Error ? error.message : '나중에 다시 시도해주세요.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <CardTitle id="workflow-chart-title">워크플로우 추이</CardTitle>
            </div>
            <CardDescription>워크플로우 요청 추이 분석</CardDescription>
          </div>
          <Select
            value={dateRange}
            onValueChange={handleDateRangeChange}
            aria-label="날짜 범위 선택"
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">최근 7일</SelectItem>
              <SelectItem value="30d">최근 30일</SelectItem>
              <SelectItem value="90d">최근 90일</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : !data || data.timeline.length === 0 ? (
          <div
            className="flex items-center justify-center h-[300px] text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            <p className="text-sm">표시할 데이터가 없습니다</p>
          </div>
        ) : (
          <>
            {/* Visual Chart */}
            <div
              className="w-full h-[300px]"
              role="img"
              aria-labelledby="workflow-chart-title"
              aria-describedby="workflow-chart-desc"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.timeline}
                  onClick={handleClick}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tick={{ fill: 'currentColor', className: 'fill-muted-foreground' }}
                    tickFormatter={(value) => {
                      const date = parseISO(value);
                      return format(date, 'MM/dd');
                    }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: 'currentColor', className: 'fill-muted-foreground' }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend content={<CustomLegend />} />

                  {/* Lines for each workflow type */}
                  {activeWorkflowTypes.includes('checkout') && (
                    <Line
                      type="monotone"
                      dataKey="checkout"
                      stroke={WORKFLOW_COLORS.checkout}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5, cursor: 'pointer' }}
                      name={WORKFLOW_LABELS.checkout}
                    />
                  )}
                  {activeWorkflowTypes.includes('checkin') && (
                    <Line
                      type="monotone"
                      dataKey="checkin"
                      stroke={WORKFLOW_COLORS.checkin}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5, cursor: 'pointer' }}
                      name={WORKFLOW_LABELS.checkin}
                    />
                  )}
                  {activeWorkflowTypes.includes('transfer') && (
                    <Line
                      type="monotone"
                      dataKey="transfer"
                      stroke={WORKFLOW_COLORS.transfer}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5, cursor: 'pointer' }}
                      name={WORKFLOW_LABELS.transfer}
                    />
                  )}
                  {activeWorkflowTypes.includes('maintenance') && (
                    <Line
                      type="monotone"
                      dataKey="maintenance"
                      stroke={WORKFLOW_COLORS.maintenance}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5, cursor: 'pointer' }}
                      name={WORKFLOW_LABELS.maintenance}
                    />
                  )}
                  {activeWorkflowTypes.includes('rental') && (
                    <Line
                      type="monotone"
                      dataKey="rental"
                      stroke={WORKFLOW_COLORS.rental}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5, cursor: 'pointer' }}
                      name={WORKFLOW_LABELS.rental}
                    />
                  )}
                  {activeWorkflowTypes.includes('return') && (
                    <Line
                      type="monotone"
                      dataKey="return"
                      stroke={WORKFLOW_COLORS.return}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5, cursor: 'pointer' }}
                      name={WORKFLOW_LABELS.return}
                    />
                  )}
                  {activeWorkflowTypes.includes('disposal') && (
                    <Line
                      type="monotone"
                      dataKey="disposal"
                      stroke={WORKFLOW_COLORS.disposal}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5, cursor: 'pointer' }}
                      name={WORKFLOW_LABELS.disposal}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Hidden description for screen readers */}
            <p id="workflow-chart-desc" className="sr-only">
              워크플로우 추이 차트 ({dateRange}). {accessibleDataSummary}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
});
