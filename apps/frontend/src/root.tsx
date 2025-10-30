import { Outlet } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { queryClient } from '@/lib/query-client';
import { useEffect } from 'react';
import { initializeApiClient } from '@/lib/api';

/**
 * Root Layout Component
 *
 * Provides global context providers and layout structure:
 * - QueryClientProvider for TanStack Query
 * - Toaster for notifications (sonner)
 * - API Client initialization
 * - Basic layout structure (will add Header/Sidebar later)
 */
export default function Root() {
  // Initialize API client on mount
  useEffect(() => {
    initializeApiClient();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        {/* TODO: Add Header component in Phase 7 */}
        {/* TODO: Add Sidebar component in Phase 7 */}

        <main className="container mx-auto py-6 px-4">
          <Outlet />
        </main>

        {/* Global toast notifications */}
        <Toaster position="top-right" richColors />
      </div>
    </QueryClientProvider>
  );
}
