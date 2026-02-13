import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { initLiff, getLiffIdToken } from '@/liff/lib/liff-init';

const EDGE_FUNCTION_BASE = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
  : '';

export function RegisterPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('LINE連携を開始しています...');
  const [driverName, setDriverName] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function register() {
      try {
        // URLからregistration_tokenを取得
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if (!token) {
          if (!cancelled) {
            setStatus('error');
            setMessage('登録URLが無効です。管理者に確認してください。');
          }
          return;
        }

        // LIFF初期化
        await initLiff();
        const idToken = getLiffIdToken();
        if (!idToken) {
          if (!cancelled) {
            setStatus('error');
            setMessage('LINE認証が必要です。LINEアプリから開いてください。');
          }
          return;
        }

        // link-driver Edge Function呼び出し
        const res = await fetch(`${EDGE_FUNCTION_BASE}/link-driver`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({ registrationToken: token }),
        });

        const data = await res.json();

        if (!cancelled) {
          if (res.ok && data.success) {
            setStatus('success');
            setMessage(data.message ?? 'LINE連携が完了しました');
            setDriverName(data.driverName ?? '');
          } else {
            setStatus('error');
            setMessage(data.message ?? 'LINE連携に失敗しました');
          }
        }
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setMessage(err instanceof Error ? err.message : 'エラーが発生しました');
        }
      }
    }

    register();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-[#f8faf8] flex items-center justify-center p-4">
      <div className="text-center max-w-sm bg-white rounded-2xl shadow-lg p-8">
        <img src="/ecxia-logo-footer.png" alt="ECXIA" className="h-8 mx-auto mb-4" />
        <h1 className="text-lg font-bold mb-6">ECXIA安全管理システム</h1>

        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 text-[#49b93d] mx-auto mb-4 animate-spin" />
            <p className="text-sm text-muted-foreground">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 text-[#49b93d] mx-auto mb-4" />
            <p className="text-base font-bold text-[#49b93d] mb-2">LINE連携完了</p>
            {driverName && (
              <p className="text-sm mb-4">{driverName} さん</p>
            )}
            <p className="text-sm text-muted-foreground mb-4">{message}</p>
            <p className="text-xs text-muted-foreground">
              画面下部のメニューから日報の提出ができます。
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-base font-bold text-red-500 mb-2">エラー</p>
            <p className="text-sm text-muted-foreground">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}
