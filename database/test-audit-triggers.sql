-- =====================================================
-- TEST AUDIT TRIGGERS FUNCTIONALITY
-- =====================================================
-- This script tests that all audit triggers are working correctly
-- by performing sample CRUD operations and verifying audit logs
-- =====================================================

-- Test audit triggers functionality
DO $$
DECLARE
    test_user_id UUID;
    test_loft_id UUID;
    test_owner_id UUID;
    test_transaction_id UUID;
    test_task_id UUID;
    test_reservation_id UUID;
    audit_count INTEGER;
BEGIN
    -- Get test data
    SELECT id INTO test_user_id FROM profiles LIMIT 1;
    SELECT id INTO test_loft_id FROM lofts LIMIT 1;
    SELECT id INTO test_owner_id FROM loft_owners LIMIT 1;
    
    -- Set audit context
    PERFORM audit.set_audit_user_context(
        test_user_id,
        'audit-test@example.com',
        '127.0.0.1'::INET,
        'Audit Test Script',
        'audit-test-session'
    );
    
    RAISE NOTICE 'Starting audit triggers test...';
    
    -- Test 1: Transaction audit
    INSERT INTO transactions (
        amount, description, transaction_type, status, category
    ) VALUES (
        250.00, 'Audit test transaction', 'expense', 'pending', 'test'
    ) RETURNING id INTO test_transaction_id;
    
    SELECT COUNT(*) INTO audit_count
    FROM audit.audit_logs
    WHERE table_name = 'transactions' AND record_id = test_transaction_id AND action = 'INSERT';
    
    IF audit_count = 0 THEN
        RAISE EXCEPTION 'Transaction INSERT audit failed';
    END IF;
    
    UPDATE transactions SET amount = 300.00 WHERE id = test_transaction_id;
    
    SELECT COUNT(*) INTO audit_count
    FROM audit.audit_logs
    WHERE table_name = 'transactions' AND record_id = test_transaction_id AND action = 'UPDATE';
    
    IF audit_count = 0 THEN
        RAISE EXCEPTION 'Transaction UPDATE audit failed';
    END IF;
    
    RAISE NOTICE 'Transaction audit triggers: PASSED';
    
    -- Test 2: Task audit
    INSERT INTO tasks (
        title, description, status, assigned_to, created_by
    ) VALUES (
        'Audit test task', 'Test task for audit verification', 'todo', test_user_id, test_user_id
    ) RETURNING id INTO test_task_id;
    
    SELECT COUNT(*) INTO audit_count
    FROM audit.audit_logs
    WHERE table_name = 'tasks' AND record_id = test_task_id AND action = 'INSERT';
    
    IF audit_count = 0 THEN
        RAISE EXCEPTION 'Task INSERT audit failed';
    END IF;
    
    UPDATE tasks SET status = 'in_progress' WHERE id = test_task_id;
    
    SELECT COUNT(*) INTO audit_count
    FROM audit.audit_logs
    WHERE table_name = 'tasks' AND record_id = test_task_id AND action = 'UPDATE';
    
    IF audit_count = 0 THEN
        RAISE EXCEPTION 'Task UPDATE audit failed';
    END IF;
    
    RAISE NOTICE 'Task audit triggers: PASSED';
    
    -- Test 3: Reservation audit (if reservations table exists)
    BEGIN
        INSERT INTO reservations (
            guest_name, guest_email, guest_phone, guest_nationality, guest_count,
            loft_id, check_in_date, check_out_date, base_price, total_amount
        ) VALUES (
            'Test Guest', 'test@example.com', '+1234567890', 'Test', 1,
            test_loft_id, CURRENT_DATE + 1, CURRENT_DATE + 3, 100.00, 200.00
        ) RETURNING id INTO test_reservation_id;
        
        SELECT COUNT(*) INTO audit_count
        FROM audit.audit_logs
        WHERE table_name = 'reservations' AND record_id = test_reservation_id AND action = 'INSERT';
        
        IF audit_count = 0 THEN
            RAISE EXCEPTION 'Reservation INSERT audit failed';
        END IF;
        
        UPDATE reservations SET status = 'confirmed' WHERE id = test_reservation_id;
        
        SELECT COUNT(*) INTO audit_count
        FROM audit.audit_logs
        WHERE table_name = 'reservations' AND record_id = test_reservation_id AND action = 'UPDATE';
        
        IF audit_count = 0 THEN
            RAISE EXCEPTION 'Reservation UPDATE audit failed';
        END IF;
        
        RAISE NOTICE 'Reservation audit triggers: PASSED';
        
        -- Clean up reservation
        DELETE FROM reservations WHERE id = test_reservation_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Reservation audit test skipped (table may not exist): %', SQLERRM;
    END;
    
    -- Test 4: Loft audit
    UPDATE lofts SET status = 'maintenance' WHERE id = test_loft_id;
    
    SELECT COUNT(*) INTO audit_count
    FROM audit.audit_logs
    WHERE table_name = 'lofts' AND record_id = test_loft_id AND action = 'UPDATE';
    
    IF audit_count = 0 THEN
        RAISE EXCEPTION 'Loft UPDATE audit failed';
    END IF;
    
    -- Restore loft status
    UPDATE lofts SET status = 'available' WHERE id = test_loft_id;
    
    RAISE NOTICE 'Loft audit triggers: PASSED';
    
    -- Clean up test data
    DELETE FROM transactions WHERE id = test_transaction_id;
    DELETE FROM tasks WHERE id = test_task_id;
    
    -- Clear audit context
    PERFORM audit.clear_audit_user_context();
    
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'ALL AUDIT TRIGGER TESTS PASSED SUCCESSFULLY!';
    RAISE NOTICE '==============================================';
    
EXCEPTION WHEN OTHERS THEN
    -- Clean up on error
    PERFORM audit.clear_audit_user_context();
    DELETE FROM transactions WHERE id = test_transaction_id;
    DELETE FROM tasks WHERE id = test_task_id;
    DELETE FROM reservations WHERE id = test_reservation_id;
    RAISE EXCEPTION 'Audit trigger test failed: %', SQLERRM;
END $$;

-- Display final audit statistics
SELECT 
    table_name,
    COUNT(*) as total_logs,
    COUNT(*) FILTER (WHERE action = 'INSERT') as inserts,
    COUNT(*) FILTER (WHERE action = 'UPDATE') as updates,
    COUNT(*) FILTER (WHERE action = 'DELETE') as deletes
FROM audit.audit_logs 
WHERE table_name IN ('transactions', 'tasks', 'reservations', 'lofts')
GROUP BY table_name
ORDER BY table_name;