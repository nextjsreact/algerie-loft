-- Récupérer le code complet de la fonction trigger
SELECT 
    pg_get_functiondef(p.oid) as complete_function_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'audit_trigger_function' 
  AND n.nspname = 'audit';