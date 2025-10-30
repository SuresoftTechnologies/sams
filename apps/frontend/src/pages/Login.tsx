import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { LogIn, Loader2 } from 'lucide-react';
import { loginSchema, type LoginFormData } from '@/lib/validators';
import { useLogin } from '@/hooks/useAuth';

/**
 * Login Page
 *
 * Features:
 * - React Hook Form with Zod validation
 * - TanStack Query mutation for login
 * - Loading states and error handling
 * - Auto-redirect after successful login
 *
 * Demo credentials:
 * - Admin: admin@suresoft.com / admin123!
 * - Manager: manager@suresoft.com / manager123!
 * - Employee: employee@suresoft.com / employee123!
 */
export default function Login() {
  const loginMutation = useLogin();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-6">
            <img
              src="/logo.png"
              alt="SureSoft Logo"
              className="h-12 w-auto object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Sign in</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access Asset Management System
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="user@example.com"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </Form>

          {/* Demo credentials hint */}
          <div className="mt-4 p-3 bg-muted rounded-md space-y-1">
            <p className="text-xs font-semibold text-muted-foreground text-center mb-1">
              Demo Accounts:
            </p>
            <p className="text-xs text-muted-foreground text-center">
              👤 Admin: admin@suresoft.com / admin123!
            </p>
            <p className="text-xs text-muted-foreground text-center">
              👤 Manager: manager@suresoft.com / manager123!
            </p>
            <p className="text-xs text-muted-foreground text-center">
              👤 Employee: employee@suresoft.com / employee123!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
