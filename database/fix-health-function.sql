-- Fix for get_superuser_system_health function
-- This corrects the ambiguous column reference issue

CREATE OR REPLACE FUNCTION get_superuser_system_health()
RETURNS TABLE (
    component VARCHAR(50),
    status VARCHAR(20),
    details JSONB
) AS $$
BEGIN
    -- Check superuser profiles
    RETURN QUERY
    SELECT 
        'superuser_profiles'::VARCHAR(50),
        CASE WHEN COUNT(*) > 0 THEN 'HEALTHY' ELSE 'WARNING' END::VARCHAR(20),
        jsonb_build_object(
            'active_superusers', COUNT(*) FILTER (WHERE sp.is_active = TRUE),
            'total_superusers', COUNT(*),
            'last_activity', MAX(sp.last_activity)
        )
    FROM superuser_profiles sp;
    
    -- Check audit logs
    RETURN QUERY
    SELECT 
        'audit_logs'::VARCHAR(50),
        'HEALTHY'::VARCHAR(20),
        jsonb_build_object(
            'total_logs', COUNT(*),
            'logs_last_24h', COUNT(*) FILTER (WHERE sal.timestamp > NOW() - INTERVAL '24 hours'),
            'failed_actions_24h', COUNT(*) FILTER (WHERE sal.timestamp > NOW() - INTERVAL '24 hours' AND sal.success = FALSE)
        )
    FROM superuser_audit_logs sal;
    
    -- Check system configurations
    RETURN QUERY
    SELECT 
        'system_configurations'::VARCHAR(50),
        'HEALTHY'::VARCHAR(20),
        jsonb_build_object(
            'total_configs', COUNT(*),
            'sensitive_configs', COUNT(*) FILTER (WHERE sc.is_sensitive = TRUE),
            'last_modified', MAX(sc.modified_at)
        )
    FROM system_configurations sc;
    
    -- Check backup records
    RETURN QUERY
    SELECT 
        'backup_system'::VARCHAR(50),
        CASE 
            WHEN COUNT(*) FILTER (WHERE br.status = 'COMPLETED' AND br.started_at > NOW() - INTERVAL '7 days') > 0 
            THEN 'HEALTHY' 
            ELSE 'WARNING' 
        END::VARCHAR(20),
        jsonb_build_object(
            'total_backups', COUNT(*),
            'successful_backups_7d', COUNT(*) FILTER (WHERE br.status = 'COMPLETED' AND br.started_at > NOW() - INTERVAL '7 days'),
            'failed_backups_7d', COUNT(*) FILTER (WHERE br.status = 'FAILED' AND br.started_at > NOW() - INTERVAL '7 days'),
            'last_successful_backup', MAX(br.completed_at) FILTER (WHERE br.status = 'COMPLETED')
        )
    FROM backup_records br;
END;
$$ LANGUAGE plpgsql;