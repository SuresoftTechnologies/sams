import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutGrid } from 'lucide-react';

/**
 * Category Distribution Bar Chart Component
 *
 * Features:
 * - Horizontal bar chart for all categories
 * - Shows all categories (no limit)
 * - Gradient color scheme based on count
 * - Interactive tooltips with count and percentage
 * - Responsive design
 * - Click interaction for navigation
 * - Accessibility support
 */

interface CategoryData {
  id: string;
  name: string;
  count: number;
  percentage: number;
}

interface CategoryBarChartProps {
  data: CategoryData[];
  totalAssets: number;
  onCategoryClick?: (categoryId: string) => void;
}

export function CategoryBarChart({ data, totalAssets, onCategoryClick }: CategoryBarChartProps) {
  // Sort by count descending and take top 10 for better readability
  const chartData = [...data]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Generate gradient colors based on value
  const getBarColor = (index: number, total: number) => {
    // Gradient from darker to lighter blue
    const baseHue = 217; // Blue hue
    const saturation = 91;
    const lightness = 45 + (index / Math.max(total - 1, 1)) * 25;
    const opacity = 0.95 - (index / Math.max(total - 1, 1)) * 0.4;
    return `hsla(${baseHue}, ${saturation}%, ${lightness}%, ${opacity})`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-semibold text-sm mb-1">{data.payload.name}</p>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>{data.value.toLocaleString()}개 자산</p>
            <p className="text-xs">전체의 {data.payload.percentage}%</p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Y-axis tick with truncation
  const CustomYAxisTick = ({ x, y, payload }: any) => {
    const maxLength = 15;
    const text = payload.value.length > maxLength
      ? `${payload.value.substring(0, maxLength)}...`
      : payload.value;

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={4}
          textAnchor="end"
          fill="currentColor"
          className="fill-muted-foreground text-xs"
        >
          {text}
        </text>
      </g>
    );
  };

  // Handle bar click
  const handleClick = (data: any) => {
    if (data && onCategoryClick) {
      onCategoryClick(data.id);
    }
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-muted-foreground" />
            <CardTitle>카테고리 분포</CardTitle>
          </div>
          <CardDescription>카테고리별 자산 분류 (상위 10개)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
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
          <LayoutGrid className="h-5 w-5 text-muted-foreground" />
          <CardTitle>카테고리 분포</CardTitle>
        </div>
        <CardDescription>카테고리별 자산 분류 (상위 10개)</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="w-full h-[400px]"
          role="img"
          aria-label={`상위 ${chartData.length}개 카테고리별 자산 분포`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={true}
                vertical={false}
                className="stroke-muted"
              />
              <XAxis
                type="number"
                className="text-xs"
                tick={{ fill: 'currentColor', className: 'fill-muted-foreground' }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={95}
                tick={<CustomYAxisTick />}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
              <Bar
                dataKey="count"
                radius={[0, 4, 4, 0]}
                maxBarSize={30}
                onClick={handleClick}
                label={{
                  position: 'right',
                  className: 'fill-muted-foreground text-xs font-medium',
                  formatter: (value: number) => value.toLocaleString(),
                }}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(index, chartData.length)}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {data.length > 10 && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            +{data.length - 10}개 추가 카테고리
          </p>
        )}
      </CardContent>
    </Card>
  );
}
