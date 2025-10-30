import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, CheckCircle, XCircle, Clock } from 'lucide-react';

/**
 * Dashboard Page (Placeholder)
 *
 * TODO Phase 7:
 * - Fetch statistics from API using useQuery
 * - Display total assets, available, in-use counts
 * - Show recent activity timeline
 * - Add charts (optional)
 */
export default function Dashboard() {
  // Placeholder data
  const stats = [
    { label: 'Total Assets', value: 0, icon: Package, color: 'text-blue-500' },
    { label: 'Available', value: 0, icon: CheckCircle, color: 'text-green-500' },
    { label: 'In Use', value: 0, icon: Clock, color: 'text-yellow-500' },
    { label: 'Maintenance', value: 0, icon: XCircle, color: 'text-red-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to SureSoft Asset Management System
          </p>
        </div>
        <Badge variant="secondary">Phase 5 Complete</Badge>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {/* TODO: Add comparison with previous period */}
                  No data available yet
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest asset transactions and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No recent activity. Connect to backend API to see data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
