-- 3.10 driver_guidance_records（指導監督記録 — 3年保存）
CREATE TABLE driver_guidance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL,
  guidance_type TEXT NOT NULL
    CHECK (guidance_type IN ('initial', 'accident', 'senior', 'regular')),
  guidance_date DATE NOT NULL,
  content TEXT NOT NULL,
  instructor_name TEXT NOT NULL,
  duration_minutes INTEGER,
  expires_at DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (driver_id, organization_id) REFERENCES drivers(id, organization_id)
);

CREATE INDEX idx_driver_guidance_org ON driver_guidance_records(organization_id);
CREATE INDEX idx_driver_guidance_driver ON driver_guidance_records(driver_id);
CREATE INDEX idx_driver_guidance_expires ON driver_guidance_records(expires_at);
