-- Issue 2: accident_reportsの複合インデックス追加（3-AIコンセンサス）
-- 既存: idx_accident_reports_org(organization_id) → 日時ソート未対応
-- 追加: (organization_id, occurred_at DESC) でダッシュボード・エクスポートクエリを最適化

CREATE INDEX IF NOT EXISTS idx_accident_reports_org_occurred
  ON accident_reports(organization_id, occurred_at DESC);

-- ドライバー一覧クエリ最適化: WHERE org_id = ? AND status != 'inactive' ORDER BY name
CREATE INDEX IF NOT EXISTS idx_drivers_org_status_name
  ON drivers(organization_id, status, name);

-- 車両一覧クエリ最適化: WHERE org_id = ? AND status != 'retired' ORDER BY plate_number
CREATE INDEX IF NOT EXISTS idx_vehicles_org_status_plate
  ON vehicles(organization_id, status, plate_number);
