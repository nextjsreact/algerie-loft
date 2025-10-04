-- =====================================================
-- AUDIT TRIGGERS FOR TASKS TABLE
-- =====================================================
-- This script adds audit triggers to the tasks table
-- to track all INSERT, UPDATE, and DELETE operations.
-- =====================================================

-- Ensure audit schema exists
CREATE SCHEMA IF NOT EXISTS audit;

-- Create audit trigger for tasks table
DO $$
BEGIN
    -- Drop existing trigger if it exists
    DROP TRIGGER IF EXISTS audit_trigger_tasks ON tasks;
    
    -- Create the audit trigger
    CREATE TRIGGER audit_trigger_tasks
        AFTER INSERT OR UPDATE OR DELETE ON tasks
        FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();
    
    RAISE NOTICE 'Audit trigger created for tasks table';
    
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create audit trigger for tasks: %', SQLERRM;
END $$;

-- Verify the trigger was created
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'audit_trigger_tasks'
AND event_object_table = 'tasks';

-- Test the audit trigger functionality
DO $$
DECLARE
    test_task_id UUID;
    audit_count INTEGER;
    test_user_id UUID;
BEGIN
    -- Get a test user ID
    SELECT id INTO test_user_id FROM profiles LIMIT 1;
    
    -- Set audit context for testing
    PERFORM audit.set_audit_user_context(
        test_user_id,
        'test@example.com',
        '127.0.0.1'::INET,
        'Test User Agent',
        'test-session-456'
    );
    
    -- Test INSERT operation
    INSERT INTO tasks (
        title,
        description,
        status,
        assigned_to,
        created_by
    ) VALUES (
        'Test task for audit',
        'This is a test task to verify audit functionality',
        'todo',
        test_user_id,
        test_user_id
    ) RETURNING id INTO test_task_id;
    
    -- Check if audit log was created for INSERT
    SELECT COUNT(*) INTO audit_count
    FROM audit.audit_logs
    WHERE table_name = 'tasks'
    AND record_id = test_task_id
    AND action = 'INSERT';
    
    IF audit_count = 0 THEN
        RAISE EXCEPTION 'Audit log not created for INSERT operation';
    END IF;
    
    -- Verify user tracking in audit log
    IF NOT EXISTS (
        SELECT 1 FROM audit.audit_logs
        WHERE table_name = 'tasks'
        AND record_id = test_task_id
        AND action = 'INSERT'
        AND user_id = test_user_id
        AND user_email = 'test@example.com'
    ) THEN
        RAISE EXCEPTION 'User tracking not properly recorded in audit log';
    END IF;
    
    -- Test UPDATE operation
    UPDATE tasks 
    SET status = 'in_progress', 
        description = 'Updated test task description'
    WHERE id = test_task_id;
    
    -- Check if audit log was created for UPDATE
    SELECT COUNT(*) INTO audit_count
    FROM audit.audit_logs
    WHERE table_name = 'tasks'
    AND record_id = test_task_id
    AND action = 'UPDATE';
    
    IF audit_count = 0 THEN
        RAISE EXCEPTION 'Audit log not created for UPDATE operation';
    END IF;
    
    -- Verify changed fields are captured
    IF NOT EXISTS (
        SELECT 1 FROM audit.audit_logs
        WHERE table_name = 'tasks'
        AND record_id = test_task_id
        AND action = 'UPDATE'
        AND 'status' = ANY(changed_fields)
        AND 'description' = ANY(changed_fields)
    ) THEN
        RAISE EXCEPTION 'Changed fields not properly captured in audit log';
    END IF;
    
    -- Verify timestamp recording
    IF NOT EXISTS (
        SELECT 1 FROM audit.audit_logs
        WHERE table_name = 'tasks'
        AND record_id = test_task_id
        AND timestamp IS NOT NULL
        AND timestamp > NOW() - INTERVAL '1 minute'
    ) THEN
        RAISE EXCEPTION 'Timestamp not properly recorded in audit log';
    END IF;
    
    -- Test DELETE operation
    DELETE FROM tasks WHERE id = test_task_id;
    
    -- Check if audit log was created for DELETE
    SELECT COUNT(*) INTO audit_count
    FROM audit.audit_logs
    WHERE table_name = 'tasks'
    AND record_id = test_task_id
    AND action = 'DELETE';
    
    IF audit_count = 0 THEN
        RAISE EXCEPTION 'Audit log not created for DELETE operation';
    END IF;
    
    -- Clean up audit context
    PERFORM audit.clear_audit_user_context();
    
    RAISE NOTICE 'All audit trigger tests passed for tasks table';
    
EXCEPTION WHEN OTHERS THEN
    -- Clean up on error
    PERFORM audit.clear_audit_user_context();
    DELETE FROM tasks WHERE id = test_task_id;
    RAISE EXCEPTION 'Audit trigger test failed: %', SQLERRM;
END $$;

-- Display audit statistics for tasks
SELECT 
    'tasks' as table_name,
    COUNT(*) as total_audit_logs,
    COUNT(*) FILTER (WHERE action = 'INSERT') as insert_logs,
    COUNT(*) FILTER (WHERE action = 'UPDATE') as update_logs,
    COUNT(*) FILTER (WHERE action = 'DELETE') as delete_logs
FROM audit.audit_logs 
WHERE table_name = 'tasks';

RAISE NOTICE 'Audit trigger for tasks table created and tested successfully';