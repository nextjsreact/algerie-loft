-- =====================================================
-- AUDIT TRIGGERS FOR RESERVATIONS TABLE
-- =====================================================
-- This script adds audit triggers to the reservations table
-- to track all INSERT, UPDATE, and DELETE operations.
-- =====================================================

-- Ensure audit schema exists
CREATE SCHEMA IF NOT EXISTS audit;

-- Create audit trigger for reservations table
DO $$
BEGIN
    -- Drop existing trigger if it exists
    DROP TRIGGER IF EXISTS audit_trigger_reservations ON reservations;
    
    -- Create the audit trigger
    CREATE TRIGGER audit_trigger_reservations
        AFTER INSERT OR UPDATE OR DELETE ON reservations
        FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();
    
    RAISE NOTICE 'Audit trigger created for reservations table';
    
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create audit trigger for reservations: %', SQLERRM;
END $$;

-- Verify the trigger was created
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'audit_trigger_reservations'
AND event_object_table = 'reservations';

-- Test the audit trigger functionality
DO $$
DECLARE
    test_reservation_id UUID;
    test_loft_id UUID;
    audit_count INTEGER;
    test_user_id UUID;
BEGIN
    -- Get test data
    SELECT id INTO test_user_id FROM profiles LIMIT 1;
    SELECT id INTO test_loft_id FROM lofts LIMIT 1;
    
    -- Set audit context for testing
    PERFORM audit.set_audit_user_context(
        test_user_id,
        'test@example.com',
        '127.0.0.1'::INET,
        'Test User Agent',
        'test-session-789'
    );
    
    -- Test INSERT operation
    INSERT INTO reservations (
        guest_name,
        guest_email,
        guest_phone,
        guest_nationality,
        guest_count,
        loft_id,
        check_in_date,
        check_out_date,
        base_price,
        total_amount,
        status,
        payment_status
    ) VALUES (
        'John Doe',
        'john.doe@example.com',
        '+1234567890',
        'American',
        2,
        test_loft_id,
        CURRENT_DATE + INTERVAL '7 days',
        CURRENT_DATE + INTERVAL '10 days',
        100.00,
        300.00,
        'pending',
        'pending'
    ) RETURNING id INTO test_reservation_id;
    
    -- Check if audit log was created for INSERT
    SELECT COUNT(*) INTO audit_count
    FROM audit.audit_logs
    WHERE table_name = 'reservations'
    AND record_id = test_reservation_id
    AND action = 'INSERT';
    
    IF audit_count = 0 THEN
        RAISE EXCEPTION 'Audit log not created for INSERT operation';
    END IF;
    
    -- Test UPDATE operation - simulate reservation state changes
    UPDATE reservations 
    SET status = 'confirmed', 
        payment_status = 'paid',
        special_requests = 'Late check-in requested'
    WHERE id = test_reservation_id;
    
    -- Check if audit log was created for UPDATE
    SELECT COUNT(*) INTO audit_count
    FROM audit.audit_logs
    WHERE table_name = 'reservations'
    AND record_id = test_reservation_id
    AND action = 'UPDATE';
    
    IF audit_count = 0 THEN
        RAISE EXCEPTION 'Audit log not created for UPDATE operation';
    END IF;
    
    -- Verify proper capture of reservation state changes
    IF NOT EXISTS (
        SELECT 1 FROM audit.audit_logs
        WHERE table_name = 'reservations'
        AND record_id = test_reservation_id
        AND action = 'UPDATE'
        AND 'status' = ANY(changed_fields)
        AND 'payment_status' = ANY(changed_fields)
        AND 'special_requests' = ANY(changed_fields)
    ) THEN
        RAISE EXCEPTION 'Reservation state changes not properly captured in audit log';
    END IF;
    
    -- Verify old and new values are captured
    IF NOT EXISTS (
        SELECT 1 FROM audit.audit_logs
        WHERE table_name = 'reservations'
        AND record_id = test_reservation_id
        AND action = 'UPDATE'
        AND old_values->>'status' = 'pending'
        AND new_values->>'status' = 'confirmed'
        AND old_values->>'payment_status' = 'pending'
        AND new_values->>'payment_status' = 'paid'
    ) THEN
        RAISE EXCEPTION 'Old and new values not properly captured for reservation state changes';
    END IF;
    
    -- Test another UPDATE - simulate cancellation
    UPDATE reservations 
    SET status = 'cancelled',
        cancelled_at = NOW(),
        cancellation_reason = 'Guest requested cancellation'
    WHERE id = test_reservation_id;
    
    -- Verify cancellation is tracked
    IF NOT EXISTS (
        SELECT 1 FROM audit.audit_logs
        WHERE table_name = 'reservations'
        AND record_id = test_reservation_id
        AND action = 'UPDATE'
        AND 'status' = ANY(changed_fields)
        AND 'cancelled_at' = ANY(changed_fields)
        AND 'cancellation_reason' = ANY(changed_fields)
        AND new_values->>'status' = 'cancelled'
    ) THEN
        RAISE EXCEPTION 'Reservation cancellation not properly tracked in audit log';
    END IF;
    
    -- Test DELETE operation
    DELETE FROM reservations WHERE id = test_reservation_id;
    
    -- Check if audit log was created for DELETE
    SELECT COUNT(*) INTO audit_count
    FROM audit.audit_logs
    WHERE table_name = 'reservations'
    AND record_id = test_reservation_id
    AND action = 'DELETE';
    
    IF audit_count = 0 THEN
        RAISE EXCEPTION 'Audit log not created for DELETE operation';
    END IF;
    
    -- Clean up audit context
    PERFORM audit.clear_audit_user_context();
    
    RAISE NOTICE 'All audit trigger tests passed for reservations table';
    
EXCEPTION WHEN OTHERS THEN
    -- Clean up on error
    PERFORM audit.clear_audit_user_context();
    DELETE FROM reservations WHERE id = test_reservation_id;
    RAISE EXCEPTION 'Audit trigger test failed: %', SQLERRM;
END $$;

-- Display audit statistics for reservations
SELECT 
    'reservations' as table_name,
    COUNT(*) as total_audit_logs,
    COUNT(*) FILTER (WHERE action = 'INSERT') as insert_logs,
    COUNT(*) FILTER (WHERE action = 'UPDATE') as update_logs,
    COUNT(*) FILTER (WHERE action = 'DELETE') as delete_logs
FROM audit.audit_logs 
WHERE table_name = 'reservations';

RAISE NOTICE 'Audit trigger for reservations table created and tested successfully';