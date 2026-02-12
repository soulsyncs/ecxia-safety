-- 3.1 organizations（組織）
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  postal_code TEXT,
  address TEXT,
  phone TEXT,
  safety_manager_name TEXT,
  safety_manager_birthdate DATE,
  safety_manager_appointed_at DATE,
  safety_manager_training_completed_at DATE,
  line_channel_id TEXT,
  line_channel_secret TEXT,
  line_channel_access_token TEXT,
  liff_id TEXT,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
