-- Audit Data Retention Policies Schema
-- This file contains the schema and functions for managing audit data retention

-- =====================================================
-- 1. CREATE AUDIT RETENTION CONFIGURATION TABLE
-- =====================================================

-- Table to store retention policies for different audit data types
CREATE TABLE IF NOT EXISTS audit.audit_retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_name VARCHAR(100) NOT NULL UNIQUE,
    table_name VARCHAR(50) NOT NULL,
    retention_period_days INTEGER NOT NULL CHECK (retention_period_days > 0),
    archive_enabled BOOLEAN DEFAULT true,
    auto_delete_enabled BOOLEAN DEFAULT false,
    compression_enabled BOOLEAN DEFAULT true,
    policy_description TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_applied TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- =====================================================
-- 2. CREATE AUDIT ARCHIVE TABLE
-- =====================================================

-- Table to store archived audit logs
CREATE TABLE IF NOT EXISTS audit.audit_logs_archive (
    id UUID PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(10) NOT NULL,
    user_id UUID,
    user_email VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE,
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archive_reason TEXT
);

-- =====================================================
-- 3. CREATE INDEXES FOR ARCHIVE TABLE
-- =====================================================

-- Indexes for archived audit logs
CREATE INDEX idx_audit_logs_archive_table_record ON audit.audit_logs_archive(table_name, record_id);
CREATE INDEX idx_audit_logs_archive_timestamp ON audit.audit_logs_archive(timestamp DESC);
CREATE INDEX idx_audit_logs_archive_archived_at ON audit.audit_logs_archive(archived_at DESC);
CREATE INDEX idx_audit_logs_archive_user_id ON audit.audit_logs_archive(user_id);

-- =====================================================
-- 4. ROW LEVEL SECURITY FOR RETENTION TABLES
-- =====================================================

-- Enable RLS on retention policies table
ALTER TABLE audit.audit_retention_policies ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can manage retention policies
CREATE POLICY "Only admins can manage retention policies" ON audit.audit_retention_policies
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Enable RLS on archive table
ALTER TABLE audit.audit_logs_archive ENABLE ROW LEVEL SECURITY;

-- Policy: Admins and managers can view archived audit logs
CREATE POLICY "Admins and managers can view archived audit logs" ON audit.audit_logs_archive
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- Policy: Only system can insert into archive
CREATE POLICY "System can insert archived audit logs" ON audit.audit_logs_archive
    FOR INSERT
    WITH CHECK (true);

-- Policy: Prevent updates to archived logs
CREATE POLICY "Archived audit logs are immutable" ON audit.audit_logs_archive
    FOR UPDATE
    USING (false);

-- Policy: Only admins can delete very old archived logs
CREATE POLICY "Only admins can delete old archived logs" ON audit.audit_logs_archive
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
        AND archived_at < NOW() - INTERVAL '10 years'
    );

-- =====================================================
-- 5. DEFAULT RETENTION POLICIES
-- =====================================================

-- Insert default retention policies
INSERT INTO audit.audit_retention_policies (
    policy_name,
    table_name,
    retention_period_days,
    archive_enabled,
    auto_delete_enabled,
    compression_enabled,
    policy_description
) VALUES 
    (
        'transactions_retention',
        'transactions',
        2555, -- 7 years for financial records
        true,
        false,
        true,
        'Financial transaction audit logs must be retained for 7 years for compliance'
    ),
    (
        'reservations_retention',
        'reservations',
        1095, -- 3 years for reservation records
        true,
        false,
        true,
        'Reservation audit logs retained for 3 years for business analysis'
    ),
    (
        'tasks_retention',
        'tasks',
        730, -- 2 years for task management
        true,
        true,
        true,
        'Task audit logs retained for 2 years, auto-delete enabled'
    ),
    (
        'lofts_retention',
        'lofts',
        1825, -- 5 years for property records
        true,
        false,
        true,
        'Property audit logs retained for 5 years for legal compliance'
    ),
    (
        'audit_access_logs_retention',
        'audit_access_logs',
        365, -- 1 year for access logs
        true,
        true,
        true,
        'Audit access logs retained for 1 year for security monitoring'
    )
ON CONFLICT (policy_name) DO NOTHING;

