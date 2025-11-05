-- =====================================================
-- SUPERUSER ADMINISTRATION SYSTEM - DATABASE SCHEMA
-- =====================================================
-- This script creates the complete database schema for the Superuser Administration System
-- It extends the existing audit system and adds superuser-specific functionality

-- =====================================================
-- SECTION 1: SUPERUSER PROFILES TABLE
-- =====================================================

-- Create superuser_profiles table to track superuser permissions and activities
CREATE TABLE IF NOT EXISTS superuser_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    permissions JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    last_activity TIMESTAMP WITH TIME ZONE,
    ip_restrictions JSONB DEFAULT '[]'::jsonb, -- Array of allowed IP addresses/ranges
    session_timeout_minutes INTEGER DEFAULT 60,
    require_2fa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_superuser_per_user UNIQUE(user_id),
    CONSTRAINT valid_session_timeout CHECK (session_timeout_minutes > 0 AND session_timeout_minutes <= 480)
);

-- Indexes for superuser_profiles
CREATE INDEX IF NOT EXISTS idx_superuser_profiles_user_id ON superuser_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_superuser_profiles_active ON superuser_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_superuser_profiles_granted_by ON superuser_profiles(granted_by);
CREATE INDEX IF NOT EXISTS idx_superuser_profiles_last_activity ON superuser_profiles(last_activity);

-- =====================================================
-- SECTION 2: BACKUP RECORDS TABLE
-- =====================================================

-- Create backup_records table to track system backups
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

-- Indexes for backup_records
CREATE INDEX IF NOT EXISTS idx_backup_records_status ON backup_records(status);
CREATE INDEX IF NOT EXISTS idx_backup_records_type ON backup_records(backup_type);
CREATE INDEX IF NOT EXISTS idx_backup_records_initiated_by ON backup_records(initiated_by);
CREATE INDEX IF NOT EXISTS idx_backup_records_started_at ON backup_records(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_records_retention ON backup_records(retention_until);
CREATE INDEX IF NOT EXISTS idx_backup_records_completed ON backup_records(status, completed_at DESC);

-- =====================================================
-- SECTION 3: SYSTEM CONFIGURATIONS TABLE
-- =====================================================

-- Create system_configurations table for managing system-wide settings
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
    
    -- Constraints
    CONSTRAINT unique_config_key UNIQUE(category, config_key)
);

