-- Additional tables for booking audit system
-- These tables complement the existing audit system with booking-specific tracking

-- =====================================================
-- 1. BOOKING AUDIT LOGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS booking_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL CHECK (action IN ('status_change', 'payment_update', 'modification', 'cancellation')),
    old_status TEXT,
    new_status TEXT,
    booking_reference TEXT,
    financial_impact DECIMAL(10,2),
    compliance_flags TEXT[],
    reason TEXT,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_booking_audit_logs_booking_id ON booking_audit_logs(booking_id);
CREATE INDEX idx_booking_audit_logs_user_id ON booking_audit_logs(user_id);
CREATE INDEX idx_booking_audit_logs_timestamp ON booking_audit_logs(timestamp);
CREATE INDEX idx_booking_audit_logs_action ON booking_audit_logs(action);
CREATE INDEX idx_booking_audit_logs_compliance_flags ON booking_audit_logs USING GIN (compliance_flags);

-- =====================================================
-- 2. PAYMENT AUDIT LOGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('payment', 'refund', 'chargeback', 'dispute')),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'EUR',
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending', 'cancelled')),
    payment_intent_id TEXT,
    payment_method TEXT,
    user_id UUID REFERENCES auth.users(id),
    compliance_flags TEXT[],
    fraud_score DECIMAL(3,2),
    processor_response JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_payment_audit_logs_booking_id ON payment_audit_logs(booking_id);
CREATE INDEX idx_payment_audit_logs_transaction_type ON payment_audit_logs(transaction_type);
CREATE INDEX idx_payment_audit_logs_status ON payment_audit_logs(status);
CREATE INDEX idx_payment_audit_logs_timestamp ON payment_audit_logs(timestamp);
CREATE INDEX idx_payment_audit_logs_amount ON payment_audit_logs(amount);

-- =====================================================
-- 3. COMPLIANCE VIOLATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS compliance_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    violation_type TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    table_name TEXT,
    record_id UUID,
    booking_id UUID REFERENCES bookings(id),
    user_id UUID REFERENCES auth.users(id),
    description TEXT NOT NULL,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id),
    resolution_notes TEXT,
    status TEXT CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')) DEFAULT 'open',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_compliance_violations_type ON compliance_violations(violation_type);
CREATE INDEX idx_compliance_violations_severity ON compliance_violations(severity);
CREATE INDEX idx_compliance_violations_status ON compliance_violations(status);
CREATE INDEX idx_compliance_violations_detected_at ON compliance_violations(detected_at);
CREATE INDEX idx_compliance_violations_booking_id ON compliance_violations(booking_id);

-- =====================================================
-- 4. DATA INTEGRITY CHECKS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS data_integrity_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    check_type TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_count BIGINT,
    checksum TEXT,
    integrity_hash TEXT,
    check_status TEXT CHECK (check_status IN ('passed', 'failed', 'warning')) DEFAULT 'passed',
    issues_found INTEGER DEFAULT 0,
    check_details JSONB,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    performed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_data_integrity_checks_type ON data_integrity_checks(check_type);
CREATE INDEX idx_data_integrity_checks_table ON data_integrity_checks(table_name);
CREATE INDEX idx_data_integrity_checks_status ON data_integrity_checks(check_status);
CREATE INDEX idx_data_integrity_checks_performed_at ON data_integrity_checks(performed_at);

-- =====================================================
-- 5. AUDIT FUNCTIONS FOR BOOKING SYSTEM
-- =====================================================

-- Function to detect compliance violations
CREATE OR REPLACE FUNCTION detect_compliance_violations()
RETURNS INTEGER AS $
DECLARE
    violation_count INTEGER := 0;
    booking_record RECORD;
    payment_record RECORD;
BEGIN
    -- Check for bookings with suspicious patterns
    FOR booking_record IN
        SELECT b.id, b.booking_reference, b.total_price, b.status, b.payment_status,
               COUNT(bal.id) as status_changes
        FROM bookings b
        LEFT JOIN booking_audit_logs bal ON b.id = bal.booking_id
        WHERE b.created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY b.id, b.booking_reference, b.total_price, b.status, b.payment_status
        HAVING COUNT(bal.id) > 5  -- More than 5 status changes in 24 hours
    LOOP
        INSERT INTO compliance_violations (
            violation_type,
            severity,
            table_name,
            record_id,
            booking_id,
            description,
            metadata
        ) VALUES (
            'EXCESSIVE_STATUS_CHANGES',
            'medium',
            'bookings',
            booking_record.id,
            booking_record.id,
            format('Booking %s has %s status changes in 24 hours', 
                   booking_record.booking_reference, 
                   booking_record.status_changes),
            jsonb_build_object(
                'status_changes', booking_record.status_changes,
                'current_status', booking_record.status,
                'payment_status', booking_record.payment_status
            )
        );
        
        violation_count := violation_count + 1;
    END LOOP;

    -- Check for suspicious payment patterns
    FOR payment_record IN
        SELECT booking_id, COUNT(*) as failed_attempts, SUM(amount) as total_amount
        FROM payment_audit_logs
        WHERE status = 'failed'
          AND timestamp >= NOW() - INTERVAL '1 hour'
        GROUP BY booking_id
        HAVING COUNT(*) > 3  -- More than 3 failed attempts in 1 hour
    LOOP
        INSERT INTO compliance_violations (
            violation_type,
            severity,
            table_name,
            booking_id,
            description,
            metadata
        ) VALUES (
            'SUSPICIOUS_PAYMENT_PATTERN',
            'high',
            'payment_audit_logs',
            payment_record.booking_id,
            format('Booking has %s failed payment attempts in 1 hour', 
                   payment_record.failed_attempts),
            jsonb_build_object(
                'failed_attempts', payment_record.failed_attempts,
                'total_amount', payment_record.total_amount
            )
        );
        
        violation_count := violation_count + 1;
    END LOOP;

    RETURN violation_count;
