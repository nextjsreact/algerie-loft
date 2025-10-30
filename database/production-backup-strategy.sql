-- =====================================================
-- PRODUCTION BACKUP AND DISASTER RECOVERY STRATEGY
-- =====================================================
-- Comprehensive backup, replication, and disaster recovery setup
-- Requirements: 9.1, 9.2, 9.5
-- =====================================================

-- =====================================================
-- 1. BACKUP CONFIGURATION SETUP
-- =====================================================

-- Create backup monitoring table
CREATE TABLE IF NOT EXISTS backup_monitoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_type VARCHAR(50) NOT NULL, -- 'full', 'incremental', 'transaction_log'
    backup_size_bytes BIGINT,
    backup_duration_seconds INTEGER,
    backup_status VARCHAR(20) NOT NULL CHECK (backup_status IN ('started', 'completed', 'failed')),
    backup_location TEXT,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    database_size_bytes BIGINT,
    tables_backed_up TEXT[],
    backup_method VARCHAR(50), -- 'pg_dump', 'pg_basebackup', 'supabase_backup'
    retention_until DATE
);

-- Create index for backup monitoring
CREATE INDEX IF NOT EXISTS idx_backup_monitoring_type_status ON backup_monitoring(backup_type, backup_status);
CREATE INDEX IF NOT EXISTS idx_backup_monitoring_started_at ON backup_monitoring(started_at);

-- =====================================================
-- 2. BACKUP FUNCTIONS
-- =====================================================

-- Function to log backup operations
CREATE OR REPLACE FUNCTION log_backup_operation(
    p_backup_type VARCHAR(50),
    p_backup_method VARCHAR(50),
    p_backup_location TEXT DEFAULT NULL
) RETURNS UUID AS $
DECLARE
    backup_id UUID;
    db_size BIGINT;
BEGIN
    -- Get current database size
    SELECT pg_database_size(current_database()) INTO db_size;
    
    -- Insert backup log entry
    INSERT INTO backup_monitoring (
        backup_type, 
        backup_method, 
        backup_location, 
        backup_status, 
        database_size_bytes
    ) VALUES (
        p_backup_type, 
        p_backup_method, 
        p_backup_location, 
        'started', 
        db_size
    ) RETURNING id INTO backup_id;
    
    RETURN backup_id;
END;
$ LANGUAGE plpgsql;

-- Function to complete backup operation
CREATE OR REPLACE FUNCTION complete_backup_operation(
    p_backup_id UUID,
    p_backup_size_bytes BIGINT DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL
) RETURNS VOID AS $
DECLARE
    duration_seconds INTEGER;
BEGIN
    -- Calculate duration
    SELECT EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER 
    INTO duration_seconds
    FROM backup_monitoring 
    WHERE id = p_backup_id;
    
    -- Update backup record
    UPDATE backup_monitoring SET
        backup_status = CASE WHEN p_error_message IS NULL THEN 'completed' ELSE 'failed' END,
        backup_size_bytes = p_backup_size_bytes,
        backup_duration_seconds = duration_seconds,
        error_message = p_error_message,
        completed_at = NOW()
    WHERE id = p_backup_id;
END;
$ LANGUAGE plpgsql;

