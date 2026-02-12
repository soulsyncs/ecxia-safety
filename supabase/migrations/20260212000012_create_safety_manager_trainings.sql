-- 3.12 safety_manager_trainings（安全管理者講習記録）
CREATE TABLE safety_manager_trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  training_type TEXT NOT NULL
    CHECK (training_type IN ('initial', 'periodic')),
  training_date DATE NOT NULL,
  training_institution TEXT NOT NULL,
  certificate_number TEXT,
  next_training_due DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_safety_trainings_org ON safety_manager_trainings(organization_id);
