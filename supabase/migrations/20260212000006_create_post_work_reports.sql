-- 3.6 post_work_reports（業務後報告 - 点呼：乗務後）
CREATE TABLE post_work_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL,
  vehicle_id UUID NOT NULL,
  report_date DATE NOT NULL,
  clock_out_at TIMESTAMPTZ NOT NULL,
  end_location TEXT NOT NULL,
  actual_destinations TEXT NOT NULL,
  distance_km NUMERIC(7,1) NOT NULL,
  rest_periods JSONB,
  alcohol_check_result TEXT NOT NULL
    CHECK (alcohol_check_result IN ('negative', 'positive')),
  alcohol_check_value NUMERIC(4,3),
  alcohol_checker_name TEXT NOT NULL,
  road_condition_note TEXT,
  cargo_delivered_count INTEGER,
  submitted_via TEXT NOT NULL DEFAULT 'liff'
    CHECK (submitted_via IN ('liff', 'web', 'manual')),
  expires_at DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (driver_id, organization_id) REFERENCES drivers(id, organization_id),
  FOREIGN KEY (vehicle_id, organization_id) REFERENCES vehicles(id, organization_id)
);

CREATE INDEX idx_post_work_reports_org_date ON post_work_reports(organization_id, report_date);
CREATE INDEX idx_post_work_reports_driver ON post_work_reports(driver_id, report_date);
CREATE INDEX idx_post_work_reports_expires ON post_work_reports(expires_at);
CREATE UNIQUE INDEX idx_post_work_reports_unique ON post_work_reports(driver_id, report_date);
