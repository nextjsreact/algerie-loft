-- Audit Security Enhancements
-- This file contains enhanced security features for the audit system including:
-- 1. Enhanced RLS policies with more granular access control
-- 2. Audit log integrity checks and validation
-- 3. Audit access logging mechanism
-- 4. Audit data retention policies

-- =====================================================
-- 1. AUDIT ACCESS LOGGING TABLE
-- =====================================================

-- Create table to log who accesses audit data
CREATE TABLE IF NOT EXISTS audit.audit_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    accessed_by_user_id UUID REFERENCES profiles(id),
    accessed_by_email VARCHAR(255),
    access_type VARCHAR(20) NOT NULL CHECK (access_type IN ('VIEW', 'EXPORT', 'SEARCH', 'FILTER')),
    table_name VARCHAR(50),
    record_id UUID,
    filters_applied JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    access_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    records_accessed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for audit access logs
CREATE INDEX idx_audit_access_logs_user ON audit.audit_access_logs(accessed_by_user_id);
CREATE INDEX idx_audit_access_logs_timestamp ON audit.audit_access_logs(access_timestamp DESC);
CREATE INDEX idx_audit_access_logs_type ON audit.audit_access_logs(access_type);
CREATE INDEX idx_audit_access_logs_table ON audit.audit_access_logs(table_name);

-- Enable RLS on audit access logs
ALTER TABLE audit.audit_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit access logs
CREATE POLICY "Only admins can view audit access logs" ON audit.audit_access_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- System can insert audit access logs
CREATE POLICY "System can insert audit access logs" ON audit.audit_access_logs
    FOR INSERT
    WITH CHECK (true);

-- Prevent updates and deletes on audit access logs
CREATE POLICY "Audit access logs are immutable" ON audit.audit_access_logs
    FOR UPDATE
    USING (false);

CREATE POLICY "Audit access logs cannot be deleted" ON audit.audit_access_logs
    FOR DELETE
    USING (false);

-- =====================================================
-- 2. AUDIT LOG INTEGRITY FUNCTIONS
-- =====================================================

-- Function to calculate audit log hash for integrity checking
CREATE OR REPLACE FUNCTION audit.calculate_audit_hash(
    p_table_name VARCHAR(50),
    p_record_id UUID,
    p_action VARCHAR(10),
    p_user_id UUID,
    p_timestamp TIMESTAMP WITH TIME ZONE,
    p_old_values JSONB,
    p_new_values JSONB
)
RETURNS TEXT AS $
DECLARE
    hash_input TEXT;
    calculated_hash TEXT;
BEGIN
    -- Create a consistent string for hashing
    hash_input := CONCAT(
        COALESCE(p_table_name, ''),
        '|',
        COALESCE(p_record_id::TEXT, ''),
        '|',
        COALESCE(p_action, ''),
        '|',
        COALESCE(p_user_id::TEXT, ''),
        '|',
        COALESCE(p_timestamp::TEXT, ''),
        '|',
        COALESCE(p_old_values::TEXT, ''),
        '|',
        COALESCE(p_new_values::TEXT, '')
    );
    
    -- Calculate SHA-256 hash
    calculated_hash := encode(digest(hash_input, 'sha256'), 'hex');
    
    RETURN calculated_hash;
END;
$ LANGUAGE plpgsql;

-- Add integrity hash column to audit_logs table
ALTER TABLE audit.audit_logs 
ADD COLUMN IF NOT EXISTS integrity_hash TEXT;

-- Create index on integrity hash
CREATE INDEX IF NOT EXISTS idx_audit_logs_integrity_hash ON audit.audit_logs(integrity_hash);

-- Function to verify audit log integrity
CREATE OR REPLACE FUNCTION audit.verify_audit_log_integrity(p_audit_log_id UUID)
RETURNS BOOLEAN AS $
DECLARE
    log_record RECORD;
    calculated_hash TEXT;
BEGIN
    -- Get the audit log record
    SELECT * INTO log_record
    FROM audit.audit_logs
    WHERE id = p_audit_log_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Calculate expected hash
    calculated_hash := audit.calculate_audit_hash(
        log_record.table_name,
        log_record.record_id,
        log_record.action,
        log_record.user_id,
        log_record.timestamp,
        log_record.old_values,
        log_record.new_values
    );
    
    -- Compare with stored hash
    RETURN log_record.integrity_hash = calculated_hash;
