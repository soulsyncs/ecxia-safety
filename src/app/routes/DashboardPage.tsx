import { useEffect, useState } from 'react';
import { Users, FileText, ClipboardCheck, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { dashboardService } from '@/lib/demo-store';
import type { DailySubmissionSummary } from '@/types/database';

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
              className={`h-2 rounded-full transition-all ${isComplete ? 'bg-green-500' : 'bg-amber-500'}`}
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
          <p className="text-xs text-green-600 font-medium mt-2">全員提出済み</p>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const [summary, setSummary] = useState<DailySubmissionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0]!;

  useEffect(() => {
    dashboardService.getDailySummary(today)
      .then(data => {
        setSummary(data);
      })
      .catch(err => {
        console.error('Failed to load dashboard summary:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [today]);

  if (loading || !summary) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">読み込み中...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">ダッシュボード</h1>
          <p className="text-muted-foreground">本日の提出状況 ({today})</p>
        </div>
        <Badge variant="outline" className="text-sm">
          デモモード
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">稼働ドライバー</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
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
          color="text-blue-500"
        />
        <StatCard
          title="日常点検"
          icon={ClipboardCheck}
          value={summary.inspectionSubmitted}
          total={summary.totalDrivers}
          missing={summary.inspectionMissing}
          color="text-green-500"
        />
        <StatCard
          title="業務後報告"
          icon={AlertTriangle}
          value={summary.postWorkSubmitted}
          total={summary.totalDrivers}
          missing={summary.postWorkMissing}
          color="text-purple-500"
        />
      </div>

      {/* アクティビティ */}
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
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <ClipboardCheck className="h-5 w-5 text-green-500" />
                <p className="text-sm font-medium text-green-800">本日の未提出はありません</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
