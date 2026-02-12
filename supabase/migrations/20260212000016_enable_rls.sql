-- 全テーブルにRLSを有効化 + ポリシー設定

-- organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation_organizations" ON organizations FOR ALL
  USING (id = (SELECT organization_id FROM admin_users WHERE id = auth.uid()));

-- admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation_admin_users" ON admin_users FOR ALL
  USING (organization_id = (SELECT organization_id FROM admin_users WHERE id = auth.uid()));

-- drivers
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_read_drivers" ON drivers FOR SELECT
  USING (organization_id = (SELECT organization_id FROM admin_users WHERE id = auth.uid()));

-- vehicles
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation_vehicles" ON vehicles FOR ALL
  USING (organization_id = (SELECT organization_id FROM admin_users WHERE id = auth.uid()));

-- pre_work_reports
ALTER TABLE pre_work_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_read_pre_work_reports" ON pre_work_reports FOR SELECT
  USING (organization_id = (SELECT organization_id FROM admin_users WHERE id = auth.uid()));

-- post_work_reports
ALTER TABLE post_work_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_read_post_work_reports" ON post_work_reports FOR SELECT
  USING (organization_id = (SELECT organization_id FROM admin_users WHERE id = auth.uid()));

-- daily_inspections
ALTER TABLE daily_inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_read_daily_inspections" ON daily_inspections FOR SELECT
  USING (organization_id = (SELECT organization_id FROM admin_users WHERE id = auth.uid()));

-- accident_reports
ALTER TABLE accident_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_read_accident_reports" ON accident_reports FOR SELECT
  USING (organization_id = (SELECT organization_id FROM admin_users WHERE id = auth.uid()));

-- accident_photos
ALTER TABLE accident_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_read_accident_photos" ON accident_photos FOR SELECT
  USING (organization_id = (SELECT organization_id FROM admin_users WHERE id = auth.uid()));

-- driver_guidance_records
ALTER TABLE driver_guidance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_read_driver_guidance_records" ON driver_guidance_records FOR SELECT
  USING (organization_id = (SELECT organization_id FROM admin_users WHERE id = auth.uid()));

-- aptitude_tests
ALTER TABLE aptitude_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_read_aptitude_tests" ON aptitude_tests FOR SELECT
  USING (organization_id = (SELECT organization_id FROM admin_users WHERE id = auth.uid()));

-- safety_manager_trainings
ALTER TABLE safety_manager_trainings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation_safety_manager_trainings" ON safety_manager_trainings FOR ALL
  USING (organization_id = (SELECT organization_id FROM admin_users WHERE id = auth.uid()));

-- line_broadcasts
ALTER TABLE line_broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation_line_broadcasts" ON line_broadcasts FOR ALL
  USING (organization_id = (SELECT organization_id FROM admin_users WHERE id = auth.uid()));

-- line_broadcast_targets (broadcast_id経由で組織分離)
ALTER TABLE line_broadcast_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_read_broadcast_targets" ON line_broadcast_targets FOR SELECT
  USING (broadcast_id IN (
    SELECT id FROM line_broadcasts WHERE organization_id = (
      SELECT organization_id FROM admin_users WHERE id = auth.uid()
    )
  ));

-- event_logs: SELECT only (INSERT は service_role のみ, UPDATE/DELETE 禁止)
ALTER TABLE event_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_event_logs" ON event_logs FOR SELECT
  USING (organization_id = (SELECT organization_id FROM admin_users WHERE id = auth.uid()));
