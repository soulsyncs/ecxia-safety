-- RLS循環参照の修正
-- admin_usersのRLSポリシーがadmin_usersを参照する循環を解消
-- SECURITY DEFINER関数でRLSをバイパスしてorganization_idを取得

-- 1. ヘルパー関数: 現在のユーザーのorganization_idを取得（RLSバイパス）
CREATE OR REPLACE FUNCTION get_my_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM admin_users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. admin_usersの既存ポリシーを削除して再作成
DROP POLICY IF EXISTS "org_isolation_admin_users" ON admin_users;
CREATE POLICY "org_isolation_admin_users" ON admin_users FOR ALL
  USING (organization_id = get_my_org_id());

-- 3. organizationsのポリシーも同様に修正
DROP POLICY IF EXISTS "org_isolation_organizations" ON organizations;
CREATE POLICY "org_isolation_organizations" ON organizations FOR ALL
  USING (id = get_my_org_id());

-- 4. 他の全テーブルのポリシーも関数を使うように統一
-- drivers
DROP POLICY IF EXISTS "admin_read_drivers" ON drivers;
CREATE POLICY "admin_read_drivers" ON drivers FOR SELECT
  USING (organization_id = get_my_org_id());

-- vehicles
DROP POLICY IF EXISTS "org_isolation_vehicles" ON vehicles;
CREATE POLICY "org_isolation_vehicles" ON vehicles FOR ALL
  USING (organization_id = get_my_org_id());

-- pre_work_reports
DROP POLICY IF EXISTS "admin_read_pre_work_reports" ON pre_work_reports;
CREATE POLICY "admin_read_pre_work_reports" ON pre_work_reports FOR SELECT
  USING (organization_id = get_my_org_id());

-- post_work_reports
DROP POLICY IF EXISTS "admin_read_post_work_reports" ON post_work_reports;
CREATE POLICY "admin_read_post_work_reports" ON post_work_reports FOR SELECT
  USING (organization_id = get_my_org_id());

-- daily_inspections
DROP POLICY IF EXISTS "admin_read_daily_inspections" ON daily_inspections;
CREATE POLICY "admin_read_daily_inspections" ON daily_inspections FOR SELECT
  USING (organization_id = get_my_org_id());

-- accident_reports
DROP POLICY IF EXISTS "admin_read_accident_reports" ON accident_reports;
CREATE POLICY "admin_read_accident_reports" ON accident_reports FOR SELECT
  USING (organization_id = get_my_org_id());

-- accident_photos
DROP POLICY IF EXISTS "admin_read_accident_photos" ON accident_photos;
CREATE POLICY "admin_read_accident_photos" ON accident_photos FOR SELECT
  USING (organization_id = get_my_org_id());

-- driver_guidance_records
DROP POLICY IF EXISTS "admin_read_driver_guidance_records" ON driver_guidance_records;
CREATE POLICY "admin_read_driver_guidance_records" ON driver_guidance_records FOR SELECT
  USING (organization_id = get_my_org_id());

-- aptitude_tests
DROP POLICY IF EXISTS "admin_read_aptitude_tests" ON aptitude_tests;
CREATE POLICY "admin_read_aptitude_tests" ON aptitude_tests FOR SELECT
  USING (organization_id = get_my_org_id());

-- safety_manager_trainings
DROP POLICY IF EXISTS "org_isolation_safety_manager_trainings" ON safety_manager_trainings;
CREATE POLICY "org_isolation_safety_manager_trainings" ON safety_manager_trainings FOR ALL
  USING (organization_id = get_my_org_id());

-- line_broadcasts
DROP POLICY IF EXISTS "org_isolation_line_broadcasts" ON line_broadcasts;
CREATE POLICY "org_isolation_line_broadcasts" ON line_broadcasts FOR ALL
  USING (organization_id = get_my_org_id());

-- line_broadcast_targets
DROP POLICY IF EXISTS "admin_read_broadcast_targets" ON line_broadcast_targets;
CREATE POLICY "admin_read_broadcast_targets" ON line_broadcast_targets FOR SELECT
  USING (broadcast_id IN (
    SELECT id FROM line_broadcasts WHERE organization_id = get_my_org_id()
  ));

-- event_logs (SELECT)
DROP POLICY IF EXISTS "select_event_logs" ON event_logs;
CREATE POLICY "select_event_logs" ON event_logs FOR SELECT
  USING (organization_id = get_my_org_id());

-- event_logs (INSERT from migration 000020)
DROP POLICY IF EXISTS "Authenticated users can insert event_logs" ON event_logs;
CREATE POLICY "Authenticated users can insert event_logs"
  ON event_logs FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_my_org_id());

-- migration 000019のポリシーも更新
-- drivers CRUD
DROP POLICY IF EXISTS "admin_crud_drivers" ON drivers;
CREATE POLICY "admin_crud_drivers" ON drivers FOR ALL
  USING (organization_id = get_my_org_id());

-- migration 000020のRPC関数も更新（get_my_org_id()を使用）
CREATE OR REPLACE FUNCTION get_daily_submission_summary(
  p_org_id UUID,
  p_date DATE
) RETURNS JSON AS $$
DECLARE
  v_caller_org_id UUID;
BEGIN
  v_caller_org_id := get_my_org_id();

  IF v_caller_org_id IS NULL OR v_caller_org_id != p_org_id THEN
    RAISE EXCEPTION 'Unauthorized: caller does not belong to organization %', p_org_id;
  END IF;

  RETURN (
    SELECT json_build_object(
      'total_drivers', (
        SELECT COUNT(*) FROM drivers
        WHERE organization_id = p_org_id AND status = 'active'
      ),
      'pre_work_submitted', (
        SELECT COUNT(*) FROM pre_work_reports
        WHERE organization_id = p_org_id AND report_date = p_date
      ),
      'post_work_submitted', (
        SELECT COUNT(*) FROM post_work_reports
        WHERE organization_id = p_org_id AND report_date = p_date
      ),
      'inspection_submitted', (
        SELECT COUNT(*) FROM daily_inspections
        WHERE organization_id = p_org_id AND inspection_date = p_date
      ),
      'pre_work_missing', (
        SELECT COALESCE(json_agg(d.name), '[]'::json)
        FROM drivers d
        WHERE d.organization_id = p_org_id AND d.status = 'active'
        AND NOT EXISTS (
          SELECT 1 FROM pre_work_reports p
          WHERE p.driver_id = d.id AND p.report_date = p_date
        )
      ),
      'post_work_missing', (
        SELECT COALESCE(json_agg(d.name), '[]'::json)
        FROM drivers d
        WHERE d.organization_id = p_org_id AND d.status = 'active'
        AND NOT EXISTS (
          SELECT 1 FROM post_work_reports p
          WHERE p.driver_id = d.id AND p.report_date = p_date
        )
      ),
      'inspection_missing', (
        SELECT COALESCE(json_agg(d.name), '[]'::json)
        FROM drivers d
        WHERE d.organization_id = p_org_id AND d.status = 'active'
        AND NOT EXISTS (
          SELECT 1 FROM daily_inspections di
          WHERE di.driver_id = d.id AND di.inspection_date = p_date
        )
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
