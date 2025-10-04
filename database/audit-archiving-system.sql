-- =====================================================
-- AUDIT ARCHIVING SYSTEM
-- =====================================================
-- This file contains the complete audit archiving system including:
-- 1. Archive tables for old audit logs
-- 2. Configurable retention policies
-- 3. Automated archiving functions
-- 4. Archive access and restoration functions

-- =====================================================
-- 1. CREATE ARCHIVE SCHEMA AND TABLES
-- =====================================================

-- Create dedicated schema for archived audit data
CREATE SCHEMA IF NOT EXISTS audit_archive;

-- Grant usage on audit_archive schema to authenticated users
GRANT USAGE ON SCHEMA audit_archive TO authenticated;

-- Create archived audit logs table with same structure as main table
CREATE TABLE IF NOT EXISTS audit_archive.audit_logs_archived (
    id UUID PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    user_id UUID,
    user_email VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archive_reason VARCHAR(100) DEFAULT 'retention_policy'
);

-- Create indexes on archived table for efficient querying
CREATE INDEX IF NOT EXISTS idx_archived_logs_table_record ON audit_archive.audit_logs_archived(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_archived_logs_timestamp ON audit_archive.audit_logs_archived(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_archived_logs_archived_at ON audit_archive.audit_logs_archived(archived_at DESC);
CREATE INDEX IF NOT EXISTS idx_archived_logs_user_id ON audit_archive.audit_logs_archived(user_id);

-- Create retention policies configuration table
CREATE TABLE IF NOT EXISTS audit_archive.retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(50) NOT NULL UNIQUE,
    retention_days INTEGER NOT NULL DEFAULT 365,
    archive_after_days INTEGER NOT NULL DEFAULT 90,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create archive operations log table
CREATE TABLE IF NOT EXISTS audit_archive.archive_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_type VARCHAR(20) NOT NULL CHECK (operation_type IN ('ARCHIVE', 'RESTORE', 'DELETE', 'CLEANUP')),
    table_name VARCHAR(50),
    records_affected INTEGER DEFAULT 0,
    operation_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    operation_end TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'RUNNING' CHECK (status IN ('RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    error_message TEXT,
    performed_by UUID,
    batch_size INTEGER,
    total_batches INTEGER,
    completed_batches INTEGER DEFAULT 0
);

-- =====================================================
-- 2. DEFAULT RETENTION POLICIES
-- =====================================================

-- Insert default retention policies for audited tables
INSERT INTO audit_archive.retention_policies (table_name, retention_days, archive_after_days, enabled)
VALUES 
    ('transactions', 1095, 90, true),    -- 3 years retention, archive after 90 days
    ('tasks', 730, 60, true),            -- 2 years retention, archive after 60 days
    ('reservations', 1095, 90, true),    -- 3 years retention, archive after 90 days
    ('lofts', 1825, 180, true)           -- 5 years retention, archive after 180 days
ON CONFLICT (table_name) DO NOTHING;

-- =====================================================
-- 3. ARCHIVING FUNCTIONS
-- =====================================================

-- Function to get retention status for all tables
CREATE OR REPLACE FUNCTION audit_archive.get_retention_status()
RETURNS TABLE (
    table_name VARCHAR(50),
    total_logs BIGINT,
    logs_to_archive BIGINT,
    logs_to_delete BIGINT,
    oldest_log_date TIMESTAMP WITH TIME ZONE,
    newest_log_date TIMESTAMP WITH TIME ZONE,
    retention_days INTEGER,
    archive_after_days INTEGER,
    policy_enabled BOOLEAN
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        rp.table_name,
        COALESCE(stats.total_logs, 0) as total_logs,
        COALESCE(stats.logs_to_archive, 0) as logs_to_archive,
        COALESCE(stats.logs_to_delete, 0) as logs_to_delete,
        stats.oldest_log_date,
        stats.newest_log_date,
        rp.retention_days,
        rp.archive_after_days,
        rp.enabled as policy_enabled
    FROM audit_archive.retention_policies rp
    LEFT JOIN (
        SELECT 
            al.table_name,
            COUNT(*) as total_logs,
            COUNT(*) FILTER (
                WHERE al.timestamp < (NOW() - (rp2.archive_after_days || ' days')::INTERVAL)
            ) as logs_to_archive,
            COUNT(*) FILTER (
                WHERE al.timestamp < (NOW() - (rp2.retention_days || ' days')::INTERVAL)
            ) as logs_to_delete,
            MIN(al.timestamp) as oldest_log_date,
            MAX(al.timestamp) as newest_log_date
        FROM audit.audit_logs al
        JOIN audit_archive.retention_policies rp2 ON rp2.table_name = al.table_name
        WHERE rp2.enabled = true
        GROUP BY al.table_name
    ) stats ON stats.table_name = rp.table_name
    WHERE rp.enabled = true
    ORDER BY rp.table_name;
END;
$ LANGUAGE plpgsql;

-- Function to archive old audit logs
CREATE OR REPLACE FUNCTION audit_archive.archive_old_audit_logs(
    p_table_name VARCHAR(50) DEFAULT NULL,
    p_batch_size INTEGER DEFAULT 1000
)
RETURNS TABLE (
    table_name VARCHAR(50),
    archived_count INTEGER,
    archive_date TIMESTAMP WITH TIME ZONE
) AS $
DECLARE
    policy_record RECORD;
    operation_id UUID;
    total_archived INTEGER := 0;
    batch_count INTEGER := 0;
    archive_threshold TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Create operation log entry
    INSERT INTO audit_archive.archive_operations (
        operation_type, table_name, batch_size, performed_by
    ) VALUES (
        'ARCHIVE', p_table_name, p_batch_size, auth.uid()
    ) RETURNING id INTO operation_id;

    -- Process each enabled retention policy
    FOR policy_record IN 
        SELECT * FROM audit_archive.retention_policies 
        WHERE enabled = true 
        AND (p_table_name IS NULL OR table_name = p_table_name)
    LOOP
        -- Calculate archive threshold
        archive_threshold := NOW() - (policy_record.archive_after_days || ' days')::INTERVAL;
        
        -- Archive logs in batches
        LOOP
            WITH logs_to_archive AS (
                SELECT id, table_name, record_id, action, user_id, user_email, 
                       timestamp, old_values, new_values, changed_fields, 
                       ip_address, user_agent, session_id, created_at
                FROM audit.audit_logs
                WHERE table_name = policy_record.table_name
                AND timestamp < archive_threshold
                ORDER BY timestamp
                LIMIT p_batch_size
            ),
            archived_logs AS (
                INSERT INTO audit_archive.audit_logs_archived (
                    id, table_name, record_id, action, user_id, user_email,
                    timestamp, old_values, new_values, changed_fields,
                    ip_address, user_agent, session_id, created_at
                )
                SELECT * FROM logs_to_archive
                RETURNING id
            ),
            deleted_logs AS (
                DELETE FROM audit.audit_logs
                WHERE id IN (SELECT id FROM logs_to_archive)
                RETURNING id
            )
            SELECT COUNT(*) INTO batch_count FROM deleted_logs;
            
            -- Exit if no more logs to archive
            EXIT WHEN batch_count = 0;
            
            total_archived := total_archived + batch_count;
            
            -- Update operation progress
            UPDATE audit_archive.archive_operations 
            SET completed_batches = completed_batches + 1,
                records_affected = total_archived
            WHERE id = operation_id;
            
            -- Commit batch and continue
            COMMIT;
        END LOOP;
        
        -- Return results for this table
        RETURN QUERY SELECT 
            policy_record.table_name,
            total_archived,
            NOW();
    END LOOP;
    
    -- Mark operation as completed
    UPDATE audit_archive.archive_operations 
    SET status = 'COMPLETED', 
        operation_end = NOW(),
        records_affected = total_archived
    WHERE id = operation_id;
    
EXCEPTION WHEN OTHERS THEN
    -- Mark operation as failed
    UPDATE audit_archive.archive_operations 
    SET status = 'FAILED', 
        operation_end = NOW(),
        error_message = SQLERRM
    WHERE id = operation_id;
    
    RAISE;
END;
$ LANGUAGE plpgsql;

-- Function to cleanup old audit logs (permanent deletion)
CREATE OR REPLACE FUNCTION audit_archive.cleanup_old_audit_logs(
    p_table_name VARCHAR(50) DEFAULT NULL,
    p_batch_size INTEGER DEFAULT 1000
)
RETURNS TABLE (
    table_name VARCHAR(50),
    deleted_count INTEGER,
    cleanup_date TIMESTAMP WITH TIME ZONE
) AS $
DECLARE
    policy_record RECORD;
    operation_id UUID;
    total_deleted INTEGER := 0;
    batch_count INTEGER := 0;
    retention_threshold TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Create operation log entry
    INSERT INTO audit_archive.archive_operations (
        operation_type, table_name, batch_size, performed_by
    ) VALUES (
        'DELETE', p_table_name, p_batch_size, auth.uid()
    ) RETURNING id INTO operation_id;

    -- Process each enabled retention policy
    FOR policy_record IN 
        SELECT * FROM audit_archive.retention_policies 
        WHERE enabled = true 
        AND (p_table_name IS NULL OR table_name = p_table_name)
    LOOP
        -- Calculate retention threshold
        retention_threshold := NOW() - (policy_record.retention_days || ' days')::INTERVAL;
        
        -- Delete old archived logs in batches
        LOOP
            WITH logs_to_delete AS (
                DELETE FROM audit_archive.audit_logs_archived
                WHERE table_name = policy_record.table_name
                AND timestamp < retention_threshold
                AND id IN (
                    SELECT id FROM audit_archive.audit_logs_archived
                    WHERE table_name = policy_record.table_name
                    AND timestamp < retention_threshold
                    ORDER BY timestamp
                    LIMIT p_batch_size
                )
                RETURNING id
            )
            SELECT COUNT(*) INTO batch_count FROM logs_to_delete;
            
            -- Exit if no more logs to delete
            EXIT WHEN batch_count = 0;
            
            total_deleted := total_deleted + batch_count;
            
            -- Update operation progress
            UPDATE audit_archive.archive_operations 
            SET completed_batches = completed_batches + 1,
                records_affected = total_deleted
            WHERE id = operation_id;
            
            -- Commit batch and continue
            COMMIT;
        END LOOP;
        
        -- Return results for this table
        RETURN QUERY SELECT 
            policy_record.table_name,
            total_deleted,
            NOW();
    END LOOP;
    
    -- Mark operation as completed
    UPDATE audit_archive.archive_operations 
    SET status = 'COMPLETED', 
        operation_end = NOW(),
        records_affected = total_deleted
    WHERE id = operation_id;
    
EXCEPTION WHEN OTHERS THEN
    -- Mark operation as failed
    UPDATE audit_archive.archive_operations 
    SET status = 'FAILED', 
        operation_end = NOW(),
        error_message = SQLERRM
    WHERE id = operation_id;
    
    RAISE;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- 4. ARCHIVE ACCESS FUNCTIONS
-- =====================================================

-- Function to search archived audit logs
CREATE OR REPLACE FUNCTION audit_archive.search_archived_logs(
    p_table_name VARCHAR(50) DEFAULT NULL,
    p_record_id UUID DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_action VARCHAR(10) DEFAULT NULL,
    p_date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    table_name VARCHAR(50),
    record_id UUID,
    action VARCHAR(10),
    user_id UUID,
    user_email VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE,
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    ip_address INET,
    user_agent TEXT,
    archived_at TIMESTAMP WITH TIME ZONE
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        ala.id,
        ala.table_name,
        ala.record_id,
        ala.action,
        ala.user_id,
        ala.user_email,
        ala.timestamp,
        ala.old_values,
        ala.new_values,
        ala.changed_fields,
        ala.ip_address,
        ala.user_agent,
        ala.archived_at
    FROM audit_archive.audit_logs_archived ala
    WHERE (p_table_name IS NULL OR ala.table_name = p_table_name)
    AND (p_record_id IS NULL OR ala.record_id = p_record_id)
    AND (p_user_id IS NULL OR ala.user_id = p_user_id)
    AND (p_action IS NULL OR ala.action = p_action)
    AND (p_date_from IS NULL OR ala.timestamp >= p_date_from)
    AND (p_date_to IS NULL OR ala.timestamp <= p_date_to)
    ORDER BY ala.timestamp DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$ LANGUAGE plpgsql;

-- Function to get combined audit history (active + archived)
CREATE OR REPLACE FUNCTION audit_archive.get_complete_audit_history(
    p_table_name VARCHAR(50),
    p_record_id UUID,
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    table_name VARCHAR(50),
    record_id UUID,
    action VARCHAR(10),
    user_id UUID,
    user_email VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE,
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    ip_address INET,
    user_agent TEXT,
    is_archived BOOLEAN
) AS $
BEGIN
    RETURN QUERY
    (
        -- Active logs
        SELECT 
            al.id,
            al.table_name,
            al.record_id,
            al.action,
            al.user_id,
            al.user_email,
            al.timestamp,
            al.old_values,
            al.new_values,
            al.changed_fields,
            al.ip_address,
            al.user_agent,
            false as is_archived
        FROM audit.audit_logs al
        WHERE al.table_name = p_table_name 
        AND al.record_id = p_record_id
        
        UNION ALL
        
        -- Archived logs
        SELECT 
            ala.id,
            ala.table_name,
            ala.record_id,
            ala.action,
            ala.user_id,
            ala.user_email,
            ala.timestamp,
            ala.old_values,
            ala.new_values,
            ala.changed_fields,
            ala.ip_address,
            ala.user_agent,
            true as is_archived
        FROM audit_archive.audit_logs_archived ala
        WHERE ala.table_name = p_table_name 
        AND ala.record_id = p_record_id
    )
    ORDER BY timestamp DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$ LANGUAGE plpgsql;

-- Function to restore archived logs back to active table
CREATE OR REPLACE FUNCTION audit_archive.restore_archived_logs(
    p_table_name VARCHAR(50),
    p_record_id UUID DEFAULT NULL,
    p_date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    restored_count INTEGER,
    restore_date TIMESTAMP WITH TIME ZONE
) AS $
DECLARE
    operation_id UUID;
    total_restored INTEGER := 0;
BEGIN
    -- Create operation log entry
    INSERT INTO audit_archive.archive_operations (
        operation_type, table_name, performed_by
    ) VALUES (
        'RESTORE', p_table_name, auth.uid()
    ) RETURNING id INTO operation_id;

    -- Restore logs from archive to active table
    WITH logs_to_restore AS (
        SELECT id, table_name, record_id, action, user_id, user_email,
               timestamp, old_values, new_values, changed_fields,
               ip_address, user_agent, session_id, created_at
        FROM audit_archive.audit_logs_archived
        WHERE table_name = p_table_name
        AND (p_record_id IS NULL OR record_id = p_record_id)
        AND (p_date_from IS NULL OR timestamp >= p_date_from)
        AND (p_date_to IS NULL OR timestamp <= p_date_to)
    ),
    restored_logs AS (
        INSERT INTO audit.audit_logs (
            id, table_name, record_id, action, user_id, user_email,
            timestamp, old_values, new_values, changed_fields,
            ip_address, user_agent, session_id, created_at
        )
        SELECT * FROM logs_to_restore
        ON CONFLICT (id) DO NOTHING
        RETURNING id
    ),
    deleted_archived AS (
        DELETE FROM audit_archive.audit_logs_archived
        WHERE id IN (SELECT id FROM logs_to_restore)
        RETURNING id
    )
    SELECT COUNT(*) INTO total_restored FROM deleted_archived;
    
    -- Update operation status
    UPDATE audit_archive.archive_operations 
    SET status = 'COMPLETED', 
        operation_end = NOW(),
        records_affected = total_restored
    WHERE id = operation_id;
    
    RETURN QUERY SELECT total_restored, NOW();
    
EXCEPTION WHEN OTHERS THEN
    -- Mark operation as failed
    UPDATE audit_archive.archive_operations 
    SET status = 'FAILED', 
        operation_end = NOW(),
        error_message = SQLERRM
    WHERE id = operation_id;
    
    RAISE;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- 5. RETENTION POLICY MANAGEMENT
-- =====================================================

-- Function to update retention policy
CREATE OR REPLACE FUNCTION audit_archive.update_retention_policy(
    p_table_name VARCHAR(50),
    p_retention_days INTEGER,
    p_archive_after_days INTEGER,
    p_enabled BOOLEAN DEFAULT true
)
RETURNS BOOLEAN AS $
BEGIN
    INSERT INTO audit_archive.retention_policies (
        table_name, retention_days, archive_after_days, enabled, updated_at
    ) VALUES (
        p_table_name, p_retention_days, p_archive_after_days, p_enabled, NOW()
    )
    ON CONFLICT (table_name) DO UPDATE SET
        retention_days = EXCLUDED.retention_days,
        archive_after_days = EXCLUDED.archive_after_days,
        enabled = EXCLUDED.enabled,
        updated_at = NOW();
    
    RETURN true;
END;
$ LANGUAGE plpgsql;

-- Function to get archive operation status
CREATE OR REPLACE FUNCTION audit_archive.get_operation_status(
    p_operation_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    operation_type VARCHAR(20),
    table_name VARCHAR(50),
    records_affected INTEGER,
    operation_start TIMESTAMP WITH TIME ZONE,
    operation_end TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20),
    error_message TEXT,
    progress_percentage NUMERIC
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        ao.id,
        ao.operation_type,
        ao.table_name,
        ao.records_affected,
        ao.operation_start,
        ao.operation_end,
        ao.status,
        ao.error_message,
        CASE 
            WHEN ao.total_batches > 0 THEN 
                ROUND((ao.completed_batches::NUMERIC / ao.total_batches) * 100, 2)
            ELSE 0 
        END as progress_percentage
    FROM audit_archive.archive_operations ao
    WHERE (p_operation_id IS NULL OR ao.id = p_operation_id)
    ORDER BY ao.operation_start DESC
    LIMIT p_limit;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- 6. AUTOMATED ARCHIVING SCHEDULER
-- =====================================================

-- Function for automated daily archiving (to be called by cron job)
CREATE OR REPLACE FUNCTION audit_archive.daily_archive_maintenance()
RETURNS TEXT AS $
DECLARE
    result_text TEXT := '';
    archive_result RECORD;
    cleanup_result RECORD;
BEGIN
    result_text := 'Daily Archive Maintenance - ' || NOW()::TEXT || E'\n';
    result_text := result_text || '================================================' || E'\n';
    
    -- Archive old logs
    result_text := result_text || 'ARCHIVING OLD LOGS:' || E'\n';
    FOR archive_result IN 
        SELECT * FROM audit_archive.archive_old_audit_logs()
    LOOP
        result_text := result_text || '- ' || archive_result.table_name || 
                      ': ' || archive_result.archived_count || ' logs archived' || E'\n';
    END LOOP;
    
    result_text := result_text || E'\n';
    
    -- Cleanup very old logs
    result_text := result_text || 'CLEANING UP OLD ARCHIVED LOGS:' || E'\n';
    FOR cleanup_result IN 
        SELECT * FROM audit_archive.cleanup_old_audit_logs()
    LOOP
        result_text := result_text || '- ' || cleanup_result.table_name || 
                      ': ' || cleanup_result.deleted_count || ' logs deleted' || E'\n';
    END LOOP;
    
    result_text := result_text || E'\n';
    result_text := result_text || 'Maintenance completed at: ' || NOW()::TEXT;
    
    RETURN result_text;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- 7. ROW LEVEL SECURITY FOR ARCHIVE TABLES
-- =====================================================

-- Enable RLS on archive tables
ALTER TABLE audit_archive.audit_logs_archived ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_archive.retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_archive.archive_operations ENABLE ROW LEVEL SECURITY;

-- Policies for archived audit logs (same as main audit table)
CREATE POLICY "Users can view their own archived audit logs" ON audit_archive.audit_logs_archived
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins and managers can view all archived audit logs" ON audit_archive.audit_logs_archived
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- Policies for retention policies (admin only)
CREATE POLICY "Only admins can manage retention policies" ON audit_archive.retention_policies
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Policies for archive operations (admin and manager)
CREATE POLICY "Admins and managers can view archive operations" ON audit_archive.archive_operations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- =====================================================
-- 8. COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON SCHEMA audit_archive IS 'Schema for archived audit logs and retention management';
COMMENT ON TABLE audit_archive.audit_logs_archived IS 'Archived audit logs for long-term storage';
COMMENT ON TABLE audit_archive.retention_policies IS 'Configuration for audit log retention and archiving policies';
COMMENT ON TABLE audit_archive.archive_operations IS 'Log of archive operations for monitoring and auditing';

COMMENT ON FUNCTION audit_archive.get_retention_status() IS 'Get current retention status for all audited tables';
COMMENT ON FUNCTION audit_archive.archive_old_audit_logs(VARCHAR, INTEGER) IS 'Archive old audit logs based on retention policies';
COMMENT ON FUNCTION audit_archive.cleanup_old_audit_logs(VARCHAR, INTEGER) IS 'Permanently delete old archived logs based on retention policies';
COMMENT ON FUNCTION audit_archive.search_archived_logs(VARCHAR, UUID, UUID, VARCHAR, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, INTEGER, INTEGER) IS 'Search archived audit logs with filtering';
COMMENT ON FUNCTION audit_archive.get_complete_audit_history(VARCHAR, UUID, INTEGER, INTEGER) IS 'Get complete audit history including both active and archived logs';
COMMENT ON FUNCTION audit_archive.restore_archived_logs(VARCHAR, UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) IS 'Restore archived logs back to active audit table';
COMMENT ON FUNCTION audit_archive.update_retention_policy(VARCHAR, INTEGER, INTEGER, BOOLEAN) IS 'Update or create retention policy for a table';
COMMENT ON FUNCTION audit_archive.get_operation_status(UUID, INTEGER) IS 'Get status of archive operations';
COMMENT ON FUNCTION audit_archive.daily_archive_maintenance() IS 'Automated daily maintenance function for archiving and cleanup';

-- Log successful archiving system setup
DO $$
BEGIN
    RAISE NOTICE 'Audit archiving system created successfully';
    RAISE NOTICE 'Archive schema: audit_archive';
    RAISE NOTICE 'Archive tables: audit_logs_archived, retention_policies, archive_operations';
    RAISE NOTICE 'Archive functions: 9 management functions created';
    RAISE NOTICE 'Default retention policies: Set for transactions, tasks, reservations, lofts';
    RAISE NOTICE 'RLS policies: Security policies applied to all archive tables';
    RAISE NOTICE 'Ready for automated archiving operations';
END $$;