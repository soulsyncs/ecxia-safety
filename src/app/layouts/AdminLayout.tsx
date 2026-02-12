import { Outlet, Link, useRouter } from '@tanstack/react-router';
import {
  LayoutDashboard, Users, Truck, FileText, Download, LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      {/* サイドバー — ECXIAダークグリーン */}
      <aside className="w-64 ecxia-sidebar flex flex-col">
        <div className="p-4">
          <img src="/ecxia-logo-footer.png" alt="ECXIA" className="h-7 mb-2" />
          <p className="text-sm font-medium text-white/80">安全管理システム</p>
        </div>
        <div className="mx-4 border-t border-white/10" />
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-white/70 hover:text-white hover:bg-white/5 [&.active]:bg-white/15 [&.active]:text-white [&.active]:font-semibold [&.active]:border-l-4 [&.active]:border-[#50cb43]"
              activeProps={{ className: 'active' }}
              activeOptions={{ exact: item.to === '/' }}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mx-4 border-t border-white/10" />
        <div className="p-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-sm text-white/50 hover:text-white hover:bg-white/5"
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
