import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { reportService } from '@/lib/demo-store';
import { demoDrivers } from '@/lib/demo-data';

export function AccidentFormPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const driver = demoDrivers[0]!;

  const [form, setForm] = useState({
    location: '',
    summary: '',
    cause: '',
    preventionMeasures: '',
    hasInjuries: false,
    injuryDetails: '',
    isSerious: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.hasInjuries && !form.injuryDetails) return;
    setSubmitting(true);
    try {
      const submitTime = new Date();
      const occurredAt = submitTime.toISOString();
      const dateStr = submitTime.toISOString().split('T')[0]!;

      await reportService.submitAccidentReport({
        id: crypto.randomUUID(),
        organizationId: driver.organizationId,
        driverId: driver.id,
        vehicleId: driver.defaultVehicleId,
        occurredAt,
        location: form.location,
        summary: form.summary,
        cause: form.cause,
        preventionMeasures: form.preventionMeasures,
        hasInjuries: form.hasInjuries,
        injuryDetails: form.hasInjuries ? form.injuryDetails : null,
        isSerious: form.isSerious,
        reportedToMlit: false,
        reportedToMlitAt: null,
        mlitReportDeadline: form.isSerious
          ? (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0]!; })()
          : null,
        status: 'submitted',
        expiresAt: (() => { const d = new Date(dateStr); d.setFullYear(d.getFullYear() + 3); return d.toISOString().split('T')[0]!; })(),
        createdAt: occurredAt,
        updatedAt: occurredAt,
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit accident report:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">事故報告を提出しました</h2>
        <p className="text-muted-foreground">管理者に通知されました</p>
        <Button className="mt-6" onClick={() => setSubmitted(false)}>もう一度入力</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <h2 className="text-lg font-bold">事故報告</h2>
      </div>

      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-4">
          <p className="text-sm text-red-800">事故が発生した場合は、まず安全を確保し、必要に応じて警察・救急に連絡してください。その後、このフォームで報告してください。</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">事故の基本情報</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">発生場所 *</Label>
            <Input value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))} required placeholder="例: 江東区亀戸2丁目交差点" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">事故の概要 *</Label>
            <Textarea value={form.summary} onChange={e => setForm(f => ({...f, summary: e.target.value}))} required placeholder="何が起こったかを簡潔に" rows={3} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">事故の原因 *</Label>
            <Textarea value={form.cause} onChange={e => setForm(f => ({...f, cause: e.target.value}))} required placeholder="原因と考えられること" rows={2} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">再発防止策 *</Label>
            <Textarea value={form.preventionMeasures} onChange={e => setForm(f => ({...f, preventionMeasures: e.target.value}))} required placeholder="今後の対策" rows={2} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">負傷・重大事故</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">負傷者の有無</Label>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant={!form.hasInjuries ? 'default' : 'outline'} onClick={() => setForm(f => ({...f, hasInjuries: false}))} className="flex-1">なし</Button>
              <Button type="button" size="sm" variant={form.hasInjuries ? 'destructive' : 'outline'} onClick={() => setForm(f => ({...f, hasInjuries: true}))} className="flex-1">あり</Button>
            </div>
          </div>
          {form.hasInjuries && (
            <div className="space-y-1">
              <Label className="text-xs text-red-600">負傷の詳細（必須）</Label>
              <Textarea value={form.injuryDetails} onChange={e => setForm(f => ({...f, injuryDetails: e.target.value}))} required placeholder="負傷者の人数、状態など" rows={2} />
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs">重大事故</Label>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant={!form.isSerious ? 'default' : 'outline'} onClick={() => setForm(f => ({...f, isSerious: false}))} className="flex-1">いいえ</Button>
              <Button type="button" size="sm" variant={form.isSerious ? 'destructive' : 'outline'} onClick={() => setForm(f => ({...f, isSerious: true}))} className="flex-1">はい（国交省報告対象）</Button>
            </div>
          </div>
          {form.isSerious && (
            <div className="p-3 bg-red-50 rounded-lg text-sm text-red-800">
              重大事故の場合、国土交通大臣への報告が必要です（速報24時間以内、本報30日以内）。管理者に自動通知されます。
            </div>
          )}
        </CardContent>
      </Card>

      <Button type="submit" className="w-full h-12 text-base bg-red-600 hover:bg-red-700 text-white" disabled={submitting}>
        {submitting ? '送信中...' : '事故報告を提出'}
      </Button>
    </form>
  );
}
