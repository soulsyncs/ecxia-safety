-- 3-AIレビュー指摘: accident_reportsテーブルに不足カラムを追加
-- Edge Functionのホワイトリスト + AccidentFormPageに存在するが、DBカラムが未定義のため
-- ドライバー入力データが失われる問題を修正

ALTER TABLE accident_reports
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS counterparty_info TEXT,
  ADD COLUMN IF NOT EXISTS police_reported BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS insurance_contacted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notes TEXT;
