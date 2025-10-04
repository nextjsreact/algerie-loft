-- Vérifier le code de la fonction trigger pour voir pourquoi elle ne fonctionne pas correctement
SELECT 
    'TRIGGER FUNCTION CODE' as section,
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'audit_trigger_function' 
  AND routine_schema = 'audit';

-- Vérifier les derniers logs pour voir les problèmes
SELECT 
    'PROBLEMATIC LOGS' as section,
    action,
    user_email,
    old_values,
    new_values,
    changed_fields,
    timestamp
FROM audit.audit_logs 
WHERE record_id = '79125cd9-84fc-4d9b-861a-dc73b7e1695f'
ORDER BY timestamp DESC 
LIMIT 3;