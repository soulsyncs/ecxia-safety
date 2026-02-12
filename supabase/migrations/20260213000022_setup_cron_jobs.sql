-- =============================================================
-- ECXIA Safety Management System - Cron拡張の有効化
-- pg_cron + pg_net を有効化する（スケジュール設定は別途SQL Editorで実行）
-- =============================================================

-- pg_cron: 定期実行スケジューラ
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- pg_net: HTTPリクエスト送信（Edge Functions呼び出し用）
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
