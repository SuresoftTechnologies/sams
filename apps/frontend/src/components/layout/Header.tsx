import { Link, useLocation } from 'react-router';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import {
  User,
  LogOut,
  Settings,
  Menu,
  LayoutDashboard,
  Package,
} from 'lucide-react';
import { useUser, useLogout } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { cn } from '@/lib/utils';

/**
 * Header Component
 *
 * Global Navigation Bar (GNB) with:
 * - Logo and app title
 * - Full navigation menu (desktop horizontal, mobile hamburger)
 * - Role-based menu filtering
 * - Active page highlighting
 * - User dropdown menu (profile, settings, logout)
 * - Role badge display
 * - Fully responsive design
 */

interface NavItem {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
  disabled?: boolean;
  requiredRoles?: Array<'admin' | 'manager' | 'employee'>;
}

const navItems: NavItem[] = [
  {
    title: '대시보드',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: '자산',
    href: '/assets',
    icon: Package,
  },
];

export default function Header() {
  const user = useUser();
  const logoutMutation = useLogout();
  const { hasRole } = useRole();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Don't render header on login page or if no user
  if (!user) {
    return null;
  }

  // Filter nav items based on user role
  const visibleNavItems = navItems.filter((item) => {
    // If no role requirement, show to all users
    if (!item.requiredRoles || item.requiredRoles.length === 0) {
      return true;
    }
    // Check if user has required role
    return hasRole(...item.requiredRoles);
  });

  // Check if nav item is active
  const isNavActive = (href: string) => {
    return (
      location.pathname === href ||
      (href !== '/dashboard' && location.pathname.startsWith(href))
    );
  };

  // Role color mapping
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'manager':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 container max-w-screen-2xl mx-auto">
        {/* Mobile Menu Toggle */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden mr-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <img src="/logo.png" alt="SureSoft" className="h-6 w-auto" />
                <span>AMS</span>
              </SheetTitle>
            </SheetHeader>

            {/* Mobile Navigation */}
            <nav className="flex flex-col gap-2 mt-6">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = isNavActive(item.href);

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => !item.disabled && setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-secondary text-secondary-foreground'
                        : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
                      item.disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                    aria-disabled={item.disabled}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}

              {/* Mobile Menu Divider */}
              <div className="border-t pt-3 mt-3">
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                    isNavActive('/profile')
                      ? 'bg-secondary text-secondary-foreground'
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                  )}
                >
                  <User className="h-5 w-5" />
                  <span>프로필</span>
                </Link>

                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors opacity-50 cursor-not-allowed pointer-events-none',
                    'text-muted-foreground'
                  )}
                  aria-disabled="true"
                >
                  <Settings className="h-5 w-5" />
                  <span>설정</span>
                </Link>

                <Button
                  variant="ghost"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  disabled={logoutMutation.isPending}
                  className="w-full justify-start gap-3 px-3 mt-2 text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <LogOut className="h-5 w-5" />
                  <span>{logoutMutation.isPending ? '로그아웃 중...' : '로그아웃'}</span>
                </Button>
              </div>

              {/* Mobile Footer Info */}
              <div className="border-t pt-4 mt-4">
                <p className="text-xs text-muted-foreground">버전 1.0.0</p>
                <p className="text-xs text-muted-foreground">SureSoft SAMS</p>
              </div>
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo & Title */}
        <div className="mr-6 flex items-center space-x-2">
          <Link to="/dashboard" className="flex items-center space-x-3">
            <img
              src="/logo.png"
              alt="SureSoft Logo"
              className="h-8 w-auto object-contain"
            />
            <span className="hidden font-bold text-lg sm:inline-block">
              AMS
            </span>
          </Link>
        </div>

        {/* Desktop Navigation - Horizontal Menu */}
        <nav className="hidden lg:flex flex-1 items-center gap-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = isNavActive(item.href);

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
                  item.disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
                )}
                aria-current={isActive ? 'page' : undefined}
                aria-disabled={item.disabled}
              >
                <Icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Spacer for mobile */}
        <div className="flex-1 lg:hidden" />

        {/* User Menu */}
        <div className="flex items-center justify-end space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative gap-2">
                <User className="h-5 w-5" />
                <span className="hidden md:inline-block text-sm font-medium">
                  {user.full_name}
                </span>
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.full_name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                  <div className="mt-2">
                    <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                      {user.role.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>프로필</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Settings className="mr-2 h-4 w-4" />
                <span>설정</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                disabled={logoutMutation.isPending}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{logoutMutation.isPending ? '로그아웃 중...' : '로그아웃'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
