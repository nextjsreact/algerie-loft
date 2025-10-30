-- Security-related database tables for rate limiting, blocking, and audit logging
-- This schema supports the security middleware functionality

-- Rate limiting table to track API usage per identifier
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE, -- Composite key: endpoint:identifier
    identifier VARCHAR(255) NOT NULL, -- IP address, user ID, or API key
    endpoint VARCHAR(100) NOT NULL, -- API endpoint name
    hits INTEGER NOT NULL DEFAULT 1, -- Number of requests in current window
    window_start BIGINT NOT NULL, -- Window start timestamp (milliseconds)
    reset_time BIGINT NOT NULL, -- When the window resets (milliseconds)
    max_requests INTEGER NOT NULL, -- Maximum requests allowed in window
    window_ms INTEGER NOT NULL, -- Window duration in milliseconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for rate limiting performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_endpoint ON rate_limits(endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON rate_limits(window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_time ON rate_limits(reset_time);

-- Blocked identifiers table for temporary or permanent blocks
CREATE TABLE IF NOT EXISTS blocked_identifiers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL, -- IP address, user ID, or other identifier
    reason TEXT NOT NULL, -- Reason for blocking
    blocked_by VARCHAR(255), -- Who/what blocked this identifier
    expires_at TIMESTAMP WITH TIME ZONE, -- NULL for permanent blocks
    is_permanent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for blocked identifiers
CREATE INDEX IF NOT EXISTS idx_blocked_identifiers_identifier ON blocked_identifiers(identifier);
CREATE INDEX IF NOT EXISTS idx_blocked_identifiers_expires_at ON blocked_identifiers(expires_at);
CREATE INDEX IF NOT EXISTS idx_blocked_identifiers_active ON blocked_identifiers(identifier, expires_at) 
    WHERE expires_at IS NULL OR expires_at > NOW();

-- API keys table for external integrations
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL, -- Descriptive name for the API key
    key_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 hash of the actual key
    permissions JSONB DEFAULT '[]'::jsonb, -- Array of permissions
    rate_limits JSONB DEFAULT '{}'::jsonb, -- Custom rate limits for this key
    expires_at TIMESTAMP WITH TIME ZONE, -- NULL for no expiration
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for API keys
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_created_by ON api_keys(created_by);

-- Security events table for logging security-related events
CREATE TABLE IF NOT EXISTS security_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL, -- 'rate_limit_exceeded', 'suspicious_activity', 'csrf_violation', etc.
    severity VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    identifier VARCHAR(255) NOT NULL, -- IP, user ID, etc.
    user_id UUID REFERENCES auth.users(id), -- If associated with a user
    endpoint VARCHAR(255), -- API endpoint involved
    method VARCHAR(10), -- HTTP method
    user_agent TEXT,
    request_id VARCHAR(100),
    details JSONB DEFAULT '{}'::jsonb, -- Additional event details
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for security events
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_identifier ON security_events(identifier);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_unresolved ON security_events(resolved, severity) WHERE NOT resolved;

-- CSRF tokens table for tracking valid tokens
CREATE TABLE IF NOT EXISTS csrf_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 hash of the token
    session_id VARCHAR(255), -- Associated session ID
    user_id UUID REFERENCES auth.users(id), -- Associated user (if any)
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for CSRF tokens
CREATE INDEX IF NOT EXISTS idx_csrf_tokens_hash ON csrf_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_csrf_tokens_session ON csrf_tokens(session_id);
CREATE INDEX IF NOT EXISTS idx_csrf_tokens_expires ON csrf_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_csrf_tokens_active ON csrf_tokens(token_hash, expires_at, used) 
    WHERE NOT used AND expires_at > NOW();

-- Input validation violations table
CREATE TABLE IF NOT EXISTS validation_violations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    violation_type VARCHAR(50) NOT NULL, -- 'sql_injection', 'xss', 'path_traversal', etc.
    identifier VARCHAR(255) NOT NULL, -- IP, user ID, etc.
    user_id UUID REFERENCES auth.users(id),
    endpoint VARCHAR(255),
    method VARCHAR(10),
    input_field VARCHAR(100), -- Which field contained the violation
    violation_content TEXT, -- The actual violating content (sanitized for logging)
    user_agent TEXT,
    request_id VARCHAR(100),
    blocked BOOLEAN DEFAULT FALSE, -- Whether the request was blocked
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for validation violations
CREATE INDEX IF NOT EXISTS idx_validation_violations_type ON validation_violations(violation_type);
CREATE INDEX IF NOT EXISTS idx_validation_violations_identifier ON validation_violations(identifier);
CREATE INDEX IF NOT EXISTS idx_validation_violations_user_id ON validation_violations(user_id);
CREATE INDEX IF NOT EXISTS idx_validation_violations_created_at ON validation_violations(created_at);

-- Function to clean up expired records
CREATE OR REPLACE FUNCTION cleanup_security_tables()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    temp_count INTEGER;
BEGIN
    -- Clean up expired rate limits (older than 24 hours)
    DELETE FROM rate_limits 
    WHERE window_start < EXTRACT(EPOCH FROM NOW() - INTERVAL '24 hours') * 1000;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Clean up expired blocked identifiers
    DELETE FROM blocked_identifiers 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Clean up expired CSRF tokens
    DELETE FROM csrf_tokens 
    WHERE expires_at < NOW();
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Clean up old security events (older than 90 days)
    DELETE FROM security_events 
    WHERE created_at < NOW() - INTERVAL '90 days';
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Clean up old validation violations (older than 30 days)
    DELETE FROM validation_violations 
    WHERE created_at < NOW() - INTERVAL '30 days';
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get security statistics
CREATE OR REPLACE FUNCTION get_security_stats(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '24 hours',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE(
    metric VARCHAR,
    count BIGINT,
    details JSONB
) AS $$
BEGIN
    -- Rate limit violations
    RETURN QUERY
    SELECT 
        'rate_limit_violations'::VARCHAR,
        COUNT(*)::BIGINT,
        jsonb_build_object(
            'top_endpoints', 
            jsonb_agg(jsonb_build_object('endpoint', endpoint, 'count', cnt))
        )
    FROM (
        SELECT endpoint, COUNT(*) as cnt
        FROM rate_limits 
        WHERE created_at BETWEEN start_date AND end_date
        AND hits > max_requests
        GROUP BY endpoint
        ORDER BY cnt DESC
        LIMIT 10
    ) t;
    
    -- Security events by type
    RETURN QUERY
    SELECT 
        'security_events_by_type'::VARCHAR,
        COUNT(*)::BIGINT,
        jsonb_object_agg(event_type, cnt)
    FROM (
        SELECT event_type, COUNT(*) as cnt
        FROM security_events 
        WHERE created_at BETWEEN start_date AND end_date
        GROUP BY event_type
    ) t;
    
    -- Validation violations by type
    RETURN QUERY
    SELECT 
        'validation_violations_by_type'::VARCHAR,
        COUNT(*)::BIGINT,
        jsonb_object_agg(violation_type, cnt)
    FROM (
        SELECT violation_type, COUNT(*) as cnt
        FROM validation_violations 
        WHERE created_at BETWEEN start_date AND end_date
        GROUP BY violation_type
    ) t;
    
    -- Top blocked identifiers
    RETURN QUERY
    SELECT 
        'top_blocked_identifiers'::VARCHAR,
        COUNT(*)::BIGINT,
        jsonb_agg(jsonb_build_object('identifier', identifier, 'reason', reason))
    FROM (
        SELECT identifier, reason
        FROM blocked_identifiers 
        WHERE created_at BETWEEN start_date AND end_date
        ORDER BY created_at DESC
        LIMIT 10
    ) t;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) policies
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_identifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE csrf_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_violations ENABLE ROW LEVEL SECURITY;

-- Policies for rate_limits (system access only)
CREATE POLICY "System can manage rate limits" ON rate_limits
    FOR ALL USING (true);

-- Policies for blocked_identifiers (admin access only)
CREATE POLICY "Admins can manage blocked identifiers" ON blocked_identifiers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Policies for api_keys (creator and admin access)
CREATE POLICY "Users can view their own API keys" ON api_keys
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Admins can manage all API keys" ON api_keys
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Policies for security_events (admin and manager access)
CREATE POLICY "Admins and managers can view security events" ON security_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'manager')
        )
    );

