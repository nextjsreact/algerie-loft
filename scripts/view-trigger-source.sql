-- Voir le code source complet de la fonction trigger
\sf audit.audit_trigger_function

-- Alternative si la première ne marche pas
SELECT 
    prosrc as function_source
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'audit_trigger_function' 
  AND n.nspname = 'audit';