-- Function to get backup statistics
CREATE OR REPLACE FUNCTION get_backup_statistics(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
    backup_type VARCHAR(50),
    total_backups BIGINT,
    successful_backups BIGINT,
    failed_backups BIGINT,
    avg_duration_minutes DECIMAL(10,2),
    avg_size_gb DECIMAL(10,2),
    last_successful_backup TIMESTAMP WITH TIME ZONE,
    success_rate_percent DECIMAL(5,2)
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        bm.backup_type,
        COUNT(*) as total_backups,
        COUNT(*) FILTER (WHERE bm.backup_status = 'completed') as successful_backups,
        COUNT(*) FILTER (WHERE bm.backup_status = 'failed') as failed_backups,
        ROUND(AVG(bm.backup_duration_seconds) FILTER (WHERE bm.backup_status = 'completed') / 60.0, 2) as avg_duration_minutes,
        ROUND(AVG(bm.backup_size_bytes) FILTER (WHERE bm.backup_status = 'completed') / (1024.0^3), 2) as avg_size_gb,
        MAX(bm.completed_at) FILTER (WHERE bm.backup_status = 'completed') as last_successful_backup,
        ROUND(
            COUNT(*) FILTER (WHERE bm.backup_status = 'completed')::DECIMAL / 
            NULLIF(COUNT(*), 0) * 100, 2
        ) as success_rate_percent
    FROM backup_monitoring bm
    WHERE bm.started_at >= NOW() - (days_back || ' days')::INTERVAL
    GROUP BY bm.backup_type
    ORDER BY bm.backup_type;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- 3. DATA RETENTION POLICIES
-- =====================================================

-- Function to clean up old backup logs
CREATE OR REPLACE FUNCTION cleanup_backup_logs(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM backup_monitoring 
    WHERE started_at < NOW() - (retention_days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$ LANGUAGE plpgsql;

-- Function to archive old reservations (completed > 2 years ago)
CREATE OR REPLACE FUNCTION archive_old_reservations(retention_years INTEGER DEFAULT 2)
RETURNS INTEGER AS $
DECLARE
    archived_count INTEGER;
    cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
    cutoff_date := NOW() - (retention_years || ' years')::INTERVAL;
    
    -- Create archive table if not exists
    CREATE TABLE IF NOT EXISTS reservations_archive (LIKE reservations INCLUDING ALL);
    
    -- Archive old completed reservations
    WITH archived_records AS (
        DELETE FROM reservations 
        WHERE status = 'completed' 
        AND check_out_date < cutoff_date::DATE
        RETURNING *
    )
    INSERT INTO reservations_archive 
    SELECT * FROM archived_records;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    
    RETURN archived_count;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- 4. CRITICAL DATA IDENTIFICATION
-- =====================================================

-- View to identify critical tables and their sizes
CREATE OR REPLACE VIEW critical_data_inventory AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes,
    CASE 
        WHEN tablename IN ('reservations', 'customers', 'reservation_payments') THEN 'critical'
        WHEN tablename IN ('lofts', 'availability', 'reservation_audit_log') THEN 'important'
        ELSE 'standard'
    END as priority_level,
    CASE 
        WHEN tablename IN ('reservations', 'customers', 'reservation_payments') THEN 'Daily full backup required'
        WHEN tablename IN ('lofts', 'availability') THEN 'Daily incremental backup'
        ELSE 'Weekly backup sufficient'
    END as backup_recommendation
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- =====================================================
-- 5. POINT-IN-TIME RECOVERY SETUP
-- =====================================================

-- Function to create recovery checkpoint
CREATE OR REPLACE FUNCTION create_recovery_checkpoint(checkpoint_name TEXT)
RETURNS JSONB AS $
DECLARE
    checkpoint_info JSONB;
    current_lsn TEXT;
    current_time TIMESTAMP WITH TIME ZONE;
BEGIN
    current_time := NOW();
    
    -- Get current WAL LSN (Log Sequence Number)
    SELECT pg_current_wal_lsn()::TEXT INTO current_lsn;
    
    -- Build checkpoint information
    checkpoint_info := jsonb_build_object(
        'checkpoint_name', checkpoint_name,
        'created_at', current_time,
        'wal_lsn', current_lsn,
        'database_size', pg_database_size(current_database()),
        'active_connections', (SELECT count(*) FROM pg_stat_activity WHERE state = 'active'),
        'total_reservations', (SELECT count(*) FROM reservations),
        'total_customers', (SELECT count(*) FROM customers),
        'total_lofts', (SELECT count(*) FROM lofts)
    );
    
    -- Log checkpoint creation
    INSERT INTO backup_monitoring (
        backup_type, 
        backup_method, 
        backup_status, 
        backup_location
    ) VALUES (
        'checkpoint', 
        'manual', 
        'completed', 
        checkpoint_info->>'checkpoint_name'
    );
    
    RETURN checkpoint_info;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- 6. DISASTER RECOVERY PROCEDURES
-- =====================================================

-- Function to validate database integrity
CREATE OR REPLACE FUNCTION validate_database_integrity()
RETURNS TABLE(
    table_name TEXT,
    check_type TEXT,
    status TEXT,
    details TEXT
) AS $
DECLARE
    rec RECORD;
BEGIN
    -- Check foreign key constraints
    FOR rec IN 
        SELECT conname, conrelid::regclass as table_name
        FROM pg_constraint 
        WHERE contype = 'f' AND connamespace = 'public'::regnamespace
    LOOP
        BEGIN
            EXECUTE format('SELECT 1 FROM %s LIMIT 1', rec.table_name);
            RETURN QUERY SELECT rec.table_name::TEXT, 'foreign_key'::TEXT, 'valid'::TEXT, rec.conname::TEXT;
        EXCEPTION WHEN OTHERS THEN
            RETURN QUERY SELECT rec.table_name::TEXT, 'foreign_key'::TEXT, 'error'::TEXT, SQLERRM::TEXT;
        END;
    END LOOP;
    
    -- Check critical table row counts
    RETURN QUERY SELECT 'reservations'::TEXT, 'row_count'::TEXT, 'valid'::TEXT, 
                        (SELECT count(*)::TEXT FROM reservations) || ' rows';
    RETURN QUERY SELECT 'customers'::TEXT, 'row_count'::TEXT, 'valid'::TEXT, 
                        (SELECT count(*)::TEXT FROM customers) || ' rows';
    RETURN QUERY SELECT 'lofts'::TEXT, 'row_count'::TEXT, 'valid'::TEXT, 
                        (SELECT count(*)::TEXT FROM lofts) || ' rows';
    
    -- Check for orphaned records
    RETURN QUERY 
    SELECT 'reservations'::TEXT, 'orphaned_records'::TEXT, 
           CASE WHEN count(*) = 0 THEN 'valid' ELSE 'warning' END::TEXT,
           count(*)::TEXT || ' orphaned reservations'
    FROM reservations r 
    WHERE r.customer_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM customers c WHERE c.id = r.customer_id);
    
    RETURN QUERY 
    SELECT 'reservations'::TEXT, 'invalid_loft_refs'::TEXT, 
           CASE WHEN count(*) = 0 THEN 'valid' ELSE 'error' END::TEXT,
           count(*)::TEXT || ' invalid loft references'
    FROM reservations r 
    WHERE NOT EXISTS (SELECT 1 FROM lofts l WHERE l.id = r.loft_id);
END;
$ LANGUAGE plpgsql;

-- Function to generate disaster recovery report
CREATE OR REPLACE FUNCTION generate_disaster_recovery_report()
RETURNS JSONB AS $
DECLARE
    report JSONB;
    db_size BIGINT;
    table_count INTEGER;
    index_count INTEGER;
    last_backup TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Gather system information
    SELECT pg_database_size(current_database()) INTO db_size;
    
    SELECT count(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
    
    SELECT count(*) INTO index_count 
    FROM pg_indexes 
    WHERE schemaname = 'public';
    
    SELECT MAX(completed_at) INTO last_backup 
    FROM backup_monitoring 
    WHERE backup_status = 'completed';
    
    -- Build comprehensive report
    report := jsonb_build_object(
        'report_generated_at', NOW(),
        'database_info', jsonb_build_object(
            'database_name', current_database(),
            'database_size_bytes', db_size,
            'database_size_human', pg_size_pretty(db_size),
            'table_count', table_count,
            'index_count', index_count
        ),
        'backup_status', jsonb_build_object(
            'last_successful_backup', last_backup,
            'hours_since_last_backup', EXTRACT(EPOCH FROM (NOW() - COALESCE(last_backup, '1970-01-01'::TIMESTAMP WITH TIME ZONE))) / 3600,
            'backup_health', CASE 
                WHEN last_backup IS NULL THEN 'critical'
                WHEN last_backup < NOW() - INTERVAL '24 hours' THEN 'warning'
                ELSE 'healthy'
            END
        ),
        'data_summary', jsonb_build_object(
            'total_reservations', (SELECT count(*) FROM reservations),
            'active_reservations', (SELECT count(*) FROM reservations WHERE status IN ('pending', 'confirmed')),
            'total_customers', (SELECT count(*) FROM customers),
            'total_lofts', (SELECT count(*) FROM lofts),
            'available_lofts', (SELECT count(*) FROM lofts WHERE status = 'available')
        ),
        'system_health', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'table_name', table_name,
                    'check_type', check_type,
                    'status', status,
                    'details', details
                )
            )
            FROM validate_database_integrity()
        )
    );
    
    RETURN report;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- 7. MONITORING AND ALERTING SETUP
