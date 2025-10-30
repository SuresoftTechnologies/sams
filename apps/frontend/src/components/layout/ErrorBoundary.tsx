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
 * Default Error Fallback Component Props
 */
interface DefaultErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

/**
 * Default Error Fallback Component
 */
function DefaultErrorFallback({ error, resetError }: DefaultErrorFallbackProps) {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          {/* Error Illustration */}
          <div className="flex justify-center mb-4">
            <img
              src="/error-illustration.png"
              alt="Error Illustration"
              className="w-64 h-auto"
            />
          </div>

          <div className="flex items-center gap-3 mb-2 justify-center">
            <div className="p-2 rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl">앗! 문제가 발생했습니다</CardTitle>
          </div>
          <CardDescription className="text-center">
            예기치 않은 오류가 발생했습니다. 페이지를 새로고침하거나,
            문제가 지속되면 지원팀에 문의해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error details (dev mode only) */}
          {import.meta.env.DEV && (
            <div className="rounded-md bg-muted p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">오류 세부정보:</p>
              <p className="text-xs text-destructive font-mono break-all">{error.message}</p>
              {error.stack && (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer hover:text-foreground">
                    스택 추적
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
              다시 시도
            </Button>
            <Button onClick={handleGoHome} variant="outline" className="flex-1 gap-2">
              <Home className="h-4 w-4" />
              홈으로 가기
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
