-- Booking Audit Triggers for Multi-Role Booking System
-- This script extends the existing audit system to include booking-related tables

-- =====================================================
-- 1. EXTEND AUDIT SYSTEM FOR BOOKING TABLES
-- =====================================================

-- Add booking-specific audit triggers
SELECT audit.create_audit_trigger('bookings');
SELECT audit.create_audit_trigger('partner_profiles');
SELECT audit.create_audit_trigger('loft_availability');
SELECT audit.create_audit_trigger('booking_messages');
SELECT audit.create_audit_trigger('booking_fees');
SELECT audit.create_audit_trigger('loft_reviews');

-- =====================================================
-- 2. BOOKING-SPECIFIC AUDIT FUNCTIONS
-- =====================================================

-- Function to get booking audit trail
CREATE OR REPLACE FUNCTION audit.get_booking_audit_trail(
    p_booking_id UUID
)
RETURNS TABLE (
    id UUID,
    table_name VARCHAR(50),
    record_id UUID,
    action VARCHAR(10),
    user_id UUID,
    user_email VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE,
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255)
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        al.id,
        al.table_name,
        al.record_id,
        al.action,
        al.user_id,
        al.user_email,
        al.timestamp,
        al.old_values,
        al.new_values,
        al.changed_fields,
        al.ip_address,
        al.user_agent,
        al.session_id
    FROM audit.audit_logs al
    WHERE (
        -- Direct booking record changes
        (al.table_name = 'bookings' AND al.record_id = p_booking_id)
        OR
        -- Related booking messages
        (al.table_name = 'booking_messages' AND 
         al.record_id IN (
             SELECT id FROM booking_messages WHERE booking_id = p_booking_id
         ))
        OR
        -- Related booking fees
        (al.table_name = 'booking_fees' AND 
         al.record_id IN (
             SELECT id FROM booking_fees WHERE booking_id = p_booking_id
         ))
        OR
        -- Related reviews
        (al.table_name = 'loft_reviews' AND 
         al.record_id IN (
             SELECT id FROM loft_reviews WHERE booking_id = p_booking_id
         ))
    )
    ORDER BY al.timestamp DESC;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get partner audit activity