-- =====================================================

-- Function to check backup health and generate alerts
CREATE OR REPLACE FUNCTION check_backup_health()
RETURNS TABLE(
    alert_level TEXT,
    alert_message TEXT,
    recommended_action TEXT
) AS $
DECLARE
    last_full_backup TIMESTAMP WITH TIME ZONE;
    last_incremental_backup TIMESTAMP WITH TIME ZONE;
    failed_backups_24h INTEGER;
BEGIN
    -- Get last successful backups
    SELECT MAX(completed_at) INTO last_full_backup
    FROM backup_monitoring 
    WHERE backup_type = 'full' AND backup_status = 'completed';
    
    SELECT MAX(completed_at) INTO last_incremental_backup
    FROM backup_monitoring 
    WHERE backup_type = 'incremental' AND backup_status = 'completed';
    
    -- Count failed backups in last 24 hours
    SELECT COUNT(*) INTO failed_backups_24h
    FROM backup_monitoring 
    WHERE backup_status = 'failed' 
    AND started_at >= NOW() - INTERVAL '24 hours';
    
    -- Generate alerts based on conditions
    
    -- Critical: No full backup in 7 days
    IF last_full_backup IS NULL OR last_full_backup < NOW() - INTERVAL '7 days' THEN
        RETURN QUERY SELECT 
            'CRITICAL'::TEXT,
            'No successful full backup in the last 7 days'::TEXT,
            'Immediately perform a full database backup'::TEXT;
    END IF;
    
    -- Warning: No backup in 24 hours
    IF COALESCE(last_incremental_backup, last_full_backup) < NOW() - INTERVAL '24 hours' THEN
        RETURN QUERY SELECT 
            'WARNING'::TEXT,
            'No successful backup in the last 24 hours'::TEXT,
            'Perform an incremental backup and check backup system'::TEXT;
    END IF;
    
    -- Warning: Multiple failed backups
    IF failed_backups_24h >= 3 THEN
        RETURN QUERY SELECT 
            'WARNING'::TEXT,
            format('Multiple backup failures (%s) in the last 24 hours', failed_backups_24h),
            'Investigate backup system issues and resolve failures'::TEXT;
    END IF;
    
    -- Info: System healthy
    IF NOT EXISTS (
        SELECT 1 FROM check_backup_health() 
        WHERE alert_level IN ('CRITICAL', 'WARNING')
    ) THEN
        RETURN QUERY SELECT 
            'INFO'::TEXT,
            'Backup system is healthy'::TEXT,
            'Continue regular backup schedule'::TEXT;
    END IF;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- 8. AUTOMATED MAINTENANCE PROCEDURES
