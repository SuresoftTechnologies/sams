import { useParams, useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2, QrCode } from 'lucide-react';

/**
 * Asset Detail Page (Placeholder)
 *
 * TODO Phase 7:
 * - Fetch asset details using useGetAsset(id)
 * - Display asset information (name, category, location, etc.)
 * - Show QR code (using qrcode.react)
 * - Display check-in/out history
 * - Implement edit/delete actions with mutations
 */
export default function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // TODO: Replace with actual API call
  // const { data: asset, isLoading, error } = useGetAsset(id!);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/assets')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Asset Details</h1>
          <p className="text-muted-foreground">Asset ID: {id}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" className="gap-2">
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Info */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Asset Information</CardTitle>
            <CardDescription>Detailed information about this asset</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="text-base font-medium">Loading...</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge>Available</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Category</p>
                <p className="text-base">-</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Location</p>
                <p className="text-base">-</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR Code */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-4 border-2 border-dashed rounded-lg">
              <p className="text-sm text-muted-foreground">QR code placeholder</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>Activity History</CardTitle>
          <CardDescription>Check-in and check-out records</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No history available yet
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
