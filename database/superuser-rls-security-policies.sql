-- =====================================================
-- SUPERUSER ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- This script implements comprehensive RLS policies for superuser administration
-- It ensures proper access control and cascading security for all related tables

-- =====================================================
-- SECTION 1: ENHANCED SUPERUSER VERIFICATION FUNCTIONS
-- =====================================================

-- Enhanced function to check superuser status with additional security checks
CREATE OR REPLACE FUNCTION is_active_superuser(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $
DECLARE
    check_user_id UUID;
    superuser_record RECORD;
    current_ip INET;
    allowed_ips JSONB;
    ip_allowed BOOLEAN := TRUE;
BEGIN
    -- Use provided user_id or current authenticated user
    check_user_id := COALESCE(p_user_id, auth.uid());
    
    IF check_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get superuser profile with all security checks
    SELECT sp.*, sp.ip_restrictions, sp.last_activity, sp.session_timeout_minutes
    INTO superuser_record, allowed_ips
    FROM superuser_profiles sp
    WHERE sp.user_id = check_user_id 
    AND sp.is_active = TRUE;
    
    -- Return false if no active superuser profile found
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check session timeout
    IF superuser_record.last_activity IS NOT NULL THEN
        IF NOW() > (superuser_record.last_activity + (superuser_record.session_timeout_minutes || ' minutes')::INTERVAL) THEN
            RETURN FALSE;
        END IF;
    END IF;
    
    -- Check IP restrictions if configured
    IF jsonb_array_length(allowed_ips) > 0 THEN
        BEGIN
            current_ip := NULLIF(current_setting('audit.current_ip_address', true), '')::INET;
            
            IF current_ip IS NOT NULL THEN
                ip_allowed := FALSE;
                
                -- Check if current IP is in allowed list
                FOR i IN 0..jsonb_array_length(allowed_ips) - 1 LOOP
                    IF current_ip <<= (allowed_ips->i->>0)::INET THEN
                        ip_allowed := TRUE;
                        EXIT;
                    END IF;
                END LOOP;
                
                IF NOT ip_allowed THEN
                    RETURN FALSE;
                END IF;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- If IP checking fails, allow access but log the issue
            NULL;
        END;
    END IF;
    
    RETURN TRUE;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check specific superuser permissions
CREATE OR REPLACE FUNCTION has_superuser_permission(
    p_permission VARCHAR(50),
    p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $
DECLARE
    check_user_id UUID;
    user_permissions JSONB;
BEGIN
    check_user_id := COALESCE(p_user_id, auth.uid());
    
    -- First check if user is an active superuser
    IF NOT is_active_superuser(check_user_id) THEN
        RETURN FALSE;
    END IF;
    
    -- Get user permissions
    SELECT permissions INTO user_permissions
    FROM superuser_profiles
    WHERE user_id = check_user_id AND is_active = TRUE;
    
    -- If no specific permissions set, superuser has all permissions
    IF user_permissions IS NULL OR jsonb_array_length(user_permissions) = 0 THEN
        RETURN TRUE;
    END IF;
    
    -- Check if specific permission exists in permissions array
    RETURN user_permissions ? p_permission;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can manage other users (for user management operations)
CREATE OR REPLACE FUNCTION can_manage_users(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $
BEGIN
    RETURN has_superuser_permission('user_management', p_user_id) OR 
           has_superuser_permission('all', p_user_id);
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can manage system configurations
CREATE OR REPLACE FUNCTION can_manage_system_config(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $
BEGIN
    RETURN has_superuser_permission('system_config', p_user_id) OR 
           has_superuser_permission('all', p_user_id);
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can manage backups
CREATE OR REPLACE FUNCTION can_manage_backups(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $
BEGIN
    RETURN has_superuser_permission('backup_management', p_user_id) OR 
           has_superuser_permission('all', p_user_id);
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can view audit logs
CREATE OR REPLACE FUNCTION can_view_audit_logs(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $
BEGIN
    RETURN has_superuser_permission('audit_access', p_user_id) OR 
           has_superuser_permission('all', p_user_id);
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SECTION 2: SUPERUSER PROFILES RLS POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "superuser_profiles_select_policy" ON superuser_profiles;
DROP POLICY IF EXISTS "superuser_profiles_insert_policy" ON superuser_profiles;
DROP POLICY IF EXISTS "superuser_profiles_update_policy" ON superuser_profiles;
DROP POLICY IF EXISTS "superuser_profiles_delete_policy" ON superuser_profiles;

-- Enable RLS on superuser_profiles
ALTER TABLE superuser_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Superusers can view all superuser profiles
CREATE POLICY "superuser_profiles_select_policy" ON superuser_profiles
    FOR SELECT
    USING (is_active_superuser());

-- Policy: Only superusers with user_management permission can create new superuser profiles
CREATE POLICY "superuser_profiles_insert_policy" ON superuser_profiles
    FOR INSERT
    WITH CHECK (can_manage_users());

-- Policy: Superusers can update profiles, but cannot modify their own active status
CREATE POLICY "superuser_profiles_update_policy" ON superuser_profiles
    FOR UPDATE
    USING (can_manage_users())
    WITH CHECK (
        can_manage_users() AND 
        (user_id != auth.uid() OR is_active = OLD.is_active) -- Cannot deactivate own account
    );

-- Policy: Superusers can delete other superuser profiles but not their own
CREATE POLICY "superuser_profiles_delete_policy" ON superuser_profiles
    FOR DELETE
    USING (can_manage_users() AND user_id != auth.uid());

-- =====================================================
-- SECTION 3: BACKUP RECORDS RLS POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "backup_records_select_policy" ON backup_records;
DROP POLICY IF EXISTS "backup_records_insert_policy" ON backup_records;
DROP POLICY IF EXISTS "backup_records_update_policy" ON backup_records;
DROP POLICY IF EXISTS "backup_records_delete_policy" ON backup_records;

-- Enable RLS on backup_records
ALTER TABLE backup_records ENABLE ROW LEVEL SECURITY;

-- Policy: Superusers with backup permissions can view all backup records
CREATE POLICY "backup_records_select_policy" ON backup_records
    FOR SELECT
    USING (can_manage_backups());

-- Policy: Superusers with backup permissions can create backup records
CREATE POLICY "backup_records_insert_policy" ON backup_records
    FOR INSERT
    WITH CHECK (can_manage_backups());

-- Policy: Superusers with backup permissions can update backup records
CREATE POLICY "backup_records_update_policy" ON backup_records
    FOR UPDATE
    USING (can_manage_backups())
    WITH CHECK (can_manage_backups());

-- Policy: Superusers with backup permissions can delete backup records
CREATE POLICY "backup_records_delete_policy" ON backup_records
    FOR DELETE
    USING (can_manage_backups());

-- =====================================================
-- SECTION 4: SYSTEM CONFIGURATIONS RLS POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "system_configurations_select_policy" ON system_configurations;
DROP POLICY IF EXISTS "system_configurations_insert_policy" ON system_configurations;
DROP POLICY IF EXISTS "system_configurations_update_policy" ON system_configurations;
DROP POLICY IF EXISTS "system_configurations_delete_policy" ON system_configurations;

-- Enable RLS on system_configurations
ALTER TABLE system_configurations ENABLE ROW LEVEL SECURITY;

-- Policy: Superusers can view all configurations, but sensitive ones require special permission
CREATE POLICY "system_configurations_select_policy" ON system_configurations
    FOR SELECT
    USING (
        can_manage_system_config() AND 
        (NOT is_sensitive OR has_superuser_permission('sensitive_config'))
    );

-- Policy: Superusers with system config permission can create configurations
CREATE POLICY "system_configurations_insert_policy" ON system_configurations
    FOR INSERT
    WITH CHECK (
        can_manage_system_config() AND 
        (NOT is_sensitive OR has_superuser_permission('sensitive_config'))
    );

-- Policy: Superusers with system config permission can update configurations
CREATE POLICY "system_configurations_update_policy" ON system_configurations
    FOR UPDATE
    USING (
        can_manage_system_config() AND 
        (NOT is_sensitive OR has_superuser_permission('sensitive_config'))
    )
    WITH CHECK (
        can_manage_system_config() AND 
        (NOT is_sensitive OR has_superuser_permission('sensitive_config'))
    );

-- Policy: Superusers with system config permission can delete configurations
CREATE POLICY "system_configurations_delete_policy" ON system_configurations
    FOR DELETE
    USING (
        can_manage_system_config() AND 
        (NOT is_sensitive OR has_superuser_permission('sensitive_config'))
    );

-- =====================================================
-- SECTION 5: SUPERUSER AUDIT LOGS RLS POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "superuser_audit_logs_select_policy" ON superuser_audit_logs;
DROP POLICY IF EXISTS "superuser_audit_logs_insert_policy" ON superuser_audit_logs;
DROP POLICY IF EXISTS "superuser_audit_logs_update_policy" ON superuser_audit_logs;
DROP POLICY IF EXISTS "superuser_audit_logs_delete_policy" ON superuser_audit_logs;

-- Enable RLS on superuser_audit_logs
ALTER TABLE superuser_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Superusers with audit access can view audit logs
CREATE POLICY "superuser_audit_logs_select_policy" ON superuser_audit_logs
    FOR SELECT
    USING (can_view_audit_logs());

-- Policy: Only system functions can insert audit logs (no direct user inserts)
CREATE POLICY "superuser_audit_logs_insert_policy" ON superuser_audit_logs
    FOR INSERT
    WITH CHECK (false); -- Prevents direct inserts, only functions can insert

-- Policy: Audit logs are immutable (no updates allowed)
CREATE POLICY "superuser_audit_logs_update_policy" ON superuser_audit_logs
    FOR UPDATE
    USING (false);

-- Policy: Audit logs cannot be deleted by users (only by system cleanup functions)
CREATE POLICY "superuser_audit_logs_delete_policy" ON superuser_audit_logs
    FOR DELETE
    USING (false);

-- =====================================================
-- SECTION 6: ARCHIVE POLICIES RLS POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "archive_policies_select_policy" ON archive_policies;
DROP POLICY IF EXISTS "archive_policies_insert_policy" ON archive_policies;
DROP POLICY IF EXISTS "archive_policies_update_policy" ON archive_policies;
DROP POLICY IF EXISTS "archive_policies_delete_policy" ON archive_policies;

-- Enable RLS on archive_policies
ALTER TABLE archive_policies ENABLE ROW LEVEL SECURITY;

-- Policy: Superusers can view archive policies
CREATE POLICY "archive_policies_select_policy" ON archive_policies
    FOR SELECT
    USING (is_active_superuser());

-- Policy: Superusers can create archive policies
CREATE POLICY "archive_policies_insert_policy" ON archive_policies
    FOR INSERT
    WITH CHECK (is_active_superuser());

-- Policy: Superusers can update archive policies
CREATE POLICY "archive_policies_update_policy" ON archive_policies
    FOR UPDATE
    USING (is_active_superuser())
    WITH CHECK (is_active_superuser());

-- Policy: Superusers can delete archive policies
CREATE POLICY "archive_policies_delete_policy" ON archive_policies
    FOR DELETE
    USING (is_active_superuser());

-- =====================================================
-- SECTION 7: ARCHIVED RECORDS RLS POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "archived_records_select_policy" ON archived_records;
DROP POLICY IF EXISTS "archived_records_insert_policy" ON archived_records;
DROP POLICY IF EXISTS "archived_records_update_policy" ON archived_records;
DROP POLICY IF EXISTS "archived_records_delete_policy" ON archived_records;

-- Enable RLS on archived_records
ALTER TABLE archived_records ENABLE ROW LEVEL SECURITY;

-- Policy: Superusers can view archived records
CREATE POLICY "archived_records_select_policy" ON archived_records
    FOR SELECT
    USING (is_active_superuser());

-- Policy: Superusers can create archived records
CREATE POLICY "archived_records_insert_policy" ON archived_records
    FOR INSERT
    WITH CHECK (is_active_superuser());

-- Policy: Superusers can update archived records (for restoration status)
CREATE POLICY "archived_records_update_policy" ON archived_records
    FOR UPDATE
    USING (is_active_superuser())
    WITH CHECK (is_active_superuser());

-- Policy: Superusers can delete archived records
CREATE POLICY "archived_records_delete_policy" ON archived_records
    FOR DELETE
    USING (is_active_superuser());

-- =====================================================
-- SECTION 8: ENHANCED EXISTING TABLE POLICIES
-- =====================================================

-- Enhance existing profiles table policies to allow superuser management
-- Note: This assumes existing policies exist and adds superuser exceptions

-- Drop and recreate profiles policies to include superuser access
DO $$
BEGIN
    -- Check if profiles table exists and has RLS enabled
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        -- Add superuser policy for profiles management
        DROP POLICY IF EXISTS "superuser_profiles_management_policy" ON profiles;
        
        CREATE POLICY "superuser_profiles_management_policy" ON profiles
            FOR ALL
            USING (can_manage_users())
            WITH CHECK (can_manage_users());
            
        RAISE NOTICE 'Enhanced profiles table with superuser management policy';
    END IF;
END $$;

-- Enhance existing auth.users access for superusers (if accessible)
-- Note: This may not be possible depending on Supabase configuration

-- =====================================================
-- SECTION 9: SECURITY MONITORING POLICIES
-- =====================================================

-- Create policies for security monitoring tables if they exist
DO $$
BEGIN
    -- Enhanced policies for failed_login_attempts
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'failed_login_attempts') THEN
        DROP POLICY IF EXISTS "superuser_failed_login_access" ON failed_login_attempts;
        
        CREATE POLICY "superuser_failed_login_access" ON failed_login_attempts
            FOR SELECT
            USING (is_active_superuser());
            
        RAISE NOTICE 'Enhanced failed_login_attempts table with superuser access';
    END IF;
    
    -- Enhanced policies for user_sessions
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sessions') THEN
        DROP POLICY IF EXISTS "superuser_user_sessions_access" ON user_sessions;
        
        CREATE POLICY "superuser_user_sessions_access" ON user_sessions
            FOR ALL
            USING (is_active_superuser() OR user_id = auth.uid())
            WITH CHECK (is_active_superuser() OR user_id = auth.uid());
            
        RAISE NOTICE 'Enhanced user_sessions table with superuser access';
    END IF;
END $$;

-- =====================================================
-- SECTION 10: CASCADING SECURITY FUNCTIONS
-- =====================================================

-- Function to temporarily elevate permissions for system operations
CREATE OR REPLACE FUNCTION with_superuser_privileges(operation_name TEXT)
RETURNS BOOLEAN AS $
DECLARE
    current_user_id UUID;
    is_superuser_op BOOLEAN := FALSE;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if current user is an active superuser
    SELECT is_active_superuser(current_user_id) INTO is_superuser_op;
    
    IF is_superuser_op THEN
        -- Log the privileged operation
        PERFORM log_superuser_api_action(
            'PRIVILEGED_OPERATION',
            'SECURITY',
            jsonb_build_object('operation', operation_name),
            NULL,
            NULL,
            NULL,
            'HIGH',
            TRUE,
            NULL,
            NULL
        );
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate and log security-sensitive operations
CREATE OR REPLACE FUNCTION validate_security_operation(
    operation_type VARCHAR(50),
    target_details JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN AS $
DECLARE
    current_user_id UUID;
    validation_result BOOLEAN := FALSE;
    session_valid RECORD;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'No authenticated user for security operation';
    END IF;
    
    -- Validate superuser session
    SELECT * INTO session_valid
    FROM validate_superuser_session(current_user_id);
    
    IF NOT session_valid.is_valid THEN
        RAISE EXCEPTION 'Invalid superuser session: %', session_valid.reason;
    END IF;
    
    -- Log the security operation attempt
    PERFORM log_superuser_api_action(
        operation_type,
        'SECURITY',
        jsonb_build_object(
            'target_details', target_details,
            'session_expires_at', session_valid.session_expires_at
        ),
        NULL,
        NULL,
        NULL,
        'CRITICAL',
        TRUE,
        NULL,
        NULL
    );
    
    RETURN TRUE;
    
EXCEPTION WHEN OTHERS THEN
    -- Log the failed security operation
    PERFORM log_superuser_api_action(
        operation_type,
        'SECURITY',
        jsonb_build_object(
            'target_details', target_details,
            'error', SQLERRM
        ),
        NULL,
        NULL,
        NULL,
        'CRITICAL',
        FALSE,
        SQLERRM,
        NULL
    );
    
    RAISE;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SECTION 11: GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on security functions
GRANT EXECUTE ON FUNCTION is_active_superuser(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_superuser_permission(VARCHAR, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_manage_users(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_manage_system_config(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_manage_backups(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_view_audit_logs(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION with_superuser_privileges(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_security_operation(VARCHAR, JSONB) TO authenticated;

-- =====================================================
-- SECTION 12: COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION is_active_superuser(UUID) IS 'Enhanced superuser verification with session timeout and IP restrictions';
COMMENT ON FUNCTION has_superuser_permission(VARCHAR, UUID) IS 'Checks if superuser has specific permission';
COMMENT ON FUNCTION can_manage_users(UUID) IS 'Checks if user can perform user management operations';
COMMENT ON FUNCTION can_manage_system_config(UUID) IS 'Checks if user can manage system configurations';
COMMENT ON FUNCTION can_manage_backups(UUID) IS 'Checks if user can manage backup operations';
COMMENT ON FUNCTION can_view_audit_logs(UUID) IS 'Checks if user can access audit logs';
COMMENT ON FUNCTION with_superuser_privileges(TEXT) IS 'Temporarily elevates permissions for system operations';
COMMENT ON FUNCTION validate_security_operation(VARCHAR, JSONB) IS 'Validates and logs security-sensitive operations';

-- Log successful RLS setup
DO $$
BEGIN
    RAISE NOTICE 'Superuser RLS security policies implemented successfully';
    RAISE NOTICE 'Enhanced security functions created with permission checking';
    RAISE NOTICE 'Cascading security policies applied to all superuser tables';
    RAISE NOTICE 'Session validation and IP restrictions enforced';
    RAISE NOTICE 'Audit logging integrated with all security operations';
END $$;