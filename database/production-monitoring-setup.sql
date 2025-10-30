-- =====================================================
-- PRODUCTION DATABASE MONITORING AND HEALTH SETUP
-- =====================================================
-- Comprehensive monitoring, alerting, and health check system
-- Requirements: 9.1, 9.2, 9.5
-- =====================================================

-- =====================================================
-- 1. MONITORING INFRASTRUCTURE SETUP
-- =====================================================

-- Enable required extensions for monitoring
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_buffercache";

-- Create monitoring configuration table
CREATE TABLE IF NOT EXISTS monitoring_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(100) NOT NULL UNIQUE,
    metric_type VARCHAR(50) NOT NULL, -- 'performance', 'availability', 'capacity', 'security'
    threshold_warning DECIMAL(15,2),
    threshold_critical DECIMAL(15,2),
    check_interval_minutes INTEGER DEFAULT 5,
    enabled BOOLEAN DEFAULT true,
    alert_channels TEXT[] DEFAULT '{"email"}',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create monitoring metrics table
CREATE TABLE IF NOT EXISTS monitoring_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    metric_unit VARCHAR(20),
    status VARCHAR(20) CHECK (status IN ('normal', 'warning', 'critical')),
    additional_data JSONB,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT fk_monitoring_metrics_config 
        FOREIGN KEY (metric_name) REFERENCES monitoring_config(metric_name)
);

-- Create monitoring alerts table
CREATE TABLE IF NOT EXISTS monitoring_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(100) NOT NULL,
    alert_level VARCHAR(20) NOT NULL CHECK (alert_level IN ('warning', 'critical')),
    alert_message TEXT NOT NULL,
    metric_value DECIMAL(15,2),
    threshold_exceeded DECIMAL(15,2),
    additional_context JSONB,
    
    -- Alert lifecycle
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id),
    resolution_notes TEXT,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'suppressed'))
);

-- =====================================================
-- 2. PERFORMANCE MONITORING FUNCTIONS
-- =====================================================

-- Function to collect database performance metrics
CREATE OR REPLACE FUNCTION collect_performance_metrics()
RETURNS JSONB AS $
DECLARE
    metrics JSONB;
    db_size BIGINT;
    active_connections INTEGER;
    slow_queries INTEGER;
    cache_hit_ratio DECIMAL(5,2);
    avg_query_time DECIMAL(10,3);
BEGIN
    -- Get database size
    SELECT pg_database_size(current_database()) INTO db_size;
    
    -- Get active connections
    SELECT count(*) INTO active_connections
    FROM pg_stat_activity 
    WHERE state = 'active' AND pid != pg_backend_pid();
    
    -- Get slow queries count (queries > 1 second)
    SELECT count(*) INTO slow_queries
    FROM pg_stat_statements 
    WHERE mean_exec_time > 1000;
    
    -- Calculate cache hit ratio
    SELECT 
        ROUND(
            (sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0)) * 100, 2
        ) INTO cache_hit_ratio
    FROM pg_statio_user_tables;
    
    -- Get average query execution time
    SELECT ROUND(AVG(mean_exec_time), 3) INTO avg_query_time
    FROM pg_stat_statements
    WHERE calls > 10; -- Only consider frequently executed queries
    
    -- Build metrics object
    metrics := jsonb_build_object(
        'database_size_bytes', db_size,
        'database_size_mb', ROUND(db_size / (1024.0^2), 2),
        'active_connections', active_connections,
        'slow_queries_count', slow_queries,
        'cache_hit_ratio_percent', COALESCE(cache_hit_ratio, 0),
        'avg_query_time_ms', COALESCE(avg_query_time, 0),
        'collected_at', NOW()
    );
    
    -- Store individual metrics
    INSERT INTO monitoring_metrics (metric_name, metric_value, metric_unit, status) VALUES
        ('database_size_mb', (metrics->>'database_size_mb')::DECIMAL, 'MB', 
         CASE WHEN (metrics->>'database_size_mb')::DECIMAL > 10000 THEN 'warning' ELSE 'normal' END),
        ('active_connections', active_connections, 'count',
         CASE WHEN active_connections > 80 THEN 'critical' 
              WHEN active_connections > 50 THEN 'warning' 
              ELSE 'normal' END),
        ('cache_hit_ratio', COALESCE(cache_hit_ratio, 0), 'percent',
         CASE WHEN COALESCE(cache_hit_ratio, 0) < 90 THEN 'warning' ELSE 'normal' END),
        ('avg_query_time', COALESCE(avg_query_time, 0), 'ms',
         CASE WHEN COALESCE(avg_query_time, 0) > 500 THEN 'warning' ELSE 'normal' END);
    
    RETURN metrics;
