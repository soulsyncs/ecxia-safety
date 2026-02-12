import type { DailySubmissionSummary } from '@/types/database';
import { supabase, isDemoMode, handleSupabaseError } from '@/lib/supabase';
import { dashboardService as demoDashboardService } from '@/lib/demo-store';

async function getDailySummary(date: string, organizationId: string): Promise<DailySubmissionSummary> {
  if (isDemoMode) return demoDashboardService.getDailySummary(date);

  // RPC: get_daily_submission_summary (定義済み: migration 000018)
  const { data, error } = await supabase.rpc('get_daily_submission_summary', {
    p_org_id: organizationId,
    p_date: date,
  });
  if (error) handleSupabaseError(error);

  // RPC returns JSON with snake_case keys
  const raw = data as {
    total_drivers: number;
    pre_work_submitted: number;
    post_work_submitted: number;
    inspection_submitted: number;
    pre_work_missing: string[];
    post_work_missing: string[];
    inspection_missing: string[];
  };

  return {
    date,
    totalDrivers: raw.total_drivers,
    preWorkSubmitted: raw.pre_work_submitted,
    postWorkSubmitted: raw.post_work_submitted,
    inspectionSubmitted: raw.inspection_submitted,
    preWorkMissing: raw.pre_work_missing ?? [],
    postWorkMissing: raw.post_work_missing ?? [],
    inspectionMissing: raw.inspection_missing ?? [],
  };
}

export const dashboardService = { getDailySummary };
