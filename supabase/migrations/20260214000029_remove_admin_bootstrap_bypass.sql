-- 2-AIコンセンサス修正: admin_users bootstrapバイパス完全削除
-- 問題: 空テーブル時に任意のorganization_idでINSERTが可能
-- 修正: bootstrapバイパスを削除し、全操作をorg_isolationのみに制限
--        初回管理者はマイグレーション（service_role）で投入する運用に変更

-- 旧ポリシーを全て削除して再作成
DROP POLICY IF EXISTS "org_isolation_admin_users_read" ON admin_users;
DROP POLICY IF EXISTS "org_isolation_admin_users_write" ON admin_users;
DROP POLICY IF EXISTS "org_isolation_admin_users_delete" ON admin_users;
DROP POLICY IF EXISTS "org_isolation_admin_users_insert" ON admin_users;

-- 全操作をget_my_org_id()で制限（bootstrapバイパスなし）
CREATE POLICY "org_isolation_admin_users" ON admin_users FOR ALL
  USING (organization_id = get_my_org_id())
  WITH CHECK (organization_id = get_my_org_id());