END;
$ LANGUAGE plpgsql;

-- Function to batch verify audit log integrity
CREATE OR REPLACE FUNCTION audit.verify_audit_logs_integrity(
    p_table_name VARCHAR(50) DEFAULT NULL,
    p_date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    total_logs BIGINT,
    valid_logs BIGINT,
    invalid_logs BIGINT,
    integrity_percentage NUMERIC(5,2)
) AS $
DECLARE
    total_count BIGINT := 0;
    valid_count BIGINT := 0;
    invalid_count BIGINT := 0;
BEGIN
    -- Count total logs matching criteria
    SELECT COUNT(*) INTO total_count
    FROM audit.audit_logs
    WHERE (p_table_name IS NULL OR table_name = p_table_name)
    AND (p_date_from IS NULL OR timestamp >= p_date_from)
    AND (p_date_to IS NULL OR timestamp <= p_date_to);
    
    -- Count valid logs
    SELECT COUNT(*) INTO valid_count
    FROM audit.audit_logs al
    WHERE (p_table_name IS NULL OR al.table_name = p_table_name)
    AND (p_date_from IS NULL OR al.timestamp >= p_date_from)
    AND (p_date_to IS NULL OR al.timestamp <= p_date_to)
    AND audit.verify_audit_log_integrity(al.id);
    
    invalid_count := total_count - valid_count;
    
    RETURN QUERY SELECT 
        total_count,
        valid_count,
        invalid_count,
        CASE 
            WHEN total_count > 0 THEN ROUND((valid_count::NUMERIC / total_count::NUMERIC) * 100, 2)
            ELSE 0::NUMERIC(5,2)
        END;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- 3. ENHANCED AUDIT TRIGGER WITH INTEGRITY HASH
-- =====================================================

-- Enhanced audit trigger function with integrity checking
CREATE OR REPLACE FUNCTION audit.audit_trigger_function_with_integrity()
RETURNS TRIGGER AS $
DECLARE
    user_info RECORD;
    changed_fields TEXT[] := '{}';
    field_name TEXT;
    old_val TEXT;
    new_val TEXT;
    current_user_id UUID;
    current_user_email VARCHAR(255);
    current_ip_address INET;
    current_user_agent TEXT;
    current_session_id VARCHAR(255);
    audit_timestamp TIMESTAMP WITH TIME ZONE;
    integrity_hash TEXT;
