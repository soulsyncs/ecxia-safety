import type { EmergencyReport, EmergencyReportType } from '@/types/database';
import { supabase, isDemoMode, fromDb, fromDbArray } from '@/lib/supabase';
import { emergencyService as demoEmergencyService } from '@/lib/demo-store';

/** 緊急連絡一覧（日付範囲） */
async function list(organizationId: string, startDate?: string, endDate?: string): Promise<EmergencyReport[]> {
  if (isDemoMode) return demoEmergencyService.list(startDate, endDate);

  let query = supabase
    .from('emergency_reports')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (startDate) query = query.gte('report_date', startDate);
  if (endDate) query = query.lte('report_date', endDate);

  const { data, error } = await query;
  if (error) throw error;
  return fromDbArray<EmergencyReport>(data ?? []);
}

/** 緊急連絡を作成 */
async function create(
  organizationId: string,
  driverId: string,
  reportType: EmergencyReportType,
  reason?: string,
  vehicleId?: string,
): Promise<EmergencyReport> {
  if (isDemoMode) return demoEmergencyService.create(driverId, reportType, reason, vehicleId);

  const today = new Date().toISOString().split('T')[0]!;

  const { data, error } = await supabase
    .from('emergency_reports')
    .insert({
      organization_id: organizationId,
      driver_id: driverId,
      report_date: today,
      report_type: reportType,
      reason: reason ?? null,
      vehicle_id: vehicleId ?? null,
      submitted_via: 'web',
    })
    .select('*')
    .single();

  if (error) throw error;
  return fromDb<EmergencyReport>(data);
}

/** 対応完了にする */
async function resolve(organizationId: string, id: string, resolvedByAdminId: string): Promise<void> {
  if (isDemoMode) {
    demoEmergencyService.resolve(id, resolvedByAdminId);
    return;
  }

  const { error } = await supabase
    .from('emergency_reports')
    .update({
      is_resolved: true,
      resolved_by: resolvedByAdminId,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('organization_id', organizationId);

  if (error) throw error;
}

export const emergencyService = { list, create, resolve };
