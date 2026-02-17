-- admin_usersにline_user_idカラムを追加（管理者へのLINE通知用）
ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS line_user_id TEXT DEFAULT NULL;

-- 管理者のLINE連携トークン（ドライバーの登録トークンと同じ仕組み）
ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS line_registration_token TEXT DEFAULT NULL;
