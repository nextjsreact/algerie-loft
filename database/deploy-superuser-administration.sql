-- =====================================================
-- SUPERUSER ADMINISTRATION SYSTEM - DEPLOYMENT SCRIPT
-- =====================================================
-- This script deploys the complete superuser administration system
-- Run this script in your Supabase SQL editor to set up the entire system

-- =====================================================
-- SECTION 1: PREREQUISITES CHECK
-- =====================================================

-- Check if required tables exist
DO $$
BEGIN
    -- Check if profiles table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        RAISE EXCEPTION 'profiles table does not exist. Please ensure the base schema is deployed first.';
    END IF;
    
    -- Check if audit schema exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'audit') THEN
        RAISE EXCEPTION 'audit schema does not exist. Please deploy the audit system first.';
    END IF;
    
    RAISE NOTICE 'Prerequisites check passed. Proceeding with superuser administration deployment.';
END $$;

-- =====================================================
-- SECTION 2: DEPLOY CORE SCHEMA
-- =====================================================

-- Deploy superuser administration schema
\i database/superuser-administration-schema.sql

-- =====================================================
-- SECTION 3: DEPLOY AUDIT ENHANCEMENTS
-- =====================================================

-- Deploy enhanced audit logging system
\i database/superuser-audit-enhancements.sql

-- =====================================================
-- SECTION 4: DEPLOY SECURITY POLICIES
-- =====================================================

-- Deploy RLS security policies
\i database/superuser-rls-security-policies.sql

-- =====================================================
-- SECTION 5: POST-DEPLOYMENT VERIFICATION
-- =====================================================

-- Verify all tables were created successfully
DO $$
DECLARE
    table_count INTEGER;
    function_count INTEGER;
    policy_count INTEGER;
BEGIN
    -- Count superuser tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_name IN (
        'superuser_profiles',
        'backup_records', 
        'system_configurations',
        'superuser_audit_logs',
        'archive_policies',
        'archived_records'
    );
    
    -- Count superuser functions
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_name IN (
        'log_superuser_action',
        'is_superuser',
        'get_superuser_permissions',
        'validate_superuser_session',
        'is_active_superuser',
        'has_superuser_permission',
        'can_manage_users',
        'can_manage_system_config',
        'can_manage_backups',
        'can_view_audit_logs'
    );
    
    -- Count RLS policies on superuser tables
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename IN (
        'superuser_profiles',
        'backup_records',
        'system_configurations', 
        'superuser_audit_logs',
        'archive_policies',
        'archived_records'
    );
    
    -- Report results
    RAISE NOTICE 'Deployment verification results:';
    RAISE NOTICE '- Tables created: % of 6 expected', table_count;
    RAISE NOTICE '- Functions created: % of 10+ expected', function_count;
    RAISE NOTICE '- RLS policies created: % policies', policy_count;
    
    -- Check for any missing components
    IF table_count < 6 THEN
        RAISE WARNING 'Some superuser tables may not have been created successfully';
    END IF;
    
    IF function_count < 10 THEN
        RAISE WARNING 'Some superuser functions may not have been created successfully';
    END IF;
    
    IF policy_count < 20 THEN
        RAISE WARNING 'Some RLS policies may not have been created successfully';
    END IF;
    
    RAISE NOTICE 'Superuser administration system deployment completed';
END $$;

-- =====================================================
-- SECTION 6: INITIAL SUPERUSER SETUP (OPTIONAL)
-- =====================================================

-- Function to create the first superuser account
-- This should be run manually after deployment with appropriate user ID
CREATE OR REPLACE FUNCTION create_initial_superuser(
    p_user_email VARCHAR(255),
    p_granted_by_email VARCHAR(255) DEFAULT 'system'
)
RETURNS UUID AS $
DECLARE
    target_user_id UUID;
    granted_by_user_id UUID;
    superuser_profile_id UUID;
