import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Package,
  UserCheck,
  HandHelping,
  Box,
  Archive,
  Server,
  XCircle,
  LayoutGrid,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router';
import { StatusDonutChart } from '@/components/charts/StatusDonutChart';
import { LocationBarChart } from '@/components/charts/LocationBarChart';
import { TrendIndicator } from '@/components/charts/TrendIndicator';

/**
 * Dashboard Page - Phase 1 Enhanced
 *
 * Features:
 * - Real-time asset statistics with trend indicators
 * - Status distribution donut chart
 * - Location distribution horizontal bar chart
 * - Category distribution with progress bars
 * - Recent assets activity
 * - Loading and error states
 * - Responsive grid layout
 * - Enhanced data visualization
 */
export default function Dashboard() {
  const { data: stats, isLoading, error } = useDashboardStats();

  // TODO: Replace with actual backend data when API is updated
  // Mock previous month data for trend calculation (10% less than current)
  const getPreviousValue = (current: number): number => {
    return Math.round(current * 0.9);
  };

  // Statistics cards configuration
  const statsCards = stats
    ? [
        {
          label: '전체 자산',
          value: stats.totalAssets.toLocaleString(),
          previous: getPreviousValue(stats.totalAssets),
          icon: Package,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50 dark:bg-blue-950',
          description: `${stats.totalCategories}개 카테고리, ${stats.totalLocations}개 위치`,
        },
        {
          label: '지급장비',
          value: stats.statusDistribution.issued.toLocaleString(),
          previous: getPreviousValue(stats.statusDistribution.issued),
          icon: UserCheck,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-950',
          description: '사용자에게 지급됨',
          percentage: stats.totalAssets > 0
            ? Math.round((stats.statusDistribution.issued / stats.totalAssets) * 100)
            : 0,
        },
        {
          label: '대여용',
          value: stats.statusDistribution.loaned.toLocaleString(),
          previous: getPreviousValue(stats.statusDistribution.loaned),
          icon: HandHelping,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50 dark:bg-purple-950',
          description: '대여 가능',
          percentage: stats.totalAssets > 0
            ? Math.round((stats.statusDistribution.loaned / stats.totalAssets) * 100)
            : 0,
        },
        {
          label: '일반장비',
          value: stats.statusDistribution.general.toLocaleString(),
          previous: getPreviousValue(stats.statusDistribution.general),
          icon: Box,
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-950',
          description: '일반 자산',
          percentage: stats.totalAssets > 0
            ? Math.round((stats.statusDistribution.general / stats.totalAssets) * 100)
            : 0,
        },
        {
          label: '재고',
          value: stats.statusDistribution.stock.toLocaleString(),
          previous: getPreviousValue(stats.statusDistribution.stock),
          icon: Archive,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50 dark:bg-gray-950',
          description: '창고 보관 중',
          percentage: stats.totalAssets > 0
            ? Math.round((stats.statusDistribution.stock / stats.totalAssets) * 100)
            : 0,
        },
        {
          label: '서버실',
          value: stats.statusDistribution.server_room.toLocaleString(),
          previous: getPreviousValue(stats.statusDistribution.server_room),
          icon: Server,
          color: 'text-cyan-600',
          bgColor: 'bg-cyan-50 dark:bg-cyan-950',
          description: '서버실 운영',
          percentage: stats.totalAssets > 0
            ? Math.round((stats.statusDistribution.server_room / stats.totalAssets) * 100)
            : 0,
        },
        {
          label: '불용',
          value: stats.statusDistribution.disposed.toLocaleString(),
          previous: getPreviousValue(stats.statusDistribution.disposed),
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50 dark:bg-red-950',
          description: '폐기 처리됨',
          percentage: stats.totalAssets > 0
            ? Math.round((stats.statusDistribution.disposed / stats.totalAssets) * 100)
            : 0,
        },
      ]
    : [];

  // Format status for display
  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Get badge variant for status
  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'issued':
        return 'default'; // blue
      case 'loaned':
        return 'secondary'; // purple
      case 'general':
        return 'outline'; // green
      case 'stock':
        return 'secondary'; // gray
      case 'server_room':
        return 'default'; // cyan
      case 'disposed':
        return 'destructive'; // red
      default:
        return 'outline';
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
          <p className="text-muted-foreground">SureSoft 자산 관리 시스템에 오신 것을 환영합니다</p>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <div>
                <p className="text-destructive font-semibold">대시보드 데이터 로딩 실패</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {error instanceof Error ? error.message : '나중에 다시 시도해주세요.'}
                </p>
              </div>
              <Button variant="outline" onClick={() => window.location.reload()}>
                다시 시도
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 -mt-0 pb-8">
      {/* Header */}
      <div className="pt-0">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">대시보드</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          SureSoft 자산 관리 시스템에 오신 것을 환영합니다
        </p>
      </div>

      {/* Statistics Cards */}
      {isLoading ? (
        <div className="space-y-4">
          {/* Total Assets Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-10 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>

          {/* Status Cards Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-10 rounded-lg" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Total Assets Card - Full Width with Trend */}
          {statsCards[0] && (() => {
            const stat = statsCards[0];
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <div className="text-2xl font-bold">{stat.value}</div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                    </div>
                    <TrendIndicator
                      current={stats.totalAssets}
                      previous={stat.previous}
                      className="ml-4"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Status Cards - 2x3 Grid with Trends */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {statsCards.slice(1).map((stat, index) => {
              const Icon = stat.icon;
              const currentValue = Object.values(stats.statusDistribution)[index];
              return (
                <Card key={stat.label} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <div className="text-2xl font-bold">{stat.value}</div>
                        {stat.percentage !== undefined && (
                          <span className="text-xs text-muted-foreground">
                            ({stat.percentage}%)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">{stat.description}</p>
                        <TrendIndicator
                          current={currentValue}
                          previous={stat.previous}
                          compact
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Status Distribution Donut Chart */}
        {isLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ) : stats ? (
          <StatusDonutChart
            data={stats.statusDistribution}
            totalAssets={stats.totalAssets}
          />
        ) : null}

        {/* Location Distribution Bar Chart */}
        {isLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[400px] w-full" />
            </CardContent>
          </Card>
        ) : stats && stats.locationDistribution.length > 0 ? (
          <LocationBarChart
            data={stats.locationDistribution.map(loc => ({
              id: parseInt(loc.id),
              name: loc.name,
              count: loc.count,
            }))}
          />
        ) : null}
      </div>

      {/* Category Distribution & Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Category Distribution */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-muted-foreground" />
              <CardTitle>카테고리 분포</CardTitle>
            </div>
            <CardDescription>카테고리별 자산 분류</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : stats && stats.categoryDistribution.length > 0 ? (
              <div className="space-y-3">
                {stats.categoryDistribution.slice(0, 8).map((category) => (
                  <div key={category.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{category.name}</span>
                      <span className="text-muted-foreground">
                        {category.count.toLocaleString()} ({category.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
                {stats.categoryDistribution.length > 8 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    +{stats.categoryDistribution.length - 8}개 추가 카테고리
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                카테고리 데이터가 없습니다
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>최근 자산</CardTitle>
                </div>
                <CardDescription>시스템에 추가된 최신 자산</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : stats && stats.recentAssets.length > 0 ? (
              <div className="space-y-4">
                {stats.recentAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex flex-col gap-2 border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <Link
                        to={`/assets/${asset.id}`}
                        className="text-sm font-medium leading-none hover:underline block truncate"
                      >
                        {asset.model || asset.asset_tag}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {asset.asset_tag}
                        {asset.category_name && ` • ${asset.category_name}`}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant={getStatusVariant(asset.status)} className="text-xs">
                        {formatStatus(asset.status)}
                      </Badge>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(asset.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="pt-2">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link to="/assets">전체 보기</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  자산을 찾을 수 없습니다. 첫 번째 자산을 생성하세요.
                </p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <Link to="/assets/new">자산 생성</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
