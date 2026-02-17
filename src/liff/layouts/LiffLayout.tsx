import { Outlet, Link } from '@tanstack/react-router';
import { Truck, ClipboardCheck, FileText, AlertTriangle, RefreshCw, CalendarDays, Phone } from 'lucide-react';
import { useLiffAuth } from '@/liff/hooks/use-liff-auth';

const liffNavItems = [
  { to: '/liff/pre-work' as const, label: '出勤', icon: Truck },
  { to: '/liff/inspection' as const, label: '点検', icon: ClipboardCheck },
  { to: '/liff/post-work' as const, label: '退勤', icon: FileText },
  { to: '/liff/shift-request' as const, label: 'シフト', icon: CalendarDays },
  { to: '/liff/emergency-request' as const, label: '緊急', icon: Phone },
  { to: '/liff/accident' as const, label: '事故', icon: AlertTriangle },
];

/** エラーメッセージに応じたユーザー向けガイドを返す */
function getErrorGuide(error: string): { title: string; steps: string[]; note?: string } {
  if (error.includes('LINE認証') || error.includes('IDトークン') || error.includes('認証が必要')) {
    return {
      title: 'LINE認証に問題があります',
      steps: [
        'LINEアプリの画面下部メニューからアクセスしてください',
        'ブラウザからは利用できません',
        'それでも解決しない場合は、LINEアプリを再起動してください',
      ],
    };
  }
  if (error.includes('ドライバー') && (error.includes('見つかり') || error.includes('登録'))) {
    return {
      title: 'ドライバー登録が必要です',
      steps: [
        '管理者から受け取った登録URL（QRコード）を開いてください',
        'まだ登録URLを受け取っていない場合は、管理者にお問い合わせください',
      ],
      note: '登録URL: 管理画面の「ドライバー」ページから発行されます',
    };
  }
  if (error.includes('友だち') || error.includes('ブロック')) {
    return {
      title: 'LINE公式アカウントの友だち追加が必要です',
      steps: [
        'ECXIA安全管理のLINE公式アカウントを友だち追加してください',
        '以前ブロックした場合は、ブロック解除してください',
        '友だち追加後、もう一度メニューからアクセスしてください',
      ],
    };
  }
  if (error.includes('ネットワーク') || error.includes('fetch') || error.includes('Failed')) {
    return {
      title: '通信エラーが発生しました',
      steps: [
        'インターネット接続を確認してください',
        '電波の良い場所で再度お試しください',
        '問題が続く場合は、管理者にお問い合わせください',
      ],
    };
  }
  return {
    title: 'エラーが発生しました',
    steps: [
      'LINEアプリを再起動してください',
      'メニューから再度アクセスしてください',
      '問題が続く場合は、下記のエラー内容を管理者に伝えてください',
    ],
  };
}

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
    const guide = getErrorGuide(error);
    return (
      <div className="min-h-screen bg-[#f8faf8] flex items-center justify-center p-4">
        <div className="text-center max-w-sm bg-white rounded-2xl shadow-lg p-6">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold mb-3">{guide.title}</h2>
          <div className="text-left mb-4">
            <p className="text-sm font-medium mb-2">対処方法：</p>
            <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
              {guide.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
          {guide.note && (
            <p className="text-xs text-muted-foreground bg-gray-50 rounded p-2 mb-4">{guide.note}</p>
          )}
          <div className="border-t pt-3 mt-3">
            <p className="text-xs text-muted-foreground mb-2">エラー詳細: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-1 text-xs text-[#49b93d] font-medium"
            >
              <RefreshCw className="h-3 w-3" />
              再読み込み
            </button>
          </div>
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
      <nav className="bg-white border-t grid grid-cols-6">
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
