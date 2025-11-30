-- Create security_alerts table for superuser security monitoring
-- Note: audit_logs already exists in the audit schema, no need to recreate it

CREATE TABLE IF NOT EXISTS public.security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('failed_login', 'suspicious_activity', 'unauthorized_access', 'data_breach', 'system_error', 'SUSPICIOUS_ACTIVITY')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'investigating', 'resolved', 'dismissed')),
  resolved BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  description TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for security_alerts
CREATE INDEX IF NOT EXISTS idx_security_alerts_timestamp ON public.security_alerts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_alerts_alert_type ON public.security_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON public.security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_status ON public.security_alerts(status);
CREATE INDEX IF NOT EXISTS idx_security_alerts_resolved ON public.security_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_security_alerts_user_id ON public.security_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_created_at ON public.security_alerts(created_at DESC);

-- Enable RLS
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

-- Policy: Superusers can view all security alerts
CREATE POLICY "Superusers can view security alerts"
  ON public.security_alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superuser'
    )
  );

-- Policy: Superusers can insert security alerts
CREATE POLICY "Superusers can insert security alerts"
  ON public.security_alerts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superuser'
    )
  );

-- Policy: Superusers can update security alerts
CREATE POLICY "Superusers can update security alerts"
  ON public.security_alerts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superuser'
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_security_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on security_alerts
DROP TRIGGER IF EXISTS trigger_update_security_alerts_updated_at ON public.security_alerts;
CREATE TRIGGER trigger_update_security_alerts_updated_at
  BEFORE UPDATE ON public.security_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_security_alerts_updated_at();

-- Insert some sample security alerts for testing
INSERT INTO public.security_alerts (alert_type, severity, status, description, details, resolved)
VALUES 
  (
    'failed_login',
    'medium',
    'active',
    'Multiple failed login attempts detected',
    '{"attempts": 5, "ip": "192.168.1.100", "timeframe": "5 minutes"}'::jsonb,
    false
  ),
  (
    'suspicious_activity',
    'high',
    'investigating',
    'Unusual access pattern detected',
    '{"pattern": "rapid_api_calls", "endpoint": "/api/users", "count": 100}'::jsonb,
    false
  ),
  (
    'unauthorized_access',
    'critical',
    'resolved',
    'Attempted access to restricted area',
    '{"area": "admin_panel", "user": "unknown", "blocked": true}'::jsonb,
    true
  )
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.security_alerts TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Security alerts table created successfully!';
  RAISE NOTICE 'Note: audit_logs already exists in the audit schema';
  RAISE NOTICE 'Run this migration in your Supabase SQL Editor';
END $$;
