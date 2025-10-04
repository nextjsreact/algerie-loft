-- Test script to validate audit system schema
-- This script can be used to test the audit system functionality

-- Test 1: Verify audit_logs table exists and has correct structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'audit' 
AND table_name = 'audit_logs' 
ORDER BY ordinal_position;

-- Test 2: Verify indexes exist
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'audit' 
AND tablename = 'audit_logs';

-- Test 3: Verify functions exist
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'audit'
AND routine_name IN (
    'audit_trigger_function',
    'set_audit_user_context',
    'clear_audit_user_context',
    'create_audit_trigger',
    'drop_audit_trigger',
    'get_audit_statistics'
);

-- Test 4: Test user context setting
SELECT audit.set_audit_user_context(
    'f47ac10b-58cc-4372-a567-0e02b2c3d479'::UUID,
    'test@example.com',
    '192.168.1.1'::INET,
    'Test User Agent',
    'test-session-123'
);

-- Test 5: Verify context was set
SELECT 
    current_setting('audit.current_user_id', true) as user_id,
    current_setting('audit.current_user_email', true) as user_email,
    current_setting('audit.current_ip_address', true) as ip_address;

-- Test 6: Clear context
SELECT audit.clear_audit_user_context();

-- Test 7: Verify context was cleared
SELECT 
    current_setting('audit.current_user_id', true) as user_id,
    current_setting('audit.current_user_email', true) as user_email;

-- Test 8: Get audit statistics (should be empty initially)
SELECT * FROM audit.get_audit_statistics();

-- Test 9: Verify RLS policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'audit' 
AND tablename = 'audit_logs';