-- Simple diagnostic to check if the trigger is working
-- This is the final test to determine if the trigger itself is the problem

-- 1. Check if the trigger exists and is active
SELECT 
    'TRIGGER STATUS' as section,
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'transactions' 
  AND trigger_name LIKE '%audit%';

-- 2. Check current count for our test transaction
SELECT 
    'BEFORE UPDATE COUNT' as section,
    COUNT(*) as current_logs 
FROM audit.audit_logs 
WHERE record_id = '79125cd9-84fc-4d9b-861a-dc73b7e1695f';

-- 3. Perform a simple update that should trigger the audit
UPDATE transactions 
SET amount = amount + 1 
WHERE id = '79125cd9-84fc-4d9b-861a-dc73b7e1695f';

-- 4. Check count immediately after update
SELECT 
    'AFTER UPDATE COUNT' as section,
    COUNT(*) as new_logs 
FROM audit.audit_logs 
WHERE record_id = '79125cd9-84fc-4d9b-861a-dc73b7e1695f';

-- 5. Show the latest log if it was created
SELECT 
    'LATEST LOG DETAILS' as section,
    action,
    user_email,
    "timestamp",
    changed_fields,
    old_values,
    new_values
FROM audit.audit_logs 
WHERE record_id = '79125cd9-84fc-4d9b-861a-dc73b7e1695f'
ORDER BY "timestamp" DESC 
LIMIT 1;

SELECT 'Simple trigger diagnostic complete' as message;