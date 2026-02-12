-- 3.7 daily_inspections（日常点検記録）
CREATE TABLE daily_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL,
  vehicle_id UUID NOT NULL,
  inspection_date DATE NOT NULL,
  engine_oil BOOLEAN NOT NULL,
  coolant_level BOOLEAN NOT NULL,
  battery BOOLEAN NOT NULL,
  headlights BOOLEAN NOT NULL,
  turn_signals BOOLEAN NOT NULL,
  brake_lights BOOLEAN NOT NULL,
  tire_pressure BOOLEAN NOT NULL,
  tire_tread BOOLEAN NOT NULL,
  tire_damage BOOLEAN NOT NULL,
  mirrors BOOLEAN NOT NULL,
  seatbelt BOOLEAN NOT NULL,
  brakes BOOLEAN NOT NULL,
  steering BOOLEAN NOT NULL,
  all_passed BOOLEAN NOT NULL,
  abnormality_note TEXT,
  submitted_via TEXT NOT NULL DEFAULT 'liff'
    CHECK (submitted_via IN ('liff', 'web', 'manual')),
  expires_at DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (driver_id, organization_id) REFERENCES drivers(id, organization_id),
  FOREIGN KEY (vehicle_id, organization_id) REFERENCES vehicles(id, organization_id),
  CONSTRAINT chk_inspection_abnormality_note
    CHECK (all_passed = true OR abnormality_note IS NOT NULL)
);

CREATE INDEX idx_daily_inspections_org_date ON daily_inspections(organization_id, inspection_date);
CREATE INDEX idx_daily_inspections_driver ON daily_inspections(driver_id, inspection_date);
CREATE INDEX idx_daily_inspections_expires ON daily_inspections(expires_at);
CREATE UNIQUE INDEX idx_daily_inspections_unique ON daily_inspections(driver_id, inspection_date);
