-- ダッシュボード用RPC: 提出状況を1クエリで集計（N+1防止）
CREATE OR REPLACE FUNCTION get_daily_submission_summary(
  p_org_id UUID,
  p_date DATE
) RETURNS JSON AS $$
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
  );
$$ LANGUAGE sql SECURITY DEFINER;