END;
$ LANGUAGE plpgsql;

-- Function to collect reservation system metrics
CREATE OR REPLACE FUNCTION collect_reservation_metrics()
RETURNS JSONB AS $
DECLARE
    metrics JSONB;
    total_reservations INTEGER;
    active_reservations INTEGER;
    pending_payments INTEGER;
    failed_payments_24h INTEGER;
    avg_booking_value DECIMAL(10,2);
    conversion_rate DECIMAL(5,2);
BEGIN
    -- Get reservation counts
    SELECT count(*) INTO total_reservations FROM reservations;
    
    SELECT count(*) INTO active_reservations 
    FROM reservations 
    WHERE status IN ('pending', 'confirmed') 
    AND check_out_date >= CURRENT_DATE;
    
    -- Get payment metrics
    SELECT count(*) INTO pending_payments
    FROM reservations 
    WHERE payment_status = 'pending' 
    AND status != 'cancelled';
    
    SELECT count(*) INTO failed_payments_24h
    FROM reservation_payments 
    WHERE status = 'failed' 
    AND created_at >= NOW() - INTERVAL '24 hours';
    
    -- Calculate average booking value (last 30 days)
    SELECT ROUND(AVG((pricing->>'total_amount')::DECIMAL), 2) INTO avg_booking_value
    FROM reservations 
    WHERE status = 'confirmed' 
    AND created_at >= NOW() - INTERVAL '30 days';
    
    -- Calculate conversion rate (confirmed / total created in last 7 days)
    SELECT ROUND(
        (COUNT(*) FILTER (WHERE status = 'confirmed')::DECIMAL / 
         NULLIF(COUNT(*), 0)) * 100, 2
    ) INTO conversion_rate
    FROM reservations 
    WHERE created_at >= NOW() - INTERVAL '7 days';
    
    -- Build metrics object
    metrics := jsonb_build_object(
        'total_reservations', total_reservations,
        'active_reservations', active_reservations,
        'pending_payments', pending_payments,
        'failed_payments_24h', failed_payments_24h,
        'avg_booking_value_dzd', COALESCE(avg_booking_value, 0),
        'conversion_rate_percent', COALESCE(conversion_rate, 0),
        'collected_at', NOW()
    );
    
    -- Store individual metrics
    INSERT INTO monitoring_metrics (metric_name, metric_value, metric_unit, status) VALUES
        ('active_reservations', active_reservations, 'count', 'normal'),
        ('pending_payments', pending_payments, 'count',
         CASE WHEN pending_payments > 50 THEN 'warning' ELSE 'normal' END),
        ('failed_payments_24h', failed_payments_24h, 'count',
         CASE WHEN failed_payments_24h > 10 THEN 'critical'
              WHEN failed_payments_24h > 5 THEN 'warning'
              ELSE 'normal' END),
        ('conversion_rate', COALESCE(conversion_rate, 0), 'percent',
         CASE WHEN COALESCE(conversion_rate, 0) < 20 THEN 'warning' ELSE 'normal' END);
    
    RETURN metrics;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- 3. AVAILABILITY MONITORING FUNCTIONS
-- =====================================================

-- Function to check system availability
CREATE OR REPLACE FUNCTION check_system_availability()
RETURNS JSONB AS $
DECLARE
    availability_report JSONB;
    db_uptime INTERVAL;
    replication_lag INTEGER;
    disk_usage_percent DECIMAL(5,2);
    connection_limit INTEGER;
    current_connections INTEGER;
BEGIN
    -- Get database uptime
    SELECT NOW() - pg_postmaster_start_time() INTO db_uptime;
    
    -- Get connection information
    SELECT setting::INTEGER INTO connection_limit 
    FROM pg_settings WHERE name = 'max_connections';
    
    SELECT count(*) INTO current_connections 
    FROM pg_stat_activity;
    
    -- Calculate connection usage percentage
    disk_usage_percent := (current_connections::DECIMAL / connection_limit) * 100;
    
    -- Build availability report
    availability_report := jsonb_build_object(
        'database_uptime_hours', EXTRACT(EPOCH FROM db_uptime) / 3600,
        'connection_limit', connection_limit,
        'current_connections', current_connections,
        'connection_usage_percent', ROUND(disk_usage_percent, 2),
        'system_status', CASE 
            WHEN disk_usage_percent > 90 THEN 'critical'
            WHEN disk_usage_percent > 75 THEN 'warning'
            ELSE 'healthy'
        END,
        'checked_at', NOW()
    );
    
    -- Store availability metrics
    INSERT INTO monitoring_metrics (metric_name, metric_value, metric_unit, status) VALUES
        ('connection_usage', disk_usage_percent, 'percent',
         CASE WHEN disk_usage_percent > 90 THEN 'critical'
              WHEN disk_usage_percent > 75 THEN 'warning'
              ELSE 'normal' END),
        ('database_uptime_hours', EXTRACT(EPOCH FROM db_uptime) / 3600, 'hours', 'normal');
    
    RETURN availability_report;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- 4. SECURITY MONITORING FUNCTIONS
