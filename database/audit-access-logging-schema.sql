-- Audit Access Logging Schema
-- This file contains the schema for logging audit access attempts for security monitoring

-- =====================================================
-- 1. CREATE AUDIT ACCESS LOGS TABLE
-- =====================================================

-- Create table to track who accesses audit logs and when
CREATE TABLE IF NOT EXISTS audit.audit_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    user_email VARCHAR(255),
    user_role VARCHAR(50),
    access_type VARCHAR(50) NOT NULL, -- 'view_logs', 'export_logs', 'view_entity_history', 'admin_dashboard'
    table_name VARCHAR(50), -- Table being audited (if applicable)
    record_id UUID, -- Specific record being audited (if applicable)
    access_granted BOOLEAN NOT NULL DEFAULT false,
    access_reason TEXT, -- Reason for access decision
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    request_path TEXT, -- API endpoint or page accessed
    query_parameters JSONB, -- Query parameters used
    response_size INTEGER, -- Number of records returned
    access_duration_ms INTEGER, -- Time taken to process request
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Primary indexes for common query patterns
CREATE INDEX idx_audit_access_logs_user_id ON audit.audit_access_logs(user_id);
CREATE INDEX idx_audit_access_logs_timestamp ON audit.audit_access_logs(timestamp DESC);
CREATE INDEX idx_audit_access_logs_access_type ON audit.audit_access_logs(access_type);
CREATE INDEX idx_audit_access_logs_access_granted ON audit.audit_access_logs(access_granted);
CREATE INDEX idx_audit_access_logs_table_record ON audit.audit_access_logs(table_name, record_id);

-- Composite indexes for security monitoring
CREATE INDEX idx_audit_access_logs_user_timestamp ON audit.audit_access_logs(user_id, timestamp DESC);
CREATE INDEX idx_audit_access_logs_denied_access ON audit.audit_access_logs(access_granted, timestamp DESC) WHERE access_granted = false;
CREATE INDEX idx_audit_access_logs_suspicious ON audit.audit_access_logs(user_id, access_granted, timestamp DESC) WHERE access_granted = false;

-- GIN index for query parameters
CREATE INDEX idx_audit_access_logs_query_params_gin ON audit.audit_access_logs USING GIN (query_parameters);

-- =====================================================
-- 3. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on audit access logs table
ALTER TABLE audit.audit_access_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view audit access logs
CREATE POLICY "Only admins can view audit access logs" ON audit.audit_access_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Policy: System can insert audit access logs
CREATE POLICY "System can insert audit access logs" ON audit.audit_access_logs
    FOR INSERT
    WITH CHECK (true);

-- Policy: Prevent updates and deletes (access logs are immutable)
CREATE POLICY "Audit access logs are immutable" ON audit.audit_access_logs
    FOR UPDATE
    USING (false);

CREATE POLICY "Audit access logs cannot be deleted" ON audit.audit_access_logs
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
        AND created_at < NOW() - INTERVAL '7 years' -- Only allow deletion of very old logs
    );

-- =====================================================
-- 4. AUDIT ACCESS LOGGING FUNCTIONS
-- =====================================================

