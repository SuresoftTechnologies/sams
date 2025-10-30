import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home } from 'lucide-react';

/**
 * 404 Not Found Page
 *
 * Displayed when user navigates to non-existent route
 * Provides navigation back to home/dashboard
 */
export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="text-6xl font-bold text-muted-foreground">404</div>
          </div>
          <CardTitle className="text-2xl">페이지를 찾을 수 없습니다</CardTitle>
          <CardDescription>
            찾으시는 페이지가 존재하지 않거나 이동되었습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/')} className="gap-2">
            <Home className="h-4 w-4" />
            대시보드로 이동
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
