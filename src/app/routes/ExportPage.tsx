import { useState } from 'react';
import { Download, FileText, ClipboardCheck, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDrivers } from '@/hooks/use-drivers';
import { useVehicles } from '@/hooks/use-vehicles';
import { usePreWorkReports, usePostWorkReports, useDailyInspections, useAccidentReports } from '@/hooks/use-reports';
import { useAuth } from '@/contexts/auth-context';

type ExportType = 'pre_work' | 'post_work' | 'inspection' | 'accident';

const exportItems: { type: ExportType; label: string; icon: React.ElementType; description: string }[] = [
  { type: 'pre_work', label: '業務前報告', icon: FileText, description: '出勤打刻・アルコールチェック・点呼記録' },
  { type: 'post_work', label: '業務後報告', icon: FileText, description: '退勤打刻・走行距離・道路状況' },
  { type: 'inspection', label: '日常点検', icon: ClipboardCheck, description: '車両13項目日常点検記録' },
  { type: 'accident', label: '事故報告', icon: AlertTriangle, description: '事故の記録・原因・再発防止策' },
];

/** CSVフィールドのエスケープ（インジェクション防止） */
function escapeCsv(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) return `"'${str.replace(/"/g, '""')}"`;
  if (/[,"\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function downloadCsv(csv: string, filename: string) {
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportPage() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0]!;
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]!);
  const [exporting, setExporting] = useState<ExportType | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('all');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');

  const { organization } = useAuth();
  const orgId = organization?.id ?? '';
  const { data: drivers = [] } = useDrivers(orgId);
  const { data: vehicles = [] } = useVehicles(orgId);
  const { data: preWork = [] } = usePreWorkReports(orgId, startDate, endDate);
  const { data: postWork = [] } = usePostWorkReports(orgId, startDate, endDate);
  const { data: inspections = [] } = useDailyInspections(orgId, startDate, endDate);
  const { data: accidents = [] } = useAccidentReports(orgId);

  const driverName = (id: string) => drivers.find(d => d.id === id)?.name ?? '-';
  const vehiclePlate = (id: string | null) => id ? (vehicles.find(v => v.id === id)?.plateNumber ?? '-') : '-';

  const filterByDriver = <T extends { driverId: string }>(data: T[]): T[] => {
    if (selectedDriverId === 'all') return data;
    return data.filter(d => d.driverId === selectedDriverId);
  };

  const filterByVehicle = <T extends { vehicleId: string | null }>(data: T[]): T[] => {
    if (selectedVehicleId === 'all') return data;
    return data.filter(d => d.vehicleId === selectedVehicleId);
  };

  const handleExport = async (type: ExportType) => {
    setExporting(type);
    await new Promise(r => setTimeout(r, 300));

    let csv = '';
    let filename = '';
    const driverLabel = selectedDriverId === 'all' ? '全員' : driverName(selectedDriverId);

    if (type === 'pre_work') {
      const filtered = filterByVehicle(filterByDriver(preWork));
      csv = '日付,ドライバー,車両,出勤時刻,出発地,配送先,アルコール結果,測定値,確認者,体調,疲労度,睡眠時間,提出方法\n';
      for (const r of filtered) {
        csv += [r.reportDate, escapeCsv(driverName(r.driverId)), escapeCsv(vehiclePlate(r.vehicleId)), r.clockInAt, escapeCsv(r.startLocation), escapeCsv(r.plannedDestinations), r.alcoholCheckResult, r.alcoholCheckValue ?? '', escapeCsv(r.alcoholCheckerName), r.healthCondition, r.fatigueLevel, r.sleepHours ?? '', r.submittedVia].join(',') + '\n';
      }
      filename = `業務前報告_${driverLabel}_${startDate}_${endDate}.csv`;
    } else if (type === 'post_work') {
      const filtered = filterByVehicle(filterByDriver(postWork));
      csv = '日付,ドライバー,車両,退勤時刻,到着地,走行距離km,配送数,アルコール結果,道路状況\n';
      for (const r of filtered) {
        csv += [r.reportDate, escapeCsv(driverName(r.driverId)), escapeCsv(vehiclePlate(r.vehicleId)), r.clockOutAt, escapeCsv(r.endLocation), r.distanceKm, r.cargoDeliveredCount ?? '', r.alcoholCheckResult, escapeCsv(r.roadConditionNote)].join(',') + '\n';
      }
      filename = `業務後報告_${driverLabel}_${startDate}_${endDate}.csv`;
    } else if (type === 'inspection') {
      const filtered = filterByVehicle(filterByDriver(inspections));
      csv = '日付,ドライバー,車両,エンジンオイル,冷却水,バッテリー,ヘッドライト,ウインカー,ブレーキランプ,タイヤ空気圧,タイヤ溝,タイヤ損傷,ミラー,シートベルト,ブレーキ,ステアリング,全項目合格,異常メモ\n';
      for (const r of filtered) {
        const yn = (v: boolean) => v ? 'OK' : 'NG';
        csv += [r.inspectionDate, escapeCsv(driverName(r.driverId)), escapeCsv(vehiclePlate(r.vehicleId)), yn(r.engineOil), yn(r.coolantLevel), yn(r.battery), yn(r.headlights), yn(r.turnSignals), yn(r.brakeLights), yn(r.tirePressure), yn(r.tireTread), yn(r.tireDamage), yn(r.mirrors), yn(r.seatbelt), yn(r.brakes), yn(r.steering), r.allPassed ? 'OK' : 'NG', escapeCsv(r.abnormalityNote)].join(',') + '\n';
      }
      filename = `日常点検_${driverLabel}_${startDate}_${endDate}.csv`;
    } else {
      const filtered = filterByDriver(accidents);
      csv = '発生日時,ドライバー,車両,場所,概要,原因,再発防止策,負傷者,負傷詳細,重大事故,国交省報告済,状態\n';
      for (const r of filtered) {
        csv += [r.occurredAt, escapeCsv(driverName(r.driverId)), vehiclePlate(r.vehicleId ?? null), escapeCsv(r.location), escapeCsv(r.summary), escapeCsv(r.cause), escapeCsv(r.preventionMeasures), r.hasInjuries ? 'あり' : 'なし', escapeCsv(r.injuryDetails), r.isSerious ? 'はい' : 'いいえ', r.reportedToMlit ? 'はい' : 'いいえ', r.status].join(',') + '\n';
      }
      filename = `事故報告_${driverLabel}_全件.csv`;
    }

    downloadCsv(csv, filename);
    setExporting(null);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">データエクスポート</h1>
        <p className="text-muted-foreground">監査対応用のCSVデータをダウンロード</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">絞り込み条件</CardTitle>
          <CardDescription>期間・ドライバー・車両で絞り込んでエクスポートできます</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label>開始日</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>終了日</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>ドライバー</Label>
              <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全員</SelectItem>
                  {drivers.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>車両</Label>
              <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全車両</SelectItem>
                  {vehicles.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.plateNumber}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exportItems.map(item => (
          <Card key={item.type}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-base">{item.label}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => handleExport(item.type)}
                disabled={exporting !== null}
                className="w-full"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                {exporting === item.type ? 'エクスポート中...' : 'CSVダウンロード'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">法令対応</Badge>
            <span>業務記録・点呼記録は1年間、事故記録は3年間の保存が義務付けられています</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
