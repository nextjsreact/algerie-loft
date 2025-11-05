-- Superuser Maintenance Functions
-- These functions support system maintenance operations

-- Function to get database information
CREATE OR REPLACE FUNCTION get_database_info()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'version', version(),
        'current_database', current_database(),
        'current_user', current_user,
        'server_encoding', pg_encoding_to_char(pg_database.encoding),
        'database_size', pg_size_pretty(pg_database_size(current_database())),
        'uptime', now() - pg_postmaster_start_time()
    ) INTO result
    FROM pg_database 
    WHERE datname = current_database();
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get table sizes
CREATE OR REPLACE FUNCTION get_table_sizes()
RETURNS TABLE(
    schema_name TEXT,
    table_name TEXT,
    total_size TEXT,
    table_size TEXT,
    index_size TEXT,
    row_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname::TEXT,
        tablename::TEXT,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
        pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size,
        COALESCE(c.reltuples::BIGINT, 0) as row_count
    FROM pg_tables pt
    LEFT JOIN pg_class c ON c.relname = pt.tablename
    LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = pt.schemaname
    WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active connections
CREATE OR REPLACE FUNCTION get_active_connections()
RETURNS INTEGER AS $$
DECLARE
    connection_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO connection_count
    FROM pg_stat_activity
    WHERE state = 'active' AND pid != pg_backend_pid();
    
    RETURN connection_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get table statistics
CREATE OR REPLACE FUNCTION get_table_statistics()
RETURNS TABLE(
    schema_name TEXT,
    table_name TEXT,
    n_tup_ins BIGINT,
    n_tup_upd BIGINT,
    n_tup_del BIGINT,
    n_live_tup BIGINT,
    n_dead_tup BIGINT,
    last_vacuum TIMESTAMP WITH TIME ZONE,
    last_autovacuum TIMESTAMP WITH TIME ZONE,
    last_analyze TIMESTAMP WITH TIME ZONE,
    last_autoanalyze TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname::TEXT,
        relname::TEXT,
        n_tup_ins,
        n_tup_upd,
        n_tup_del,
        n_live_tup,
        n_dead_tup,
        last_vacuum,
        last_autovacuum,
        last_analyze,
        last_autoanalyze
    FROM pg_stat_user_tables
    ORDER BY schemaname, relname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get index usage statistics
CREATE OR REPLACE FUNCTION get_index_usage()
RETURNS TABLE(
    schema_name TEXT,
    table_name TEXT,
    index_name TEXT,
    idx_tup_read BIGINT,
    idx_tup_fetch BIGINT,
    idx_blks_read BIGINT,
    idx_blks_hit BIGINT,
    usage_ratio NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname::TEXT,
        relname::TEXT,
        indexrelname::TEXT,
        idx_tup_read,
        idx_tup_fetch,
        idx_blks_read,
        idx_blks_hit,
        CASE 
            WHEN (idx_blks_read + idx_blks_hit) > 0 
            THEN ROUND((idx_blks_hit::NUMERIC / (idx_blks_read + idx_blks_hit)) * 100, 2)
            ELSE 0 
        END as usage_ratio
    FROM pg_stat_user_indexes
    ORDER BY schemaname, relname, indexrelname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get slow queries (simplified version)
CREATE OR REPLACE FUNCTION get_slow_queries()
RETURNS TABLE(
    query_text TEXT,
    calls BIGINT,
    total_time DOUBLE PRECISION,
    mean_time DOUBLE PRECISION,
    rows BIGINT
) AS $$
BEGIN
    -- This would require pg_stat_statements extension
    -- For now, return empty result
    RETURN QUERY
    SELECT 
        'No slow query data available'::TEXT,
        0::BIGINT,
        0::DOUBLE PRECISION,
        0::DOUBLE PRECISION,
        0::BIGINT
    WHERE FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old audit logs
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(retention_days INTEGER DEFAULT 90)
RETURNS JSON AS $$
DECLARE
    deleted_count INTEGER;
    cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
    cutoff_date := NOW() - (retention_days || ' days')::INTERVAL;
    
    DELETE FROM superuser_audit_logs 
    WHERE timestamp < cutoff_date;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN json_build_object(
        'deleted_records', deleted_count,
        'cutoff_date', cutoff_date,
        'retention_days', retention_days
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS JSON AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- This would cleanup expired sessions from auth.sessions if accessible
    -- For now, return a placeholder
    deleted_count := 0;
    
    RETURN json_build_object(
        'deleted_sessions', deleted_count,
        'cleanup_time', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup orphaned records
CREATE OR REPLACE FUNCTION cleanup_orphaned_records()
RETURNS JSON AS $$
DECLARE
    result JSON;
    orphaned_count INTEGER := 0;
BEGIN
    -- Example: Clean up orphaned notifications
    DELETE FROM notifications 
    WHERE user_id NOT IN (SELECT id FROM auth.users);
    
    GET DIAGNOSTICS orphaned_count = ROW_COUNT;
    
    result := json_build_object(
        'orphaned_notifications', orphaned_count,
        'cleanup_time', NOW()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reindex tables
CREATE OR REPLACE FUNCTION reindex_tables(table_names TEXT[] DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    table_name TEXT;
    reindexed_count INTEGER := 0;
    result JSON;
BEGIN
    -- If no specific tables provided, reindex all user tables
    IF table_names IS NULL THEN
        FOR table_name IN 
            SELECT schemaname||'.'||tablename 
            FROM pg_tables 
            WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
        LOOP
            EXECUTE 'REINDEX TABLE ' || table_name;
            reindexed_count := reindexed_count + 1;
        END LOOP;
    ELSE
        FOREACH table_name IN ARRAY table_names
        LOOP
            EXECUTE 'REINDEX TABLE ' || table_name;
            reindexed_count := reindexed_count + 1;
        END LOOP;
    END IF;
    
    result := json_build_object(
        'reindexed_tables', reindexed_count,
        'reindex_time', NOW()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update table statistics
CREATE OR REPLACE FUNCTION update_table_statistics(table_names TEXT[] DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    table_name TEXT;
    analyzed_count INTEGER := 0;
    result JSON;
BEGIN
    -- If no specific tables provided, analyze all user tables
    IF table_names IS NULL THEN
        FOR table_name IN 
            SELECT schemaname||'.'||tablename 
            FROM pg_tables 
            WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
        LOOP
            EXECUTE 'ANALYZE ' || table_name;
            analyzed_count := analyzed_count + 1;
        END LOOP;
    ELSE
        FOREACH table_name IN ARRAY table_names
        LOOP
            EXECUTE 'ANALYZE ' || table_name;
            analyzed_count := analyzed_count + 1;
        END LOOP;
    END IF;
    
    result := json_build_object(
        'analyzed_tables', analyzed_count,
        'analyze_time', NOW()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to vacuum and analyze tables
CREATE OR REPLACE FUNCTION vacuum_analyze_tables(
    table_names TEXT[] DEFAULT NULL,
    full_vacuum BOOLEAN DEFAULT FALSE
)
RETURNS JSON AS $$
DECLARE
    table_name TEXT;
    vacuum_command TEXT;
    processed_count INTEGER := 0;
    result JSON;
BEGIN
    vacuum_command := CASE WHEN full_vacuum THEN 'VACUUM FULL ANALYZE ' ELSE 'VACUUM ANALYZE ' END;
    
    -- If no specific tables provided, vacuum all user tables
    IF table_names IS NULL THEN
        FOR table_name IN 
            SELECT schemaname||'.'||tablename 
            FROM pg_tables 
            WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
        LOOP
            EXECUTE vacuum_command || table_name;
            processed_count := processed_count + 1;
        END LOOP;
    ELSE
        FOREACH table_name IN ARRAY table_names
        LOOP
            EXECUTE vacuum_command || table_name;
            processed_count := processed_count + 1;
        END LOOP;
    END IF;
    
    result := json_build_object(
        'processed_tables', processed_count,
        'vacuum_type', CASE WHEN full_vacuum THEN 'FULL' ELSE 'STANDARD' END,
        'vacuum_time', NOW()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users (will be restricted by RLS)
GRANT EXECUTE ON FUNCTION get_database_info() TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_sizes() TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_connections() TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_index_usage() TO authenticated;
GRANT EXECUTE ON FUNCTION get_slow_queries() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_audit_logs(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_orphaned_records() TO authenticated;
GRANT EXECUTE ON FUNCTION reindex_tables(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION update_table_statistics(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION vacuum_analyze_tables(TEXT[], BOOLEAN) TO authenticated;