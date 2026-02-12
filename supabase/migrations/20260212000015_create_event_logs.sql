-- 3.15 event_logs（監査ログ）
CREATE TABLE event_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_type TEXT NOT NULL
    CHECK (actor_type IN ('admin', 'driver', 'system')),
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_event_logs_org ON event_logs(organization_id);
CREATE INDEX idx_event_logs_created ON event_logs(created_at);
CREATE INDEX idx_event_logs_actor ON event_logs(actor_type, actor_id);