-- =====================================================

-- Function to monitor security events
CREATE OR REPLACE FUNCTION monitor_security_events()
RETURNS JSONB AS $
DECLARE
    security_report JSONB;
    failed_logins_24h INTEGER;
    suspicious_queries INTEGER;
    unusual_access_patterns INTEGER;
    admin_actions_24h INTEGER;
BEGIN
    -- Count failed authentication attempts (would need application-level logging)
    failed_logins_24h := 0; -- Placeholder - implement based on auth system
    
    -- Count potentially suspicious queries (long-running, resource-intensive)
    SELECT count(*) INTO suspicious_queries
    FROM pg_stat_activity 
    WHERE state = 'active' 
    AND query_start < NOW() - INTERVAL '5 minutes'
    AND query NOT LIKE '%pg_stat_activity%';
    
    -- Count unusual access patterns (high frequency from single IP)
    -- This would require application-level IP tracking
    unusual_access_patterns := 0; -- Placeholder
    
    -- Count admin actions in last 24 hours
    SELECT count(*) INTO admin_actions_24h
    FROM reservation_audit_log 
    WHERE user_type = 'admin' 
    AND created_at >= NOW() - INTERVAL '24 hours';
    
    -- Build security report
    security_report := jsonb_build_object(
        'failed_logins_24h', failed_logins_24h,
        'suspicious_queries', suspicious_queries,
        'unusual_access_patterns', unusual_access_patterns,
        'admin_actions_24h', admin_actions_24h,
        'security_status', CASE 
            WHEN suspicious_queries > 5 THEN 'warning'
            WHEN failed_logins_24h > 100 THEN 'critical'
            ELSE 'normal'
        END,
        'monitored_at', NOW()
    );
    
    -- Store security metrics
    INSERT INTO monitoring_metrics (metric_name, metric_value, metric_unit, status) VALUES
        ('suspicious_queries', suspicious_queries, 'count',
         CASE WHEN suspicious_queries > 5 THEN 'warning' ELSE 'normal' END),
        ('admin_actions_24h', admin_actions_24h, 'count', 'normal');
    
    RETURN security_report;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- 5. ALERTING SYSTEM
-- =====================================================

-- Function to generate alerts based on thresholds
CREATE OR REPLACE FUNCTION generate_monitoring_alerts()
RETURNS INTEGER AS $
DECLARE
    alert_count INTEGER := 0;
    metric_record RECORD;
    config_record RECORD;
BEGIN
    -- Check recent metrics against thresholds
    FOR metric_record IN 
        SELECT DISTINCT ON (metric_name) 
            metric_name, metric_value, status, recorded_at
        FROM monitoring_metrics 
        WHERE recorded_at >= NOW() - INTERVAL '1 hour'
        ORDER BY metric_name, recorded_at DESC
    LOOP
        -- Get configuration for this metric
        SELECT * INTO config_record
        FROM monitoring_config 
        WHERE metric_name = metric_record.metric_name 
        AND enabled = true;
        
        IF FOUND THEN
            -- Check for critical threshold breach
            IF config_record.threshold_critical IS NOT NULL 
               AND metric_record.metric_value >= config_record.threshold_critical THEN
                
                -- Check if alert already exists and is active
                IF NOT EXISTS (
                    SELECT 1 FROM monitoring_alerts 
                    WHERE metric_name = metric_record.metric_name 
                    AND alert_level = 'critical'
                    AND status = 'active'
                ) THEN
                    INSERT INTO monitoring_alerts (
                        metric_name, alert_level, alert_message, 
                        metric_value, threshold_exceeded
                    ) VALUES (
                        metric_record.metric_name,
                        'critical',
                        format('CRITICAL: %s has reached %s (threshold: %s)', 
                               metric_record.metric_name, 
                               metric_record.metric_value, 
                               config_record.threshold_critical),
                        metric_record.metric_value,
                        config_record.threshold_critical
                    );
                    alert_count := alert_count + 1;
                END IF;
                
            -- Check for warning threshold breach
            ELSIF config_record.threshold_warning IS NOT NULL 
                  AND metric_record.metric_value >= config_record.threshold_warning THEN
                
                IF NOT EXISTS (
                    SELECT 1 FROM monitoring_alerts 
                    WHERE metric_name = metric_record.metric_name 
                    AND alert_level = 'warning'
                    AND status = 'active'
                ) THEN
                    INSERT INTO monitoring_alerts (
                        metric_name, alert_level, alert_message, 
                        metric_value, threshold_exceeded
                    ) VALUES (
                        metric_record.metric_name,
                        'warning',
                        format('WARNING: %s has reached %s (threshold: %s)', 
                               metric_record.metric_name, 
                               metric_record.metric_value, 
                               config_record.threshold_warning),
                        metric_record.metric_value,
                        config_record.threshold_warning
                    );
                    alert_count := alert_count + 1;
                END IF;
            END IF;
        END IF;
    END LOOP;
    
    RETURN alert_count;
