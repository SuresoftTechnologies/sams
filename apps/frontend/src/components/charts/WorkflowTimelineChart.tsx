import { useState } from 'react';
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
 * Workflow Timeline Chart Component
 *
 * Features:
 * - Line chart showing workflow request trends over time
 * - Multiple lines for different workflow types
 * - Date range selector (7d, 30d, 90d)
 * - Interactive tooltips with detailed information
 * - Responsive design
 * - Loading and error states
 * - Click interaction for navigation
 */

interface WorkflowTimelineChartProps {
  onDateClick?: (date: string) => void;
}

// Workflow type colors (consistent with design system)
const WORKFLOW_COLORS = {
  checkout: '#2563eb',    // blue-600
  checkin: '#16a34a',     // green-600
  transfer: '#9333ea',    // purple-600
  maintenance: '#ea580c', // orange-600
  rental: '#0891b2',      // cyan-600
  return: '#65a30d',      // lime-600
  disposal: '#dc2626',    // red-600
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

export function WorkflowTimelineChart({ onDateClick }: WorkflowTimelineChartProps) {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Fetch workflow timeline data
  const { data, isLoading, error } = useQuery({
    queryKey: ['statistics', 'workflow-timeline', dateRange],
    queryFn: () => apiClient.statistics.workflowTimeline(dateRange),
    staleTime: 60 * 1000, // 1 minute
  });

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const date = payload[0].payload.date;
      const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);

      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3 max-w-xs">
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

  // Custom legend
  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {payload
          .filter((entry: any) => {
            // Only show legend items that have data
            const hasData = data?.timeline.some((item) => (item as any)[entry.dataKey] > 0);
            return hasData;
          })
          .map((entry: any, index: number) => (
            <div key={`legend-${index}`} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-muted-foreground">
                {WORKFLOW_LABELS[entry.dataKey]}
              </span>
            </div>
          ))}
      </div>
    );
  };

  // Handle line click
  const handleClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const date = data.activePayload[0].payload.date;
      onDateClick?.(date);
    }
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <CardTitle>워크플로우 추이</CardTitle>
          </div>
          <CardDescription>워크플로우 요청 추이 분석</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
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
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <CardTitle>워크플로우 추이</CardTitle>
            </div>
            <CardDescription>워크플로우 요청 추이 분석</CardDescription>
          </div>
          <Select
            value={dateRange}
            onValueChange={(value) => setDateRange(value as '7d' | '30d' | '90d')}
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
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <p className="text-sm">표시할 데이터가 없습니다</p>
          </div>
        ) : (
          <div
            className="w-full h-[300px]"
            role="img"
            aria-label={`워크플로우 추이 차트 (${dateRange})`}
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
                <Line
                  type="monotone"
                  dataKey="checkout"
                  stroke={WORKFLOW_COLORS.checkout}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5, cursor: 'pointer' }}
                  name={WORKFLOW_LABELS.checkout}
                />
                <Line
                  type="monotone"
                  dataKey="checkin"
                  stroke={WORKFLOW_COLORS.checkin}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5, cursor: 'pointer' }}
                  name={WORKFLOW_LABELS.checkin}
                />
                <Line
                  type="monotone"
                  dataKey="transfer"
                  stroke={WORKFLOW_COLORS.transfer}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5, cursor: 'pointer' }}
                  name={WORKFLOW_LABELS.transfer}
                />
                <Line
                  type="monotone"
                  dataKey="maintenance"
                  stroke={WORKFLOW_COLORS.maintenance}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5, cursor: 'pointer' }}
                  name={WORKFLOW_LABELS.maintenance}
                />
                <Line
                  type="monotone"
                  dataKey="rental"
                  stroke={WORKFLOW_COLORS.rental}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5, cursor: 'pointer' }}
                  name={WORKFLOW_LABELS.rental}
                />
                <Line
                  type="monotone"
                  dataKey="return"
                  stroke={WORKFLOW_COLORS.return}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5, cursor: 'pointer' }}
                  name={WORKFLOW_LABELS.return}
                />
                <Line
                  type="monotone"
                  dataKey="disposal"
                  stroke={WORKFLOW_COLORS.disposal}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5, cursor: 'pointer' }}
                  name={WORKFLOW_LABELS.disposal}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