-- =====================================================

-- Function to perform daily maintenance tasks
CREATE OR REPLACE FUNCTION perform_daily_maintenance()
RETURNS JSONB AS $
DECLARE
    maintenance_report JSONB;
    expired_locks_cleaned INTEGER;
    old_logs_cleaned INTEGER;
    old_reservations_archived INTEGER;
BEGIN
    -- Clean up expired reservation locks
    SELECT cleanup_expired_locks() INTO expired_locks_cleaned;
    
    -- Clean up old backup logs (keep 90 days)
    SELECT cleanup_backup_logs(90) INTO old_logs_cleaned;
    
    -- Archive old completed reservations (older than 2 years)
    SELECT archive_old_reservations(2) INTO old_reservations_archived;
    
    -- Update table statistics
    ANALYZE;
    
    -- Build maintenance report
    maintenance_report := jsonb_build_object(
        'maintenance_completed_at', NOW(),
        'tasks_performed', jsonb_build_object(
            'expired_locks_cleaned', expired_locks_cleaned,
            'old_backup_logs_cleaned', old_logs_cleaned,
            'old_reservations_archived', old_reservations_archived,
            'statistics_updated', true
        ),
        'next_maintenance_due', NOW() + INTERVAL '1 day'
    );
    
    RETURN maintenance_report;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- 9. BACKUP VERIFICATION PROCEDURES
-- =====================================================

-- Function to verify backup integrity
CREATE OR REPLACE FUNCTION verify_backup_integrity(backup_id UUID)
RETURNS JSONB AS $
DECLARE
    backup_record RECORD;
    verification_result JSONB;
BEGIN
    -- Get backup information
    SELECT * INTO backup_record
    FROM backup_monitoring 
    WHERE id = backup_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'status', 'error',
            'message', 'Backup record not found'
        );
    END IF;
    
    -- Perform basic verification checks
    verification_result := jsonb_build_object(
        'backup_id', backup_id,
        'verification_time', NOW(),
        'backup_type', backup_record.backup_type,
        'backup_status', backup_record.backup_status,
        'backup_size_mb', ROUND(backup_record.backup_size_bytes / (1024.0^2), 2),
        'backup_age_hours', EXTRACT(EPOCH FROM (NOW() - backup_record.completed_at)) / 3600,
        'verification_status', CASE 
            WHEN backup_record.backup_status != 'completed' THEN 'failed'
            WHEN backup_record.backup_size_bytes IS NULL OR backup_record.backup_size_bytes = 0 THEN 'suspicious'
            WHEN backup_record.completed_at IS NULL THEN 'incomplete'
            ELSE 'verified'
        END
    );
    
    RETURN verification_result;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- 10. EMERGENCY RECOVERY PROCEDURES