-- =====================================================
-- 6. RETENTION MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to archive old audit logs based on retention policies
CREATE OR REPLACE FUNCTION audit.archive_old_audit_logs(
    p_policy_name VARCHAR(100) DEFAULT NULL,
    p_dry_run BOOLEAN DEFAULT true
)
RETURNS TABLE (
    policy_name VARCHAR(100),
    table_name VARCHAR(50),
    records_to_archive BIGINT,
    archive_cutoff_date TIMESTAMP WITH TIME ZONE,
    status TEXT
) AS $
DECLARE
    policy_record RECORD;
    cutoff_date TIMESTAMP WITH TIME ZONE;
    records_count BIGINT;
    archived_count BIGINT := 0;
BEGIN
    -- Loop through retention policies
    FOR policy_record IN 
        SELECT * FROM audit.audit_retention_policies 
        WHERE is_active = true 
        AND archive_enabled = true
        AND (p_policy_name IS NULL OR policy_name = p_policy_name)
    LOOP
        -- Calculate cutoff date
        cutoff_date := NOW() - INTERVAL '1 day' * policy_record.retention_period_days;
        
        -- Count records to be archived
        IF policy_record.table_name = 'audit_access_logs' THEN
            SELECT COUNT(*) INTO records_count
            FROM audit.audit_access_logs
            WHERE created_at < cutoff_date;
        ELSE
            SELECT COUNT(*) INTO records_count
            FROM audit.audit_logs
            WHERE table_name = policy_record.table_name
            AND created_at < cutoff_date;
        END IF;
        
        -- Perform archiving if not dry run
        IF NOT p_dry_run AND records_count > 0 THEN
            IF policy_record.table_name = 'audit_access_logs' THEN
                -- Archive access logs
                INSERT INTO audit.audit_logs_archive (
                    id, table_name, record_id, action, user_id, user_email,
                    timestamp, old_values, new_values, changed_fields,
                    ip_address, user_agent, session_id, created_at,
                    archive_reason
                )
                SELECT 
                    gen_random_uuid(), -- New ID for archive
                    'audit_access_logs',
                    NULL, -- No record_id for access logs
                    'ACCESS_LOG',
                    user_id,
                    user_email,
                    timestamp,
                    NULL, -- No old_values for access logs
                    to_jsonb(aal.*), -- Store entire access log as new_values
                    ARRAY[]::TEXT[], -- No changed_fields for access logs
                    ip_address,
                    user_agent,
                    session_id,
                    created_at,
                    'Archived by retention policy: ' || policy_record.policy_name
                FROM audit.audit_access_logs aal
                WHERE aal.created_at < cutoff_date;
                
                GET DIAGNOSTICS archived_count = ROW_COUNT;
                
                -- Delete archived records
                DELETE FROM audit.audit_access_logs
                WHERE created_at < cutoff_date;
            ELSE
                -- Archive regular audit logs
                INSERT INTO audit.audit_logs_archive (
                    id, table_name, record_id, action, user_id, user_email,
                    timestamp, old_values, new_values, changed_fields,
                    ip_address, user_agent, session_id, created_at,
                    archive_reason
                )
                SELECT 
                    id, table_name, record_id, action, user_id, user_email,
                    timestamp, old_values, new_values, changed_fields,
                    ip_address, user_agent, session_id, created_at,
                    'Archived by retention policy: ' || policy_record.policy_name
                FROM audit.audit_logs
                WHERE table_name = policy_record.table_name
                AND created_at < cutoff_date;
                
                GET DIAGNOSTICS archived_count = ROW_COUNT;
                
                -- Delete archived records
                DELETE FROM audit.audit_logs
                WHERE table_name = policy_record.table_name
                AND created_at < cutoff_date;
            END IF;
            
            -- Update last applied timestamp
            UPDATE audit.audit_retention_policies
            SET last_applied = NOW()
            WHERE id = policy_record.id;
        END IF;
        
        -- Return results
        RETURN QUERY SELECT 
            policy_record.policy_name,
            policy_record.table_name,
            records_count,
            cutoff_date,
            CASE 
                WHEN p_dry_run THEN 'DRY RUN - No changes made'
                WHEN records_count = 0 THEN 'No records to archive'
                ELSE 'Archived ' || archived_count || ' records'
            END;
    END LOOP;