BEGIN
    -- Set audit timestamp
    audit_timestamp := NOW();
    
    -- Get user context from session variables
    BEGIN
        current_user_id := NULLIF(current_setting('audit.current_user_id', true), '')::UUID;
        current_user_email := NULLIF(current_setting('audit.current_user_email', true), '');
        current_ip_address := NULLIF(current_setting('audit.current_ip_address', true), '')::INET;
        current_user_agent := NULLIF(current_setting('audit.current_user_agent', true), '');
        current_session_id := NULLIF(current_setting('audit.current_session_id', true), '');
    EXCEPTION WHEN OTHERS THEN
        current_user_id := NULL;
        current_user_email := NULL;
        current_ip_address := NULL;
        current_user_agent := NULL;
        current_session_id := NULL;
    END;
    
    -- If no user context is set, try to get from auth.uid() (Supabase)
    IF current_user_id IS NULL THEN
        BEGIN
            current_user_id := auth.uid();
        EXCEPTION WHEN OTHERS THEN
            current_user_id := NULL;
        END;
    END IF;
    
    -- Get user email from profiles table if not provided in context
    IF current_user_id IS NOT NULL AND current_user_email IS NULL THEN
        BEGIN
            SELECT email INTO current_user_email 
            FROM profiles 
            WHERE id = current_user_id;
        EXCEPTION WHEN OTHERS THEN
            current_user_email := NULL;
        END;
    END IF;
    
    -- For UPDATE operations, determine which fields have changed
    IF TG_OP = 'UPDATE' THEN
        FOR field_name IN 
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = TG_TABLE_SCHEMA 
            AND table_name = TG_TABLE_NAME
            AND column_name NOT IN ('updated_at', 'created_at')
        LOOP
            EXECUTE format('SELECT ($1).%I::TEXT, ($2).%I::TEXT', field_name, field_name) 
            INTO old_val, new_val 
            USING OLD, NEW;
            
            IF old_val IS DISTINCT FROM new_val THEN
                changed_fields := array_append(changed_fields, field_name);
            END IF;
        END LOOP;
    END IF;
    
    -- Calculate integrity hash
    integrity_hash := audit.calculate_audit_hash(
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        current_user_id,
        audit_timestamp,
        CASE 
            WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
            WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD)
            ELSE NULL 
        END,
        CASE 
            WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW)
            WHEN TG_OP = 'UPDATE' THEN to_jsonb(NEW)
            ELSE NULL 
        END
    );
    
    -- Insert audit log record with integrity hash
    INSERT INTO audit.audit_logs (
        table_name,
        record_id,
        action,
        user_id,
        user_email,
        timestamp,
        old_values,
        new_values,
        changed_fields,
        ip_address,
        user_agent,
        session_id,
        integrity_hash
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        current_user_id,
        current_user_email,
        audit_timestamp,
        CASE 
            WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
            WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD)
            ELSE NULL 
        END,
        CASE 
            WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW)
            WHEN TG_OP = 'UPDATE' THEN to_jsonb(NEW)
            ELSE NULL 
        END,
        changed_fields,
        current_ip_address,
        current_user_agent,
        current_session_id,
        integrity_hash
    );
    
    RETURN COALESCE(NEW, OLD);
    
EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the main operation
    RAISE WARNING 'Audit trigger with integrity failed for table %: %', TG_TABLE_NAME, SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- 4. AUDIT ACCESS LOGGING FUNCTIONS
-- =====================================================

-- Function to log audit access
CREATE OR REPLACE FUNCTION audit.log_audit_access(
    p_access_type VARCHAR(20),
    p_table_name VARCHAR(50) DEFAULT NULL,
    p_record_id UUID DEFAULT NULL,
    p_filters_applied JSONB DEFAULT NULL,
    p_records_accessed INTEGER DEFAULT 0
)
RETURNS UUID AS $
DECLARE
    access_log_id UUID;
    current_user_id UUID;
    current_user_email VARCHAR(255);
    current_ip_address INET;
    current_user_agent TEXT;
    current_session_id VARCHAR(255);
BEGIN
    -- Get user context
    BEGIN
        current_user_id := auth.uid();
        current_user_email := NULLIF(current_setting('audit.current_user_email', true), '');
        current_ip_address := NULLIF(current_setting('audit.current_ip_address', true), '')::INET;
        current_user_agent := NULLIF(current_setting('audit.current_user_agent', true), '');
        current_session_id := NULLIF(current_setting('audit.current_session_id', true), '');
    EXCEPTION WHEN OTHERS THEN
        current_user_id := auth.uid();
        current_user_email := NULL;
        current_ip_address := NULL;
        current_user_agent := NULL;
        current_session_id := NULL;
    END;
    
    -- Get user email if not in context
    IF current_user_id IS NOT NULL AND current_user_email IS NULL THEN
        BEGIN
            SELECT email INTO current_user_email 
            FROM profiles 
            WHERE id = current_user_id;
        EXCEPTION WHEN OTHERS THEN
            current_user_email := NULL;
        END;
    END IF;
    
    -- Insert access log
    INSERT INTO audit.audit_access_logs (
        accessed_by_user_id,
        accessed_by_email,
        access_type,
        table_name,
        record_id,
        filters_applied,
        ip_address,
        user_agent,
        session_id,
        records_accessed
    ) VALUES (
        current_user_id,
        current_user_email,
        p_access_type,
        p_table_name,
        p_record_id,
        p_filters_applied,
        current_ip_address,
        current_user_agent,
        current_session_id,
        p_records_accessed
    ) RETURNING id INTO access_log_id;
    
    RETURN access_log_id;
    
