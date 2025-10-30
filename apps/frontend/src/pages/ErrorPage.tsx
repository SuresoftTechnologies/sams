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

  let title = '앗! 문제가 발생했습니다';
  let message = '예기치 않은 오류가 발생했습니다. 다시 시도해주세요.';
  let statusCode: number | undefined;

  if (isRouteErrorResponse(error)) {
    statusCode = error.status;
    title = `${error.status} ${error.statusText}`;
    message = error.data?.message || error.statusText;

    // Custom messages for common status codes
    if (error.status === 404) {
      title = '404 - 페이지를 찾을 수 없습니다';
      message = "찾으시는 페이지가 존재하지 않거나 이동되었습니다.";
    } else if (error.status === 403) {
      title = '403 - 접근 금지';
      message = "이 페이지에 접근할 권한이 없습니다.";
    } else if (error.status === 500) {
      title = '500 - 서버 오류';
      message = '서버에 문제가 발생했습니다. 나중에 다시 시도해주세요.';
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
                  오류 {statusCode}
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
            <Button onClick={handleGoBack} variant="outline" className="flex-1 gap-2">
              <ArrowLeft className="h-4 w-4" />
              뒤로 가기
            </Button>
            <Button onClick={handleGoHome} className="flex-1 gap-2">
              <Home className="h-4 w-4" />
              홈으로 가기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
