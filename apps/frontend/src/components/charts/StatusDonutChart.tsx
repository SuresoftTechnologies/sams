import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart as PieChartIcon } from 'lucide-react';

/**
 * Status Distribution Donut Chart Component
 *
 * Features:
 * - Donut chart visualization of asset status distribution
 * - Center label showing total count
 * - Color-coded segments matching existing design system
 * - Interactive tooltips with count and percentage
 * - Responsive design for all screen sizes
 * - Accessibility support with ARIA labels
 */

interface StatusData {
  name: string;
  value: number;
  color: string;
  label: string;
}

interface StatusDonutChartProps {
  data: {
    issued: number;
    loaned: number;
    general: number;
    stock: number;
    server_room: number;
    disposed: number;
  };
  totalAssets: number;
}

// Status color mapping (consistent with existing design)
const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  issued: { color: '#2563eb', label: '지급장비' },
  loaned: { color: '#9333ea', label: '대여용' },
  general: { color: '#16a34a', label: '일반장비' },
  stock: { color: '#6b7280', label: '재고' },
  server_room: { color: '#0891b2', label: '서버실' },
  disposed: { color: '#dc2626', label: '불용' },
};

export function StatusDonutChart({ data, totalAssets }: StatusDonutChartProps) {
  // Transform data for Recharts
  const chartData: StatusData[] = Object.entries(data)
    .filter(([_, value]) => value > 0) // Only show statuses with assets
    .map(([key, value]) => ({
      name: key,
      value,
      color: STATUS_CONFIG[key].color,
      label: STATUS_CONFIG[key].label,
    }));

  // Custom label for center of donut
  const renderCenterLabel = () => {
    return (
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-foreground"
      >
        <tspan x="50%" dy="-0.5em" fontSize="24" fontWeight="bold">
          {totalAssets.toLocaleString()}
        </tspan>
        <tspan x="50%" dy="1.5em" fontSize="12" className="fill-muted-foreground">
          총 자산
        </tspan>
      </text>
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = totalAssets > 0
        ? ((data.value / totalAssets) * 100).toFixed(1)
        : 0;

      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-semibold text-sm mb-1">{data.payload.label}</p>
          <p className="text-sm text-muted-foreground">
            {data.value.toLocaleString()}개 ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom legend
  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-muted-foreground">
              {entry.payload.label}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-muted-foreground" />
            <CardTitle>상태 분포</CardTitle>
          </div>
          <CardDescription>자산 상태별 분포 현황</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <p className="text-sm">표시할 데이터가 없습니다</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-muted-foreground" />
          <CardTitle>상태 분포</CardTitle>
        </div>
        <CardDescription>자산 상태별 분포 현황</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="w-full h-[300px]"
          role="img"
          aria-label={`자산 상태 분포 차트. 총 ${totalAssets}개 자산`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="80%"
                paddingAngle={2}
                dataKey="value"
                label={false}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    className="stroke-background hover:opacity-80 transition-opacity cursor-pointer"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
              {renderCenterLabel()}
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
