import { Outlet, Link } from '@tanstack/react-router';
import { Truck, ClipboardCheck, FileText, AlertTriangle } from 'lucide-react';

const liffNavItems = [
  { to: '/liff/pre-work' as const, label: '出勤', icon: Truck, color: 'text-blue-600' },
  { to: '/liff/inspection' as const, label: '点検', icon: ClipboardCheck, color: 'text-green-600' },
  { to: '/liff/post-work' as const, label: '退勤', icon: FileText, color: 'text-purple-600' },
  { to: '/liff/accident' as const, label: '事故', icon: AlertTriangle, color: 'text-red-600' },
];

export function LiffLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
      {/* ヘッダー */}
      <header className="bg-[#06C755] text-white px-4 py-3 text-center">
        <h1 className="font-bold text-lg">ECXIA安全管理</h1>
        <p className="text-xs opacity-80">ドライバー報告フォーム</p>
      </header>

      {/* コンテンツ */}
      <div className="flex-1 p-4">
        <Outlet />
      </div>

      {/* ナビゲーション */}
      <nav className="bg-white border-t grid grid-cols-4">
        {liffNavItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex flex-col items-center py-2 text-xs text-gray-500 transition-colors hover:text-gray-900 [&.active]:text-[#06C755] [&.active]:font-medium"
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
