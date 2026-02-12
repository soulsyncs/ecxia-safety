-- 3.14 line_broadcast_targets（配信対象ドライバー）
CREATE TABLE line_broadcast_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID NOT NULL REFERENCES line_broadcasts(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed')),
  error_code TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_broadcast_targets_broadcast ON line_broadcast_targets(broadcast_id);
CREATE INDEX idx_broadcast_targets_driver ON line_broadcast_targets(driver_id);
