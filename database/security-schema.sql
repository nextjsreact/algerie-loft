-- Security and compliance database schema
-- This file contains all security-related tables for the multi-role booking system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Secure file metadata table
CREATE TABLE IF NOT EXISTS secure_file_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  encryption_key TEXT NOT NULL, -- Encrypted encryption key
  access_level TEXT NOT NULL CHECK (access_level IN ('private', 'partner', 'admin')),
  document_type TEXT NOT NULL CHECK (document_type IN ('identity', 'business_license', 'tax_document', 'bank_statement', 'other')),
  related_entity_id UUID,
  related_entity_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File access tokens for temporary URL generation
CREATE TABLE IF NOT EXISTS file_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  file_id UUID REFERENCES secure_file_metadata(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  hits INTEGER NOT NULL DEFAULT 0,
  window_start BIGINT NOT NULL,
  reset_time BIGINT NOT NULL,
  max_requests INTEGER NOT NULL,
  window_ms INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blocked identifiers table
CREATE TABLE IF NOT EXISTS blocked_identifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  reason TEXT NOT NULL,
  blocked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API keys table for external integrations
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key_hash TEXT UNIQUE NOT NULL,
  permissions TEXT[] DEFAULT '{}',
  rate_limits JSONB DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GDPR data requests table
CREATE TABLE IF NOT EXISTS gdpr_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('export', 'delete', 'rectification', 'portability')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  requested_data TEXT[], -- Array of data types requested
  reason TEXT,
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  export_file_id UUID REFERENCES secure_file_metadata(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User consent management
CREATE TABLE IF NOT EXISTS user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL, -- 'marketing', 'analytics', 'data_processing', etc.
  consent_given BOOLEAN NOT NULL,
  consent_version TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  withdrawn_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, consent_type, consent_version)
);

-- Fraud detection events
CREATE TABLE IF NOT EXISTS fraud_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- 'suspicious_login', 'payment_fraud', 'booking_fraud', etc.
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  details JSONB NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'false_positive', 'confirmed')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  actions_taken TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security audit events (extends existing audit_logs)
CREATE TABLE IF NOT EXISTS security_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- 'login_attempt', 'permission_denied', 'data_access', etc.
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  resource_accessed TEXT,
  additional_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance reports
CREATE TABLE IF NOT EXISTS compliance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL, -- 'gdpr', 'audit', 'security', 'financial'
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  report_data JSONB NOT NULL,
  file_id UUID REFERENCES secure_file_metadata(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'generated' CHECK (status IN ('generated', 'reviewed', 'submitted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_secure_file_metadata_uploaded_by ON secure_file_metadata(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_secure_file_metadata_document_type ON secure_file_metadata(document_type);
CREATE INDEX IF NOT EXISTS idx_secure_file_metadata_related_entity ON secure_file_metadata(related_entity_id, related_entity_type);

CREATE INDEX IF NOT EXISTS idx_file_access_tokens_token ON file_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_file_access_tokens_expires_at ON file_access_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON rate_limits(window_start);

CREATE INDEX IF NOT EXISTS idx_blocked_identifiers_identifier ON blocked_identifiers(identifier);
CREATE INDEX IF NOT EXISTS idx_blocked_identifiers_expires_at ON blocked_identifiers(expires_at);

CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);

CREATE INDEX IF NOT EXISTS idx_gdpr_requests_user_id ON gdpr_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_status ON gdpr_requests(status);

CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_consent_type ON user_consents(consent_type);

CREATE INDEX IF NOT EXISTS idx_fraud_events_user_id ON fraud_events(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_events_risk_score ON fraud_events(risk_score);
CREATE INDEX IF NOT EXISTS idx_fraud_events_status ON fraud_events(status);

CREATE INDEX IF NOT EXISTS idx_security_audit_events_user_id ON security_audit_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_events_event_type ON security_audit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_events_created_at ON security_audit_events(created_at);

CREATE INDEX IF NOT EXISTS idx_compliance_reports_report_type ON compliance_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_period ON compliance_reports(period_start, period_end);

-- Row Level Security (RLS) policies

-- Secure file metadata RLS
ALTER TABLE secure_file_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own files" ON secure_file_metadata
  FOR SELECT USING (uploaded_by = auth.uid());

CREATE POLICY "Partners can view partner-level files" ON secure_file_metadata
  FOR SELECT USING (
    access_level = 'partner' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('partner', 'admin', 'manager')
    )
  );

CREATE POLICY "Admins can view all files" ON secure_file_metadata
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can upload files" ON secure_file_metadata
  FOR INSERT WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update their own files" ON secure_file_metadata
  FOR UPDATE USING (uploaded_by = auth.uid());

CREATE POLICY "Admins can delete files" ON secure_file_metadata
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- File access tokens RLS
ALTER TABLE file_access_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own access tokens" ON file_access_tokens
  FOR SELECT USING (user_id = auth.uid());

-- GDPR requests RLS
ALTER TABLE gdpr_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own GDPR requests" ON gdpr_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create GDPR requests" ON gdpr_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all GDPR requests" ON gdpr_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- User consents RLS
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own consents" ON user_consents
  FOR ALL USING (user_id = auth.uid());

-- Fraud events RLS (admin only)
ALTER TABLE fraud_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view fraud events" ON fraud_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Security audit events RLS (admin only)
ALTER TABLE security_audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view security audit events" ON security_audit_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Compliance reports RLS (admin only)
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage compliance reports" ON compliance_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Functions for automatic cleanup

-- Function to clean up expired file access tokens
CREATE OR REPLACE FUNCTION cleanup_expired_file_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM file_access_tokens 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired blocked identifiers
CREATE OR REPLACE FUNCTION cleanup_expired_blocks()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM blocked_identifiers 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old rate limit records
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM rate_limits 
  WHERE window_start < EXTRACT(EPOCH FROM NOW() - INTERVAL '24 hours') * 1000;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for automatic updates

-- Update timestamp trigger for secure_file_metadata
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_secure_file_metadata_updated_at
  BEFORE UPDATE ON secure_file_metadata
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_limits_updated_at
  BEFORE UPDATE ON rate_limits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gdpr_requests_updated_at
  BEFORE UPDATE ON gdpr_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_consents_updated_at
  BEFORE UPDATE ON user_consents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Comments for documentation
COMMENT ON TABLE secure_file_metadata IS 'Metadata for encrypted files stored securely';
COMMENT ON TABLE file_access_tokens IS 'Temporary tokens for secure file access';
COMMENT ON TABLE rate_limits IS 'Rate limiting data for API endpoints';
COMMENT ON TABLE blocked_identifiers IS 'Temporarily blocked IP addresses or user identifiers';
COMMENT ON TABLE api_keys IS 'API keys for external integrations';
COMMENT ON TABLE gdpr_requests IS 'GDPR data requests from users';
COMMENT ON TABLE user_consents IS 'User consent tracking for data processing';
COMMENT ON TABLE fraud_events IS 'Fraud detection events and alerts';
COMMENT ON TABLE security_audit_events IS 'Security-specific audit events';
COMMENT ON TABLE compliance_reports IS 'Generated compliance reports';