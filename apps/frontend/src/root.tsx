import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { queryClient } from '@/lib/query-client';
import { useEffect } from 'react';
import { initializeApiClient } from '@/lib/api';
import RootLayout from '@/components/layout/RootLayout';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';

/**
 * Root Component
 *
 * Provides global context providers:
 * - ErrorBoundary for error handling
 * - QueryClientProvider for TanStack Query
 * - Toaster for notifications (sonner)
 * - API Client initialization
 * - RootLayout with Header/Sidebar
 */
export default function Root() {
  // Initialize API client on mount
  useEffect(() => {
    initializeApiClient();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-background">
          <RootLayout />

          {/* Global toast notifications */}
          <Toaster position="top-right" richColors />
        </div>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
