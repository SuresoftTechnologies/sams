import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';

/**
 * ErrorPage Component
 *
 * Displays errors caught by React Router
 * - 404 Not Found errors
 * - Network errors
 * - Other routing errors
 *
 * Used as errorElement in route configuration
 */
export default function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  let title = 'Oops! Something went wrong';
  let message = 'An unexpected error occurred. Please try again.';
  let statusCode: number | undefined;

  if (isRouteErrorResponse(error)) {
    statusCode = error.status;
    title = `${error.status} ${error.statusText}`;
    message = error.data?.message || error.statusText;

    // Custom messages for common status codes
    if (error.status === 404) {
      title = '404 - Page Not Found';
      message = "The page you're looking for doesn't exist or has been moved.";
    } else if (error.status === 403) {
      title = '403 - Forbidden';
      message = "You don't have permission to access this page.";
    } else if (error.status === 500) {
      title = '500 - Server Error';
      message = 'Something went wrong on our end. Please try again later.';
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              {statusCode && (
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Error {statusCode}
                </p>
              )}
              <CardTitle className="text-2xl">{title}</CardTitle>
            </div>
          </div>
          <CardDescription className="text-base">{message}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Error details in dev mode */}
          {import.meta.env.DEV && error instanceof Error && (
            <div className="mb-4 rounded-md bg-muted p-3 space-y-2">
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
            <Button onClick={handleGoBack} variant="outline" className="flex-1 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            <Button onClick={handleGoHome} className="flex-1 gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
