-- =====================================================
-- CREATE BACKUP_RECORDS TABLE
-- =====================================================
-- Run this script in Supabase SQL Editor to enable backup functionality
-- This creates only the backup_records table and its dependencies

-- =====================================================
-- STEP 1: Create backup_records table
-- =====================================================

CREATE TABLE IF NOT EXISTS backup_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_type VARCHAR(20) NOT NULL CHECK (backup_type IN ('FULL', 'INCREMENTAL', 'MANUAL', 'SCHEDULED')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED')),
    initiated_by UUID REFERENCES auth.users(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    file_size BIGINT, -- Size in bytes
    file_path TEXT,
    checksum VARCHAR(64), -- SHA-256 checksum
    compression_ratio DECIMAL(5,2), -- Compression ratio as percentage
    tables_included JSONB DEFAULT '[]'::jsonb, -- Array of table names included
    error_message TEXT,
    retention_until TIMESTAMP WITH TIME ZONE,
    is_encrypted BOOLEAN DEFAULT TRUE,
    encryption_key_id VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 2: Create indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_backup_records_status ON backup_records(status);
CREATE INDEX IF NOT EXISTS idx_backup_records_type ON backup_records(backup_type);
CREATE INDEX IF NOT EXISTS idx_backup_records_initiated_by ON backup_records(initiated_by);
CREATE INDEX IF NOT EXISTS idx_backup_records_started_at ON backup_records(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_records_retention ON backup_records(retention_until);
CREATE INDEX IF NOT EXISTS idx_backup_records_completed ON backup_records(status, completed_at DESC);

-- =====================================================
-- STEP 3: Create system_configurations table (for backup settings)
-- =====================================================

CREATE TABLE IF NOT EXISTS system_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL,
    config_key VARCHAR(100) NOT NULL,
    config_value JSONB NOT NULL,
    previous_value JSONB,
    data_type VARCHAR(20) NOT NULL CHECK (data_type IN ('string', 'number', 'boolean', 'object', 'array')),
    description TEXT,
    is_sensitive BOOLEAN DEFAULT FALSE,
    requires_restart BOOLEAN DEFAULT FALSE,
    validation_rules JSONB DEFAULT '{}'::jsonb,
    modified_by UUID REFERENCES auth.users(id),
    modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_config_key UNIQUE(category, config_key)
);

-- Indexes for system_configurations
CREATE INDEX IF NOT EXISTS idx_system_configurations_category ON system_configurations(category);
CREATE INDEX IF NOT EXISTS idx_system_configurations_key ON system_configurations(config_key);

-- =====================================================
-- STEP 4: Insert default backup configurations
-- =====================================================

INSERT INTO system_configurations (category, config_key, config_value, data_type, description, is_sensitive) VALUES
('backup', 'retention_days', '30', 'number', 'Number of days to retain backup files', FALSE),
('backup', 'compression_enabled', 'true', 'boolean', 'Enable backup compression', FALSE),
('backup', 'encryption_enabled', 'true', 'boolean', 'Enable backup encryption', FALSE),
('backup', 'max_concurrent_backups', '2', 'number', 'Maximum number of concurrent backups', FALSE),
('backup', 'storage_location', '"/backups"', 'string', 'Backup storage directory path', FALSE),
('backup', 'backup_schedule', '{"full_backup_cron":"0 2 * * 0","incremental_backup_cron":"0 2 * * 1-6"}', 'object', 'Backup schedule configuration', FALSE),
('backup', 'notification_settings', '{"on_success":true,"on_failure":true,"email_recipients":[]}', 'object', 'Backup notification settings', FALSE)
ON CONFLICT (category, config_key) DO NOTHING;

-- =====================================================
-- STEP 5: Enable Row Level Security
-- =====================================================

ALTER TABLE backup_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_configurations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 6: Create helper function to check superuser status
-- =====================================================

-- Simple function to check if user is superuser (based on role in profiles table)
CREATE OR REPLACE FUNCTION is_superuser_role()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if current user has superuser role in profiles table
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'superuser'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 7: Create RLS policies (drop existing first)
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Superusers can view all backup records" ON backup_records;
DROP POLICY IF EXISTS "Superusers can insert backup records" ON backup_records;
DROP POLICY IF EXISTS "Superusers can update backup records" ON backup_records;
DROP POLICY IF EXISTS "Superusers can delete backup records" ON backup_records;
DROP POLICY IF EXISTS "Superusers can manage backup records" ON backup_records;

DROP POLICY IF EXISTS "Superusers can view system configurations" ON system_configurations;
DROP POLICY IF EXISTS "Superusers can insert system configurations" ON system_configurations;
DROP POLICY IF EXISTS "Superusers can update system configurations" ON system_configurations;
DROP POLICY IF EXISTS "Superusers can delete system configurations" ON system_configurations;
DROP POLICY IF EXISTS "Superusers can manage system configurations" ON system_configurations;

-- Backup records policies - only superusers can access
CREATE POLICY "Superusers can view all backup records" ON backup_records
    FOR SELECT USING (is_superuser_role());

CREATE POLICY "Superusers can insert backup records" ON backup_records
    FOR INSERT WITH CHECK (is_superuser_role());

CREATE POLICY "Superusers can update backup records" ON backup_records
    FOR UPDATE USING (is_superuser_role());

CREATE POLICY "Superusers can delete backup records" ON backup_records
    FOR DELETE USING (is_superuser_role());

-- System configurations policies - only superusers can access
CREATE POLICY "Superusers can view system configurations" ON system_configurations
    FOR SELECT USING (is_superuser_role());

CREATE POLICY "Superusers can insert system configurations" ON system_configurations
    FOR INSERT WITH CHECK (is_superuser_role());

CREATE POLICY "Superusers can update system configurations" ON system_configurations
    FOR UPDATE USING (is_superuser_role());

CREATE POLICY "Superusers can delete system configurations" ON system_configurations
    FOR DELETE USING (is_superuser_role());

-- =====================================================
-- STEP 8: Grant permissions
-- =====================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON backup_records TO authenticated;
GRANT ALL ON system_configurations TO authenticated;
GRANT EXECUTE ON FUNCTION is_superuser_role() TO authenticated;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'BACKUP SYSTEM TABLES CREATED';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '- backup_records (with 6 indexes)';
    RAISE NOTICE '- system_configurations (with 2 indexes)';
    RAISE NOTICE '';
    RAISE NOTICE 'RLS policies created:';
    RAISE NOTICE '- 4 policies on backup_records';
    RAISE NOTICE '- 4 policies on system_configurations';
    RAISE NOTICE '';
    RAISE NOTICE 'Default backup configurations inserted';
    RAISE NOTICE '';
    RAISE NOTICE 'The backup manager is now ready to use!';
    RAISE NOTICE 'Access it at: /admin/superuser/backup';
    RAISE NOTICE '========================================';
END $$;
