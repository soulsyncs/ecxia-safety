-- accident-photos Storage bucket（Edge Functionのservice_roleからのみアップロード可能）
INSERT INTO storage.buckets (id, name, public)
VALUES ('accident-photos', 'accident-photos', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: 管理者のみ読み取り可能
CREATE POLICY "admin_read_accident_photos_storage" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'accident-photos'
    AND EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid()
    )
  );
