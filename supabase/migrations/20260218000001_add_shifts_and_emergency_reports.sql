-- =============================================
-- シフト管理テーブル + 緊急連絡テーブル
-- 要望2: シフト管理、要望3: 急な欠勤・トラブル報告
-- =============================================

-- 1. シフト管理テーブル
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'working' CHECK (status IN ('working', 'day_off', 'half_am', 'half_pm', 'absent', 'pending')),
  note TEXT,
  submitted_by TEXT NOT NULL DEFAULT 'driver' CHECK (submitted_by IN ('driver', 'admin', 'system')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(driver_id, shift_date)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_shifts_org_date ON shifts(organization_id, shift_date);
CREATE INDEX IF NOT EXISTS idx_shifts_driver_date ON shifts(driver_id, shift_date);

-- RLS
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY shifts_select ON shifts FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM admin_users WHERE id = auth.uid()
  ));

CREATE POLICY shifts_insert ON shifts FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM admin_users WHERE id = auth.uid()
  ));

CREATE POLICY shifts_update ON shifts FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM admin_users WHERE id = auth.uid()
  ));

CREATE POLICY shifts_delete ON shifts FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM admin_users WHERE id = auth.uid()
  ));

-- updated_at トリガー
CREATE TRIGGER set_shifts_updated_at
  BEFORE UPDATE ON shifts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 2. 緊急連絡テーブル（急な欠勤・トラブル報告）
CREATE TABLE IF NOT EXISTS emergency_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('absent', 'vehicle_trouble', 'accident', 'family', 'other')),
  reason TEXT,
  vehicle_id UUID REFERENCES vehicles(id),
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID REFERENCES admin_users(id),
  resolved_at TIMESTAMPTZ,
  submitted_via TEXT NOT NULL DEFAULT 'liff' CHECK (submitted_via IN ('liff', 'web', 'manual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_emergency_org_date ON emergency_reports(organization_id, report_date);
CREATE INDEX IF NOT EXISTS idx_emergency_driver ON emergency_reports(driver_id, report_date);

-- RLS
ALTER TABLE emergency_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY emergency_select ON emergency_reports FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM admin_users WHERE id = auth.uid()
  ));

CREATE POLICY emergency_insert ON emergency_reports FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM admin_users WHERE id = auth.uid()
  ));

CREATE POLICY emergency_update ON emergency_reports FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM admin_users WHERE id = auth.uid()
  ));

-- updated_at トリガー
CREATE TRIGGER set_emergency_reports_updated_at
  BEFORE UPDATE ON emergency_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
