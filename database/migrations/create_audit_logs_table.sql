-- Create audit_logs table for superuser activity tracking
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  superuser_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_details JSONB,
  target_resource TEXT,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_superuser_id ON audit_logs(superuser_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user_id ON audit_logs(target_user_id);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only superusers can view audit logs
CREATE POLICY "Superusers can view all audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'superuser'
    )
  );

-- Policy: Only superusers can insert audit logs
CREATE POLICY "Superusers can insert audit logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'superuser'
    )
  );

-- Function to cleanup old audit logs
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_logs
  WHERE timestamp < NOW() - (retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all audit logs (for RPC)
CREATE OR REPLACE FUNCTION get_all_audit_logs(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  timestamp TIMESTAMPTZ,
  superuser_id UUID,
  action_type TEXT,
  action_details JSONB,
  target_resource TEXT,
  target_user_id UUID,
  severity TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    al.timestamp,
    al.superuser_id,
    al.action_type,
    al.action_details,
    al.target_resource,
    al.target_user_id,
    al.severity,
    al.ip_address,
    al.user_agent,
    al.created_at
  FROM audit_logs al
  ORDER BY al.timestamp DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT ON audit_logs TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_audit_logs TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_audit_logs TO authenticated;

-- Insert initial audit log
INSERT INTO audit_logs (
  superuser_id,
  action_type,
  action_details,
  target_resource,
  severity
) VALUES (
  (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'superuser' LIMIT 1),
  'SYSTEM',
  '{"action": "audit_system_initialized", "message": "Audit logging system initialized"}'::JSONB,
  'audit_logs',
  'LOW'
) ON CONFLICT DO NOTHING;

COMMENT ON TABLE audit_logs IS 'Audit trail for superuser activities';
COMMENT ON COLUMN audit_logs.action_type IS 'Type of action: SYSTEM, SECURITY, USER_MANAGEMENT, DATA_MANAGEMENT, etc.';
COMMENT ON COLUMN audit_logs.severity IS 'Severity level: LOW, MEDIUM, HIGH, CRITICAL';