END;
$ LANGUAGE plpgsql;

-- Function to get active alerts
CREATE OR REPLACE FUNCTION get_active_alerts()
RETURNS TABLE(
    alert_id UUID,
    metric_name VARCHAR(100),
    alert_level VARCHAR(20),
    alert_message TEXT,
    metric_value DECIMAL(15,2),
    triggered_at TIMESTAMP WITH TIME ZONE,
    age_minutes INTEGER
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        ma.id,
        ma.metric_name,
        ma.alert_level,
        ma.alert_message,
        ma.metric_value,
        ma.triggered_at,
        EXTRACT(EPOCH FROM (NOW() - ma.triggered_at))::INTEGER / 60 as age_minutes
    FROM monitoring_alerts ma
    WHERE ma.status = 'active'
    ORDER BY 
        CASE ma.alert_level 
            WHEN 'critical' THEN 1 
            WHEN 'warning' THEN 2 
            ELSE 3 
        END,
        ma.triggered_at DESC;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- 6. HEALTH CHECK DASHBOARD FUNCTIONS
-- =====================================================

-- Function to generate comprehensive health report
CREATE OR REPLACE FUNCTION generate_health_dashboard()
RETURNS JSONB AS $
DECLARE
    dashboard JSONB;
    performance_metrics JSONB;
    reservation_metrics JSONB;
    availability_metrics JSONB;
    security_metrics JSONB;
    active_alerts_count INTEGER;
BEGIN
    -- Collect all metrics
    SELECT collect_performance_metrics() INTO performance_metrics;
    SELECT collect_reservation_metrics() INTO reservation_metrics;
    SELECT check_system_availability() INTO availability_metrics;
    SELECT monitor_security_events() INTO security_metrics;
    
    -- Count active alerts
    SELECT count(*) INTO active_alerts_count
    FROM monitoring_alerts 
    WHERE status = 'active';
    
    -- Build comprehensive dashboard
    dashboard := jsonb_build_object(
        'dashboard_generated_at', NOW(),
        'overall_status', CASE 
            WHEN active_alerts_count = 0 THEN 'healthy'
            WHEN EXISTS (SELECT 1 FROM monitoring_alerts WHERE status = 'active' AND alert_level = 'critical') THEN 'critical'
            ELSE 'warning'
        END,
        'active_alerts_count', active_alerts_count,
        'performance', performance_metrics,
        'reservations', reservation_metrics,
        'availability', availability_metrics,
        'security', security_metrics,
        'system_info', jsonb_build_object(
            'database_version', version(),
            'current_time', NOW(),
            'timezone', current_setting('timezone')
        )
    );
    
    RETURN dashboard;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- 7. AUTOMATED MONITORING PROCEDURES
-- =====================================================

-- Function to run all monitoring checks
CREATE OR REPLACE FUNCTION run_monitoring_cycle()
RETURNS JSONB AS $
DECLARE
    cycle_report JSONB;
    alerts_generated INTEGER;
    metrics_collected INTEGER;
BEGIN
    -- Collect all metrics
    PERFORM collect_performance_metrics();
    PERFORM collect_reservation_metrics();
    PERFORM check_system_availability();
    PERFORM monitor_security_events();
    
    -- Generate alerts
    SELECT generate_monitoring_alerts() INTO alerts_generated;
    
    -- Count metrics collected in this cycle
    SELECT count(*) INTO metrics_collected
    FROM monitoring_metrics 
    WHERE recorded_at >= NOW() - INTERVAL '5 minutes';
    
    -- Build cycle report
    cycle_report := jsonb_build_object(
        'cycle_completed_at', NOW(),
        'metrics_collected', metrics_collected,
        'alerts_generated', alerts_generated,
        'next_cycle_due', NOW() + INTERVAL '5 minutes'
    );
    
    RETURN cycle_report;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- 8. MONITORING CONFIGURATION SETUP
-- =====================================================

-- Insert default monitoring configurations
INSERT INTO monitoring_config (metric_name, metric_type, threshold_warning, threshold_critical, description) VALUES
('database_size_mb', 'capacity', 8000, 10000, 'Database size in megabytes'),
('active_connections', 'performance', 50, 80, 'Number of active database connections'),
('cache_hit_ratio', 'performance', 90, 85, 'Database cache hit ratio percentage'),
('avg_query_time', 'performance', 200, 500, 'Average query execution time in milliseconds'),
('connection_usage', 'availability', 75, 90, 'Connection pool usage percentage'),
('pending_payments', 'business', 30, 50, 'Number of pending payments'),
('failed_payments_24h', 'business', 5, 10, 'Failed payments in last 24 hours'),
('conversion_rate', 'business', 25, 15, 'Reservation conversion rate percentage'),
('suspicious_queries', 'security', 3, 5, 'Number of suspicious database queries')
ON CONFLICT (metric_name) DO NOTHING;

-- =====================================================
-- 9. INDEXES FOR MONITORING PERFORMANCE
-- =====================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_monitoring_metrics_name_time ON monitoring_metrics(metric_name, recorded_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_monitoring_metrics_status ON monitoring_metrics(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_monitoring_alerts_status ON monitoring_alerts(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_monitoring_alerts_level ON monitoring_alerts(alert_level);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_monitoring_alerts_triggered ON monitoring_alerts(triggered_at DESC);

-- =====================================================
-- 10. CLEANUP AND MAINTENANCE
-- =====================================================

-- Function to clean up old monitoring data
CREATE OR REPLACE FUNCTION cleanup_monitoring_data(retention_days INTEGER DEFAULT 30)
RETURNS JSONB AS $
DECLARE
    cleanup_report JSONB;
    metrics_deleted INTEGER;
    alerts_deleted INTEGER;
BEGIN
    -- Clean up old metrics
    DELETE FROM monitoring_metrics 
    WHERE recorded_at < NOW() - (retention_days || ' days')::INTERVAL;
    GET DIAGNOSTICS metrics_deleted = ROW_COUNT;
    
    -- Clean up old resolved alerts
    DELETE FROM monitoring_alerts 
    WHERE status = 'resolved' 
    AND resolved_at < NOW() - (retention_days || ' days')::INTERVAL;
    GET DIAGNOSTICS alerts_deleted = ROW_COUNT;
    
    -- Build cleanup report
    cleanup_report := jsonb_build_object(
        'cleanup_completed_at', NOW(),
        'retention_days', retention_days,
        'metrics_deleted', metrics_deleted,
        'alerts_deleted', alerts_deleted
    );
    
    RETURN cleanup_report;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- 11. ROW LEVEL SECURITY FOR MONITORING
-- =====================================================

-- Enable RLS on monitoring tables
ALTER TABLE monitoring_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for monitoring access
CREATE POLICY "Authenticated users can view monitoring config" ON monitoring_config
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view monitoring metrics" ON monitoring_metrics
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view monitoring alerts" ON monitoring_alerts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can acknowledge alerts" ON monitoring_alerts
    FOR UPDATE USING (auth.role() = 'authenticated');

-- =====================================================
-- 12. PERMISSIONS AND ACCESS
-- =====================================================

-- Grant necessary permissions
GRANT SELECT ON monitoring_config TO authenticated;
GRANT SELECT ON monitoring_metrics TO authenticated;
GRANT SELECT, UPDATE ON monitoring_alerts TO authenticated;

GRANT EXECUTE ON FUNCTION collect_performance_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION collect_reservation_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION check_system_availability() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_health_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_alerts() TO authenticated;

-- Service role permissions for automated monitoring
GRANT ALL ON monitoring_config TO service_role;
GRANT ALL ON monitoring_metrics TO service_role;
GRANT ALL ON monitoring_alerts TO service_role;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- =====================================================
-- 13. INITIAL MONITORING CYCLE
-- =====================================================

-- Run initial monitoring cycle to populate data
SELECT run_monitoring_cycle();

-- Generate initial health dashboard
SELECT generate_health_dashboard();

SELECT 'Production Database Monitoring System Deployed! 📊' as status,
       'Features: Performance monitoring, alerting system, health dashboard, security monitoring' as features,
       'Next steps: Set up automated monitoring jobs, configure alert notifications, create monitoring dashboards' as next_steps;