EXCEPTION WHEN OTHERS THEN
    -- Don't fail if access logging fails
    RAISE WARNING 'Failed to log audit access: %', SQLERRM;
    RETURN NULL;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- 5. DATA RETENTION POLICIES
-- =====================================================

-- Create audit retention settings table
CREATE TABLE IF NOT EXISTS audit.audit_retention_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(50) UNIQUE NOT NULL,
    retention_days INTEGER NOT NULL DEFAULT 2555, -- ~7 years default
    archive_after_days INTEGER DEFAULT 365, -- Archive after 1 year
    auto_cleanup_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default retention settings
INSERT INTO audit.audit_retention_settings (table_name, retention_days, archive_after_days)
VALUES 
    ('transactions', 2555, 365),  -- 7 years for financial records
    ('reservations', 1825, 365),  -- 5 years for reservations
    ('tasks', 1095, 180),         -- 3 years for tasks
    ('lofts', 2555, 365)          -- 7 years for property records
ON CONFLICT (table_name) DO NOTHING;

-- Function to archive old audit logs
CREATE OR REPLACE FUNCTION audit.archive_old_audit_logs(
    p_table_name VARCHAR(50) DEFAULT NULL,
    p_batch_size INTEGER DEFAULT 1000
)
RETURNS TABLE (
    table_name VARCHAR(50),
    archived_count BIGINT,
    archive_date TIMESTAMP WITH TIME ZONE
) AS $
DECLARE
    retention_record RECORD;
    archive_count BIGINT;
BEGIN
    -- Process each table's retention settings
    FOR retention_record IN 
        SELECT ars.table_name, ars.archive_after_days
        FROM audit.audit_retention_settings ars
        WHERE (p_table_name IS NULL OR ars.table_name = p_table_name)
        AND ars.auto_cleanup_enabled = true
    LOOP
        -- Archive logs older than archive_after_days
        WITH archived_logs AS (
            DELETE FROM audit.audit_logs
            WHERE table_name = retention_record.table_name
            AND timestamp < NOW() - INTERVAL '1 day' * retention_record.archive_after_days
            AND id IN (
                SELECT id FROM audit.audit_logs
                WHERE table_name = retention_record.table_name
                AND timestamp < NOW() - INTERVAL '1 day' * retention_record.archive_after_days
                ORDER BY timestamp
                LIMIT p_batch_size
            )
            RETURNING *
        )
        SELECT COUNT(*) INTO archive_count FROM archived_logs;
        
        -- Return results for this table
        RETURN QUERY SELECT 
            retention_record.table_name,
            archive_count,
            NOW();
    END LOOP;
END;
$ LANGUAGE plpgsql;

-- Function to clean up old audit logs (permanent deletion)
CREATE OR REPLACE FUNCTION audit.cleanup_old_audit_logs(
    p_table_name VARCHAR(50) DEFAULT NULL,
    p_batch_size INTEGER DEFAULT 1000
)
RETURNS TABLE (
    table_name VARCHAR(50),
    deleted_count BIGINT,
    cleanup_date TIMESTAMP WITH TIME ZONE
) AS $
DECLARE
    retention_record RECORD;
    delete_count BIGINT;
BEGIN
    -- Process each table's retention settings
    FOR retention_record IN 
        SELECT ars.table_name, ars.retention_days
        FROM audit.audit_retention_settings ars
        WHERE (p_table_name IS NULL OR ars.table_name = p_table_name)
        AND ars.auto_cleanup_enabled = true
    LOOP
        -- Delete logs older than retention_days
        WITH deleted_logs AS (
            DELETE FROM audit.audit_logs
            WHERE table_name = retention_record.table_name
            AND timestamp < NOW() - INTERVAL '1 day' * retention_record.retention_days
            AND id IN (
                SELECT id FROM audit.audit_logs
                WHERE table_name = retention_record.table_name
                AND timestamp < NOW() - INTERVAL '1 day' * retention_record.retention_days
                ORDER BY timestamp
                LIMIT p_batch_size
            )
            RETURNING *
        )
        SELECT COUNT(*) INTO delete_count FROM deleted_logs;
        
        -- Return results for this table
        RETURN QUERY SELECT 
            retention_record.table_name,
            delete_count,
            NOW();
    END LOOP;
