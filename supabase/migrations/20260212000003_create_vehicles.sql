-- 3.4 vehicles（車両） ※driversの前に作成（FK依存）
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plate_number TEXT NOT NULL,
  maker TEXT,
  model TEXT,
  year INTEGER,
  vehicle_inspection_date DATE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'maintenance', 'retired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id)
);

CREATE INDEX idx_vehicles_organization_id ON vehicles(organization_id);
CREATE UNIQUE INDEX idx_vehicles_plate ON vehicles(organization_id, plate_number);