-- Indexes for system_configurations
CREATE INDEX IF NOT EXISTS idx_system_configurations_category ON system_configurations(category);
CREATE INDEX IF NOT EXISTS idx_system_configurations_key ON system_configurations(config_key);
CREATE INDEX IF NOT EXISTS idx_system_configurations_modified_by ON system_configurations(modified_by);
CREATE INDEX IF NOT EXISTS idx_system_configurations_modified_at ON system_configurations(modified_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_configurations_sensitive ON system_configurations(is_sensitive);

-- =====================================================
-- SECTION 4: SUPERUSER AUDIT LOGS (Enhanced)
-- =====================================================

-- Create superuser_audit_logs table for enhanced superuser activity tracking
CREATE TABLE IF NOT EXISTS superuser_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    superuser_id UUID NOT NULL REFERENCES superuser_profiles(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    action_category VARCHAR(30) NOT NULL CHECK (action_category IN ('USER_MANAGEMENT', 'BACKUP', 'SYSTEM_CONFIG', 'SECURITY', 'MAINTENANCE', 'ARCHIVE')),
    action_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    target_user_id UUID REFERENCES auth.users(id),
    target_table VARCHAR(50),
    target_record_id UUID,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    severity VARCHAR(10) NOT NULL DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    execution_time_ms INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for superuser_audit_logs
CREATE INDEX IF NOT EXISTS idx_superuser_audit_logs_superuser_id ON superuser_audit_logs(superuser_id);
CREATE INDEX IF NOT EXISTS idx_superuser_audit_logs_action_type ON superuser_audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_superuser_audit_logs_category ON superuser_audit_logs(action_category);
CREATE INDEX IF NOT EXISTS idx_superuser_audit_logs_timestamp ON superuser_audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_superuser_audit_logs_severity ON superuser_audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_superuser_audit_logs_target_user ON superuser_audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_superuser_audit_logs_success ON superuser_audit_logs(success);
CREATE INDEX IF NOT EXISTS idx_superuser_audit_logs_ip ON superuser_audit_logs(ip_address);

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_superuser_audit_logs_user_timestamp ON superuser_audit_logs(superuser_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_superuser_audit_logs_category_timestamp ON superuser_audit_logs(action_category, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_superuser_audit_logs_severity_timestamp ON superuser_audit_logs(severity, timestamp DESC);

-- GIN index for JSONB action_details
CREATE INDEX IF NOT EXISTS idx_superuser_audit_logs_action_details_gin ON superuser_audit_logs USING GIN (action_details);

-- =====================================================
-- SECTION 5: ARCHIVE MANAGEMENT TABLES
-- =====================================================

-- Create archive_policies table for data archiving rules
CREATE TABLE IF NOT EXISTS archive_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_name VARCHAR(100) NOT NULL UNIQUE,
    table_name VARCHAR(50) NOT NULL,
    archive_after_days INTEGER NOT NULL CHECK (archive_after_days > 0),
    conditions JSONB DEFAULT '{}'::jsonb, -- Additional conditions for archiving
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create archived_records table to track archived data
CREATE TABLE IF NOT EXISTS archived_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_table VARCHAR(50) NOT NULL,
    original_record_id UUID NOT NULL,
    archived_data JSONB NOT NULL,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archived_by UUID REFERENCES auth.users(id),
    archive_policy_id UUID REFERENCES archive_policies(id),
    can_restore BOOLEAN DEFAULT TRUE,
    restored_at TIMESTAMP WITH TIME ZONE,
    restored_by UUID REFERENCES auth.users(id),
    checksum VARCHAR(64), -- Data integrity verification
    compression_used BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for archive tables
CREATE INDEX IF NOT EXISTS idx_archive_policies_table_name ON archive_policies(table_name);
CREATE INDEX IF NOT EXISTS idx_archive_policies_active ON archive_policies(is_active);
CREATE INDEX IF NOT EXISTS idx_archived_records_table ON archived_records(original_table);
CREATE INDEX IF NOT EXISTS idx_archived_records_original_id ON archived_records(original_record_id);
CREATE INDEX IF NOT EXISTS idx_archived_records_archived_at ON archived_records(archived_at DESC);
CREATE INDEX IF NOT EXISTS idx_archived_records_can_restore ON archived_records(can_restore);
CREATE INDEX IF NOT EXISTS idx_archived_records_policy ON archived_records(archive_policy_id);

-- GIN index for archived_data JSONB
CREATE INDEX IF NOT EXISTS idx_archived_records_data_gin ON archived_records USING GIN (archived_data);

-- =====================================================
-- SECTION 6: SUPERUSER FUNCTIONS
-- =====================================================

-- Function to log superuser actions
CREATE OR REPLACE FUNCTION log_superuser_action(
    p_superuser_id UUID,
    p_action_type VARCHAR(50),
    p_action_category VARCHAR(30),
    p_action_details JSONB DEFAULT '{}'::jsonb,
    p_target_user_id UUID DEFAULT NULL,
    p_target_table VARCHAR(50) DEFAULT NULL,
    p_target_record_id UUID DEFAULT NULL,
    p_severity VARCHAR(10) DEFAULT 'MEDIUM',
    p_success BOOLEAN DEFAULT TRUE,
    p_error_message TEXT DEFAULT NULL,
    p_execution_time_ms INTEGER DEFAULT NULL
)
RETURNS UUID AS $
DECLARE
    log_id UUID;
    current_ip INET;
    current_user_agent TEXT;
    current_session_id VARCHAR(255);
BEGIN
    -- Get current session context
    BEGIN
        current_ip := NULLIF(current_setting('audit.current_ip_address', true), '')::INET;
        current_user_agent := NULLIF(current_setting('audit.current_user_agent', true), '');
        current_session_id := NULLIF(current_setting('audit.current_session_id', true), '');
    EXCEPTION WHEN OTHERS THEN
        current_ip := NULL;
        current_user_agent := NULL;
        current_session_id := NULL;
    END;
    
    -- Insert superuser audit log
    INSERT INTO superuser_audit_logs (
        superuser_id,
        action_type,
        action_category,
        action_details,
        target_user_id,
        target_table,
        target_record_id,
        ip_address,
        user_agent,
        session_id,
        severity,
        success,
        error_message,
        execution_time_ms
    ) VALUES (
        p_superuser_id,
        p_action_type,
        p_action_category,
        p_action_details,
        p_target_user_id,
        p_target_table,
        p_target_record_id,
        current_ip,
        current_user_agent,
        current_session_id,
        p_severity,
        p_success,
        p_error_message,
        p_execution_time_ms
    ) RETURNING id INTO log_id;
    
    -- Update superuser last activity
    UPDATE superuser_profiles 
    SET last_activity = NOW(), updated_at = NOW()
    WHERE id = p_superuser_id;
    
    RETURN log_id;
END;
$ LANGUAGE plpgsql;

-- Function to check if user is superuser
CREATE OR REPLACE FUNCTION is_superuser(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $
DECLARE
    check_user_id UUID;
    is_super BOOLEAN := FALSE;
BEGIN
    -- Use provided user_id or current authenticated user
    check_user_id := COALESCE(p_user_id, auth.uid());
    
    IF check_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user has active superuser profile
    SELECT EXISTS(
        SELECT 1 FROM superuser_profiles 
        WHERE user_id = check_user_id 
        AND is_active = TRUE
    ) INTO is_super;
    
    RETURN is_super;
END;
$ LANGUAGE plpgsql;

-- Function to get superuser permissions
CREATE OR REPLACE FUNCTION get_superuser_permissions(p_user_id UUID DEFAULT NULL)
RETURNS JSONB AS $
DECLARE
    check_user_id UUID;
    user_permissions JSONB := '[]'::jsonb;
BEGIN
    check_user_id := COALESCE(p_user_id, auth.uid());
    
    IF check_user_id IS NULL THEN
        RETURN '[]'::jsonb;
    END IF;
    
    SELECT COALESCE(permissions, '[]'::jsonb) 
    INTO user_permissions
    FROM superuser_profiles 
    WHERE user_id = check_user_id 
    AND is_active = TRUE;
    
    RETURN COALESCE(user_permissions, '[]'::jsonb);
END;
$ LANGUAGE plpgsql;

-- Function to validate superuser session
CREATE OR REPLACE FUNCTION validate_superuser_session(p_user_id UUID DEFAULT NULL)
RETURNS TABLE(
    is_valid BOOLEAN,
    reason VARCHAR(255),
    session_expires_at TIMESTAMP WITH TIME ZONE
) AS $
DECLARE
    check_user_id UUID;
    profile_record RECORD;
    session_timeout_minutes INTEGER;
    last_activity TIMESTAMP WITH TIME ZONE;
    expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    check_user_id := COALESCE(p_user_id, auth.uid());
    
    IF check_user_id IS NULL THEN
        RETURN QUERY SELECT FALSE, 'No authenticated user'::VARCHAR(255), NULL::TIMESTAMP WITH TIME ZONE;
        RETURN;
    END IF;
    
    -- Get superuser profile
    SELECT sp.*, sp.session_timeout_minutes, sp.last_activity
    INTO profile_record, session_timeout_minutes, last_activity
    FROM superuser_profiles sp
    WHERE sp.user_id = check_user_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'User is not a superuser'::VARCHAR(255), NULL::TIMESTAMP WITH TIME ZONE;
        RETURN;
    END IF;
    
    IF NOT profile_record.is_active THEN
        RETURN QUERY SELECT FALSE, 'Superuser account is inactive'::VARCHAR(255), NULL::TIMESTAMP WITH TIME ZONE;
        RETURN;
    END IF;
    
    -- Check session timeout
    IF last_activity IS NOT NULL THEN
        expires_at := last_activity + (session_timeout_minutes || ' minutes')::INTERVAL;
        IF NOW() > expires_at THEN
            RETURN QUERY SELECT FALSE, 'Session has expired'::VARCHAR(255), expires_at;
            RETURN;
        END IF;
    ELSE
        expires_at := NOW() + (session_timeout_minutes || ' minutes')::INTERVAL;
    END IF;
    
    RETURN QUERY SELECT TRUE, 'Valid session'::VARCHAR(255), expires_at;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- SECTION 7: ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all superuser tables
ALTER TABLE superuser_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE superuser_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_records ENABLE ROW LEVEL SECURITY;

-- Superuser profiles policies
CREATE POLICY "Superusers can view all superuser profiles" ON superuser_profiles
    FOR SELECT USING (is_superuser());

CREATE POLICY "Superusers can manage superuser profiles" ON superuser_profiles
    FOR ALL USING (is_superuser());

-- Backup records policies
CREATE POLICY "Superusers can view all backup records" ON backup_records
    FOR SELECT USING (is_superuser());

CREATE POLICY "Superusers can manage backup records" ON backup_records
    FOR ALL USING (is_superuser());

-- System configurations policies
CREATE POLICY "Superusers can view all system configurations" ON system_configurations
    FOR SELECT USING (is_superuser());

CREATE POLICY "Superusers can manage system configurations" ON system_configurations
    FOR ALL USING (is_superuser());

-- Superuser audit logs policies (read-only for security)
CREATE POLICY "Superusers can view superuser audit logs" ON superuser_audit_logs
    FOR SELECT USING (is_superuser());

-- Archive policies
CREATE POLICY "Superusers can view archive policies" ON archive_policies
    FOR SELECT USING (is_superuser());

CREATE POLICY "Superusers can manage archive policies" ON archive_policies
    FOR ALL USING (is_superuser());

-- Archived records policies
CREATE POLICY "Superusers can view archived records" ON archived_records
    FOR SELECT USING (is_superuser());

CREATE POLICY "Superusers can manage archived records" ON archived_records
    FOR ALL USING (is_superuser());

-- =====================================================
-- SECTION 8: TRIGGERS FOR AUTOMATIC AUDIT LOGGING
-- =====================================================

-- Trigger function for superuser_profiles changes
CREATE OR REPLACE FUNCTION superuser_profiles_audit_trigger()
RETURNS TRIGGER AS $
BEGIN
    -- Log the change in regular audit system
    INSERT INTO audit.audit_logs (
        table_name,
        record_id,
        action,
        user_id,
        old_values,
        new_values
    ) VALUES (
        'superuser_profiles',
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        auth.uid(),
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$ LANGUAGE plpgsql;

-- Create triggers for superuser tables
CREATE TRIGGER superuser_profiles_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON superuser_profiles
    FOR EACH ROW EXECUTE FUNCTION superuser_profiles_audit_trigger();

-- Apply existing audit triggers to new tables
SELECT audit.create_audit_trigger('backup_records');
SELECT audit.create_audit_trigger('system_configurations');
SELECT audit.create_audit_trigger('archive_policies');
SELECT audit.create_audit_trigger('archived_records');

-- =====================================================
-- SECTION 9: INITIAL DATA AND PERMISSIONS
-- =====================================================

-- Insert default system configurations
INSERT INTO system_configurations (category, config_key, config_value, data_type, description, is_sensitive) VALUES
('security', 'max_failed_login_attempts', '5', 'number', 'Maximum failed login attempts before account lockout', FALSE),
('security', 'account_lockout_duration_minutes', '30', 'number', 'Duration of account lockout in minutes', FALSE),
('security', 'session_timeout_minutes', '60', 'number', 'Default session timeout for regular users', FALSE),
('security', 'superuser_session_timeout_minutes', '30', 'number', 'Session timeout for superuser accounts', FALSE),
('security', 'require_2fa_for_superusers', 'true', 'boolean', 'Require two-factor authentication for superuser accounts', FALSE),
('backup', 'auto_backup_enabled', 'true', 'boolean', 'Enable automatic daily backups', FALSE),
('backup', 'backup_retention_days', '30', 'number', 'Number of days to retain backup files', FALSE),
('backup', 'backup_compression_enabled', 'true', 'boolean', 'Enable backup compression', FALSE),
('archive', 'auto_archive_enabled', 'false', 'boolean', 'Enable automatic data archiving', FALSE),
('archive', 'default_archive_after_days', '365', 'number', 'Default number of days before archiving data', FALSE),
('maintenance', 'maintenance_window_start', '"02:00"', 'string', 'Daily maintenance window start time (24h format)', FALSE),
('maintenance', 'maintenance_window_duration_hours', '2', 'number', 'Duration of maintenance window in hours', FALSE)
ON CONFLICT (category, config_key) DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =====================================================
-- SECTION 10: COMMENTS AND DOCUMENTATION
-- =====================================================

-- Table comments
COMMENT ON TABLE superuser_profiles IS 'Stores superuser account information and permissions';
COMMENT ON TABLE backup_records IS 'Tracks system backup operations and their status';
COMMENT ON TABLE system_configurations IS 'Stores system-wide configuration parameters';
COMMENT ON TABLE superuser_audit_logs IS 'Enhanced audit logging for superuser activities';
COMMENT ON TABLE archive_policies IS 'Defines data archiving policies and rules';
COMMENT ON TABLE archived_records IS 'Stores archived data with metadata';

-- Function comments
COMMENT ON FUNCTION log_superuser_action(UUID, VARCHAR, VARCHAR, JSONB, UUID, VARCHAR, UUID, VARCHAR, BOOLEAN, TEXT, INTEGER) IS 'Logs superuser actions with detailed context';
COMMENT ON FUNCTION is_superuser(UUID) IS 'Checks if a user has active superuser privileges';
COMMENT ON FUNCTION get_superuser_permissions(UUID) IS 'Returns the permissions array for a superuser';
COMMENT ON FUNCTION validate_superuser_session(UUID) IS 'Validates superuser session and returns expiration info';

-- Log successful schema creation
DO $$
BEGIN
    RAISE NOTICE 'Superuser Administration schema created successfully';
    RAISE NOTICE 'Tables created: superuser_profiles, backup_records, system_configurations, superuser_audit_logs, archive_policies, archived_records';
    RAISE NOTICE 'Functions created: log_superuser_action, is_superuser, get_superuser_permissions, validate_superuser_session';
    RAISE NOTICE 'RLS policies created for all tables';
    RAISE NOTICE 'Audit triggers applied to all tables';
    RAISE NOTICE 'Default system configurations inserted';
END $$;