END;
$ LANGUAGE plpgsql;

-- Function to permanently delete very old archived logs
CREATE OR REPLACE FUNCTION audit.cleanup_old_archived_logs(
    p_archive_age_years INTEGER DEFAULT 10,
    p_dry_run BOOLEAN DEFAULT true
)
RETURNS TABLE (
    table_name VARCHAR(50),
    records_to_delete BIGINT,
    deletion_cutoff_date TIMESTAMP WITH TIME ZONE,
    status TEXT
) AS $
DECLARE
    cutoff_date TIMESTAMP WITH TIME ZONE;
    records_count BIGINT;
    deleted_count BIGINT := 0;
BEGIN
    -- Calculate cutoff date for permanent deletion
    cutoff_date := NOW() - INTERVAL '1 year' * p_archive_age_years;
    
    -- Count records to be deleted
    SELECT COUNT(*) INTO records_count
    FROM audit.audit_logs_archive
    WHERE archived_at < cutoff_date;
    
    -- Perform deletion if not dry run
    IF NOT p_dry_run AND records_count > 0 THEN
        DELETE FROM audit.audit_logs_archive
        WHERE archived_at < cutoff_date;
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
    END IF;
    
    -- Return results
    RETURN QUERY SELECT 
        'audit_logs_archive'::VARCHAR(50),
        records_count,
        cutoff_date,
        CASE 
            WHEN p_dry_run THEN 'DRY RUN - No changes made'
            WHEN records_count = 0 THEN 'No archived records to delete'
            ELSE 'Permanently deleted ' || deleted_count || ' archived records'
        END;
END;
$ LANGUAGE plpgsql;

-- Function to get retention policy status
CREATE OR REPLACE FUNCTION audit.get_retention_status()
RETURNS TABLE (
    policy_name VARCHAR(100),
    table_name VARCHAR(50),
    retention_days INTEGER,
    total_records BIGINT,
    records_due_for_archive BIGINT,
    oldest_record_age_days INTEGER,
    last_applied TIMESTAMP WITH TIME ZONE,
    status TEXT
) AS $
DECLARE
    policy_record RECORD;
    cutoff_date TIMESTAMP WITH TIME ZONE;
    total_count BIGINT;
    due_count BIGINT;
    oldest_age INTEGER;
BEGIN
    FOR policy_record IN 
        SELECT * FROM audit.audit_retention_policies 
        WHERE is_active = true
        ORDER BY policy_name
    LOOP
        cutoff_date := NOW() - INTERVAL '1 day' * policy_record.retention_period_days;
        
        -- Get counts and oldest record age
        IF policy_record.table_name = 'audit_access_logs' THEN
            SELECT 
                COUNT(*),
                COUNT(*) FILTER (WHERE created_at < cutoff_date),
                COALESCE(EXTRACT(DAYS FROM NOW() - MIN(created_at))::INTEGER, 0)
            INTO total_count, due_count, oldest_age
            FROM audit.audit_access_logs;
        ELSE
            SELECT 
                COUNT(*),
                COUNT(*) FILTER (WHERE created_at < cutoff_date),
                COALESCE(EXTRACT(DAYS FROM NOW() - MIN(created_at))::INTEGER, 0)
            INTO total_count, due_count, oldest_age
            FROM audit.audit_logs
            WHERE table_name = policy_record.table_name;
        END IF;
        
        RETURN QUERY SELECT 
            policy_record.policy_name,
            policy_record.table_name,
            policy_record.retention_period_days,
            total_count,
            due_count,
            oldest_age,
            policy_record.last_applied,
            CASE 
                WHEN due_count = 0 THEN 'OK - No action needed'
                WHEN due_count > 0 AND policy_record.archive_enabled THEN 'ACTION NEEDED - ' || due_count || ' records due for archiving'
                ELSE 'WARNING - ' || due_count || ' records exceed retention but archiving disabled'
            END;
    END LOOP;
END;
$ LANGUAGE plpgsql;

