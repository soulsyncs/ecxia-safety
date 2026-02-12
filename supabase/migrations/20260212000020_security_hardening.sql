-- 3-AIセキュリティレビュー対応マイグレーション
-- CRITICAL/HIGH修正: event_logs INSERT policy + RPC auth検証

-- 1. event_logs: 認証済みユーザーからのINSERTを許可
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can insert event_logs'
  ) THEN
    CREATE POLICY "Authenticated users can insert event_logs"
      ON event_logs FOR INSERT
      TO authenticated
      WITH CHECK (
        organization_id IN (
          SELECT organization_id FROM admin_users WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- 2. RPC関数: SECURITY DEFINER → SECURITY INVOKER に変更
-- auth.uid()で呼び出し元を検証し、organization_idの整合性を確認
CREATE OR REPLACE FUNCTION get_daily_submission_summary(
  p_org_id UUID,
  p_date DATE
) RETURNS JSON AS $$
DECLARE
  v_caller_org_id UUID;
BEGIN
  -- 認証チェック: auth.uid()が存在し、指定組織に所属していること
  SELECT organization_id INTO v_caller_org_id
  FROM admin_users
  WHERE id = auth.uid();

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

-- SECURITY DEFINERを維持しつつ、関数内でauth.uid()チェックを実施
-- これによりRLSをバイパスしてデータ集計できるが、呼び出し元は認証済みユーザーに限定
COMMENT ON FUNCTION get_daily_submission_summary IS
  '3-AI consensus: SECURITY DEFINER with auth.uid() validation inside function body';
