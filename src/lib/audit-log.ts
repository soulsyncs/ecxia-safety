/**
 * 監査ログユーティリティ
 * event_logsテーブルへの安全なINSERT（PIIマスキング済み）
 */
import { supabase, isDemoMode, toDb } from '@/lib/supabase';
import { maskPiiFields } from '@/lib/pii-mask';

export type AuditEventType =
  | 'login'
  | 'logout'
  | 'driver_created'
  | 'driver_updated'
  | 'vehicle_created'
  | 'vehicle_updated'
  | 'report_submitted'
  | 'report_reviewed'
  | 'driver_linked'
  | 'export_csv'
  | 'admin_action';

interface AuditLogInput {
  organizationId: string;
  eventType: AuditEventType;
  actorId?: string;          // 操作者ID（admin_user or driver）
  actorType?: 'admin' | 'driver' | 'system';
  targetTable?: string;      // 対象テーブル
  targetId?: string;         // 対象レコードID
  details?: Record<string, unknown>; // PIIマスキング済みデータ
}

/** 監査ログを記録（デモモードではconsole.logのみ） */
export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  // PIIをマスキング
  const safeDetails = input.details ? maskPiiFields(input.details) : {};

  if (isDemoMode) {
    console.log('[AuditLog]', {
      eventType: input.eventType,
      actorType: input.actorType,
      targetTable: input.targetTable,
      details: safeDetails,
    });
    return;
  }

  try {
    const row = toDb({
      organizationId: input.organizationId,
      eventType: input.eventType,
      actorId: input.actorId ?? null,
      actorType: input.actorType ?? 'system',
      targetTable: input.targetTable ?? null,
      targetId: input.targetId ?? null,
      details: safeDetails,
    });

    const { error } = await supabase.from('event_logs').insert(row);
    if (error) {
      // 監査ログの書き込み失敗はアプリの動作を止めない
      console.error('[AuditLog] Failed to write:', error.message);
    }
  } catch (err) {
    console.error('[AuditLog] Error:', err);
  }
}
