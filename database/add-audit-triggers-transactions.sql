-- =====================================================
-- AUDIT TRIGGERS FOR TRANSACTIONS TABLE
-- =====================================================
-- This script adds audit triggers to the transactions table
-- to track all INSERT, UPDATE, and DELETE operations.
-- =====================================================

-- Ensure audit schema exists
CREATE SCHEMA IF NOT EXISTS audit;

-- Create audit trigger for transactions table
DO $$
BEGIN
    -- Drop existing trigger if it exists
    DROP TRIGGER IF EXISTS audit_trigger_transactions ON transactions;
    
    -- Create the audit trigger
    CREATE TRIGGER audit_trigger_transactions
        AFTER INSERT OR UPDATE OR DELETE ON transactions
        FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();
    
    RAISE NOTICE 'Audit trigger created for transactions table';
    
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create audit trigger for transactions: %', SQLERRM;
END $$;

-- Verify the trigger was created
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'audit_trigger_transactions'
AND event_object_table = 'transactions';

-- Test the audit trigger functionality
DO $$
DECLARE
    test_transaction_id UUID;
    audit_count INTEGER;
BEGIN
    -- Set audit context for testing
    PERFORM audit.set_audit_user_context(
        (SELECT id FROM profiles LIMIT 1),
        'test@example.com',
        '127.0.0.1'::INET,
        'Test User Agent',
        'test-session-123'
    );
    
    -- Test INSERT operation
    INSERT INTO transactions (
        amount,
        description,
        transaction_type,
        status,
        category
    ) VALUES (
        100.00,
        'Test transaction for audit',
        'expense',
        'pending',
        'test'
    ) RETURNING id INTO test_transaction_id;
    
    -- Check if audit log was created for INSERT
    SELECT COUNT(*) INTO audit_count
    FROM audit.audit_logs
    WHERE table_name = 'transactions'
    AND record_id = test_transaction_id
    AND action = 'INSERT';
    
    IF audit_count = 0 THEN
        RAISE EXCEPTION 'Audit log not created for INSERT operation';
    END IF;
    
    -- Test UPDATE operation
    UPDATE transactions 
    SET amount = 150.00, description = 'Updated test transaction'
    WHERE id = test_transaction_id;
    
    -- Check if audit log was created for UPDATE
    SELECT COUNT(*) INTO audit_count
    FROM audit.audit_logs
    WHERE table_name = 'transactions'
    AND record_id = test_transaction_id
    AND action = 'UPDATE';
    
    IF audit_count = 0 THEN
        RAISE EXCEPTION 'Audit log not created for UPDATE operation';
    END IF;
    
    -- Verify changed fields are captured
    IF NOT EXISTS (
        SELECT 1 FROM audit.audit_logs
        WHERE table_name = 'transactions'
        AND record_id = test_transaction_id
        AND action = 'UPDATE'
        AND 'amount' = ANY(changed_fields)
        AND 'description' = ANY(changed_fields)
    ) THEN
        RAISE EXCEPTION 'Changed fields not properly captured in audit log';
    END IF;
    
    -- Test DELETE operation
    DELETE FROM transactions WHERE id = test_transaction_id;
    
    -- Check if audit log was created for DELETE
    SELECT COUNT(*) INTO audit_count
    FROM audit.audit_logs
    WHERE table_name = 'transactions'
    AND record_id = test_transaction_id
    AND action = 'DELETE';
    
    IF audit_count = 0 THEN
        RAISE EXCEPTION 'Audit log not created for DELETE operation';
    END IF;
    
    -- Clean up audit context
    PERFORM audit.clear_audit_user_context();
    
    RAISE NOTICE 'All audit trigger tests passed for transactions table';
    
EXCEPTION WHEN OTHERS THEN
    -- Clean up on error
    PERFORM audit.clear_audit_user_context();
    DELETE FROM transactions WHERE id = test_transaction_id;
    RAISE EXCEPTION 'Audit trigger test failed: %', SQLERRM;
END $$;

-- Display audit statistics for transactions
SELECT 
    'transactions' as table_name,
    COUNT(*) as total_audit_logs,
    COUNT(*) FILTER (WHERE action = 'INSERT') as insert_logs,
    COUNT(*) FILTER (WHERE action = 'UPDATE') as update_logs,
    COUNT(*) FILTER (WHERE action = 'DELETE') as delete_logs
FROM audit.audit_logs 
WHERE table_name = 'transactions';

RAISE NOTICE 'Audit trigger for transactions table created and tested successfully';