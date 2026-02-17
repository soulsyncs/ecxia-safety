-- =============================================================
-- ECXIA Safety Management System - Cronジョブ再設定
-- LINE自動配信を再有効化（管理画面の通知設定でON/OFF制御可能）
-- ※ 認証にはSupabase Service Role Keyを使用
-- =============================================================

-- まず既存のジョブを削除（もしあれば）
DO $$
BEGIN
  PERFORM cron.unschedule('ecxia-morning-reminder');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$
BEGIN
  PERFORM cron.unschedule('ecxia-check-pre-work');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$
BEGIN
  PERFORM cron.unschedule('ecxia-admin-summary');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$
BEGIN
  PERFORM cron.unschedule('ecxia-check-post-work');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 朝のリマインド: 毎朝08:00 JST = 23:00 UTC (前日)
SELECT cron.schedule(
  'ecxia-morning-reminder',
  '0 23 * * *',
  $$
  SELECT net.http_post(
    url := 'https://dirbmretnocymuttrlrc.supabase.co/functions/v1/morning-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- 業務前未提出アラート: 毎朝09:30 JST = 00:30 UTC
SELECT cron.schedule(
  'ecxia-check-pre-work',
  '30 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://dirbmretnocymuttrlrc.supabase.co/functions/v1/check-submissions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key')
    ),
    body := '{"type": "pre_work"}'::jsonb
  );
  $$
);

-- 管理者サマリー通知: 毎朝10:00 JST = 01:00 UTC
SELECT cron.schedule(
  'ecxia-admin-summary',
  '0 1 * * *',
  $$
  SELECT net.http_post(
    url := 'https://dirbmretnocymuttrlrc.supabase.co/functions/v1/check-submissions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key')
    ),
    body := '{"type": "admin_summary"}'::jsonb
  );
  $$
);

-- 業務後未提出アラート: 毎夕19:00 JST = 10:00 UTC
SELECT cron.schedule(
  'ecxia-check-post-work',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url := 'https://dirbmretnocymuttrlrc.supabase.co/functions/v1/check-submissions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key')
    ),
    body := '{"type": "post_work"}'::jsonb
  );
  $$
);
