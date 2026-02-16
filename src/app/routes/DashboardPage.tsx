import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { Users, FileText, ClipboardCheck, AlertTriangle, CheckCircle2, Circle, X, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDailySummary } from '@/hooks/use-dashboard';
import { useDrivers } from '@/hooks/use-drivers';
import { useVehicles } from '@/hooks/use-vehicles';
import { useAuth } from '@/contexts/auth-context';
import { isDemoMode } from '@/lib/supabase';

function StatCard({ title, icon: Icon, value, total, missing, color }: {
  title: string;
  icon: React.ElementType;
  value: number;
  total: number;
  missing: string[];
  color: string;
}) {
  const rate = total > 0 ? Math.round((value / total) * 100) : 0;
  const isComplete = value >= total;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value} / {total}</div>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${isComplete ? 'bg-ecxia-green' : 'bg-amber-500'}`}
              style={{ width: `${rate}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{rate}%</span>
        </div>
        {missing.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium text-destructive mb-1">未提出:</p>
            <div className="flex flex-wrap gap-1">
              {missing.map(name => (
                <Badge key={name} variant="destructive" className="text-xs">
                  {name}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {isComplete && (
          <p className="text-xs text-ecxia-green-dark font-medium mt-2">全員提出済み</p>
        )}
      </CardContent>
    </Card>
  );
}

/** ウェルカムガイド（初回のみ表示） */
function WelcomeGuide({ userName, onDismiss }: { userName: string; onDismiss: () => void }) {
  return (
    <Card className="mb-6 border-[#50cb43]/30 bg-gradient-to-r from-[#eef6ed] to-white">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex gap-3">
            <Sparkles className="h-6 w-6 text-[#50cb43] mt-0.5 shrink-0" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                ようこそ、{userName}さん！
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                ECXIA安全管理システムへの初回ログインありがとうございます。
              </p>
              <div className="mt-3 space-y-2 text-sm text-gray-700">
                <p>このシステムでは、以下のことができます：</p>
                <ul className="list-disc list-inside space-y-1 ml-1">
                  <li>ドライバーの日報・点呼記録を一覧で確認</li>
                  <li>未提出者をひと目で把握し、アラートを受け取る</li>
                  <li>監査用のCSVデータをワンクリックでダウンロード</li>
                </ul>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                まずは下の「やることリスト」に沿って、初期設定を進めましょう。
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onDismiss} className="shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/** やることリスト（セットアップチェックリスト） */
function SetupChecklist({ items }: { items: { label: string; done: boolean; href: string; description: string }[] }) {
  const doneCount = items.filter(i => i.done).length;
  const allDone = doneCount === items.length;

  if (allDone) return null;

  return (
    <Card className="mb-6 border-amber-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">はじめに設定すること</CardTitle>
          <Badge variant="outline" className="text-xs">
            {doneCount} / {items.length} 完了
          </Badge>
        </div>
        <div className="flex gap-1 mt-2">
          {items.map((item, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${item.done ? 'bg-ecxia-green' : 'bg-gray-200'}`}
            />
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item, i) => (
          <Link
            key={i}
            to={item.href}
            className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
              item.done
                ? 'bg-green-50 text-green-700'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900'
            }`}
          >
            {item.done ? (
              <CheckCircle2 className="h-5 w-5 text-ecxia-green shrink-0 mt-0.5" />
            ) : (
              <Circle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div>
              <p className={`text-sm font-medium ${item.done ? 'line-through' : ''}`}>
                {item.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { user, organization } = useAuth();
  const orgId = organization?.id ?? '';
  const today = new Date().toISOString().split('T')[0]!;
  const { data: summary, isLoading } = useDailySummary(today, orgId);
  const { data: drivers = [] } = useDrivers(orgId);
  const { data: vehicles = [] } = useVehicles(orgId);

  // ウェルカムガイドの表示制御（localStorage）
  const [showWelcome, setShowWelcome] = useState(false);
  useEffect(() => {
    const dismissed = localStorage.getItem('ecxia_welcome_dismissed');
    if (!dismissed) setShowWelcome(true);
  }, []);

  const dismissWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem('ecxia_welcome_dismissed', 'true');
  };

  // セットアップチェックリスト
  const activeDrivers = drivers.filter(d => d.status === 'active');
  const activeVehicles = vehicles.filter(v => v.status !== 'retired');
  const linkedDrivers = activeDrivers.filter(d => d.lineUserId);

  const setupItems = [
    {
      label: 'ドライバーを登録する',
      done: activeDrivers.length > 0,
      href: '/drivers',
      description: activeDrivers.length > 0
        ? `${activeDrivers.length}名が登録済み`
        : 'ドライバー管理ページで、名前と電話番号を登録しましょう',
    },
    {
      label: '車両を登録する',
      done: activeVehicles.length > 0,
      href: '/vehicles',
      description: activeVehicles.length > 0
        ? `${activeVehicles.length}台が登録済み`
        : '車両管理ページで、ナンバープレートを登録しましょう',
    },
    {
      label: 'ドライバーのLINE連携をする',
      done: linkedDrivers.length > 0,
      href: '/drivers',
      description: linkedDrivers.length > 0
        ? `${linkedDrivers.length}名が連携済み`
        : 'ドライバー管理ページで「LINE連携」ボタンからQRコードを発行しましょう',
    },
  ];

  if (isLoading || !summary) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">読み込み中...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">ダッシュボード</h1>
          <p className="text-muted-foreground">本日の提出状況 ({today})</p>
        </div>
        {isDemoMode && (
          <Badge variant="outline" className="text-sm">
            デモモード
          </Badge>
        )}
      </div>

      {/* 1. ウェルカムガイド */}
      {showWelcome && user && (
        <WelcomeGuide userName={user.name} onDismiss={dismissWelcome} />
      )}

      {/* 2. やることリスト */}
      <SetupChecklist items={setupItems} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">稼働ドライバー</CardTitle>
            <Users className="h-4 w-4 text-ecxia-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalDrivers}名</div>
          </CardContent>
        </Card>

        <StatCard
          title="業務前報告"
          icon={FileText}
          value={summary.preWorkSubmitted}
          total={summary.totalDrivers}
          missing={summary.preWorkMissing}
          color="text-ecxia-green-dark"
        />
        <StatCard
          title="日常点検"
          icon={ClipboardCheck}
          value={summary.inspectionSubmitted}
          total={summary.totalDrivers}
          missing={summary.inspectionMissing}
          color="text-ecxia-green-vivid"
        />
        <StatCard
          title="業務後報告"
          icon={AlertTriangle}
          value={summary.postWorkSubmitted}
          total={summary.totalDrivers}
          missing={summary.postWorkMissing}
          color="text-ecxia-green"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">本日のアクティビティ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {summary.preWorkMissing.length > 0 && (
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">業務前報告 未提出あり</p>
                  <p className="text-xs text-red-600">{summary.preWorkMissing.join('、')} が未提出です</p>
                </div>
              </div>
            )}
            {summary.inspectionMissing.length > 0 && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                <ClipboardCheck className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">日常点検 未提出あり</p>
                  <p className="text-xs text-amber-600">{summary.inspectionMissing.join('、')} が未提出です</p>
                </div>
              </div>
            )}
            {summary.preWorkMissing.length === 0 && summary.inspectionMissing.length === 0 && summary.postWorkMissing.length === 0 && (
              <div className="flex items-center gap-3 p-3 bg-ecxia-green-light rounded-lg">
                <ClipboardCheck className="h-5 w-5 text-ecxia-green" />
                <p className="text-sm font-medium text-ecxia-green-dark">本日の未提出はありません</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