-- Function to log audit access attempts
CREATE OR REPLACE FUNCTION audit.log_audit_access(
    p_user_id UUID,
    p_user_email VARCHAR(255),
    p_user_role VARCHAR(50),
    p_access_type VARCHAR(50),
    p_table_name VARCHAR(50) DEFAULT NULL,
    p_record_id UUID DEFAULT NULL,
    p_access_granted BOOLEAN DEFAULT false,
    p_access_reason TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_session_id VARCHAR(255) DEFAULT NULL,
    p_request_path TEXT DEFAULT NULL,
    p_query_parameters JSONB DEFAULT NULL,
    p_response_size INTEGER DEFAULT NULL,
    p_access_duration_ms INTEGER DEFAULT NULL
)
RETURNS UUID AS $
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO audit.audit_access_logs (
        user_id,
        user_email,
        user_role,
        access_type,
        table_name,
        record_id,
        access_granted,
        access_reason,
        ip_address,
        user_agent,
        session_id,
        request_path,
        query_parameters,
        response_size,
        access_duration_ms
    ) VALUES (
        p_user_id,
        p_user_email,
        p_user_role,
        p_access_type,
        p_table_name,
        p_record_id,
        p_access_granted,
        p_access_reason,
        p_ip_address,
        p_user_agent,
        p_session_id,
        p_request_path,
        p_query_parameters,
        p_response_size,
        p_access_duration_ms
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$ LANGUAGE plpgsql;

-- Function to get audit access statistics
CREATE OR REPLACE FUNCTION audit.get_audit_access_statistics(
    p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    access_type VARCHAR(50),
    total_attempts BIGINT,
    granted_attempts BIGINT,
    denied_attempts BIGINT,
    unique_users BIGINT,
    avg_response_size NUMERIC,
    avg_duration_ms NUMERIC
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        aal.access_type,
        COUNT(*) as total_attempts,
        COUNT(*) FILTER (WHERE aal.access_granted = true) as granted_attempts,
        COUNT(*) FILTER (WHERE aal.access_granted = false) as denied_attempts,
        COUNT(DISTINCT aal.user_id) as unique_users,
        AVG(aal.response_size) as avg_response_size,
        AVG(aal.access_duration_ms) as avg_duration_ms
    FROM audit.audit_access_logs aal
    WHERE aal.timestamp >= NOW() - INTERVAL '1 day' * p_days_back
    GROUP BY aal.access_type
    ORDER BY total_attempts DESC;
END;
$ LANGUAGE plpgsql;

-- Function to detect suspicious audit access patterns
CREATE OR REPLACE FUNCTION audit.detect_suspicious_audit_access(
    p_days_back INTEGER DEFAULT 7
)
RETURNS TABLE (
    user_id UUID,
    user_email VARCHAR(255),
    total_attempts BIGINT,
    denied_attempts BIGINT,
    denial_rate NUMERIC,
    unique_tables BIGINT,
    last_attempt TIMESTAMP WITH TIME ZONE,
    risk_score INTEGER
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        aal.user_id,
        aal.user_email,
        COUNT(*) as total_attempts,
        COUNT(*) FILTER (WHERE aal.access_granted = false) as denied_attempts,
        ROUND(
            (COUNT(*) FILTER (WHERE aal.access_granted = false)::NUMERIC / COUNT(*)::NUMERIC) * 100, 
            2
        ) as denial_rate,
        COUNT(DISTINCT aal.table_name) as unique_tables,
        MAX(aal.timestamp) as last_attempt,
        -- Risk score calculation (0-100)
        LEAST(100, 
            (COUNT(*) FILTER (WHERE aal.access_granted = false) * 10) + -- 10 points per denial
            (CASE WHEN COUNT(*) > 100 THEN 20 ELSE 0 END) + -- 20 points for high volume
            (COUNT(DISTINCT aal.table_name) * 5) -- 5 points per unique table accessed
        )::INTEGER as risk_score
    FROM audit.audit_access_logs aal
    WHERE aal.timestamp >= NOW() - INTERVAL '1 day' * p_days_back
    GROUP BY aal.user_id, aal.user_email
    HAVING COUNT(*) FILTER (WHERE aal.access_granted = false) > 0 -- Only users with denials
    ORDER BY risk_score DESC, denied_attempts DESC;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- 5. COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE audit.audit_access_logs IS 'Logs all attempts to access audit information for security monitoring';
COMMENT ON COLUMN audit.audit_access_logs.access_type IS 'Type of audit access: view_logs, export_logs, view_entity_history, admin_dashboard';
COMMENT ON COLUMN audit.audit_access_logs.access_granted IS 'Whether the access attempt was successful';
COMMENT ON COLUMN audit.audit_access_logs.access_reason IS 'Reason for granting or denying access';
COMMENT ON COLUMN audit.audit_access_logs.response_size IS 'Number of audit records returned';
COMMENT ON COLUMN audit.audit_access_logs.access_duration_ms IS 'Time taken to process the audit request';

COMMENT ON FUNCTION audit.log_audit_access IS 'Logs an audit access attempt with all relevant details';
COMMENT ON FUNCTION audit.get_audit_access_statistics IS 'Returns statistics about audit access patterns';
COMMENT ON FUNCTION audit.detect_suspicious_audit_access IS 'Identifies potentially suspicious audit access patterns';

-- Log successful schema creation
DO $$
BEGIN
    RAISE NOTICE 'Audit access logging schema created successfully';
    RAISE NOTICE 'Tables created: audit_access_logs';
    RAISE NOTICE 'Functions created: log_audit_access, get_audit_access_statistics, detect_suspicious_audit_access';
    RAISE NOTICE 'Indexes created: 8 performance and security indexes';
    RAISE NOTICE 'RLS policies created: 4 security policies';
END $$;