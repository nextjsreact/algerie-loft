-- =====================================================
-- BACKUP AND ARCHIVE SYSTEM SCHEMA
-- =====================================================
-- This file contains the complete schema for the backup and archive management system
-- including alerts, policies, and monitoring tables.

-- =====================================================
-- SECTION 1: BACKUP ALERTS TABLE
-- =====================================================

-- Create backup_alerts table for monitoring and alerting
CREATE TABLE IF NOT EXISTS backup_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('BACKUP_FAILED', 'BACKUP_OVERDUE', 'STORAGE_FULL', 'BACKUP_CORRUPTED', 'RETENTION_WARNING')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    backup_id UUID REFERENCES backup_records(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for backup_alerts
CREATE INDEX IF NOT EXISTS idx_backup_alerts_type ON backup_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_backup_alerts_severity ON backup_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_backup_alerts_resolved ON backup_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_backup_alerts_created ON backup_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_alerts_backup_id ON backup_alerts(backup_id);

-- =====================================================
-- SECTION 2: ARCHIVE POLICIES TABLE
-- =====================================================

-- Create archive_policies table for managing data archiving rules
CREATE TABLE IF NOT EXISTS archive_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    table_name VARCHAR(100) NOT NULL,
    archive_condition TEXT NOT NULL, -- SQL WHERE condition for archiving
    retention_days INTEGER NOT NULL CHECK (retention_days > 0),
    compression_enabled BOOLEAN DEFAULT TRUE,
    create_search_index BOOLEAN DEFAULT TRUE,
    schedule_cron VARCHAR(100), -- Cron expression for scheduled execution
    is_active BOOLEAN DEFAULT TRUE,
    last_executed TIMESTAMP WITH TIME ZONE,
    next_execution TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for archive_policies
CREATE INDEX IF NOT EXISTS idx_archive_policies_table ON archive_policies(table_name);
CREATE INDEX IF NOT EXISTS idx_archive_policies_active ON archive_policies(is_active);
CREATE INDEX IF NOT EXISTS idx_archive_policies_next_exec ON archive_policies(next_execution);
CREATE INDEX IF NOT EXISTS idx_archive_policies_created_by ON archive_policies(created_by);

-- =====================================================
-- SECTION 3: ARCHIVE RECORDS TABLE
-- =====================================================

-- Create archive_records table to track archiving operations
CREATE TABLE IF NOT EXISTS archive_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    archive_type VARCHAR(20) NOT NULL CHECK (archive_type IN ('DATA', 'LOGS', 'BACKUPS', 'DOCUMENTS')),
    source_table VARCHAR(100) NOT NULL,
    archive_policy_id UUID NOT NULL REFERENCES archive_policies(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED')),
    initiated_by UUID NOT NULL REFERENCES auth.users(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    records_archived INTEGER DEFAULT 0,
    archive_size BIGINT DEFAULT 0, -- Size in bytes
    archive_path TEXT NOT NULL,
    compression_ratio DECIMAL(5,2), -- Compression ratio as percentage
    search_index_path TEXT, -- Path to search index file
    retention_until TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for archive_records
CREATE INDEX IF NOT EXISTS idx_archive_records_type ON archive_records(archive_type);
CREATE INDEX IF NOT EXISTS idx_archive_records_status ON archive_records(status);
CREATE INDEX IF NOT EXISTS idx_archive_records_table ON archive_records(source_table);
CREATE INDEX IF NOT EXISTS idx_archive_records_policy ON archive_records(archive_policy_id);
CREATE INDEX IF NOT EXISTS idx_archive_records_started ON archive_records(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_archive_records_retention ON archive_records(retention_until);

-- =====================================================
-- SECTION 4: ARCHIVED DATA SEARCH INDEX TABLE
-- =====================================================

-- Create archived_data_index table for searchable archived records
CREATE TABLE IF NOT EXISTS archived_data_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    archive_record_id UUID NOT NULL REFERENCES archive_records(id) ON DELETE CASCADE,
    original_table VARCHAR(100) NOT NULL,
    original_record_id UUID NOT NULL,
    record_data JSONB NOT NULL,
    search_vector TSVECTOR, -- Full-text search vector
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for archived_data_index
CREATE INDEX IF NOT EXISTS idx_archived_data_archive_id ON archived_data_index(archive_record_id);
CREATE INDEX IF NOT EXISTS idx_archived_data_table ON archived_data_index(original_table);
CREATE INDEX IF NOT EXISTS idx_archived_data_original_id ON archived_data_index(original_record_id);
CREATE INDEX IF NOT EXISTS idx_archived_data_archived_at ON archived_data_index(archived_at DESC);
CREATE INDEX IF NOT EXISTS idx_archived_data_search ON archived_data_index USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_archived_data_record_data ON archived_data_index USING GIN(record_data);

-- =====================================================
-- SECTION 5: BACKUP MONITORING FUNCTIONS
-- =====================================================

-- Function to automatically create alerts for failed backups
CREATE OR REPLACE FUNCTION create_backup_failure_alert()
RETURNS TRIGGER AS $$$
BEGIN
    -- Only create alert if backup failed
    IF NEW.status = 'FAILED' AND OLD.status != 'FAILED' THEN
        INSERT INTO backup_alerts (
            alert_type,
            severity,
            title,
            description,
            backup_id,
            metadata
        ) VALUES (
            'BACKUP_FAILED',
            'HIGH',
            'Backup Failed',
            COALESCE(NEW.error_message, 'Backup operation failed without specific error message'),
            NEW.id,
            jsonb_build_object(
                'backup_type', NEW.backup_type,
                'started_at', NEW.started_at,
                'failed_at', NEW.completed_at
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create alerts for backup failures
DROP TRIGGER IF EXISTS backup_failure_alert_trigger ON backup_records;
CREATE TRIGGER backup_failure_alert_trigger
    AFTER UPDATE ON backup_records
    FOR EACH ROW
    EXECUTE FUNCTION create_backup_failure_alert();

-- =====================================================
-- SECTION 6: ARCHIVE MONITORING FUNCTIONS
-- =====================================================

-- Function to update archive policy execution timestamps
CREATE OR REPLACE FUNCTION update_archive_policy_execution()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the policy's last_executed timestamp when archive starts
    IF NEW.status = 'IN_PROGRESS' AND OLD.status = 'PENDING' THEN
        UPDATE archive_policies 
        SET 
            last_executed = NEW.started_at,
            updated_at = NOW()
        WHERE id = NEW.archive_policy_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update policy execution timestamps
DROP TRIGGER IF EXISTS archive_policy_execution_trigger ON archive_records;
CREATE TRIGGER archive_policy_execution_trigger
    AFTER UPDATE ON archive_records
    FOR EACH ROW
    EXECUTE FUNCTION update_archive_policy_execution();

-- =====================================================
-- SECTION 7: CLEANUP FUNCTIONS
-- =====================================================

-- Function to clean up expired backup alerts
CREATE OR REPLACE FUNCTION cleanup_expired_backup_alerts()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete resolved alerts older than 6 months
    DELETE FROM backup_alerts 
    WHERE is_resolved = TRUE 
    AND resolved_at < NOW() - INTERVAL '6 months';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired archive records
CREATE OR REPLACE FUNCTION cleanup_expired_archives()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete archive records that have exceeded their retention period
    DELETE FROM archive_records 
    WHERE retention_until IS NOT NULL 
    AND retention_until < NOW()
    AND status = 'COMPLETED';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SECTION 8: UTILITY FUNCTIONS
-- =====================================================

-- Function to get backup statistics
CREATE OR REPLACE FUNCTION get_backup_statistics(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    total_backups BIGINT,
    successful_backups BIGINT,
    failed_backups BIGINT,
    pending_backups BIGINT,
    total_size BIGINT,
    success_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_backups,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as successful_backups,
        COUNT(*) FILTER (WHERE status = 'FAILED') as failed_backups,
        COUNT(*) FILTER (WHERE status IN ('PENDING', 'IN_PROGRESS')) as pending_backups,
        COALESCE(SUM(file_size) FILTER (WHERE status = 'COMPLETED'), 0) as total_size,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE status = 'COMPLETED')::DECIMAL / COUNT(*)) * 100, 2)
            ELSE 0
        END as success_rate
    FROM backup_records 
    WHERE started_at >= NOW() - (days_back || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Function to get archive statistics
CREATE OR REPLACE FUNCTION get_archive_statistics()
RETURNS TABLE (
    total_archives BIGINT,
    total_archived_records BIGINT,
    total_archive_size BIGINT,
    active_policies BIGINT,
    completed_archives BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_archives,
        COALESCE(SUM(records_archived), 0) as total_archived_records,
        COALESCE(SUM(archive_size), 0) as total_archive_size,
        (SELECT COUNT(*) FROM archive_policies WHERE is_active = TRUE) as active_policies,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_archives
    FROM archive_records;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SECTION 9: RLS POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE backup_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_data_index ENABLE ROW LEVEL SECURITY;

-- Backup alerts policies (superusers only)
CREATE POLICY "backup_alerts_superuser_policy" ON backup_alerts
    FOR ALL
    USING (can_manage_backups())
    WITH CHECK (can_manage_backups());

-- Archive policies policies (superusers only)
CREATE POLICY "archive_policies_superuser_policy" ON archive_policies
    FOR ALL
    USING (can_manage_backups() OR can_manage_system_config())
    WITH CHECK (can_manage_backups() OR can_manage_system_config());

-- Archive records policies (superusers only)
CREATE POLICY "archive_records_superuser_policy" ON archive_records
    FOR ALL
    USING (can_manage_backups())
    WITH CHECK (can_manage_backups());

-- Archived data index policies (superusers only)
CREATE POLICY "archived_data_index_superuser_policy" ON archived_data_index
    FOR ALL
    USING (can_manage_backups())
    WITH CHECK (can_manage_backups());

-- =====================================================
-- SECTION 10: GRANTS AND PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users for the utility functions
GRANT EXECUTE ON FUNCTION cleanup_expired_backup_alerts() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_archives() TO authenticated;
GRANT EXECUTE ON FUNCTION get_backup_statistics(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_archive_statistics() TO authenticated;

-- =====================================================
-- SECTION 11: COMMENTS AND DOCUMENTATION
-- =====================================================

-- Table comments
COMMENT ON TABLE backup_alerts IS 'Stores alerts and notifications related to backup operations';
COMMENT ON TABLE archive_policies IS 'Defines rules and policies for data archiving';
COMMENT ON TABLE archive_records IS 'Tracks the execution and results of archiving operations';
COMMENT ON TABLE archived_data_index IS 'Provides searchable index for archived data records';

-- Function comments
COMMENT ON FUNCTION create_backup_failure_alert() IS 'Automatically creates alerts when backups fail';
COMMENT ON FUNCTION update_archive_policy_execution() IS 'Updates policy execution timestamps when archives run';
COMMENT ON FUNCTION cleanup_expired_backup_alerts() IS 'Removes old resolved backup alerts';
COMMENT ON FUNCTION cleanup_expired_archives() IS 'Removes expired archive records';
COMMENT ON FUNCTION get_backup_statistics(INTEGER) IS 'Returns backup statistics for specified number of days';
COMMENT ON FUNCTION get_archive_statistics() IS 'Returns overall archive system statistics';

-- =====================================================
-- SECTION 12: INITIAL DATA
-- =====================================================

-- Insert default backup configuration if not exists
INSERT INTO system_configurations (category, config_key, config_value, modified_at)
VALUES 
    ('backup', 'retention_days', '30', NOW()),
    ('backup', 'compression_enabled', 'true', NOW()),
    ('backup', 'encryption_enabled', 'true', NOW()),
    ('backup', 'max_concurrent_backups', '2', NOW()),
    ('backup', 'storage_location', '/backups', NOW()),
    ('backup', 'backup_schedule', '{"full_backup_cron": "0 2 * * 0", "incremental_backup_cron": "0 2 * * 1-6"}', NOW()),
    ('backup', 'notification_settings', '{"on_success": true, "on_failure": true, "email_recipients": []}', NOW())
ON CONFLICT (category, config_key) DO NOTHING;

-- =====================================================
-- END OF SCHEMA
-- =====================================================