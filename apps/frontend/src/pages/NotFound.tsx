import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, ArrowLeft } from 'lucide-react';

/**
 * 404 Not Found Page
 *
 * Displayed when user navigates to non-existent route
 * Provides clear guidance and multiple navigation options
 *
 * Features:
 * - Consistent full-screen layout with other error pages
 * - Multiple action options (back, home, search)
 * - Clear visual hierarchy with status badge
 * - Helpful suggestions for next steps
 * - Full responsive design
 * - Enhanced accessibility with ARIA labels
 */
export default function NotFound() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-muted/40 p-4"
      role="main"
      aria-labelledby="error-title"
    >
      <Card className="w-full max-w-lg">
        <CardHeader>
          {/* Error Illustration */}
          <div className="flex justify-center mb-6">
            <img
              src="/error-illustration.png"
              alt="페이지를 찾을 수 없음을 나타내는 일러스트레이션"
              className="w-64 h-auto"
              loading="eager"
            />
          </div>

          {/* Status Badge and Title */}
          <div className="space-y-3 mb-4">
            <div className="flex justify-center">
              <Badge
                variant="outline"
                className="text-lg px-4 py-1 font-semibold text-muted-foreground border-muted-foreground/30"
              >
                404 오류
              </Badge>
            </div>
            <CardTitle
              id="error-title"
              className="text-2xl sm:text-3xl text-center"
            >
              페이지를 찾을 수 없습니다
            </CardTitle>
            <CardDescription className="text-base text-center px-2">
              요청하신 페이지가 존재하지 않거나 이동되었습니다.
              <br />
              URL을 다시 확인해주세요.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {/* Action buttons */}
          <div
            className="flex flex-col sm:flex-row gap-2"
            role="group"
            aria-label="페이지 이동 옵션"
          >
            <Button
              onClick={handleGoBack}
              variant="outline"
              className="flex-1 gap-2"
              aria-label="이전 페이지로 돌아가기"
            >
              <ArrowLeft className="h-4 w-4" />
              뒤로 가기
            </Button>
            <Button
              onClick={handleGoHome}
              className="flex-1 gap-2"
              aria-label="대시보드 홈으로 이동"
            >
              <Home className="h-4 w-4" />
              홈으로 가기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
