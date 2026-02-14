import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, CheckCircle, Plus, Trash2 } from 'lucide-react';
import { isDemoMode } from '@/lib/supabase';
import { useLiffAuth, submitToEdgeFunction } from '@/liff/hooks/use-liff-auth';
import { reportsService } from '@/services';
import type { RestPeriod } from '@/types/database';

export function PostWorkFormPage() {
  const { driver, vehicle, idToken } = useLiffAuth();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const now = new Date();
  const today = now.toISOString().split('T')[0]!;

  const [form, setForm] = useState({
    endLocation: '市川市南八幡 本社',
    actualDestinations: '',
    distanceKm: '',
    alcoholCheckResult: 'negative' as 'negative' | 'positive',
    alcoholCheckerName: '田中 一郎',
    roadConditionNote: '',
    cargoDeliveredCount: '',
  });
  const [restPeriods, setRestPeriods] = useState<RestPeriod[]>([
    { start: '12:00', end: '13:00', location: '' },
  ]);

  const addRest = () => setRestPeriods(prev => [...prev, { start: '', end: '', location: '' }]);
  const removeRest = (i: number) => setRestPeriods(prev => prev.filter((_, idx) => idx !== i));
  const updateRest = (i: number, field: keyof RestPeriod, value: string) => {
    setRestPeriods(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  };

  if (!driver || !vehicle) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const submitTime = new Date();
      const payload = {
        organizationId: driver.organizationId,
        driverId: driver.id,
        vehicleId: vehicle.id,
        reportDate: today,
        clockOutAt: submitTime.toISOString(),
        endLocation: form.endLocation,
        actualDestinations: form.actualDestinations,
        distanceKm: parseFloat(form.distanceKm) || 0,
        restPeriods: restPeriods.filter(r => r.start && r.end),
        alcoholCheckResult: form.alcoholCheckResult,
        alcoholCheckValue: 0,
        alcoholCheckerName: form.alcoholCheckerName,
        roadConditionNote: form.roadConditionNote || null,
        cargoDeliveredCount: form.cargoDeliveredCount ? parseInt(form.cargoDeliveredCount) : null,
        submittedVia: 'liff',
      };

      if (isDemoMode) {
        const expiresAt = (() => { const d = new Date(today); d.setFullYear(d.getFullYear() + 1); return d.toISOString().split('T')[0]!; })();
        await reportsService.submitPostWorkReport({
          id: crypto.randomUUID(),
          ...payload,
          expiresAt,
          createdAt: submitTime.toISOString(),
          updatedAt: submitTime.toISOString(),
        } as Parameters<typeof reportsService.submitPostWorkReport>[0]);
      } else {
        await submitToEdgeFunction('post_work', payload, idToken!);
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
        <CheckCircle className="h-16 w-16 text-ecxia-green mb-4" />
        <h2 className="text-xl font-bold mb-2">業務後報告を提出しました</h2>
        <p className="text-muted-foreground mb-1">{driver.name} / {vehicle.plateNumber}</p>
        <p className="text-sm text-muted-foreground">退勤時刻: {now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</p>
        <Button className="mt-6" onClick={() => setSubmitted(false)}>もう一度入力</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="h-5 w-5 text-ecxia-green-dark" />
        <h2 className="text-lg font-bold">業務後報告</h2>
      </div>

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
            <span className="text-muted-foreground">退勤時刻</span>
            <span className="font-medium flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
              <Badge variant="outline" className="text-xs ml-1">自動記録</Badge>
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">業務記録</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">業務終了地点</Label>
            <Input value={form.endLocation} onChange={e => setForm(f => ({...f, endLocation: e.target.value}))} required />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">実際の配送先</Label>
            <Textarea value={form.actualDestinations} onChange={e => setForm(f => ({...f, actualDestinations: e.target.value}))} required placeholder="江東区亀戸・江戸川区葛西エリア" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">走行距離 (km)</Label>
              <Input type="number" step="0.1" value={form.distanceKm} onChange={e => setForm(f => ({...f, distanceKm: e.target.value}))} required placeholder="85.5" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">配送荷物数</Label>
              <Input type="number" value={form.cargoDeliveredCount} onChange={e => setForm(f => ({...f, cargoDeliveredCount: e.target.value}))} placeholder="95" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">休憩記録</CardTitle>
          <Button type="button" variant="ghost" size="sm" onClick={addRest}><Plus className="h-3 w-3 mr-1" />追加</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {restPeriods.map((rest, i) => (
            <div key={i} className="flex items-end gap-2 p-2 bg-gray-50 rounded">
              <div className="flex-1 space-y-1">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">開始</Label>
                    <Input type="time" value={rest.start} onChange={e => updateRest(i, 'start', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">終了</Label>
                    <Input type="time" value={rest.end} onChange={e => updateRest(i, 'end', e.target.value)} />
                  </div>
                </div>
                <Input placeholder="休憩場所" value={rest.location} onChange={e => updateRest(i, 'location', e.target.value)} className="text-sm" />
              </div>
              {restPeriods.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => removeRest(i)}><Trash2 className="h-3 w-3" /></Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">点呼（乗務後）</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">アルコールチェック</Label>
            <div className="flex gap-2">
              {(['negative', 'positive'] as const).map(v => (
                <Button key={v} type="button" size="sm"
                  variant={form.alcoholCheckResult === v ? (v === 'negative' ? 'default' : 'destructive') : 'outline'}
                  onClick={() => setForm(f => ({...f, alcoholCheckResult: v}))}
                  className="flex-1"
                >{v === 'negative' ? '陰性（0.00）' : '陽性'}</Button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">確認者氏名</Label>
            <Input value={form.alcoholCheckerName} onChange={e => setForm(f => ({...f, alcoholCheckerName: e.target.value}))} required />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">道路・運行状況</Label>
            <Textarea value={form.roadConditionNote} onChange={e => setForm(f => ({...f, roadConditionNote: e.target.value}))} placeholder="特になし（渋滞情報等があれば記入）" rows={2} />
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{error}</div>
      )}

      <Button type="submit" className="w-full h-12 text-base rounded-full bg-ecxia-green hover:bg-ecxia-green-dark" disabled={submitting}>
        {submitting ? '送信中...' : '業務後報告を提出'}
      </Button>
    </form>
  );
}