BEGIN
    -- Find target user by email
    SELECT id INTO target_user_id
    FROM profiles
    WHERE email = p_user_email;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', p_user_email;
    END IF;
    
    -- Find granting user (optional)
    IF p_granted_by_email != 'system' THEN
        SELECT id INTO granted_by_user_id
        FROM profiles
        WHERE email = p_granted_by_email;
    END IF;
    
    -- Check if user is already a superuser
    IF EXISTS (SELECT 1 FROM superuser_profiles WHERE user_id = target_user_id) THEN
        RAISE EXCEPTION 'User % is already a superuser', p_user_email;
    END IF;
    
    -- Create superuser profile with all permissions
    INSERT INTO superuser_profiles (
        user_id,
        granted_by,
        permissions,
        is_active,
        session_timeout_minutes,
        require_2fa
    ) VALUES (
        target_user_id,
        granted_by_user_id,
        '["all"]'::jsonb, -- Grant all permissions to initial superuser
        TRUE,
        30, -- 30 minute session timeout for security
        TRUE -- Require 2FA
    ) RETURNING id INTO superuser_profile_id;
    
    -- Log the creation
    INSERT INTO superuser_audit_logs (
        superuser_id,
        action_type,
        action_category,
        action_details,
        target_user_id,
        severity,
        success
    ) VALUES (
        superuser_profile_id,
        'CREATE_INITIAL_SUPERUSER',
        'SECURITY',
        jsonb_build_object(
            'target_email', p_user_email,
            'granted_by', p_granted_by_email,
            'permissions', '["all"]'
        ),
        target_user_id,
        'CRITICAL',
        TRUE
    );
    
    RAISE NOTICE 'Initial superuser created for user: %', p_user_email;
    RAISE NOTICE 'Superuser profile ID: %', superuser_profile_id;
    
    RETURN superuser_profile_id;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- SECTION 7: MAINTENANCE FUNCTIONS
-- =====================================================

-- Function to get system health status
CREATE OR REPLACE FUNCTION get_superuser_system_health()
RETURNS TABLE (
    component VARCHAR(50),
    status VARCHAR(20),
    details JSONB
) AS $
BEGIN
    -- Check superuser profiles
    RETURN QUERY
    SELECT 
        'superuser_profiles'::VARCHAR(50),
        CASE WHEN COUNT(*) > 0 THEN 'HEALTHY' ELSE 'WARNING' END::VARCHAR(20),
        jsonb_build_object(
            'active_superusers', COUNT(*) FILTER (WHERE is_active = TRUE),
            'total_superusers', COUNT(*),
            'last_activity', MAX(last_activity)
        )
    FROM superuser_profiles;
    
    -- Check audit logs
    RETURN QUERY
    SELECT 
        'audit_logs'::VARCHAR(50),
        'HEALTHY'::VARCHAR(20),
        jsonb_build_object(
            'total_logs', COUNT(*),
            'logs_last_24h', COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '24 hours'),
            'failed_actions_24h', COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '24 hours' AND success = FALSE)
        )
    FROM superuser_audit_logs;
    
    -- Check system configurations
    RETURN QUERY
    SELECT 
        'system_configurations'::VARCHAR(50),
        'HEALTHY'::VARCHAR(20),
        jsonb_build_object(
            'total_configs', COUNT(*),
            'sensitive_configs', COUNT(*) FILTER (WHERE is_sensitive = TRUE),
            'last_modified', MAX(modified_at)
        )
    FROM system_configurations;
    
    -- Check backup records
    RETURN QUERY
    SELECT 
        'backup_system'::VARCHAR(50),
        CASE 
            WHEN COUNT(*) FILTER (WHERE status = 'COMPLETED' AND started_at > NOW() - INTERVAL '7 days') > 0 
            THEN 'HEALTHY' 
            ELSE 'WARNING' 
        END::VARCHAR(20),
        jsonb_build_object(
            'total_backups', COUNT(*),
            'successful_backups_7d', COUNT(*) FILTER (WHERE status = 'COMPLETED' AND started_at > NOW() - INTERVAL '7 days'),
            'failed_backups_7d', COUNT(*) FILTER (WHERE status = 'FAILED' AND started_at > NOW() - INTERVAL '7 days'),
            'last_successful_backup', MAX(completed_at) FILTER (WHERE status = 'COMPLETED')
        )
    FROM backup_records;
END;
$ LANGUAGE plpgsql;

-- Grant permissions on deployment functions
GRANT EXECUTE ON FUNCTION create_initial_superuser(VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_superuser_system_health() TO authenticated;

-- =====================================================
-- SECTION 8: DEPLOYMENT SUMMARY
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SUPERUSER ADMINISTRATION SYSTEM DEPLOYED';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Components deployed:';
    RAISE NOTICE '✓ Core database schema (6 tables)';
    RAISE NOTICE '✓ Enhanced audit logging system';
    RAISE NOTICE '✓ Row Level Security policies';
    RAISE NOTICE '✓ Security functions and permissions';
    RAISE NOTICE '✓ Maintenance and monitoring functions';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Create initial superuser: SELECT create_initial_superuser(''admin@example.com'');';
    RAISE NOTICE '2. Configure system settings in system_configurations table';
    RAISE NOTICE '3. Set up backup schedules';
    RAISE NOTICE '4. Test superuser authentication and permissions';
    RAISE NOTICE '';
    RAISE NOTICE 'System health check: SELECT * FROM get_superuser_system_health();';
    RAISE NOTICE '========================================';
END $$;