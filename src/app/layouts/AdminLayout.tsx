import { Outlet, Link, useRouter } from '@tanstack/react-router';
import {
  LayoutDashboard, Users, Truck, FileText, Download, LogOut, ShieldCheck, Bell,
  CalendarDays, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { authService } from '@/services';
import { useDailySummary } from '@/hooks/use-dashboard';

const baseNavItems = [
  { to: '/' as const, label: 'ダッシュボード', icon: LayoutDashboard },
  { to: '/reports' as const, label: '日報一覧', icon: FileText },
  { to: '/drivers' as const, label: 'ドライバー管理', icon: Users },
  { to: '/vehicles' as const, label: '車両管理', icon: Truck },
  { to: '/shifts' as const, label: 'シフト管理', icon: CalendarDays },
  { to: '/emergency' as const, label: '緊急連絡', icon: AlertTriangle },
  { to: '/export' as const, label: 'データエクスポート', icon: Download },
];

export function AdminLayout() {
  const router = useRouter();
  const { user, organization } = useAuth();
  const orgId = organization?.id ?? '';
  const today = new Date().toISOString().split('T')[0]!;
  const { data: summary } = useDailySummary(today, orgId);

  const hasMissing = summary
    ? summary.preWorkMissing.length > 0 || summary.inspectionMissing.length > 0 || summary.postWorkMissing.length > 0
    : false;

  const navItems = [
    ...baseNavItems,
    ...(user?.role === 'org_admin'
      ? [
          { to: '/notification-settings' as const, label: 'LINE自動配信', icon: Bell },
          { to: '/admin-users' as const, label: 'スタッフ管理', icon: ShieldCheck },
        ]
      : []),
  ];

  const handleLogout = async () => {
    await authService.logout();
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
              <div className="relative">
                <item.icon className="h-4 w-4" />
                {item.to === '/' && hasMissing && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 border border-[#0a3a2a]" />
                )}
              </div>
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
