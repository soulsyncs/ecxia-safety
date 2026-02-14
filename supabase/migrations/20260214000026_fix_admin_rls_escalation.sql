-- P0修正: admin_users RLS 特権昇格の防止
-- 問題: 旧ポリシーは「admin_usersに未登録の認証済みユーザー」に全テナント読み書きを許可していた
-- 修正: バイパスは「admin_usersテーブルが完全に空」かつ「INSERTのみ」に制限
--        → 初回セットアップ後は通常のorg_isolation RLSのみ有効

-- 旧ポリシーを削除
DROP POLICY IF EXISTS "org_isolation_admin_users" ON admin_users;

-- 通常の組織分離ポリシー（SELECT/UPDATE/DELETE用）
CREATE POLICY "org_isolation_admin_users_read" ON admin_users FOR SELECT
  USING (organization_id = get_my_org_id());

CREATE POLICY "org_isolation_admin_users_write" ON admin_users FOR UPDATE
  USING (organization_id = get_my_org_id())
  WITH CHECK (organization_id = get_my_org_id());

CREATE POLICY "org_isolation_admin_users_delete" ON admin_users FOR DELETE
  USING (organization_id = get_my_org_id());

-- INSERT専用: テーブルが完全に空のときのみバイパス許可（初回セットアップ用）
-- テーブルにレコードが1件でもあれば、通常のorg_isolation条件が必要
CREATE POLICY "org_isolation_admin_users_insert" ON admin_users FOR INSERT
  WITH CHECK (
    organization_id = get_my_org_id()
    OR (
      auth.uid() IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM admin_users LIMIT 1)
    )
  );
