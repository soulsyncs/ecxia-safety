import { useState } from 'react';
import { AlertTriangle, CheckCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/auth-context';
import { useDrivers } from '@/hooks/use-drivers';
import { useEmergencyReports, useCreateEmergencyReport, useResolveEmergency } from '@/hooks/use-emergency';
import type { EmergencyReportType } from '@/types/database';

const REPORT_TYPE_LABELS: Record<EmergencyReportType, string> = {
  absent: '体調不良',
  vehicle_trouble: '車両故障',
  accident: '事故',
  family: '家庭の事情',
  other: 'その他',
};

const REPORT_TYPE_ICONS: Record<EmergencyReportType, string> = {
  absent: '🤒',
  vehicle_trouble: '🚗',
  accident: '⚠️',
  family: '🏠',
  other: '📝',
};

export function EmergencyPage() {
  const { user, organization } = useAuth();
  const orgId = organization?.id ?? '';
  const today = new Date().toISOString().split('T')[0]!;
  const thirtyDaysAgo = (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]!; })();

  const { data: drivers = [] } = useDrivers(orgId);
  const { data: reports = [], isLoading } = useEmergencyReports(orgId, thirtyDaysAgo, today);
  const createMutation = useCreateEmergencyReport(orgId);
  const resolveMutation = useResolveEmergency(orgId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [reportType, setReportType] = useState<EmergencyReportType>('absent');
  const [reason, setReason] = useState('');

  const driverName = (id: string) => drivers.find(d => d.id === id)?.name ?? '-';

  const handleCreate = async () => {
    if (!selectedDriver) return;
    await createMutation.mutateAsync({
      driverId: selectedDriver,
      reportType,
      reason: reason || undefined,
    });
    setDialogOpen(false);
    setSelectedDriver('');
    setReportType('absent');
    setReason('');
  };

  const handleResolve = (id: string) => {
    if (!user) return;
    resolveMutation.mutate({ id, resolvedBy: user.id });
  };

  const unresolvedCount = reports.filter(r => !r.isResolved).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">緊急連絡</h1>
          <p className="text-muted-foreground">急な欠勤・車両トラブルなどの報告を管理します</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <Phone className="h-4 w-4 mr-2" />
              緊急報告を登録
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>緊急連絡の登録</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>ドライバー</Label>
                <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                  <SelectTrigger><SelectValue placeholder="選択してください" /></SelectTrigger>
                  <SelectContent>
                    {drivers.filter(d => d.status === 'active').map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>種類</Label>
                <Select value={reportType} onValueChange={v => setReportType(v as EmergencyReportType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(REPORT_TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{REPORT_TYPE_ICONS[k as EmergencyReportType]} {v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>詳細（任意）</Label>
                <Textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="状況を簡単に記入..."
                  rows={3}
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={!selectedDriver || createMutation.isPending}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {createMutation.isPending ? '登録中...' : '登録する（シフトも自動で欠勤に変更）'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 未対応件数 */}
      {unresolvedCount > 0 && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="font-medium text-red-800">
                未対応の緊急報告が {unresolvedCount} 件あります
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 報告一覧 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">直近30日の緊急連絡</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">読み込み中...</p>
          ) : reports.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">緊急連絡はありません</p>
          ) : (
            <div className="space-y-3">
              {reports.map(report => (
                <div
                  key={report.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    report.isResolved ? 'bg-gray-50 border-gray-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">
                      {REPORT_TYPE_ICONS[report.reportType]}
                    </span>
                    <div>
                      <div className="font-medium">
                        {driverName(report.driverId)}
                        <Badge variant="outline" className="ml-2">
                          {REPORT_TYPE_LABELS[report.reportType]}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {report.reportDate} / {new Date(report.createdAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {report.reason && (
                        <div className="text-sm mt-1">{report.reason}</div>
                      )}
                    </div>
                  </div>
                  <div>
                    {report.isResolved ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        対応済み
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolve(report.id)}
                        disabled={resolveMutation.isPending}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        対応完了
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
