-- 3.8 accident_reports（事故報告）
CREATE TABLE accident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL,
  vehicle_id UUID,
  occurred_at TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  summary TEXT NOT NULL,
  cause TEXT NOT NULL,
  prevention_measures TEXT NOT NULL,
  has_injuries BOOLEAN NOT NULL DEFAULT false,
  injury_details TEXT,
  is_serious BOOLEAN NOT NULL DEFAULT false,
  reported_to_mlit BOOLEAN NOT NULL DEFAULT false,
  reported_to_mlit_at TIMESTAMPTZ,
  mlit_report_deadline DATE,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'reviewed')),
  expires_at DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (driver_id, organization_id) REFERENCES drivers(id, organization_id),
  FOREIGN KEY (vehicle_id, organization_id) REFERENCES vehicles(id, organization_id),
  CONSTRAINT chk_accident_injury_details
    CHECK (has_injuries = false OR injury_details IS NOT NULL),
  CONSTRAINT chk_accident_mlit_deadline
    CHECK (is_serious = false OR mlit_report_deadline IS NOT NULL)
);

CREATE INDEX idx_accident_reports_org ON accident_reports(organization_id);
CREATE INDEX idx_accident_reports_driver ON accident_reports(driver_id);
CREATE INDEX idx_accident_reports_expires ON accident_reports(expires_at);
CREATE INDEX idx_accident_reports_mlit_pending
  ON accident_reports(mlit_report_deadline)
  WHERE is_serious = true AND reported_to_mlit = false;