CREATE OR REPLACE FUNCTION audit.get_partner_audit_activity(
    p_partner_id UUID,
    p_date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    table_name VARCHAR(50),
    record_id UUID,
    action VARCHAR(10),
    user_id UUID,
    user_email VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE,
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[]
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        al.id,
        al.table_name,
        al.record_id,
        al.action,
        al.user_id,
        al.user_email,
        al.timestamp,
        al.old_values,
        al.new_values,
        al.changed_fields
    FROM audit.audit_logs al
    WHERE al.user_id = p_partner_id
      AND (p_date_from IS NULL OR al.timestamp >= p_date_from)
      AND (p_date_to IS NULL OR al.timestamp <= p_date_to)
      AND al.table_name IN ('bookings', 'loft_availability', 'booking_messages', 'lofts')
    ORDER BY al.timestamp DESC;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get financial transaction audit logs
CREATE OR REPLACE FUNCTION audit.get_financial_audit_logs(
    p_date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    table_name VARCHAR(50),
    record_id UUID,
    action VARCHAR(10),
    user_id UUID,
    user_email VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE,
    old_values JSONB,
    new_values JSONB,
    transaction_amount DECIMAL,
    booking_reference TEXT
) AS $
DECLARE
    booking_ref TEXT;
    transaction_amt DECIMAL;
BEGIN
    FOR id, table_name, record_id, action, user_id, user_email, timestamp, old_values, new_values IN
        SELECT 
            al.id,
            al.table_name,
            al.record_id,
            al.action,
            al.user_id,
            al.user_email,
            al.timestamp,
            al.old_values,
            al.new_values
        FROM audit.audit_logs al
        WHERE (p_date_from IS NULL OR al.timestamp >= p_date_from)
          AND (p_date_to IS NULL OR al.timestamp <= p_date_to)
          AND (p_user_id IS NULL OR al.user_id = p_user_id)
          AND al.table_name IN ('bookings', 'transactions', 'booking_fees')
        ORDER BY al.timestamp DESC
    LOOP
        -- Extract financial information based on table
        IF table_name = 'bookings' THEN
            transaction_amount := COALESCE((new_values->>'total_price')::DECIMAL, (old_values->>'total_price')::DECIMAL);
            booking_reference := COALESCE(new_values->>'booking_reference', old_values->>'booking_reference');
        ELSIF table_name = 'booking_fees' THEN
            transaction_amount := COALESCE((new_values->>'amount')::DECIMAL, (old_values->>'amount')::DECIMAL);
            -- Get booking reference from related booking
            SELECT b.booking_reference INTO booking_reference
            FROM bookings b
            JOIN booking_fees bf ON b.id = bf.booking_id
            WHERE bf.id = record_id;
        ELSIF table_name = 'transactions' THEN
            transaction_amount := COALESCE((new_values->>'amount')::DECIMAL, (old_values->>'amount')::DECIMAL);
            booking_reference := NULL; -- Transactions may not be directly linked to bookings
        END IF;
        
        RETURN NEXT;
    END LOOP;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. COMPLIANCE AND RETENTION POLICIES
-- =====================================================

-- Function to archive old audit logs (for GDPR compliance)
CREATE OR REPLACE FUNCTION audit.archive_old_audit_logs(
    p_retention_days INTEGER DEFAULT 2555 -- 7 years default
)
RETURNS INTEGER AS $
DECLARE
    archived_count INTEGER;
    cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
    cutoff_date := NOW() - (p_retention_days || ' days')::INTERVAL;
    
    -- Create archive table if it doesn't exist
    CREATE TABLE IF NOT EXISTS audit.audit_logs_archive (
        LIKE audit.audit_logs INCLUDING ALL
    );
    
    -- Move old records to archive
    WITH moved_records AS (
        DELETE FROM audit.audit_logs
        WHERE timestamp < cutoff_date
        RETURNING *
    )
    INSERT INTO audit.audit_logs_archive
    SELECT * FROM moved_records;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    
    RAISE NOTICE 'Archived % audit log records older than %', archived_count, cutoff_date;
    
    RETURN archived_count;
END;
$ LANGUAGE plpgsql;

-- Function to get audit statistics for compliance reporting
CREATE OR REPLACE FUNCTION audit.get_compliance_statistics(
    p_date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    table_name VARCHAR(50),
    total_operations BIGINT,
    insert_operations BIGINT,
    update_operations BIGINT,
    delete_operations BIGINT,
    unique_users BIGINT,
    date_range_start TIMESTAMP WITH TIME ZONE,
    date_range_end TIMESTAMP WITH TIME ZONE
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        al.table_name,
        COUNT(*) as total_operations,
        COUNT(*) FILTER (WHERE al.action = 'INSERT') as insert_operations,
        COUNT(*) FILTER (WHERE al.action = 'UPDATE') as update_operations,
        COUNT(*) FILTER (WHERE al.action = 'DELETE') as delete_operations,
        COUNT(DISTINCT al.user_id) as unique_users,
        COALESCE(p_date_from, MIN(al.timestamp)) as date_range_start,
        COALESCE(p_date_to, MAX(al.timestamp)) as date_range_end
    FROM audit.audit_logs al
    WHERE (p_date_from IS NULL OR al.timestamp >= p_date_from)
      AND (p_date_to IS NULL OR al.timestamp <= p_date_to)
    GROUP BY al.table_name
    ORDER BY total_operations DESC;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions to authenticated users for read functions
GRANT EXECUTE ON FUNCTION audit.get_booking_audit_trail(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION audit.get_partner_audit_activity(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION audit.get_financial_audit_logs(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION audit.get_compliance_statistics(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;

-- Grant execute permissions for admin functions (archiving) only to admin roles
-- This will be handled by RLS policies in the application layer

-- =====================================================
-- 5. COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION audit.get_booking_audit_trail(UUID) IS 'Returns complete audit trail for a specific booking including related records';
COMMENT ON FUNCTION audit.get_partner_audit_activity(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) IS 'Returns audit activity for a specific partner within date range';
COMMENT ON FUNCTION audit.get_financial_audit_logs(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, UUID) IS 'Returns financial transaction audit logs for compliance reporting';
COMMENT ON FUNCTION audit.archive_old_audit_logs(INTEGER) IS 'Archives old audit logs for GDPR compliance and data retention';
COMMENT ON FUNCTION audit.get_compliance_statistics(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) IS 'Returns audit statistics for compliance reporting';

-- Log successful setup
RAISE NOTICE 'Booking audit system setup completed successfully';
RAISE NOTICE 'Functions created: get_booking_audit_trail, get_partner_audit_activity, get_financial_audit_logs, archive_old_audit_logs, get_compliance_statistics';
RAISE NOTICE 'Audit triggers applied to: bookings, partner_profiles, loft_availability, booking_messages, booking_fees, loft_reviews';