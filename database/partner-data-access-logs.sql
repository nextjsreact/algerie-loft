-- =====================================================
-- Partner Data Access Audit Logging System
-- =====================================================
-- This migration creates the infrastructure for logging
-- all partner data access attempts for security auditing
-- =====================================================

-- Create partner_data_access_logs table
CREATE TABLE IF NOT EXISTS partner_data_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('property', 'reservation', 'revenue', 'analytics', 'profile')),
  resource_id UUID,
  action TEXT NOT NULL CHECK (action IN ('read', 'write', 'delete')),
  success BOOLEAN NOT NULL DEFAULT false,
  ip_address INET,
  user_agent TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_partner_data_access_logs_partner_id 
  ON partner_data_access_logs(partner_id);

CREATE INDEX IF NOT EXISTS idx_partner_data_access_logs_created_at 
  ON partner_data_access_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_partner_data_access_logs_resource_type 
  ON partner_data_access_logs(resource_type);

CREATE INDEX IF NOT EXISTS idx_partner_data_access_logs_success 
  ON partner_data_access_logs(success) 
  WHERE success = false;

CREATE INDEX IF NOT EXISTS idx_partner_data_access_logs_composite 
  ON partner_data_access_logs(partner_id, created_at DESC, resource_type);

-- Enable RLS on the audit logs table
ALTER TABLE partner_data_access_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can insert logs (application-level logging)
CREATE POLICY "partner_data_access_logs_service_insert" 
  ON partner_data_access_logs
  FOR INSERT 
  WITH CHECK (true);

-- Partners can view their own access logs (for transparency)
CREATE POLICY "partner_data_access_logs_partner_select" 
  ON partner_data_access_logs
  FOR SELECT 
  USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

-- Admins can view all access logs
CREATE POLICY "partner_data_access_logs_admin_select" 
  ON partner_data_access_logs
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Create function to automatically clean old logs (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_partner_access_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete logs older than 90 days
  DELETE FROM partner_data_access_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  RAISE NOTICE 'Cleaned up partner access logs older than 90 days';
END;
$$;

-- Create function to get access log statistics for a partner
CREATE OR REPLACE FUNCTION get_partner_access_stats(
  p_partner_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_accesses BIGINT,
  successful_accesses BIGINT,
  failed_accesses BIGINT,
  property_accesses BIGINT,
  reservation_accesses BIGINT,
  revenue_accesses BIGINT,
  most_accessed_resource_type TEXT,
  last_access_time TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_accesses,
    COUNT(*) FILTER (WHERE success = true)::BIGINT as successful_accesses,
    COUNT(*) FILTER (WHERE success = false)::BIGINT as failed_accesses,
    COUNT(*) FILTER (WHERE resource_type = 'property')::BIGINT as property_accesses,
    COUNT(*) FILTER (WHERE resource_type = 'reservation')::BIGINT as reservation_accesses,
    COUNT(*) FILTER (WHERE resource_type = 'revenue')::BIGINT as revenue_accesses,
    (
      SELECT resource_type 
      FROM partner_data_access_logs 
      WHERE partner_id = p_partner_id 
        AND created_at >= NOW() - (p_days || ' days')::INTERVAL
      GROUP BY resource_type 
      ORDER BY COUNT(*) DESC 
      LIMIT 1
    ) as most_accessed_resource_type,
    MAX(created_at) as last_access_time
  FROM partner_data_access_logs
  WHERE partner_id = p_partner_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;
END;
$$;

-- Create function to detect suspicious access patterns
CREATE OR REPLACE FUNCTION detect_suspicious_partner_access(
  p_partner_id UUID,
  p_minutes INTEGER DEFAULT 5
)
RETURNS TABLE (
  is_suspicious BOOLEAN,
  failed_attempts INTEGER,
  different_resources INTEGER,
  reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_failed_count INTEGER;
  v_resource_count INTEGER;
  v_is_suspicious BOOLEAN := false;
  v_reason TEXT := '';
BEGIN
  -- Count failed access attempts in the last N minutes
  SELECT COUNT(*) INTO v_failed_count
  FROM partner_data_access_logs
  WHERE partner_id = p_partner_id
    AND success = false
    AND created_at >= NOW() - (p_minutes || ' minutes')::INTERVAL;
  
  -- Count distinct resources accessed in the last N minutes
  SELECT COUNT(DISTINCT resource_id) INTO v_resource_count
  FROM partner_data_access_logs
  WHERE partner_id = p_partner_id
    AND created_at >= NOW() - (p_minutes || ' minutes')::INTERVAL
    AND resource_id IS NOT NULL;
  
  -- Detect suspicious patterns
  IF v_failed_count >= 10 THEN
    v_is_suspicious := true;
    v_reason := 'High number of failed access attempts';
  ELSIF v_resource_count >= 50 THEN
    v_is_suspicious := true;
    v_reason := 'Unusual number of different resources accessed';
  END IF;
  
  RETURN QUERY SELECT v_is_suspicious, v_failed_count, v_resource_count, v_reason;
END;
$$;

-- Grant necessary permissions
GRANT SELECT ON partner_data_access_logs TO authenticated;
GRANT INSERT ON partner_data_access_logs TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_partner_access_logs() TO service_role;
GRANT EXECUTE ON FUNCTION get_partner_access_stats(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION detect_suspicious_partner_access(UUID, INTEGER) TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE partner_data_access_logs IS 'Audit log for all partner data access attempts, used for security monitoring and compliance';
COMMENT ON FUNCTION cleanup_old_partner_access_logs() IS 'Automatically removes access logs older than 90 days to comply with data retention policies';
COMMENT ON FUNCTION get_partner_access_stats(UUID, INTEGER) IS 'Returns access statistics for a partner over a specified time period';
COMMENT ON FUNCTION detect_suspicious_partner_access(UUID, INTEGER) IS 'Detects suspicious access patterns that may indicate security issues';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Partner data access audit logging system created successfully!';
  RAISE NOTICE '📊 Table: partner_data_access_logs';
  RAISE NOTICE '🔍 Functions: cleanup_old_partner_access_logs, get_partner_access_stats, detect_suspicious_partner_access';
  RAISE NOTICE '🔒 RLS policies enabled for data isolation';
END $$;
