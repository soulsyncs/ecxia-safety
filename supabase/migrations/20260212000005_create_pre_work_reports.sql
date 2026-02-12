-- 3.5 pre_work_reports（業務前報告 - 点呼：乗務前）
CREATE TABLE pre_work_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL,
  vehicle_id UUID NOT NULL,
  report_date DATE NOT NULL,
  clock_in_at TIMESTAMPTZ NOT NULL,
  start_location TEXT NOT NULL,
  planned_destinations TEXT NOT NULL,
  alcohol_check_result TEXT NOT NULL
    CHECK (alcohol_check_result IN ('negative', 'positive')),
  alcohol_check_value NUMERIC(4,3),
  alcohol_checker_name TEXT NOT NULL,
  health_condition TEXT NOT NULL
    CHECK (health_condition IN ('good', 'fair', 'poor')),
  health_condition_note TEXT,
  fatigue_level TEXT NOT NULL
    CHECK (fatigue_level IN ('none', 'mild', 'severe')),
  sleep_hours NUMERIC(3,1),
  cargo_count INTEGER,
  submitted_via TEXT NOT NULL DEFAULT 'liff'
    CHECK (submitted_via IN ('liff', 'web', 'manual')),
  expires_at DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (driver_id, organization_id) REFERENCES drivers(id, organization_id),
  FOREIGN KEY (vehicle_id, organization_id) REFERENCES vehicles(id, organization_id),
  CONSTRAINT chk_pre_work_health_note
    CHECK (health_condition != 'poor' OR health_condition_note IS NOT NULL)
);

CREATE INDEX idx_pre_work_reports_org_date ON pre_work_reports(organization_id, report_date);
CREATE INDEX idx_pre_work_reports_driver ON pre_work_reports(driver_id, report_date);
CREATE INDEX idx_pre_work_reports_expires ON pre_work_reports(expires_at);
CREATE UNIQUE INDEX idx_pre_work_reports_unique ON pre_work_reports(driver_id, report_date);
