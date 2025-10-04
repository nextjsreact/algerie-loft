-- =====================================================
-- AUDIT TRIGGERS FOR LOFTS TABLE
-- =====================================================
-- This script adds audit triggers to the lofts table
-- to track all INSERT, UPDATE, and DELETE operations.
-- =====================================================

-- Ensure audit schema exists
CREATE SCHEMA IF NOT EXISTS audit;

-- Create audit trigger for lofts table
DO $$
BEGIN
    -- Drop existing trigger if it exists
    DROP TRIGGER IF EXISTS audit_trigger_lofts ON lofts;
    
    -- Create the audit trigger
    CREATE TRIGGER audit_trigger_lofts
        AFTER INSERT OR UPDATE OR DELETE ON lofts
        FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();
    
    RAISE NOTICE 'Audit trigger created for lofts table';
    
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create audit trigger for lofts: %', SQLERRM;
END $$;

-- Verify the trigger was created
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'audit_trigger_lofts'
AND event_object_table = 'lofts';

-- Test the audit trigger functionality
DO $$
DECLARE
    test_loft_id UUID;
    test_owner_id UUID;
    audit_count INTEGER;
    test_user_id UUID;
BEGIN
    -- Get test data
    SELECT id INTO test_user_id FROM profiles LIMIT 1;
    SELECT id INTO test_owner_id FROM loft_owners LIMIT 1;
    
    -- Set audit context for testing
    PERFORM audit.set_audit_user_context(
        test_user_id,
        'test@example.com',
        '127.0.0.1'::INET,
        'Test User Agent',
        'test-session-101'
    );
    
    -- Test INSERT operation
    INSERT INTO lofts (
        name,
        description,
        address,
        price_per_month,
        status,
        owner_id,
        company_percentage,
        owner_percentage
    ) VALUES (
        'Test Loft for Audit',
        'This is a test loft to verify audit functionality',
        '123 Test Street, Test City',
        1500.00,
        'available',
        test_owner_id,
        60.00,
        40.00
    ) RETURNING id INTO test_loft_id;
    
    -- Check if audit log was created for INSERT
    SELECT COUNT(*) INTO audit_count
    FROM audit.audit_logs
    WHERE table_name = 'lofts'
    AND record_id = test_loft_id
    AND action = 'INSERT';
    
    IF audit_count = 0 THEN
        RAISE EXCEPTION 'Audit log not created for INSERT operation';
    END IF;
    
    -- Test UPDATE operation - simulate property modifications
    UPDATE lofts 
    SET status = 'maintenance',
        price_per_month = 1600.00,
        description = 'Updated test loft - under maintenance',
        company_percentage = 65.00,
        owner_percentage = 35.00
    WHERE id = test_loft_id;
    
    -- Check if audit log was created for UPDATE
    SELECT COUNT(*) INTO audit_count
    FROM audit.audit_logs
    WHERE table_name = 'lofts'
    AND record_id = test_loft_id
    AND action = 'UPDATE';
    
    IF audit_count = 0 THEN
        RAISE EXCEPTION 'Audit log not created for UPDATE operation';
    END IF;
    
    -- Verify proper tracking of property modifications
    IF NOT EXISTS (
        SELECT 1 FROM audit.audit_logs
        WHERE table_name = 'lofts'
        AND record_id = test_loft_id
        AND action = 'UPDATE'
        AND 'status' = ANY(changed_fields)
        AND 'price_per_month' = ANY(changed_fields)
        AND 'description' = ANY(changed_fields)
        AND 'company_percentage' = ANY(changed_fields)
        AND 'owner_percentage' = ANY(changed_fields)
    ) THEN
        RAISE EXCEPTION 'Property modifications not properly tracked in audit log';
    END IF;
    
    -- Verify old and new values for critical fields
    IF NOT EXISTS (
        SELECT 1 FROM audit.audit_logs
        WHERE table_name = 'lofts'
        AND record_id = test_loft_id
        AND action = 'UPDATE'
        AND old_values->>'status' = 'available'
        AND new_values->>'status' = 'maintenance'
        AND (old_values->>'price_per_month')::NUMERIC = 1500.00
        AND (new_values->>'price_per_month')::NUMERIC = 1600.00
    ) THEN
        RAISE EXCEPTION 'Critical field changes not properly captured in audit log';
    END IF;
    
    -- Test utility information update
    UPDATE lofts 
    SET water_customer_code = 'WC123456',
        electricity_pdl_ref = 'PDL789012',
        water_correspondent = 'Water Company Contact'
    WHERE id = test_loft_id;
    
    -- Verify utility information changes are tracked
    IF NOT EXISTS (
        SELECT 1 FROM audit.audit_logs
        WHERE table_name = 'lofts'
        AND record_id = test_loft_id
        AND action = 'UPDATE'
        AND 'water_customer_code' = ANY(changed_fields)
        AND 'electricity_pdl_ref' = ANY(changed_fields)
        AND 'water_correspondent' = ANY(changed_fields)
    ) THEN
        RAISE EXCEPTION 'Utility information changes not properly tracked in audit log';
    END IF;
    
    -- Test status change to occupied
    UPDATE lofts 
    SET status = 'occupied'
    WHERE id = test_loft_id;
    
    -- Verify status change tracking
    IF NOT EXISTS (
        SELECT 1 FROM audit.audit_logs
        WHERE table_name = 'lofts'
        AND record_id = test_loft_id
        AND action = 'UPDATE'
        AND old_values->>'status' = 'maintenance'
        AND new_values->>'status' = 'occupied'
    ) THEN
        RAISE EXCEPTION 'Loft status change not properly tracked in audit log';
    END IF;
    
    -- Test DELETE operation
    DELETE FROM lofts WHERE id = test_loft_id;
    
    -- Check if audit log was created for DELETE
    SELECT COUNT(*) INTO audit_count
    FROM audit.audit_logs
    WHERE table_name = 'lofts'
    AND record_id = test_loft_id
    AND action = 'DELETE';
    
    IF audit_count = 0 THEN
        RAISE EXCEPTION 'Audit log not created for DELETE operation';
    END IF;
    
    -- Verify all loft data is captured in DELETE log
    IF NOT EXISTS (
        SELECT 1 FROM audit.audit_logs
        WHERE table_name = 'lofts'
        AND record_id = test_loft_id
        AND action = 'DELETE'
        AND old_values->>'name' = 'Test Loft for Audit'
        AND old_values->>'status' = 'occupied'
        AND (old_values->>'price_per_month')::NUMERIC = 1600.00
    ) THEN
        RAISE EXCEPTION 'Complete loft data not captured in DELETE audit log';
    END IF;
    
    -- Clean up audit context
    PERFORM audit.clear_audit_user_context();
    
    RAISE NOTICE 'All audit trigger tests passed for lofts table';
    
EXCEPTION WHEN OTHERS THEN
    -- Clean up on error
    PERFORM audit.clear_audit_user_context();
    DELETE FROM lofts WHERE id = test_loft_id;
    RAISE EXCEPTION 'Audit trigger test failed: %', SQLERRM;
END $$;

-- Display audit statistics for lofts
SELECT 
    'lofts' as table_name,
    COUNT(*) as total_audit_logs,
    COUNT(*) FILTER (WHERE action = 'INSERT') as insert_logs,
    COUNT(*) FILTER (WHERE action = 'UPDATE') as update_logs,
    COUNT(*) FILTER (WHERE action = 'DELETE') as delete_logs
FROM audit.audit_logs 
WHERE table_name = 'lofts';

RAISE NOTICE 'Audit trigger for lofts table created and tested successfully';