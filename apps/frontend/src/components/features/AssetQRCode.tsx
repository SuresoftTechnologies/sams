import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import type { Asset } from '@/hooks/useAssets';

/**
 * AssetQRCode Component
 *
 * Generates and displays QR code for an asset
 * - QR code generation with asset details
 * - Download QR code as PNG
 * - Print QR code
 * - Asset information display
 *
 * Usage:
 * <AssetQRCode
 *   asset={asset}
 *   size={256}
 * />
 */

interface AssetQRCodeProps {
  asset: Asset;
  size?: number;
  includeLabel?: boolean;
  className?: string;
}

export function AssetQRCode({
  asset,
  size = 256,
  includeLabel = true,
  className = '',
}: AssetQRCodeProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  // Generate QR code value with asset information
  const qrValue = JSON.stringify({
    id: asset.id,
    name: asset.name,
    serialNumber: asset.serialNumber,
    assetTag: asset.id, // In real app, use actual asset tag
    url: `${window.location.origin}/assets/${asset.id}`,
  });

  // Download QR code as PNG
  const handleDownload = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    // Convert SVG to canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      // Download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const link = document.createElement('a');
        link.download = `asset-${asset.id}-qr.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
      });
    };

    img.src = url;
  };

  // Print QR code
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Asset QR Code - ${asset.name}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .qr-container {
              text-align: center;
              padding: 20px;
              border: 2px solid #000;
            }
            .asset-info {
              margin-top: 20px;
              text-align: center;
            }
            h2 {
              margin: 0 0 10px 0;
              font-size: 24px;
            }
            p {
              margin: 5px 0;
              font-size: 14px;
              color: #666;
            }
            @media print {
              body {
                min-height: auto;
              }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            ${svgData}
            <div class="asset-info">
              <h2>${asset.name}</h2>
              ${asset.serialNumber ? `<p>Serial: ${asset.serialNumber}</p>` : ''}
              <p>Asset ID: ${asset.id}</p>
            </div>
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>QR Code</CardTitle>
        {includeLabel && (
          <CardDescription>
            Scan this QR code to view asset details
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* QR Code */}
        <div className="flex justify-center p-4 bg-white rounded-lg" ref={qrRef}>
          <QRCodeSVG
            value={qrValue}
            size={size}
            level="H" // High error correction
            includeMargin={true}
            className="border border-gray-200 rounded"
          />
        </div>

        {/* Asset Info */}
        {includeLabel && (
          <div className="text-center space-y-1">
            <p className="font-semibold text-lg">{asset.name}</p>
            {asset.serialNumber && (
              <p className="text-sm text-muted-foreground">
                Serial: <code>{asset.serialNumber}</code>
              </p>
            )}
            <p className="text-xs text-muted-foreground">Asset ID: {asset.id}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-center">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * AssetQRCodeSimple - Minimal QR code without card wrapper
 * Useful for embedding in other components
 */
interface AssetQRCodeSimpleProps {
  asset: Asset;
  size?: number;
  className?: string;
}

export function AssetQRCodeSimple({
  asset,
  size = 128,
  className = '',
}: AssetQRCodeSimpleProps) {
  const qrValue = JSON.stringify({
    id: asset.id,
    name: asset.name,
    serialNumber: asset.serialNumber,
    url: `${window.location.origin}/assets/${asset.id}`,
  });

  return (
    <div className={`inline-block p-2 bg-white rounded ${className}`}>
      <QRCodeSVG
        value={qrValue}
        size={size}
        level="M"
        includeMargin={true}
      />
    </div>
  );
}
