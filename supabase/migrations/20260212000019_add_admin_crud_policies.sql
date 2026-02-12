-- 3-AIコンセンサス: RLSポリシー補完（Codex指摘: INSERT/UPDATE/DELETE欠如）
-- 既存: SELECT-only policies on report/driver tables
-- 追加: admin CRUD policies + driver self-insert (Edge Function経由)

-- drivers: admin can INSERT/UPDATE/DELETE
CREATE POLICY "admin_insert_drivers" ON drivers FOR INSERT
  WITH CHECK (organization_id = (SELECT organization_id FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "admin_update_drivers" ON drivers FOR UPDATE
  USING (organization_id = (SELECT organization_id FROM admin_users WHERE id = auth.uid()))
  WITH CHECK (organization_id = (SELECT organization_id FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "admin_delete_drivers" ON drivers FOR DELETE
  USING (organization_id = (SELECT organization_id FROM admin_users WHERE id = auth.uid()));

-- pre_work_reports: admin can INSERT (代理入力: submitted_via = 'manual')
CREATE POLICY "admin_insert_pre_work_reports" ON pre_work_reports FOR INSERT
  WITH CHECK (organization_id = (SELECT organization_id FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "admin_update_pre_work_reports" ON pre_work_reports FOR UPDATE
  USING (organization_id = (SELECT organization_id FROM admin_users WHERE id = auth.uid()))
  WITH CHECK (organization_id = (SELECT organization_id FROM admin_users WHERE id = auth.uid()));

-- post_work_reports: admin can INSERT/UPDATE
CREATE POLICY "admin_insert_post_work_reports" ON post_work_reports FOR INSERT
  WITH CHECK (organization_id = (SELECT organization_id FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "admin_update_post_work_reports" ON post_work_reports FOR UPDATE
  USING (organization_id = (SELECT organization_id FROM admin_users WHERE id = auth.uid()))
  WITH CHECK (organization_id = (SELECT organization_id FROM admin_users WHERE id = auth.uid()));

-- daily_inspections: admin can INSERT/UPDATE
CREATE POLICY "admin_insert_daily_inspections" ON daily_inspections FOR INSERT
  WITH CHECK (organization_id = (SELECT organization_id FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "admin_update_daily_inspections" ON daily_inspections FOR UPDATE
  USING (organization_id = (SELECT organization_id FROM admin_users WHERE id = auth.uid()))
  WITH CHECK (organization_id = (SELECT organization_id FROM admin_users WHERE id = auth.uid()));

-- accident_reports: admin can INSERT/UPDATE
CREATE POLICY "admin_insert_accident_reports" ON accident_reports FOR INSERT
  WITH CHECK (organization_id = (SELECT organization_id FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "admin_update_accident_reports" ON accident_reports FOR UPDATE
  USING (organization_id = (SELECT organization_id FROM admin_users WHERE id = auth.uid()))
  WITH CHECK (organization_id = (SELECT organization_id FROM admin_users WHERE id = auth.uid()));

-- accident_photos: admin can INSERT
CREATE POLICY "admin_insert_accident_photos" ON accident_photos FOR INSERT
  WITH CHECK (organization_id = (SELECT organization_id FROM admin_users WHERE id = auth.uid()));

-- driver_guidance_records: admin can INSERT/UPDATE
CREATE POLICY "admin_insert_driver_guidance_records" ON driver_guidance_records FOR INSERT
  WITH CHECK (organization_id = (SELECT organization_id FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "admin_update_driver_guidance_records" ON driver_guidance_records FOR UPDATE
  USING (organization_id = (SELECT organization_id FROM admin_users WHERE id = auth.uid()))
  WITH CHECK (organization_id = (SELECT organization_id FROM admin_users WHERE id = auth.uid()));

-- aptitude_tests: admin can INSERT/UPDATE
CREATE POLICY "admin_insert_aptitude_tests" ON aptitude_tests FOR INSERT
  WITH CHECK (organization_id = (SELECT organization_id FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "admin_update_aptitude_tests" ON aptitude_tests FOR UPDATE
  USING (organization_id = (SELECT organization_id FROM admin_users WHERE id = auth.uid()))
  WITH CHECK (organization_id = (SELECT organization_id FROM admin_users WHERE id = auth.uid()));

-- event_logs: service_role only for INSERT (no user INSERT policy needed)
-- Already: SELECT-only for admins. INSERT via service_role bypasses RLS.
