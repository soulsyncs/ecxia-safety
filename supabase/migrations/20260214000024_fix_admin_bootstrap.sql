-- admin_users RLS循環参照修正: 初回管理者登録のバイパス条件追加
-- 問題: get_my_org_id()がadmin_usersを参照するため、テーブルが空の状態では
--        新規admin_userをINSERTできない（NULLが返却されて条件不一致）
-- 解決: auth.uid()が認証済みだがadmin_usersに未登録の場合、初回登録を許可

DROP POLICY IF EXISTS "org_isolation_admin_users" ON admin_users;
CREATE POLICY "org_isolation_admin_users" ON admin_users FOR ALL
  USING (
    organization_id = get_my_org_id()
    OR (
      auth.uid() IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    organization_id = get_my_org_id()
    OR (
      auth.uid() IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
    )
  );
