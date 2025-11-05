-- =====================================================
-- BACKUP AND ARCHIVE SYSTEM - MINIMAL VERSION
-- =====================================================
-- This script creates only the essential tables without RLS policies

-- First, let's check and fix the archive_policies table
DO $$
BEGIN
    -- Add next_execution column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'archive_policies' 
        AND column_name = 'next_execution'
    ) THEN
        ALTER TABLE archive_policies ADD COLUMN next_execution TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- =====================================================
-- CREATE MISSING TABLES
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
    archive_size BIGINT DEFAULT 0,
    archive_path TEXT NOT NULL,
    compression_ratio DECIMAL(5,2),
    search_index_path TEXT,
    retention_until TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create archived_data_index table for searchable archived records
CREATE TABLE IF NOT EXISTS archived_data_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    archive_record_id UUID NOT NULL REFERENCES archive_records(id) ON DELETE CASCADE,
    original_table VARCHAR(100) NOT NULL,
    original_record_id UUID NOT NULL,
    record_data JSONB NOT NULL,
    search_vector TSVECTOR,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CREATE INDEXES
-- =====================================================

-- Indexes for backup_alerts
CREATE INDEX IF NOT EXISTS idx_backup_alerts_type ON backup_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_backup_alerts_severity ON backup_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_backup_alerts_resolved ON backup_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_backup_alerts_created ON backup_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_alerts_backup_id ON backup_alerts(backup_id);

-- Indexes for archive_policies (if not already exist)
CREATE INDEX IF NOT EXISTS idx_archive_policies_table ON archive_policies(table_name);
CREATE INDEX IF NOT EXISTS idx_archive_policies_active ON archive_policies(is_active);
CREATE INDEX IF NOT EXISTS idx_archive_policies_next_exec ON archive_policies(next_execution);
CREATE INDEX IF NOT EXISTS idx_archive_policies_created_by ON archive_policies(created_by);

-- Indexes for archive_records
CREATE INDEX IF NOT EXISTS idx_archive_records_type ON archive_records(archive_type);
CREATE INDEX IF NOT EXISTS idx_archive_records_status ON archive_records(status);
CREATE INDEX IF NOT EXISTS idx_archive_records_table ON archive_records(source_table);
CREATE INDEX IF NOT EXISTS idx_archive_records_policy ON archive_records(archive_policy_id);
CREATE INDEX IF NOT EXISTS idx_archive_records_started ON archive_records(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_archive_records_retention ON archive_records(retention_until);

-- Indexes for archived_data_index
CREATE INDEX IF NOT EXISTS idx_archived_data_archive_id ON archived_data_index(archive_record_id);
CREATE INDEX IF NOT EXISTS idx_archived_data_table ON archived_data_index(original_table);
CREATE INDEX IF NOT EXISTS idx_archived_data_original_id ON archived_data_index(original_record_id);
CREATE INDEX IF NOT EXISTS idx_archived_data_archived_at ON archived_data_index(archived_at DESC);
CREATE INDEX IF NOT EXISTS idx_archived_data_search ON archived_data_index USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_archived_data_record_data ON archived_data_index USING GIN(record_data);

-- =====================================================
-- INSERT DEFAULT CONFIGURATION
-- =====================================================

-- Insert default backup configuration if not exists
INSERT INTO system_configurations (category, config_key, config_value, modified_at)
VALUES 
    ('backup', 'retention_days', '30', NOW()),
    ('backup', 'compression_enabled', 'true', NOW()),
    ('backup', 'encryption_enabled', 'true', NOW()),
    ('backup', 'max_concurrent_backups', '2', NOW()),
    ('backup', 'storage_location', '"/backups"', NOW()),
    ('backup', 'backup_schedule', '{"full_backup_cron": "0 2 * * 0", "incremental_backup_cron": "0 2 * * 1-6"}', NOW()),
    ('backup', 'notification_settings', '{"on_success": true, "on_failure": true, "email_recipients": []}', NOW())
ON CONFLICT (category, config_key) DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================

-- Table comments
COMMENT ON TABLE backup_alerts IS 'Stores alerts and notifications related to backup operations';
COMMENT ON TABLE archive_records IS 'Tracks the execution and results of archiving operations';
COMMENT ON TABLE archived_data_index IS 'Provides searchable index for archived data records';

-- Success message
SELECT 'Backup and Archive system tables created successfully!' as result;