END;
$ LANGUAGE plpgsql;

-- Function to perform data integrity check
CREATE OR REPLACE FUNCTION perform_data_integrity_check(
    p_table_name TEXT
)
RETURNS UUID AS $
DECLARE
    check_id UUID;
    record_count BIGINT;
    integrity_hash TEXT;
    check_status TEXT := 'passed';
    issues_count INTEGER := 0;
BEGIN
    check_id := gen_random_uuid();
    
    -- Count records in the table
    EXECUTE format('SELECT COUNT(*) FROM %I', p_table_name) INTO record_count;
    
    -- Generate integrity hash based on table content
    EXECUTE format('
        SELECT md5(string_agg(md5(t.*::text), '''' ORDER BY id))
        FROM %I t
    ', p_table_name) INTO integrity_hash;
    
    -- Perform specific checks based on table type
    IF p_table_name = 'bookings' THEN
        -- Check for orphaned bookings
        SELECT COUNT(*) INTO issues_count
        FROM bookings b
        LEFT JOIN lofts l ON b.loft_id = l.id
        WHERE l.id IS NULL;
        
        IF issues_count > 0 THEN
            check_status := 'failed';
        END IF;
        
    ELSIF p_table_name = 'audit_logs' THEN
        -- Check for missing audit entries
        SELECT COUNT(*) INTO issues_count
        FROM audit.audit_logs
        WHERE old_values IS NULL AND new_values IS NULL;
        
        IF issues_count > 0 THEN
            check_status := 'warning';
        END IF;
    END IF;
    
    -- Insert check result
    INSERT INTO data_integrity_checks (
        id,
        check_type,
        table_name,
        record_count,
        integrity_hash,
        check_status,
        issues_found,
        check_details
    ) VALUES (
        check_id,
        'automated_integrity_check',
        p_table_name,
        record_count,
        integrity_hash,
        check_status,
        issues_count,
        jsonb_build_object(
            'check_timestamp', NOW(),
            'issues_description', 
            CASE 
                WHEN p_table_name = 'bookings' AND issues_count > 0 THEN 'Orphaned bookings found'
                WHEN p_table_name = 'audit_logs' AND issues_count > 0 THEN 'Incomplete audit entries found'
                ELSE 'No issues detected'
            END
        )
    );
    
    RETURN check_id;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- 6. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on audit tables
ALTER TABLE booking_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_integrity_checks ENABLE ROW LEVEL SECURITY;

-- Policies for booking_audit_logs
CREATE POLICY "Users can view audit logs for their bookings" ON booking_audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.id = booking_audit_logs.booking_id
            AND (b.client_id = auth.uid() OR b.partner_id = auth.uid())
        )
    );

CREATE POLICY "Admins can view all booking audit logs" ON booking_audit_logs
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- Policies for payment_audit_logs
CREATE POLICY "Users can view payment logs for their bookings" ON payment_audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.id = payment_audit_logs.booking_id
            AND (b.client_id = auth.uid() OR b.partner_id = auth.uid())
        )
    );

CREATE POLICY "Admins can view all payment audit logs" ON payment_audit_logs
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- Policies for compliance_violations (admin only)
CREATE POLICY "Only admins can access compliance violations" ON compliance_violations
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- Policies for data_integrity_checks (admin only)
CREATE POLICY "Only admins can access integrity checks" ON data_integrity_checks
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION detect_compliance_violations() TO authenticated;
GRANT EXECUTE ON FUNCTION perform_data_integrity_check(TEXT) TO authenticated;

-- =====================================================
-- 8. COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE booking_audit_logs IS 'Stores booking-specific audit events with compliance tracking';
COMMENT ON TABLE payment_audit_logs IS 'Stores payment transaction audit logs for financial compliance';
COMMENT ON TABLE compliance_violations IS 'Tracks detected compliance violations and their resolution status';
COMMENT ON TABLE data_integrity_checks IS 'Records data integrity validation results';

COMMENT ON FUNCTION detect_compliance_violations() IS 'Automatically detects compliance violations in booking and payment data';
COMMENT ON FUNCTION perform_data_integrity_check(TEXT) IS 'Performs data integrity validation on specified table';

-- Log successful schema creation
DO $$
BEGIN
    RAISE NOTICE 'Booking audit tables created successfully';
    RAISE NOTICE 'Tables created: booking_audit_logs, payment_audit_logs, compliance_violations, data_integrity_checks';
    RAISE NOTICE 'Functions created: detect_compliance_violations, perform_data_integrity_check';
    RAISE NOTICE 'RLS policies applied to all audit tables';
END $$;