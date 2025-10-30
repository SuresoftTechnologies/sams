import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

/**
 * ErrorBoundary Props
 */
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

/**
 * ErrorBoundary State
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Default Error Fallback Component
 */
function DefaultErrorFallback({
  error,
  resetError,
}: {
  error: Error;
  resetError: () => void;
}) {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Something went wrong</CardTitle>
          </div>
          <CardDescription>
            We're sorry, but an unexpected error occurred. Please try refreshing the page or
            contact support if the problem persists.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error details (dev mode only) */}
          {import.meta.env.DEV && (
            <div className="rounded-md bg-muted p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Error Details:</p>
              <p className="text-xs text-destructive font-mono break-all">{error.message}</p>
              {error.stack && (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer hover:text-foreground">
                    Stack Trace
                  </summary>
                  <pre className="mt-2 text-xs overflow-auto max-h-40 p-2 bg-background rounded">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button onClick={resetError} className="flex-1 gap-2">
              <RefreshCcw className="h-4 w-4" />
              Try Again
            </Button>
            <Button onClick={handleGoHome} variant="outline" className="flex-1 gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * ErrorBoundary Component
 *
 * Catches React errors in component tree and displays fallback UI
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 *
 * With custom fallback:
 * ```tsx
 * <ErrorBoundary fallback={CustomErrorPage}>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // TODO Phase 12: Send error to monitoring service (Sentry, LogRocket, etc.)
    // logErrorToService(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

/**
 * Hook to throw errors from functional components
 *
 * Usage:
 * ```tsx
 * const throwError = useErrorHandler();
 *
 * try {
 *   // some code that might fail
 * } catch (error) {
 *   throwError(error);
 * }
 * ```
 */
export function useErrorHandler() {
  const [, setError] = React.useState();

  return React.useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);
}
