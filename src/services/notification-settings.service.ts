import type { NotificationSettings } from '@/types/database';
import { DEFAULT_NOTIFICATION_SETTINGS } from '@/types/database';
import { supabase, isDemoMode, handleSupabaseError } from '@/lib/supabase';

// デモ用インメモリ設定
let demoSettings: NotificationSettings = { ...DEFAULT_NOTIFICATION_SETTINGS };

async function get(organizationId: string): Promise<NotificationSettings> {
  if (isDemoMode) {
    await new Promise(r => setTimeout(r, 200));
    return { ...demoSettings };
  }

  const { data, error } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', organizationId)
    .single();

  if (error) handleSupabaseError(error);

  const settings = (data?.settings ?? {}) as Record<string, unknown>;
  const notification = settings.notification as NotificationSettings | undefined;
  return notification ?? { ...DEFAULT_NOTIFICATION_SETTINGS };
}

async function update(
  organizationId: string,
  notification: NotificationSettings,
): Promise<NotificationSettings> {
  if (isDemoMode) {
    await new Promise(r => setTimeout(r, 300));
    demoSettings = { ...notification };
    return { ...demoSettings };
  }

  // 既存settingsを取得してnotificationキーだけ更新
  const { data: current, error: fetchError } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', organizationId)
    .single();

  if (fetchError) handleSupabaseError(fetchError);

  const existingSettings = (current?.settings ?? {}) as Record<string, unknown>;
  const newSettings = { ...existingSettings, notification };

  const { error } = await supabase
    .from('organizations')
    .update({ settings: newSettings, updated_at: new Date().toISOString() })
    .eq('id', organizationId);

  if (error) handleSupabaseError(error);
  return notification;
}

export const notificationSettingsService = { get, update };
