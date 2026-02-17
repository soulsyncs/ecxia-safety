import type { Shift, ShiftStatus } from '@/types/database';
import { supabase, isDemoMode, fromDb, fromDbArray } from '@/lib/supabase';
import { shiftService as demoShiftService } from '@/lib/demo-store';

/** 指定月のシフト一覧を取得 */
async function listByMonth(organizationId: string, year: number, month: number): Promise<Shift[]> {
  if (isDemoMode) return demoShiftService.listByMonth(year, month);

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]!;

  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('organization_id', organizationId)
    .gte('shift_date', startDate)
    .lte('shift_date', endDate)
    .order('shift_date', { ascending: true });

  if (error) throw error;
  return fromDbArray<Shift>(data ?? []);
}

/** 指定日のシフト一覧を取得 */
async function listByDate(organizationId: string, date: string): Promise<Shift[]> {
  if (isDemoMode) return demoShiftService.listByDate(date);

  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('shift_date', date);

  if (error) throw error;
  return fromDbArray<Shift>(data ?? []);
}

/** シフトを登録/更新（upsert） */
async function upsert(
  organizationId: string,
  driverId: string,
  date: string,
  status: ShiftStatus,
  submittedBy: 'driver' | 'admin' | 'system' = 'admin',
  note?: string,
): Promise<Shift> {
  if (isDemoMode) return demoShiftService.upsert(driverId, date, status, submittedBy, note);

  const { data, error } = await supabase
    .from('shifts')
    .upsert({
      organization_id: organizationId,
      driver_id: driverId,
      shift_date: date,
      status,
      submitted_by: submittedBy,
      note: note ?? null,
    }, { onConflict: 'driver_id,shift_date' })
    .select('*')
    .single();

  if (error) throw error;
  return fromDb<Shift>(data);
}

/** 一括シフト登録（月のテンプレート適用など） */
async function bulkUpsert(
  organizationId: string,
  entries: { driverId: string; date: string; status: ShiftStatus }[],
): Promise<void> {
  if (isDemoMode) {
    for (const e of entries) {
      await demoShiftService.upsert(e.driverId, e.date, e.status, 'admin');
    }
    return;
  }

  const rows = entries.map(e => ({
    organization_id: organizationId,
    driver_id: e.driverId,
    shift_date: e.date,
    status: e.status,
    submitted_by: 'admin',
  }));

  const { error } = await supabase
    .from('shifts')
    .upsert(rows, { onConflict: 'driver_id,shift_date' });

  if (error) throw error;
}

/** シフト削除 */
async function remove(organizationId: string, id: string): Promise<void> {
  if (isDemoMode) {
    demoShiftService.remove(id);
    return;
  }

  const { error } = await supabase
    .from('shifts')
    .delete()
    .eq('id', id)
    .eq('organization_id', organizationId);

  if (error) throw error;
}

export const shiftsService = { listByMonth, listByDate, upsert, bulkUpsert, remove };
