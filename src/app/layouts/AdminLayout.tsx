import { Outlet, Link, useRouter } from '@tanstack/react-router';
import {
  LayoutDashboard, Users, Truck, FileText, Download, LogOut, Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const navItems = [
  { to: '/' as const, label: 'ダッシュボード', icon: LayoutDashboard },
  { to: '/reports' as const, label: '日報一覧', icon: FileText },
  { to: '/drivers' as const, label: 'ドライバー管理', icon: Users },
  { to: '/vehicles' as const, label: '車両管理', icon: Truck },
  { to: '/export' as const, label: 'データエクスポート', icon: Download },
];

export function AdminLayout() {
  const router = useRouter();

  const handleLogout = () => {
    sessionStorage.removeItem('ecxia_logged_in');
    router.navigate({ to: '/login' });
  };

  return (
    <div className="flex h-screen bg-background">
      {/* サイドバー */}
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="p-4 flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h1 className="font-bold text-sm">ECXIA安全管理</h1>
            <p className="text-xs text-muted-foreground">Safety Management</p>
          </div>
        </div>
        <Separator />
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors hover:bg-accent [&.active]:bg-accent [&.active]:font-medium"
              activeProps={{ className: 'active' }}
              activeOptions={{ exact: item.to === '/' }}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <Separator />
        <div className="p-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-sm"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            ログアウト
          </Button>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
