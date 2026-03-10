-- Script to check if owners table has audit triggers

SELECT 
    n.nspname as schema_name,
    c.relname as table_name,
    t.tgname as trigger_name,
    pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'owners'
AND n.nspname = 'public'
AND NOT t.tgisinternal
ORDER BY t.tgname;
