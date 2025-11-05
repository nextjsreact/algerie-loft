-- =====================================================
-- SUPERUSER AUDIT LOGGING SYSTEM ENHANCEMENTS
-- =====================================================
-- This script enhances the existing audit system with superuser-specific
-- audit logging capabilities and automatic triggers

-- =====================================================
-- SECTION 1: ENHANCED AUDIT TRIGGER FUNCTIONS
-- =====================================================

-- Enhanced audit trigger function specifically for superuser-monitored tables
CREATE OR REPLACE FUNCTION superuser_audit_trigger_function()
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
    is_superuser_action BOOLEAN := FALSE;
    superuser_profile_id UUID;
    action_severity VARCHAR(10) := 'MEDIUM';
BEGIN
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
    
    -- If no user context is set, try to get from auth.uid()
    IF current_user_id IS NULL THEN
        BEGIN
            current_user_id := auth.uid();
        EXCEPTION WHEN OTHERS THEN
            current_user_id := NULL;
        END;
    END IF;
    
    -- Check if this is a superuser action
    IF current_user_id IS NOT NULL THEN
        SELECT sp.id INTO superuser_profile_id
        FROM superuser_profiles sp
        WHERE sp.user_id = current_user_id AND sp.is_active = TRUE;
        
        IF superuser_profile_id IS NOT NULL THEN
            is_superuser_action := TRUE;
        END IF;
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
    
    -- Determine action severity based on table and operation
    CASE TG_TABLE_NAME
        WHEN 'profiles' THEN
            CASE TG_OP
                WHEN 'DELETE' THEN action_severity := 'HIGH';
                WHEN 'UPDATE' THEN action_severity := 'MEDIUM';
                ELSE action_severity := 'LOW';
            END CASE;
        WHEN 'superuser_profiles' THEN
            action_severity := 'CRITICAL';
        WHEN 'system_configurations' THEN
            action_severity := 'HIGH';
        WHEN 'backup_records' THEN
            action_severity := 'MEDIUM';
        ELSE
            action_severity := 'LOW';
    END CASE;
    
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
    
    -- Insert into regular audit_logs table
    INSERT INTO audit.audit_logs (
        table_name,
        record_id,
        action,
        user_id,
        user_email,
        old_values,
        new_values,
        changed_fields,
        ip_address,
        user_agent,
        session_id
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        current_user_id,
        current_user_email,
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
        current_session_id
    );
    
    -- If this is a superuser action, also log in superuser_audit_logs
    IF is_superuser_action THEN
        INSERT INTO superuser_audit_logs (
            superuser_id,
            action_type,
            action_category,
            action_details,
            target_table,
            target_record_id,
            ip_address,
            user_agent,
            session_id,
            severity,
            success
        ) VALUES (
            superuser_profile_id,
            TG_OP || '_' || TG_TABLE_NAME,
            CASE TG_TABLE_NAME
                WHEN 'profiles' THEN 'USER_MANAGEMENT'
                WHEN 'superuser_profiles' THEN 'SECURITY'
                WHEN 'system_configurations' THEN 'SYSTEM_CONFIG'
                WHEN 'backup_records' THEN 'BACKUP'
                WHEN 'archived_records' THEN 'ARCHIVE'
                ELSE 'MAINTENANCE'
            END,
            jsonb_build_object(
                'operation', TG_OP,
                'table', TG_TABLE_NAME,
                'changed_fields', changed_fields,
                'record_id', COALESCE(NEW.id, OLD.id)
            ),
            TG_TABLE_NAME,
            COALESCE(NEW.id, OLD.id),
            current_ip_address,
            current_user_agent,
            current_session_id,
            action_severity,
            TRUE
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
    
EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the main operation
    RAISE WARNING 'Superuser audit trigger failed for table %: %', TG_TABLE_NAME, SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- SECTION 2: MANUAL AUDIT LOG FUNCTIONS
-- =====================================================

-- Function to manually log superuser actions (for API calls, etc.)
CREATE OR REPLACE FUNCTION log_superuser_api_action(
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
    current_user_id UUID;
    superuser_profile_id UUID;
    current_ip INET;
    current_user_agent TEXT;
    current_session_id VARCHAR(255);
BEGIN
    -- Get current user
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'No authenticated user found';
    END IF;
    
    -- Verify user is superuser
    SELECT id INTO superuser_profile_id
    FROM superuser_profiles
    WHERE user_id = current_user_id AND is_active = TRUE;
    
    IF superuser_profile_id IS NULL THEN
        RAISE EXCEPTION 'User is not an active superuser';
    END IF;
    
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
    
    -- Log the action
    SELECT log_superuser_action(
        superuser_profile_id,
        p_action_type,
        p_action_category,
        p_action_details,
        p_target_user_id,
        p_target_table,
        p_target_record_id,
        p_severity,
        p_success,
        p_error_message,
        p_execution_time_ms
    ) INTO log_id;
    
    RETURN log_id;
END;
$ LANGUAGE plpgsql;

-- Function to log bulk operations
CREATE OR REPLACE FUNCTION log_superuser_bulk_action(
    p_action_type VARCHAR(50),
    p_action_category VARCHAR(30),
    p_affected_records JSONB, -- Array of record IDs or details
    p_success_count INTEGER DEFAULT 0,
    p_failure_count INTEGER DEFAULT 0,
    p_severity VARCHAR(10) DEFAULT 'MEDIUM',
    p_execution_time_ms INTEGER DEFAULT NULL
)
RETURNS UUID AS $
DECLARE
    log_id UUID;
    action_details JSONB;
BEGIN
    -- Build action details
    action_details := jsonb_build_object(
        'bulk_operation', TRUE,
        'affected_records', p_affected_records,
        'success_count', p_success_count,
        'failure_count', p_failure_count,
        'total_records', p_success_count + p_failure_count
    );
    
    -- Log the bulk action
    SELECT log_superuser_api_action(
        p_action_type,
        p_action_category,
        action_details,
        NULL, -- No single target user for bulk operations
        NULL, -- No single target table for bulk operations
        NULL, -- No single target record for bulk operations
        p_severity,
        p_failure_count = 0, -- Success if no failures
        CASE WHEN p_failure_count > 0 THEN 'Some operations failed' ELSE NULL END,
        p_execution_time_ms
    ) INTO log_id;
    
    RETURN log_id;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- SECTION 3: AUDIT QUERY AND REPORTING FUNCTIONS
-- =====================================================

-- Function to get superuser audit statistics
CREATE OR REPLACE FUNCTION get_superuser_audit_statistics(
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    p_superuser_id UUID DEFAULT NULL
)
RETURNS TABLE (
    metric VARCHAR(50),
    count BIGINT,
    details JSONB
) AS $
BEGIN
    -- Total actions by category
    RETURN QUERY
    SELECT 
        'actions_by_category'::VARCHAR(50),
        COUNT(*)::BIGINT,
        jsonb_object_agg(action_category, category_count)
    FROM (
        SELECT 
            action_category,
            COUNT(*) as category_count
        FROM superuser_audit_logs sal
        WHERE sal.timestamp BETWEEN p_start_date AND p_end_date
        AND (p_superuser_id IS NULL OR sal.superuser_id = p_superuser_id)
        GROUP BY action_category
    ) category_stats;
    
    -- Actions by severity
    RETURN QUERY
    SELECT 
        'actions_by_severity'::VARCHAR(50),
        COUNT(*)::BIGINT,
        jsonb_object_agg(severity, severity_count)
    FROM (
        SELECT 
            severity,
            COUNT(*) as severity_count
        FROM superuser_audit_logs sal
        WHERE sal.timestamp BETWEEN p_start_date AND p_end_date
        AND (p_superuser_id IS NULL OR sal.superuser_id = p_superuser_id)
        GROUP BY severity
    ) severity_stats;
    
    -- Failed actions
    RETURN QUERY
    SELECT 
        'failed_actions'::VARCHAR(50),
        COUNT(*)::BIGINT,
        jsonb_build_object(
            'total_failures', COUNT(*),
            'failure_rate', ROUND((COUNT(*)::DECIMAL / NULLIF(total_actions.total, 0)) * 100, 2)
        )
    FROM superuser_audit_logs sal
    CROSS JOIN (
        SELECT COUNT(*) as total
        FROM superuser_audit_logs sal2
        WHERE sal2.timestamp BETWEEN p_start_date AND p_end_date
        AND (p_superuser_id IS NULL OR sal2.superuser_id = p_superuser_id)
    ) total_actions
    WHERE sal.timestamp BETWEEN p_start_date AND p_end_date
    AND sal.success = FALSE
    AND (p_superuser_id IS NULL OR sal.superuser_id = p_superuser_id);
    
    -- Most active superusers (if not filtering by specific superuser)
    IF p_superuser_id IS NULL THEN
        RETURN QUERY
        SELECT 
            'most_active_superusers'::VARCHAR(50),
            COUNT(DISTINCT sal.superuser_id)::BIGINT,
            jsonb_object_agg(
                COALESCE(p.full_name, p.email, 'Unknown'),
                user_activity.action_count
            )
        FROM (
            SELECT 
                sal.superuser_id,
                COUNT(*) as action_count
            FROM superuser_audit_logs sal
            WHERE sal.timestamp BETWEEN p_start_date AND p_end_date
            GROUP BY sal.superuser_id
            ORDER BY action_count DESC
            LIMIT 10
        ) user_activity
        JOIN superuser_profiles sp ON sp.id = user_activity.superuser_id
        JOIN profiles p ON p.id = sp.user_id;
    END IF;
    
    -- Actions by hour of day
    RETURN QUERY
    SELECT 
        'actions_by_hour'::VARCHAR(50),
        COUNT(*)::BIGINT,
        jsonb_object_agg(
            hour_of_day::TEXT,
            hour_count
        )
    FROM (
        SELECT 
            EXTRACT(HOUR FROM sal.timestamp) as hour_of_day,
            COUNT(*) as hour_count
        FROM superuser_audit_logs sal
        WHERE sal.timestamp BETWEEN p_start_date AND p_end_date
        AND (p_superuser_id IS NULL OR sal.superuser_id = p_superuser_id)
        GROUP BY EXTRACT(HOUR FROM sal.timestamp)
        ORDER BY hour_of_day
    ) hour_stats;
END;
$ LANGUAGE plpgsql;

-- Function to search audit logs with advanced filters
CREATE OR REPLACE FUNCTION search_superuser_audit_logs(
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '7 days',
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    p_superuser_id UUID DEFAULT NULL,
    p_action_category VARCHAR(30) DEFAULT NULL,
    p_severity VARCHAR(10) DEFAULT NULL,
    p_target_user_id UUID DEFAULT NULL,
    p_success_filter BOOLEAN DEFAULT NULL,
    p_search_text TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    superuser_email VARCHAR(255),
    action_type VARCHAR(50),
    action_category VARCHAR(30),
    action_details JSONB,
    target_user_email VARCHAR(255),
    severity VARCHAR(10),
    success BOOLEAN,
    error_message TEXT,
    ip_address INET,
    timestamp TIMESTAMP WITH TIME ZONE
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        sal.id,
        sp_profile.email as superuser_email,
        sal.action_type,
        sal.action_category,
        sal.action_details,
        target_profile.email as target_user_email,
        sal.severity,
        sal.success,
        sal.error_message,
        sal.ip_address,
        sal.timestamp
    FROM superuser_audit_logs sal
    JOIN superuser_profiles sp ON sp.id = sal.superuser_id
    JOIN profiles sp_profile ON sp_profile.id = sp.user_id
    LEFT JOIN profiles target_profile ON target_profile.id = sal.target_user_id
    WHERE sal.timestamp BETWEEN p_start_date AND p_end_date
    AND (p_superuser_id IS NULL OR sal.superuser_id = p_superuser_id)
    AND (p_action_category IS NULL OR sal.action_category = p_action_category)
    AND (p_severity IS NULL OR sal.severity = p_severity)
    AND (p_target_user_id IS NULL OR sal.target_user_id = p_target_user_id)
    AND (p_success_filter IS NULL OR sal.success = p_success_filter)
    AND (p_search_text IS NULL OR 
         sal.action_type ILIKE '%' || p_search_text || '%' OR
         sal.action_details::TEXT ILIKE '%' || p_search_text || '%' OR
         sal.error_message ILIKE '%' || p_search_text || '%')
    ORDER BY sal.timestamp DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- SECTION 4: AUDIT LOG CLEANUP AND MAINTENANCE
-- =====================================================

-- Function to clean up old audit logs based on retention policies
CREATE OR REPLACE FUNCTION cleanup_superuser_audit_logs(
    p_retention_days INTEGER DEFAULT 365,
    p_critical_retention_days INTEGER DEFAULT 1095 -- 3 years for critical actions
)
RETURNS INTEGER AS $
DECLARE
    deleted_count INTEGER := 0;
    temp_count INTEGER;
BEGIN
    -- Clean up non-critical audit logs older than retention period
    DELETE FROM superuser_audit_logs 
    WHERE timestamp < NOW() - (p_retention_days || ' days')::INTERVAL
    AND severity NOT IN ('CRITICAL', 'HIGH');
    
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Clean up critical audit logs older than extended retention period
    DELETE FROM superuser_audit_logs 
    WHERE timestamp < NOW() - (p_critical_retention_days || ' days')::INTERVAL
    AND severity IN ('CRITICAL', 'HIGH');
    
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    RETURN deleted_count;
END;
$ LANGUAGE plpgsql;

-- Function to archive old audit logs to archived_records table
CREATE OR REPLACE FUNCTION archive_superuser_audit_logs(
    p_archive_after_days INTEGER DEFAULT 90
)
RETURNS INTEGER AS $
DECLARE
    archived_count INTEGER := 0;
    log_record RECORD;
BEGIN
    -- Archive old audit logs
    FOR log_record IN
        SELECT * FROM superuser_audit_logs
        WHERE timestamp < NOW() - (p_archive_after_days || ' days')::INTERVAL
        ORDER BY timestamp
    LOOP
        -- Insert into archived_records
        INSERT INTO archived_records (
            original_table,
            original_record_id,
            archived_data,
            archived_by,
            can_restore,
            metadata
        ) VALUES (
            'superuser_audit_logs',
            log_record.id,
            to_jsonb(log_record),
            auth.uid(),
            TRUE,
            jsonb_build_object(
                'archived_reason', 'retention_policy',
                'original_timestamp', log_record.timestamp,
                'severity', log_record.severity
            )
        );
        
        -- Delete from original table
        DELETE FROM superuser_audit_logs WHERE id = log_record.id;
        
        archived_count := archived_count + 1;
    END LOOP;
    
    RETURN archived_count;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- SECTION 5: APPLY ENHANCED TRIGGERS TO CRITICAL TABLES
-- =====================================================

-- Apply enhanced audit triggers to critical tables that need superuser monitoring
DO $$
DECLARE
    table_name TEXT;
    critical_tables TEXT[] := ARRAY[
        'profiles',
        'superuser_profiles', 
        'system_configurations',
        'backup_records',
        'archive_policies',
        'archived_records'
    ];
BEGIN
    FOREACH table_name IN ARRAY critical_tables
    LOOP
        -- Drop existing audit trigger if it exists
        EXECUTE format('DROP TRIGGER IF EXISTS superuser_audit_trigger_%s ON %s;', table_name, table_name);
        
        -- Create enhanced superuser audit trigger
        EXECUTE format('
            CREATE TRIGGER superuser_audit_trigger_%s
            AFTER INSERT OR UPDATE OR DELETE ON %s
            FOR EACH ROW EXECUTE FUNCTION superuser_audit_trigger_function();
        ', table_name, table_name);
        
        RAISE NOTICE 'Enhanced superuser audit trigger created for table: %', table_name;
    END LOOP;
END $$;

-- =====================================================
-- SECTION 6: GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION log_superuser_api_action(VARCHAR, VARCHAR, JSONB, UUID, VARCHAR, UUID, VARCHAR, BOOLEAN, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION log_superuser_bulk_action(VARCHAR, VARCHAR, JSONB, INTEGER, INTEGER, VARCHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_superuser_audit_statistics(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION search_superuser_audit_logs(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, UUID, VARCHAR, VARCHAR, UUID, BOOLEAN, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_superuser_audit_logs(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION archive_superuser_audit_logs(INTEGER) TO authenticated;

-- =====================================================
-- SECTION 7: COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION superuser_audit_trigger_function() IS 'Enhanced audit trigger function that logs both regular and superuser-specific audit entries';
COMMENT ON FUNCTION log_superuser_api_action(VARCHAR, VARCHAR, JSONB, UUID, VARCHAR, UUID, VARCHAR, BOOLEAN, TEXT, INTEGER) IS 'Manually logs superuser API actions with full context';
COMMENT ON FUNCTION log_superuser_bulk_action(VARCHAR, VARCHAR, JSONB, INTEGER, INTEGER, VARCHAR, INTEGER) IS 'Logs bulk operations performed by superusers';
COMMENT ON FUNCTION get_superuser_audit_statistics(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, UUID) IS 'Returns comprehensive audit statistics for superuser activities';
COMMENT ON FUNCTION search_superuser_audit_logs(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, UUID, VARCHAR, VARCHAR, UUID, BOOLEAN, TEXT, INTEGER, INTEGER) IS 'Advanced search function for superuser audit logs with multiple filters';
COMMENT ON FUNCTION cleanup_superuser_audit_logs(INTEGER, INTEGER) IS 'Cleans up old superuser audit logs based on retention policies';
COMMENT ON FUNCTION archive_superuser_audit_logs(INTEGER) IS 'Archives old superuser audit logs to the archived_records table';

-- Log successful enhancement
DO $$
BEGIN
    RAISE NOTICE 'Superuser audit logging enhancements completed successfully';
    RAISE NOTICE 'Enhanced audit triggers applied to critical tables';
    RAISE NOTICE 'Manual logging functions created for API actions';
    RAISE NOTICE 'Advanced search and reporting functions available';
    RAISE NOTICE 'Cleanup and archiving functions implemented';
END $$;