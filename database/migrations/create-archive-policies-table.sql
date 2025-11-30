-- Create archive_policies table
CREATE TABLE IF NOT EXISTS archive_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT true,
  retention_days INTEGER NOT NULL CHECK (retention_days > 0),
  frequency TEXT NOT NULL CHECK (frequency IN ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'BIANNUAL', 'ANNUAL')),
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  archived_count INTEGER DEFAULT 0,
  archived_size_mb NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_archive_policies_enabled ON archive_policies(enabled);
CREATE INDEX IF NOT EXISTS idx_archive_policies_next_run ON archive_policies(next_run) WHERE enabled = true;

-- Create archive tables for each main table
-- These will store the archived data

-- Audit logs archive
CREATE TABLE IF NOT EXISTS audit_logs_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_id UUID NOT NULL,
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_archive_user_id ON audit_logs_archive(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_archive_archived_at ON audit_logs_archive(archived_at);

-- Visitor tracking archive
CREATE TABLE IF NOT EXISTS visitor_tracking_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_id UUID NOT NULL,
  visitor_id UUID,
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  visited_at TIMESTAMPTZ,
  session_duration INTEGER,
  archived_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visitor_tracking_archive_visitor_id ON visitor_tracking_archive(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_tracking_archive_archived_at ON visitor_tracking_archive(archived_at);

-- Notifications archive
CREATE TABLE IF NOT EXISTS notifications_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_id UUID NOT NULL,
  user_id UUID,
  type TEXT,
  title TEXT,
  message TEXT,
  read BOOLEAN,
  created_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_archive_user_id ON notifications_archive(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_archive_archived_at ON notifications_archive(archived_at);

-- Sessions archive
CREATE TABLE IF NOT EXISTS sessions_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_id UUID NOT NULL,
  user_id UUID,
  token TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_archive_user_id ON sessions_archive(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_archive_archived_at ON sessions_archive(archived_at);

-- Reservations archive
CREATE TABLE IF NOT EXISTS reservations_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_id UUID NOT NULL,
  user_id UUID,
  loft_id UUID,
  check_in DATE,
  check_out DATE,
  guests INTEGER,
  total_price NUMERIC(10, 2),
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reservations_archive_user_id ON reservations_archive(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_archive_archived_at ON reservations_archive(archived_at);

-- Transactions archive
CREATE TABLE IF NOT EXISTS transactions_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_id UUID NOT NULL,
  user_id UUID,
  reservation_id UUID,
  amount NUMERIC(10, 2),
  currency TEXT,
  status TEXT,
  payment_method TEXT,
  created_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_archive_user_id ON transactions_archive(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_archive_archived_at ON transactions_archive(archived_at);

-- Messages archive
CREATE TABLE IF NOT EXISTS messages_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_id UUID NOT NULL,
  conversation_id UUID,
  sender_id UUID,
  receiver_id UUID,
  content TEXT,
  read BOOLEAN,
  created_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_archive_conversation_id ON messages_archive(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_archive_archived_at ON messages_archive(archived_at);

-- Activity logs archive
CREATE TABLE IF NOT EXISTS activity_logs_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_id UUID NOT NULL,
  user_id UUID,
  activity_type TEXT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_archive_user_id ON activity_logs_archive(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_archive_archived_at ON activity_logs_archive(archived_at);

-- Enable RLS on archive_policies
ALTER TABLE archive_policies ENABLE ROW LEVEL SECURITY;

-- Policy: Only superusers can access archive policies
CREATE POLICY "Superusers can manage archive policies"
  ON archive_policies
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superuser'
    )
  );

-- Enable RLS on all archive tables
ALTER TABLE audit_logs_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_tracking_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs_archive ENABLE ROW LEVEL SECURITY;

-- Policy: Only superusers can access archived data
CREATE POLICY "Superusers can access audit_logs_archive"
  ON audit_logs_archive FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superuser'
    )
  );

CREATE POLICY "Superusers can access visitor_tracking_archive"
  ON visitor_tracking_archive FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superuser'
    )
  );

CREATE POLICY "Superusers can access notifications_archive"
  ON notifications_archive FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superuser'
    )
  );

CREATE POLICY "Superusers can access sessions_archive"
  ON sessions_archive FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superuser'
    )
  );

CREATE POLICY "Superusers can access reservations_archive"
  ON reservations_archive FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superuser'
    )
  );

CREATE POLICY "Superusers can access transactions_archive"
  ON transactions_archive FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superuser'
    )
  );

CREATE POLICY "Superusers can access messages_archive"
  ON messages_archive FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superuser'
    )
  );

CREATE POLICY "Superusers can access activity_logs_archive"
  ON activity_logs_archive FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superuser'
    )
  );

-- Function to automatically run archiving based on schedule
CREATE OR REPLACE FUNCTION run_scheduled_archiving()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function would be called by a cron job or scheduled task
  -- It checks for policies that are due to run and executes them
  
  -- Note: The actual archiving logic is handled by the API
  -- This is just a placeholder for future automation
  
  RAISE NOTICE 'Scheduled archiving check completed';
END;
$$;

-- Grant necessary permissions
GRANT ALL ON archive_policies TO authenticated;
GRANT ALL ON audit_logs_archive TO authenticated;
GRANT ALL ON visitor_tracking_archive TO authenticated;
GRANT ALL ON notifications_archive TO authenticated;
GRANT ALL ON sessions_archive TO authenticated;
GRANT ALL ON reservations_archive TO authenticated;
GRANT ALL ON transactions_archive TO authenticated;
GRANT ALL ON messages_archive TO authenticated;
GRANT ALL ON activity_logs_archive TO authenticated;

COMMENT ON TABLE archive_policies IS 'Configuration for automatic data archiving policies';
COMMENT ON TABLE audit_logs_archive IS 'Archived audit logs older than retention period';
COMMENT ON TABLE visitor_tracking_archive IS 'Archived visitor tracking data';
COMMENT ON TABLE notifications_archive IS 'Archived read notifications';
COMMENT ON TABLE sessions_archive IS 'Archived expired sessions';
COMMENT ON TABLE reservations_archive IS 'Archived completed/cancelled reservations';
COMMENT ON TABLE transactions_archive IS 'Archived transaction records';
COMMENT ON TABLE messages_archive IS 'Archived messages';
COMMENT ON TABLE activity_logs_archive IS 'Archived activity logs';
