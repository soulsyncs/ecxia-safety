-- 3.13 line_broadcasts（LINE一斉配信記録）
CREATE TABLE line_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sent_by UUID NOT NULL REFERENCES admin_users(id),
  message_type TEXT NOT NULL DEFAULT 'text'
    CHECK (message_type IN ('text', 'image', 'template')),
  content TEXT NOT NULL,
  target_type TEXT NOT NULL DEFAULT 'all'
    CHECK (target_type IN ('all', 'selected')),
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_line_broadcasts_org ON line_broadcasts(organization_id);
