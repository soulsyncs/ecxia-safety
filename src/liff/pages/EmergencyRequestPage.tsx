import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, CheckCircle, Phone } from 'lucide-react';
import { isDemoMode } from '@/lib/supabase';
import { useLiffAuth } from '@/liff/hooks/use-liff-auth';
import { emergencyService as demoEmergencyService } from '@/lib/demo-store';

const EDGE_FUNCTION_BASE = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
  : '';

type EmergencyType = 'absent' | 'vehicle_trouble' | 'accident' | 'family' | 'other';

const TYPE_OPTIONS: { value: EmergencyType; label: string; icon: string }[] = [
  { value: 'absent', label: '体調不良・欠勤', icon: '🤒' },
  { value: 'vehicle_trouble', label: '車両故障', icon: '🚛' },
  { value: 'accident', label: '事故', icon: '💥' },
  { value: 'family', label: '家庭の事情', icon: '🏠' },
  { value: 'other', label: 'その他', icon: '📋' },
];

export function EmergencyRequestPage() {
  const { driver, idToken } = useLiffAuth();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<EmergencyType | null>(null);
  const [reason, setReason] = useState('');

  if (!driver) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;
    setSubmitting(true);
    setError(null);

    try {
      if (isDemoMode) {
        await demoEmergencyService.create(
          driver.id,
          selectedType,
          reason || undefined,
        );
      } else {
        const res = await fetch(`${EDGE_FUNCTION_BASE}/submit-shift`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            action: 'emergency',
            reportType: selectedType,
            reason: reason || null,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message ?? '送信に失敗しました');
        }
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '送信に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle className="h-16 w-16 text-[#49b93d] mb-4" />
        <h2 className="text-xl font-bold mb-2">緊急連絡を送信しました</h2>
        <p className="text-sm text-muted-foreground mb-1">管理者に通知されました</p>
        <p className="text-sm text-muted-foreground mb-6">本日のシフトは自動的に「欠勤」に変更されます</p>
        <Button
          className="bg-[#49b93d] hover:bg-[#3da832]"
          onClick={() => {
            setSubmitted(false);
            setSelectedType(null);
            setReason('');
          }}
        >
          もう一度入力
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="h-5 w-5 text-red-500" />
            緊急連絡
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            急な欠勤や車両トラブルを管理者に報告します
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 連絡種別 */}
          <div>
            <p className="text-sm font-medium mb-2">連絡種別</p>
            <div className="grid grid-cols-1 gap-2">
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedType(opt.value)}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                    selectedType === opt.value
                      ? 'border-[#49b93d] bg-green-50 ring-1 ring-[#49b93d]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-xl">{opt.icon}</span>
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 理由（任意） */}
          {selectedType && (
            <div>
              <p className="text-sm font-medium mb-1">詳しい状況（任意）</p>
              <Textarea
                placeholder="例: 朝から熱が38度あるため休みます"
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {/* 注意文 */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <div className="text-xs text-amber-700">
                <p className="font-medium mb-1">送信するとどうなるか</p>
                <ul className="space-y-0.5">
                  <li>管理者のLINEに即座に通知されます</li>
                  <li>本日のシフトが自動的に「欠勤」になります</li>
                  <li>事故の場合は、別途「事故報告」も提出してください</li>
                </ul>
              </div>
            </div>
          </div>

          {/* エラー */}
          {error && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</div>
          )}

          {/* 送信ボタン */}
          <Button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white"
            disabled={!selectedType || submitting}
          >
            {submitting ? '送信中...' : '緊急連絡を送信'}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