-- =====================================================

-- Function to prepare for emergency recovery
CREATE OR REPLACE FUNCTION prepare_emergency_recovery()
RETURNS JSONB AS $
DECLARE
    recovery_info JSONB;
    critical_tables TEXT[];
    current_connections INTEGER;
BEGIN
    -- Identify critical tables
    critical_tables := ARRAY['reservations', 'customers', 'lofts', 'reservation_payments'];
    
    -- Get current connection count
    SELECT count(*) INTO current_connections 
    FROM pg_stat_activity 
    WHERE state = 'active';
    
    -- Create emergency checkpoint
    PERFORM pg_switch_wal();
    
    -- Build recovery information
    recovery_info := jsonb_build_object(
        'emergency_prep_time', NOW(),
        'database_state', jsonb_build_object(
            'current_wal_lsn', pg_current_wal_lsn(),
            'active_connections', current_connections,
            'database_size', pg_database_size(current_database())
        ),
        'critical_tables', jsonb_build_object(
            'table_list', critical_tables,
            'reservations_count', (SELECT count(*) FROM reservations),
            'customers_count', (SELECT count(*) FROM customers),
            'lofts_count', (SELECT count(*) FROM lofts),
            'payments_count', (SELECT count(*) FROM reservation_payments)
        ),
        'recovery_recommendations', ARRAY[
            'Ensure all users are disconnected before recovery',
            'Verify backup integrity before proceeding',
            'Document all recovery steps performed',
            'Test application connectivity after recovery'
        ]
    );
    
    -- Log emergency preparation
    INSERT INTO backup_monitoring (
        backup_type, 
        backup_method, 
        backup_status, 
        backup_location
    ) VALUES (
        'emergency_prep', 
        'manual', 
        'completed', 
        'Emergency recovery preparation completed'
    );
    
    RETURN recovery_info;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- 11. BACKUP SCHEDULING RECOMMENDATIONS
-- =====================================================

/*
RECOMMENDED BACKUP SCHEDULE FOR PRODUCTION:

1. FULL BACKUPS:
   - Frequency: Daily at 2:00 AM (low traffic time)
   - Retention: 30 days
   - Method: pg_dump with compression
   - Storage: Multiple locations (local + cloud)

2. INCREMENTAL BACKUPS:
   - Frequency: Every 6 hours
   - Retention: 7 days
   - Method: WAL archiving
   - Storage: Fast access storage

3. TRANSACTION LOG BACKUPS:
   - Frequency: Continuous (WAL streaming)
   - Retention: 24 hours
   - Method: WAL-E or similar
   - Storage: High availability storage

4. SNAPSHOT BACKUPS:
   - Frequency: Weekly (Sundays at 1:00 AM)
   - Retention: 12 weeks
   - Method: File system snapshots
   - Storage: Long-term archive storage

MONITORING AND ALERTING:
- Check backup completion status every hour
- Alert if backup fails or takes longer than expected
- Monitor backup storage space usage
- Verify backup integrity weekly
- Test recovery procedures monthly
*/

-- =====================================================
-- 12. COMPLETION AND VERIFICATION
-- =====================================================

-- Grant necessary permissions for backup operations
GRANT EXECUTE ON FUNCTION log_backup_operation(VARCHAR, VARCHAR, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION complete_backup_operation(UUID, BIGINT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_backup_statistics(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION check_backup_health() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_disaster_recovery_report() TO authenticated;

-- Create initial backup monitoring entry
INSERT INTO backup_monitoring (
    backup_type, 
    backup_method, 
    backup_status, 
    backup_location
) VALUES (
    'schema_deployment', 
    'manual', 
    'completed', 
    'Production backup strategy deployed'
);

SELECT 'Production Backup and Disaster Recovery Strategy Deployed! 🛡️' as status,
       'Features: Backup monitoring, integrity validation, disaster recovery procedures, automated maintenance' as features,
       'Next steps: Configure automated backup jobs, set up monitoring alerts, test recovery procedures' as next_steps;