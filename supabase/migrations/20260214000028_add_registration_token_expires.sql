-- P1修正: registration_tokenに有効期限を追加（24時間）
-- トークンが無期限だと漏洩時のリスクが永続する

ALTER TABLE drivers
  ADD COLUMN IF NOT EXISTS registration_token_expires_at TIMESTAMPTZ DEFAULT NULL;
