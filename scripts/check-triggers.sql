-- Vérifier si les triggers d'audit sont bien installés
-- Exécutez ce script dans Supabase Dashboard > SQL Editor

-- 1. Vérifier les triggers existants
SELECT 
    trigger_name,
    event_object_table as table_name,
    string_agg(event_manipulation, ', ') as events,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%audit%'
  AND event_object_schema = 'public'
GROUP BY trigger_name, event_object_table, action_timing, action_statement
ORDER BY event_object_table;

-- 2. Vérifier les fonctions d'audit
SELECT 
    proname as function_name,
    pronamespace::regnamespace as schema_name
FROM pg_proc 
WHERE proname LIKE '%audit%' 
ORDER BY proname;

-- 3. Test manuel du trigger INSERT
INSERT INTO transactions (
    id, 
    amount, 
    description, 
    transaction_type,
    status,
    date,
    category,
    created_at
) VALUES (
    gen_random_uuid(),
    12345,
    'Test trigger INSERT - ' || NOW(),
    'income',
    'pending',
    CURRENT_DATE,
    'Test',
    NOW()
);

-- 4. Vérifier si le log d'audit a été créé
SELECT 
    table_name,
    record_id,
    action,
    user_email,
    "timestamp",
    jsonb_extract_path_text(new_values, 'description') as description
FROM audit.audit_logs 
WHERE table_name = 'transactions'
  AND action = 'INSERT'
  AND "timestamp" >= NOW() - INTERVAL '5 minutes'
ORDER BY "timestamp" DESC 
LIMIT 3;

-- 5. Nettoyer le test
DELETE FROM transactions 
WHERE description LIKE 'Test trigger INSERT%';

SELECT 'Vérification des triggers terminée' as message;