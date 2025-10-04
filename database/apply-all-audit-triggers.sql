-- =====================================================
-- APPLY ALL AUDIT TRIGGERS FOR CORE ENTITIES
-- =====================================================
-- This script applies audit triggers to all core entities:
-- - transactions
-- - tasks  
-- - reservations
-- - lofts
-- =====================================================

-- Ensure audit schema and infrastructure exists
\i database/audit-system-schema.sql

-- Apply audit triggers for all core entities
\i database/add-audit-triggers-transactions.sql
\i database/add-audit-triggers-tasks.sql
\i database/add-audit-triggers-reservations.sql
\i database/add-audit-triggers-lofts.sql

-- Verify all triggers are created
SELECT 
    trigger_name,
    event_object_table as table_name,
    string_agg(event_manipulation, ', ') as events,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE 'audit_trigger_%'
AND event_object_schema = 'public'
GROUP BY trigger_name, event_object_table, action_timing, action_statement
ORDER BY event_object_table;

-- Display comprehensive audit statistics
SELECT 
    table_name,
    COUNT(*) as total_audit_logs,
    COUNT(*) FILTER (WHERE action = 'INSERT') as insert_logs,
    COUNT(*) FILTER (WHERE action = 'UPDATE') as update_logs,
    COUNT(*) FILTER (WHERE action = 'DELETE') as delete_logs,
    MIN(timestamp) as first_log,
    MAX(timestamp) as latest_log
FROM audit.audit_logs 
WHERE table_name IN ('transactions', 'tasks', 'reservations', 'lofts')
GROUP BY table_name
ORDER BY table_name;

-- Summary message
DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'AUDIT SYSTEM SETUP COMPLETE';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Audit triggers have been successfully created for:';
    RAISE NOTICE '- transactions table';
    RAISE NOTICE '- tasks table';
    RAISE NOTICE '- reservations table';
    RAISE NOTICE '- lofts table';
    RAISE NOTICE '';
    RAISE NOTICE 'All CRUD operations on these tables will now be automatically audited.';
    RAISE NOTICE 'Audit logs are stored in the audit.audit_logs table.';
    RAISE NOTICE '==============================================';
END $$;