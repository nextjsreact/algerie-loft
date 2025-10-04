-- Vérifier le dernier log d'audit avec vos modifications multiples
-- Exécutez ce script dans Supabase Dashboard > SQL Editor

-- 1. Voir le dernier log d'audit
SELECT 
    'DERNIER LOG AVEC MODIFICATIONS MULTIPLES' as section,
    action,
    user_email,
    "timestamp",
    array_to_string(changed_fields, ', ') as changed_fields_detected,
    array_length(changed_fields, 1) as number_of_fields_changed
FROM audit.audit_logs 
WHERE record_id = '79125cd9-84fc-4d9b-861a-dc73b7e1695f'
ORDER BY "timestamp" DESC 
LIMIT 1;

-- 2. Analyser les changements détectés
WITH latest_audit AS (
    SELECT old_values, new_values, changed_fields
    FROM audit.audit_logs 
    WHERE record_id = '79125cd9-84fc-4d9b-861a-dc73b7e1695f'
    ORDER BY "timestamp" DESC 
    LIMIT 1
)
SELECT 
    'CHAMPS DÉTECTÉS COMME MODIFIÉS' as section,
    unnest(changed_fields) as field_changed,
    old_values->>unnest(changed_fields) as old_value,
    new_values->>unnest(changed_fields) as new_value
FROM latest_audit;

-- 3. Voir tous les logs pour cette transaction
SELECT 
    'HISTORIQUE COMPLET' as section,
    ROW_NUMBER() OVER (ORDER BY "timestamp" DESC) as log_number,
    action,
    user_email,
    "timestamp",
    array_to_string(changed_fields, ', ') as changed_fields,
    array_length(changed_fields, 1) as fields_count
FROM audit.audit_logs 
WHERE record_id = '79125cd9-84fc-4d9b-861a-dc73b7e1695f'
ORDER BY "timestamp" DESC;

-- 4. Test de la fonction RPC (comme utilisée par l'interface)
SELECT 
    'TEST FONCTION RPC' as section,
    get_audit_logs_for_entity('transactions', '79125cd9-84fc-4d9b-861a-dc73b7e1695f', 5) as rpc_result;

SELECT 'Vérification du dernier audit terminée' as message;