-- Policies for csrf_tokens (system access only)
CREATE POLICY "System can manage CSRF tokens" ON csrf_tokens
    FOR ALL USING (true);

-- Policies for validation_violations (admin access only)
CREATE POLICY "Admins can view validation violations" ON validation_violations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Create a scheduled job to clean up expired records (if pg_cron is available)
-- This would typically be set up separately in production
-- SELECT cron.schedule('cleanup-security-tables', '0 2 * * *', 'SELECT cleanup_security_tables();');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Comments for documentation
COMMENT ON TABLE rate_limits IS 'Tracks API rate limiting per identifier and endpoint';
COMMENT ON TABLE blocked_identifiers IS 'Stores temporarily or permanently blocked IP addresses and user IDs';
COMMENT ON TABLE api_keys IS 'Manages API keys for external integrations with permissions and rate limits';
COMMENT ON TABLE security_events IS 'Logs security-related events for monitoring and analysis';
COMMENT ON TABLE csrf_tokens IS 'Tracks valid CSRF tokens for form protection';
COMMENT ON TABLE validation_violations IS 'Records input validation violations for security monitoring';

COMMENT ON FUNCTION cleanup_security_tables() IS 'Cleans up expired security records to maintain performance';
COMMENT ON FUNCTION get_security_stats(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) IS 'Provides security statistics for monitoring dashboards';