-- 3.3 drivers（ドライバー）
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  line_user_id TEXT,
  name TEXT NOT NULL,
  name_kana TEXT,
  phone TEXT,
  date_of_birth DATE,
  hire_date DATE,
  license_number TEXT,
  license_expiry DATE,
  health_check_date DATE,
  is_senior BOOLEAN NOT NULL DEFAULT false,
  is_new_hire BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'suspended')),
  default_vehicle_id UUID REFERENCES vehicles(id),
  registration_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id)
);

CREATE INDEX idx_drivers_organization_id ON drivers(organization_id);
CREATE UNIQUE INDEX idx_drivers_line_user_id ON drivers(organization_id, line_user_id) WHERE line_user_id IS NOT NULL;
CREATE UNIQUE INDEX idx_drivers_registration_token ON drivers(registration_token) WHERE registration_token IS NOT NULL;