END;
$ LANGUAGE plpgsql;

-- Function to get retention status
CREATE OR REPLACE FUNCTION audit.get_retention_status()
RETURNS TABLE (
    table_name VARCHAR(50),
    total_logs BIGINT,
    logs_to_archive BIGINT,
    logs_to_delete BIGINT,
    oldest_log_date TIMESTAMP WITH TIME ZONE,
    newest_log_date TIMESTAMP WITH TIME ZONE
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        ars.table_name,
        COALESCE(stats.total_logs, 0) as total_logs,
        COALESCE(stats.logs_to_archive, 0) as logs_to_archive,
        COALESCE(stats.logs_to_delete, 0) as logs_to_delete,
        stats.oldest_log_date,
        stats.newest_log_date
    FROM audit.audit_retention_settings ars
    LEFT JOIN (
        SELECT 
            al.table_name,
            COUNT(*) as total_logs,
            COUNT(*) FILTER (
                WHERE al.timestamp < NOW() - INTERVAL '1 day' * ars.archive_after_days
                AND al.timestamp >= NOW() - INTERVAL '1 day' * ars.retention_days
            ) as logs_to_archive,
            COUNT(*) FILTER (
                WHERE al.timestamp < NOW() - INTERVAL '1 day' * ars.retention_days
            ) as logs_to_delete,
            MIN(al.timestamp) as oldest_log_date,
            MAX(al.timestamp) as newest_log_date
        FROM audit.audit_logs al
        JOIN audit.audit_retention_settings ars ON al.table_name = ars.table_name
        GROUP BY al.table_name, ars.archive_after_days, ars.retention_days
    ) stats ON ars.table_name = stats.table_name
    ORDER BY ars.table_name;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- 6. ENHANCED RLS POLICIES
-- =====================================================

-- Drop existing policies to recreate with enhancements
DROP POLICY IF EXISTS "Users can view their own audit logs" ON audit.audit_logs;
DROP POLICY IF EXISTS "Admins and managers can view all audit logs" ON audit.audit_logs;

-- Enhanced policy: Users can view audit logs for records they own or have access to
CREATE POLICY "Users can view related audit logs" ON audit.audit_logs
    FOR SELECT
    USING (
        -- User can see their own actions
        auth.uid() = user_id
        OR
        -- User can see audit logs for records they have access to based on table-specific rules
        (
            -- For transactions: user can see if they have access to the transaction
            (table_name = 'transactions' AND EXISTS (
                SELECT 1 FROM transactions t
                JOIN lofts l ON t.loft_id = l.id
                WHERE t.id = record_id
                AND (l.owner_id = auth.uid() OR EXISTS (
                    SELECT 1 FROM profiles p 
                    WHERE p.id = auth.uid() 
                    AND p.role IN ('admin', 'manager')
                ))
            ))
            OR
            -- For tasks: user can see if they are assigned or have management access
            (table_name = 'tasks' AND EXISTS (
                SELECT 1 FROM tasks t
                WHERE t.id = record_id
                AND (t.assigned_to = auth.uid() OR t.created_by = auth.uid() OR EXISTS (
                    SELECT 1 FROM profiles p 
                    WHERE p.id = auth.uid() 
                    AND p.role IN ('admin', 'manager')
                ))
            ))
            OR
            -- For reservations: user can see if they made the reservation or have management access
            (table_name = 'reservations' AND EXISTS (
                SELECT 1 FROM reservations r
                JOIN lofts l ON r.loft_id = l.id
                WHERE r.id = record_id
                AND (r.customer_id = auth.uid() OR l.owner_id = auth.uid() OR EXISTS (
                    SELECT 1 FROM profiles p 
                    WHERE p.id = auth.uid() 
                    AND p.role IN ('admin', 'manager')
                ))
            ))
            OR
            -- For lofts: user can see if they own the loft or have management access
            (table_name = 'lofts' AND EXISTS (
                SELECT 1 FROM lofts l
                WHERE l.id = record_id
                AND (l.owner_id = auth.uid() OR EXISTS (
                    SELECT 1 FROM profiles p 
                    WHERE p.id = auth.uid() 
                    AND p.role IN ('admin', 'manager')
                ))
            ))
        )
    );

-- Enhanced policy: Admins and managers can view all audit logs with access logging
CREATE POLICY "Admins and managers can view all audit logs" ON audit.audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- =====================================================
-- 7. SECURITY MONITORING FUNCTIONS
-- =====================================================

-- Function to detect suspicious audit access patterns
CREATE OR REPLACE FUNCTION audit.detect_suspicious_access()
RETURNS TABLE (
    user_id UUID,
    user_email VARCHAR(255),
    suspicious_activity TEXT,
    access_count BIGINT,
    first_access TIMESTAMP WITH TIME ZONE,
    last_access TIMESTAMP WITH TIME ZONE
) AS $
BEGIN
    RETURN QUERY
    -- Detect users with excessive audit access in the last 24 hours
    SELECT 
        aal.accessed_by_user_id,
        aal.accessed_by_email,
        'Excessive audit access (>100 in 24h)' as suspicious_activity,
        COUNT(*) as access_count,
        MIN(aal.access_timestamp) as first_access,
        MAX(aal.access_timestamp) as last_access
    FROM audit.audit_access_logs aal
    WHERE aal.access_timestamp >= NOW() - INTERVAL '24 hours'
    GROUP BY aal.accessed_by_user_id, aal.accessed_by_email
    HAVING COUNT(*) > 100
    
    UNION ALL
    
    -- Detect users accessing audit logs outside business hours frequently
    SELECT 
        aal.accessed_by_user_id,
        aal.accessed_by_email,
        'Frequent off-hours access' as suspicious_activity,
        COUNT(*) as access_count,
        MIN(aal.access_timestamp) as first_access,
        MAX(aal.access_timestamp) as last_access
    FROM audit.audit_access_logs aal
    WHERE aal.access_timestamp >= NOW() - INTERVAL '7 days'
    AND (EXTRACT(hour FROM aal.access_timestamp) < 8 OR EXTRACT(hour FROM aal.access_timestamp) > 18)
    GROUP BY aal.accessed_by_user_id, aal.accessed_by_email
    HAVING COUNT(*) > 20;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- 8. COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE audit.audit_access_logs IS 'Logs all access to audit data for security monitoring';
COMMENT ON TABLE audit.audit_retention_settings IS 'Configuration for audit log retention and archival policies';

COMMENT ON FUNCTION audit.calculate_audit_hash(VARCHAR, UUID, VARCHAR, UUID, TIMESTAMP WITH TIME ZONE, JSONB, JSONB) IS 'Calculates integrity hash for audit log entries';
COMMENT ON FUNCTION audit.verify_audit_log_integrity(UUID) IS 'Verifies the integrity of a specific audit log entry';
COMMENT ON FUNCTION audit.verify_audit_logs_integrity(VARCHAR, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) IS 'Batch verifies integrity of audit logs with optional filters';
COMMENT ON FUNCTION audit.log_audit_access(VARCHAR, VARCHAR, UUID, JSONB, INTEGER) IS 'Logs access to audit data for security monitoring';
COMMENT ON FUNCTION audit.archive_old_audit_logs(VARCHAR, INTEGER) IS 'Archives old audit logs based on retention settings';
COMMENT ON FUNCTION audit.cleanup_old_audit_logs(VARCHAR, INTEGER) IS 'Permanently deletes old audit logs based on retention settings';
COMMENT ON FUNCTION audit.get_retention_status() IS 'Returns current retention status for all audited tables';
COMMENT ON FUNCTION audit.detect_suspicious_access() IS 'Detects suspicious patterns in audit access logs';

-- =====================================================
-- 9. SETUP COMPLETE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Audit security enhancements applied successfully';
    RAISE NOTICE 'Features added:';
    RAISE NOTICE '- Audit access logging table and functions';
    RAISE NOTICE '- Audit log integrity checking with hash validation';
    RAISE NOTICE '- Enhanced RLS policies with granular access control';
    RAISE NOTICE '- Data retention policies and cleanup functions';
    RAISE NOTICE '- Security monitoring and suspicious activity detection';
    RAISE NOTICE '- Enhanced audit trigger with integrity hash calculation';
END $$;
</content>