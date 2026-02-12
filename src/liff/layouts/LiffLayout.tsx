import { Outlet, Link } from '@tanstack/react-router';
import { Truck, ClipboardCheck, FileText, AlertTriangle } from 'lucide-react';
import { useLiffAuth } from '@/liff/hooks/use-liff-auth';

const liffNavItems = [
  { to: '/liff/pre-work' as const, label: '出勤', icon: Truck },
  { to: '/liff/inspection' as const, label: '点検', icon: ClipboardCheck },
  { to: '/liff/post-work' as const, label: '退勤', icon: FileText },
  { to: '/liff/accident' as const, label: '事故', icon: AlertTriangle },
];

export function LiffLayout() {
  const { isLoading, error } = useLiffAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8faf8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-ecxia-green border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8faf8] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold mb-2">エラー</h2>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <p className="text-xs text-muted-foreground">LINEアプリからアクセスしてください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faf8] flex flex-col max-w-md mx-auto">
      {/* ヘッダー — ECXIAグリーングラデーション */}
      <header className="ecxia-header-gradient text-white px-4 py-3 flex items-center justify-center gap-3">
        <img src="/ecxia-logo-footer.png" alt="ECXIA" className="h-6" />
        <div className="text-left">
          <p className="font-bold text-base leading-tight">安全管理</p>
          <p className="text-xs opacity-80">ドライバー報告</p>
        </div>
      </header>

      {/* コンテンツ */}
      <div className="flex-1 p-4">
        <Outlet />
      </div>

      {/* ナビゲーション — ECXIAグリーン */}
      <nav className="bg-white border-t grid grid-cols-4">
        {liffNavItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex flex-col items-center py-2 text-xs text-gray-400 transition-colors hover:text-gray-600 [&.active]:text-[#49b93d] [&.active]:font-medium"
            activeProps={{ className: 'active' }}
          >
            <item.icon className="h-5 w-5 mb-0.5" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
