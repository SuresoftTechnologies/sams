import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, Package, Loader2, Eye } from 'lucide-react';
import { useGetAssets } from '@/hooks/useAssets';
import { format } from 'date-fns';

/**
 * Assets List Page
 *
 * Features:
 * - Asset table with sortable columns
 * - Search functionality
 * - Status badges
 * - Loading states
 * - Quick actions (view details)
 */
export default function Assets() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetAssets();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter assets by search query
  const filteredAssets = data?.data.filter((asset) => {
    const query = searchQuery.toLowerCase();
    return (
      asset.name.toLowerCase().includes(query) ||
      asset.serialNumber?.toLowerCase().includes(query) ||
      asset.categoryName?.toLowerCase().includes(query) ||
      asset.locationName?.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      available: 'default',
      in_use: 'secondary',
      maintenance: 'destructive',
      retired: 'outline',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
          <p className="text-muted-foreground">Manage all your company assets</p>
        </div>
        <Button onClick={() => navigate('/assets/new')} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Asset
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, serial number, category, or location..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assets Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Assets</CardTitle>
          <CardDescription>
            {filteredAssets
              ? `${filteredAssets.length} asset${filteredAssets.length !== 1 ? 's' : ''} found`
              : 'Loading assets...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-12 text-destructive">
              <p className="text-lg font-medium">Failed to load assets</p>
              <p className="text-sm">Please try again later</p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAssets && filteredAssets.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.map((asset) => (
                    <TableRow
                      key={asset.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/assets/${asset.id}`)}
                    >
                      <TableCell className="font-medium">{asset.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {asset.serialNumber || '-'}
                      </TableCell>
                      <TableCell>{asset.categoryName || '-'}</TableCell>
                      <TableCell>{asset.locationName || '-'}</TableCell>
                      <TableCell>{getStatusBadge(asset.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(asset.createdAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/assets/${asset.id}`);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">
                {searchQuery ? 'No assets match your search' : 'No assets found'}
              </p>
              <p className="text-sm mb-4">
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : 'Create your first asset to get started'}
              </p>
              {!searchQuery && (
                <Button onClick={() => navigate('/assets/new')} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Asset
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
