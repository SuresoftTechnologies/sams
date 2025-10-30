import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function App() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-3xl">SureSoft AMS</CardTitle>
            <Badge variant="secondary">Phase 3 완료</Badge>
          </div>
          <CardDescription className="text-lg">
            Asset Management System
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">
              ✅ Phase 3: shadcn/ui 설정 완료
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
              <li>components.json 생성</li>
              <li>lib/utils.ts 생성</li>
              <li>기본 컴포넌트 11개 설치</li>
              <li>Tailwind CSS v4 + CSS 변수 설정</li>
            </ul>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button>Primary Button</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Destructive</Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Vite + React + TypeScript + Tailwind CSS v4 + shadcn/ui</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default App
