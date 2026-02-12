import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Truck, Clock, CheckCircle } from 'lucide-react';
import { reportService } from '@/lib/demo-store';
import { demoDrivers, demoVehicles } from '@/lib/demo-data';

export function PreWorkFormPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const driver = demoDrivers[0]!; // デモ: 佐藤太郎
  const vehicle = demoVehicles[0]!;
  const now = new Date();
  const today = now.toISOString().split('T')[0]!;

  const [form, setForm] = useState({
    startLocation: '市川市南八幡 本社',
    plannedDestinations: '',
    alcoholCheckResult: 'negative' as const,
    alcoholCheckValue: '0.000',
    alcoholCheckerName: '田中 一郎',
    healthCondition: 'good' as const,
    healthConditionNote: '',
    fatigueLevel: 'none' as const,
    sleepHours: '7',
    cargoCount: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const submitTime = new Date(); // S-4: タイムスタンプは送信時に取得（法令精度）
      await reportService.submitPreWorkReport({
        id: crypto.randomUUID(),
        organizationId: driver.organizationId,
        driverId: driver.id,
        vehicleId: vehicle.id,
        reportDate: today,
        clockInAt: submitTime.toISOString(),
        startLocation: form.startLocation,
        plannedDestinations: form.plannedDestinations,
        alcoholCheckResult: form.alcoholCheckResult,
        alcoholCheckValue: parseFloat(form.alcoholCheckValue) || null,
        alcoholCheckerName: form.alcoholCheckerName,
        healthCondition: form.healthCondition,
        healthConditionNote: form.healthConditionNote || null,
        fatigueLevel: form.fatigueLevel,
        sleepHours: parseFloat(form.sleepHours) || null,
        cargoCount: form.cargoCount ? parseInt(form.cargoCount) : null,
        submittedVia: 'liff',
        expiresAt: (() => { const d = new Date(today); d.setFullYear(d.getFullYear() + 1); return d.toISOString().split('T')[0]!; })(),
        createdAt: submitTime.toISOString(),
        updatedAt: submitTime.toISOString(),
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit pre-work report:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">業務前報告を提出しました</h2>
        <p className="text-muted-foreground mb-1">{driver.name} / {vehicle.plateNumber}</p>
        <p className="text-sm text-muted-foreground">出勤時刻: {now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</p>
        <Button className="mt-6" onClick={() => setSubmitted(false)}>もう一度入力</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Truck className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-bold">業務前報告</h2>
      </div>

      {/* ドライバー・車両情報（自動） */}
      <Card>
        <CardContent className="pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">ドライバー</span>
            <span className="font-medium">{driver.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">車両</span>
            <span className="font-medium">{vehicle.plateNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">出勤時刻</span>
            <span className="font-medium flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
              <Badge variant="outline" className="text-xs ml-1">自動記録</Badge>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 業務情報 */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">業務情報</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">業務開始地点</Label>
            <Input value={form.startLocation} onChange={e => setForm(f => ({...f, startLocation: e.target.value}))} required />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">配送先（予定）</Label>
            <Textarea value={form.plannedDestinations} onChange={e => setForm(f => ({...f, plannedDestinations: e.target.value}))} required placeholder="江東区・江戸川区エリア 宅配便" rows={2} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">積載荷物数</Label>
            <Input type="number" value={form.cargoCount} onChange={e => setForm(f => ({...f, cargoCount: e.target.value}))} placeholder="例: 100" />
          </div>
        </CardContent>
      </Card>

      {/* 点呼 */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">点呼（乗務前）</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">アルコールチェック</Label>
            <div className="flex gap-2">
              {(['negative', 'positive'] as const).map(v => (
                <Button key={v} type="button" size="sm"
                  variant={form.alcoholCheckResult === v ? (v === 'negative' ? 'default' : 'destructive') : 'outline'}
                  onClick={() => setForm(f => ({...f, alcoholCheckResult: v}))}
                  className="flex-1"
                >
                  {v === 'negative' ? '陰性（0.00）' : '陽性'}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">確認者氏名</Label>
            <Input value={form.alcoholCheckerName} onChange={e => setForm(f => ({...f, alcoholCheckerName: e.target.value}))} required />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">体調</Label>
            <div className="flex gap-2">
              {([['good', '良好'], ['fair', '普通'], ['poor', '不良']] as const).map(([v, l]) => (
                <Button key={v} type="button" size="sm"
                  variant={form.healthCondition === v ? (v === 'poor' ? 'destructive' : 'default') : 'outline'}
                  onClick={() => setForm(f => ({...f, healthCondition: v}))}
                  className="flex-1"
                >{l}</Button>
              ))}
            </div>
          </div>
          {form.healthCondition === 'poor' && (
            <div className="space-y-1">
              <Label className="text-xs text-red-600">体調詳細（必須）</Label>
              <Textarea value={form.healthConditionNote} onChange={e => setForm(f => ({...f, healthConditionNote: e.target.value}))} required placeholder="具体的な症状を記入" rows={2} />
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs">疲労度</Label>
            <div className="flex gap-2">
              {([['none', 'なし'], ['mild', '軽度'], ['severe', '重度']] as const).map(([v, l]) => (
                <Button key={v} type="button" size="sm"
                  variant={form.fatigueLevel === v ? (v === 'severe' ? 'destructive' : 'default') : 'outline'}
                  onClick={() => setForm(f => ({...f, fatigueLevel: v}))}
                  className="flex-1"
                >{l}</Button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">睡眠時間</Label>
            <Input type="number" step="0.5" value={form.sleepHours} onChange={e => setForm(f => ({...f, sleepHours: e.target.value}))} placeholder="7" />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full h-12 text-base bg-[#06C755] hover:bg-[#05b04c]" disabled={submitting}>
        {submitting ? '送信中...' : '業務前報告を提出'}
      </Button>
    </form>
  );
}
