-- 3.11 aptitude_tests（適性診断記録 — 3年保存）
CREATE TABLE aptitude_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL,
  test_type TEXT NOT NULL
    CHECK (test_type IN ('initial', 'periodic', 'specific', 'senior')),
  test_date DATE NOT NULL,
  testing_institution TEXT NOT NULL,
  result_summary TEXT,
  next_test_due DATE,
  expires_at DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (driver_id, organization_id) REFERENCES drivers(id, organization_id)
);

CREATE INDEX idx_aptitude_tests_org ON aptitude_tests(organization_id);
CREATE INDEX idx_aptitude_tests_driver ON aptitude_tests(driver_id);
CREATE INDEX idx_aptitude_tests_expires ON aptitude_tests(expires_at);
CREATE INDEX idx_aptitude_tests_due ON aptitude_tests(next_test_due) WHERE next_test_due IS NOT NULL;
