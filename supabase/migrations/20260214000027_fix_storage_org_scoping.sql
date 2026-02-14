-- P0修正: accident-photos Storage RLSに組織スコーピングを追加
-- 問題: 旧ポリシーは任意のadmin_userが全テナントの写真にアクセスできた
-- 修正: パスの先頭ディレクトリ（organization_id）と管理者の組織を照合

DROP POLICY IF EXISTS "admin_read_accident_photos_storage" ON storage.objects;

CREATE POLICY "admin_read_accident_photos_org_scoped" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'accident-photos'
    AND EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
        AND organization_id::text = (storage.foldername(name))[1]
    )
  );