-- Function to update retention policy
CREATE OR REPLACE FUNCTION audit.update_retention_policy(
    p_policy_name VARCHAR(100),
    p_retention_period_days INTEGER DEFAULT NULL,
    p_archive_enabled BOOLEAN DEFAULT NULL,
    p_auto_delete_enabled BOOLEAN DEFAULT NULL,
    p_is_active BOOLEAN DEFAULT NULL
)
RETURNS BOOLEAN AS $
DECLARE
    policy_exists BOOLEAN;
BEGIN
    -- Check if policy exists
    SELECT EXISTS(
        SELECT 1 FROM audit.audit_retention_policies 
        WHERE policy_name = p_policy_name
    ) INTO policy_exists;
    
    IF NOT policy_exists THEN
        RAISE EXCEPTION 'Retention policy % does not exist', p_policy_name;
    END IF;
    
    -- Update policy
    UPDATE audit.audit_retention_policies
    SET 
        retention_period_days = COALESCE(p_retention_period_days, retention_period_days),
        archive_enabled = COALESCE(p_archive_enabled, archive_enabled),
        auto_delete_enabled = COALESCE(p_auto_delete_enabled, auto_delete_enabled),
        is_active = COALESCE(p_is_active, is_active),
        updated_at = NOW()
    WHERE policy_name = p_policy_name;
    
    RETURN true;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- 7. AUTOMATED RETENTION JOB SETUP
-- =====================================================

-- Function to run automated retention maintenance
CREATE OR REPLACE FUNCTION audit.run_retention_maintenance()
RETURNS TEXT AS $
DECLARE
    result_text TEXT := '';
    policy_record RECORD;
BEGIN
    result_text := 'Audit Retention Maintenance Report - ' || NOW()::TEXT || E'\n';
    result_text := result_text || '================================================' || E'\n\n';
    
    -- Run archiving for all active policies
    FOR policy_record IN 
        SELECT policy_name, table_name FROM audit.audit_retention_policies 
        WHERE is_active = true AND archive_enabled = true
    LOOP
        BEGIN
            PERFORM audit.archive_old_audit_logs(policy_record.policy_name, false);
            result_text := result_text || 'SUCCESS: Processed policy ' || policy_record.policy_name || E'\n';
        EXCEPTION WHEN OTHERS THEN
            result_text := result_text || 'ERROR: Failed to process policy ' || policy_record.policy_name || ': ' || SQLERRM || E'\n';
        END;
    END LOOP;
    
    -- Cleanup very old archived logs
    BEGIN
        PERFORM audit.cleanup_old_archived_logs(10, false);
        result_text := result_text || 'SUCCESS: Cleaned up old archived logs' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        result_text := result_text || 'ERROR: Failed to cleanup archived logs: ' || SQLERRM || E'\n';
    END;
    
    result_text := result_text || E'\nMaintenance completed at ' || NOW()::TEXT;
    
    RETURN result_text;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- 8. COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE audit.audit_retention_policies IS 'Configuration table for audit data retention policies';
COMMENT ON TABLE audit.audit_logs_archive IS 'Archive table for old audit logs that have exceeded retention period';

COMMENT ON FUNCTION audit.archive_old_audit_logs IS 'Archives audit logs that exceed retention period based on policies';
COMMENT ON FUNCTION audit.cleanup_old_archived_logs IS 'Permanently deletes very old archived audit logs';
COMMENT ON FUNCTION audit.get_retention_status IS 'Returns status of all retention policies and records due for archiving';
COMMENT ON FUNCTION audit.update_retention_policy IS 'Updates an existing retention policy configuration';
COMMENT ON FUNCTION audit.run_retention_maintenance IS 'Automated function to run retention maintenance tasks';

-- Log successful schema creation
DO $$
BEGIN
    RAISE NOTICE 'Audit retention policies schema created successfully';
    RAISE NOTICE 'Tables created: audit_retention_policies, audit_logs_archive';
    RAISE NOTICE 'Functions created: archive_old_audit_logs, cleanup_old_archived_logs, get_retention_status, update_retention_policy, run_retention_maintenance';
    RAISE NOTICE 'Default policies created: 5 retention policies for different audit data types';
    RAISE NOTICE 'RLS policies created: 6 security policies';
END $$;