-- Add audit triggers for owners table
-- This script adds INSERT, UPDATE, and DELETE audit logging for the owners table

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS audit_trigger_owners ON owners;

-- Create the audit trigger for owners table
CREATE TRIGGER audit_trigger_owners
    AFTER INSERT OR UPDATE OR DELETE ON owners
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();

-- Verify the trigger was created
SELECT 
    n.nspname as schema_name,
    c.relname as table_name,
    t.tgname as trigger_name,
    'Trigger created successfully' as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'owners'
AND n.nspname = 'public'
AND t.tgname = 'audit_trigger_owners'
AND NOT t.tgisinternal;
