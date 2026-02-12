import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, CheckCircle, XCircle } from 'lucide-react';
import { isDemoMode } from '@/lib/supabase';
import { useLiffAuth, submitToEdgeFunction } from '@/liff/hooks/use-liff-auth';
import { reportsService } from '@/services';

const inspectionItems = [
  { category: 'エンジンルーム', items: [
    { key: 'engineOil', label: 'エンジンオイル量' },
    { key: 'coolantLevel', label: '冷却水量' },
    { key: 'battery', label: 'バッテリー液量' },
  ]},
  { category: 'ライト類', items: [
    { key: 'headlights', label: 'ヘッドライト' },
    { key: 'turnSignals', label: 'ウインカー' },
    { key: 'brakeLights', label: 'ブレーキランプ' },
  ]},
  { category: 'タイヤ', items: [
    { key: 'tirePressure', label: '空気圧' },
    { key: 'tireTread', label: '溝の深さ' },
    { key: 'tireDamage', label: '損傷の有無' },
  ]},
  { category: '運転席周り', items: [
    { key: 'mirrors', label: 'ミラー' },
    { key: 'seatbelt', label: 'シートベルト' },
    { key: 'brakes', label: 'ブレーキ' },
    { key: 'steering', label: 'ステアリング' },
  ]},
];

type CheckState = Record<string, boolean>;

export function InspectionFormPage() {
  const { driver, vehicle, idToken } = useLiffAuth();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checks, setChecks] = useState<CheckState>({});
  const [abnormalityNote, setAbnormalityNote] = useState('');
  const today = new Date().toISOString().split('T')[0]!;

  const allKeys = inspectionItems.flatMap(c => c.items.map(i => i.key));
  const allChecked = allKeys.every(k => checks[k] === true);
  const hasAnyFalse = allKeys.some(k => checks[k] === false);

  const toggle = (key: string) => {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const setAllOk = () => {
    const newChecks: CheckState = {};
    for (const k of allKeys) newChecks[k] = true;
    setChecks(newChecks);
  };

  if (!driver || !vehicle) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasAnyFalse && !abnormalityNote) return;
    setSubmitting(true);
    try {
      const submitTime = new Date();
      const allPassed = allChecked;
      const payload = {
        organizationId: driver.organizationId,
        driverId: driver.id,
        vehicleId: vehicle.id,
        inspectionDate: today,
        engineOil: checks['engineOil'] ?? false,
        coolantLevel: checks['coolantLevel'] ?? false,
        battery: checks['battery'] ?? false,
        headlights: checks['headlights'] ?? false,
        turnSignals: checks['turnSignals'] ?? false,
        brakeLights: checks['brakeLights'] ?? false,
        tirePressure: checks['tirePressure'] ?? false,
        tireTread: checks['tireTread'] ?? false,
        tireDamage: checks['tireDamage'] ?? false,
        mirrors: checks['mirrors'] ?? false,
        seatbelt: checks['seatbelt'] ?? false,
        brakes: checks['brakes'] ?? false,
        steering: checks['steering'] ?? false,
        allPassed,
        abnormalityNote: abnormalityNote || null,
        submittedVia: 'liff',
      };

      if (isDemoMode) {
        const expiresAt = (() => { const d = new Date(today); d.setFullYear(d.getFullYear() + 1); return d.toISOString().split('T')[0]!; })();
        await reportsService.submitDailyInspection({
          id: crypto.randomUUID(),
          ...payload,
          expiresAt,
          createdAt: submitTime.toISOString(),
          updatedAt: submitTime.toISOString(),
        } as Parameters<typeof reportsService.submitDailyInspection>[0]);
      } else {
        await submitToEdgeFunction('inspection', payload, idToken!);
      }
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit inspection:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle className="h-16 w-16 text-ecxia-green mb-4" />
        <h2 className="text-xl font-bold mb-2">日常点検を提出しました</h2>
        <p className="text-muted-foreground">{vehicle.plateNumber}</p>
        <Badge className="mt-2" variant={allChecked ? 'default' : 'destructive'}>
          {allChecked ? '全項目合格' : '異常あり'}
        </Badge>
        <Button className="mt-6" onClick={() => { setSubmitted(false); setChecks({}); }}>もう一度入力</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-ecxia-green-dark" />
          <h2 className="text-lg font-bold">日常点検</h2>
        </div>
        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={setAllOk}>全てOK</Button>
      </div>

      <Card>
        <CardContent className="pt-4 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">車両</span><span className="font-medium">{vehicle.plateNumber}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">車種</span><span>{vehicle.maker} {vehicle.model}</span></div>
        </CardContent>
      </Card>

      {inspectionItems.map(category => (
        <Card key={category.category}>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{category.category}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {category.items.map(item => {
              const checked = checks[item.key];
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => toggle(item.key)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    checked === true ? 'bg-ecxia-green-light border-ecxia-green/40' :
                    checked === false ? 'bg-red-50 border-red-300' :
                    'bg-gray-50 border-gray-200'
                  }`}
                >
                  <span className="text-sm">{item.label}</span>
                  {checked === true && <CheckCircle className="h-5 w-5 text-ecxia-green-dark" />}
                  {checked === false && <XCircle className="h-5 w-5 text-red-600" />}
                  {checked === undefined && <span className="text-xs text-muted-foreground">タップして確認</span>}
                </button>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {hasAnyFalse && (
        <Card className="border-red-300">
          <CardContent className="pt-4">
            <Label className="text-xs text-red-600">異常箇所の詳細（必須）</Label>
            <Textarea
              value={abnormalityNote}
              onChange={e => setAbnormalityNote(e.target.value)}
              required
              placeholder="異常の内容を具体的に記入してください"
              rows={3}
              className="mt-1"
            />
          </CardContent>
        </Card>
      )}

      <Button
        type="submit"
        className="w-full h-12 text-base rounded-full bg-ecxia-green hover:bg-ecxia-green-dark"
        disabled={submitting || allKeys.some(k => checks[k] === undefined)}
      >
        {submitting ? '送信中...' : '日常点検を提出'}
      </Button>
    </form>
  );
}
