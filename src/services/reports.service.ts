import type { PreWorkReport, PostWorkReport, DailyInspection, AccidentReport } from '@/types/database';
import { supabase, isDemoMode, fromDb, fromDbArray, toDb, handleSupabaseError } from '@/lib/supabase';
import { reportService as demoReportService } from '@/lib/demo-store';

// --- GET ---
// 全クエリにorganization_idフィルタ必須（鉄則#1: マルチテナント分離）

async function getPreWorkReports(organizationId: string, startDate?: string, endDate?: string): Promise<PreWorkReport[]> {
  if (isDemoMode) return demoReportService.getPreWorkReports(startDate);

  let query = supabase.from('pre_work_reports').select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });
  if (startDate && endDate && startDate !== endDate) {
    query = query.gte('report_date', startDate).lte('report_date', endDate);
  } else if (startDate) {
    query = query.eq('report_date', startDate);
  }

  const { data, error } = await query;
  if (error) handleSupabaseError(error);
  return fromDbArray<PreWorkReport>(data ?? []);
}

async function getPostWorkReports(organizationId: string, startDate?: string, endDate?: string): Promise<PostWorkReport[]> {
  if (isDemoMode) return demoReportService.getPostWorkReports(startDate);

  let query = supabase.from('post_work_reports').select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });
  if (startDate && endDate && startDate !== endDate) {
    query = query.gte('report_date', startDate).lte('report_date', endDate);
  } else if (startDate) {
    query = query.eq('report_date', startDate);
  }

  const { data, error } = await query;
  if (error) handleSupabaseError(error);
  return fromDbArray<PostWorkReport>(data ?? []);
}

async function getDailyInspections(organizationId: string, startDate?: string, endDate?: string): Promise<DailyInspection[]> {
  if (isDemoMode) return demoReportService.getDailyInspections(startDate);

  let query = supabase.from('daily_inspections').select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });
  if (startDate && endDate && startDate !== endDate) {
    query = query.gte('inspection_date', startDate).lte('inspection_date', endDate);
  } else if (startDate) {
    query = query.eq('inspection_date', startDate);
  }

  const { data, error } = await query;
  if (error) handleSupabaseError(error);
  return fromDbArray<DailyInspection>(data ?? []);
}

async function getAccidentReports(organizationId: string): Promise<AccidentReport[]> {
  if (isDemoMode) return demoReportService.getAccidentReports();

  const { data, error } = await supabase
    .from('accident_reports')
    .select('*')
    .eq('organization_id', organizationId)
    .order('occurred_at', { ascending: false });
  if (error) handleSupabaseError(error);
  return fromDbArray<AccidentReport>(data ?? []);
}

// --- SUBMIT ---

async function submitPreWorkReport(input: PreWorkReport): Promise<PreWorkReport> {
  if (isDemoMode) return demoReportService.submitPreWorkReport(input);

  const dbRow = toDb(input as unknown as Record<string, unknown>);
  const { data, error } = await supabase.from('pre_work_reports').insert(dbRow).select().single();
  if (error) handleSupabaseError(error);
  return fromDb<PreWorkReport>(data);
}

async function submitPostWorkReport(input: PostWorkReport): Promise<PostWorkReport> {
  if (isDemoMode) return demoReportService.submitPostWorkReport(input);

  const dbRow = toDb(input as unknown as Record<string, unknown>);
  const { data, error } = await supabase.from('post_work_reports').insert(dbRow).select().single();
  if (error) handleSupabaseError(error);
  return fromDb<PostWorkReport>(data);
}

async function submitDailyInspection(input: DailyInspection): Promise<DailyInspection> {
  if (isDemoMode) return demoReportService.submitDailyInspection(input);

  const dbRow = toDb(input as unknown as Record<string, unknown>);
  const { data, error } = await supabase.from('daily_inspections').insert(dbRow).select().single();
  if (error) handleSupabaseError(error);
  return fromDb<DailyInspection>(data);
}

async function submitAccidentReport(input: AccidentReport): Promise<AccidentReport> {
  if (isDemoMode) return demoReportService.submitAccidentReport(input);

  const dbRow = toDb(input as unknown as Record<string, unknown>);
  const { data, error } = await supabase.from('accident_reports').insert(dbRow).select().single();
  if (error) handleSupabaseError(error);
  return fromDb<AccidentReport>(data);
}

export const reportsService = {
  getPreWorkReports,
  getPostWorkReports,
  getDailyInspections,
  getAccidentReports,
  submitPreWorkReport,
  submitPostWorkReport,
  submitDailyInspection,
  submitAccidentReport,
};
