-- Analyser votre dernière modification pour voir exactement ce qui a changé
-- Exécutez ce script dans Supabase Dashboard > SQL Editor

-- 1. Voir le dernier log d'audit pour votre transaction
SELECT 
    'DERNIER LOG D''AUDIT' as section,
    action,
    user_email,
    "timestamp",
    array_to_string(changed_fields, ', ') as changed_fields_detected,
    jsonb_pretty(old_values) as old_values,
    jsonb_pretty(new_values) as new_values
FROM audit.audit_logs 
WHERE record_id = '79125cd9-84fc-4d9b-861a-dc73b7e1695f'
ORDER BY "timestamp" DESC 
LIMIT 1;

-- 2. Analyser champ par champ les différences
WITH latest_audit AS (
    SELECT old_values, new_values
    FROM audit.audit_logs 
    WHERE record_id = '79125cd9-84fc-4d9b-861a-dc73b7e1695f'
    ORDER BY "timestamp" DESC 
    LIMIT 1
)
SELECT 
    'ANALYSE CHAMP PAR CHAMP' as section,
    key as field_name,
    old_values->>key as old_value,
    new_values->>key as new_value,
    CASE 
        WHEN old_values->>key IS DISTINCT FROM new_values->>key 
        THEN '🔴 DIFFÉRENT' 
        ELSE '🟢 IDENTIQUE' 
    END as status
FROM latest_audit,
     jsonb_object_keys(old_values) as key
ORDER BY 
    CASE WHEN old_values->>key IS DISTINCT FROM new_values->>key THEN 1 ELSE 2 END,
    key;

-- 3. Voir les valeurs actuelles dans la table
SELECT 
    'VALEURS ACTUELLES DANS LA TABLE' as section,
    amount,
    status,
    description,
    date,
    category,
    loft_id,
    currency_id,
    payment_method_id,
    transaction_type,
    ratio_at_transaction,
    equivalent_amount_default_currency
FROM transactions 
WHERE id = '79125cd9-84fc-4d9b-861a-dc73b7e1695f';

-- 4. Test avec modification forcée de plusieurs champs
UPDATE transactions 
SET 
    amount = 12345,
    status = CASE 
        WHEN status = 'pending' THEN 'completed'::transaction_status
        ELSE 'pending'::transaction_status
    END,
    category = 'Test Multiple',
    description = description || ' - Test multi-champs ' || NOW()
WHERE id = '79125cd9-84fc-4d9b-861a-dc73b7e1695f';

-- 5. Vérifier le nouveau log créé
SELECT 
    'APRÈS TEST MULTI-CHAMPS' as section,
    action,
    user_email,
    "timestamp",
    array_to_string(changed_fields, ', ') as changed_fields_detected,
    array_length(changed_fields, 1) as number_of_fields_changed
FROM audit.audit_logs 
WHERE record_id = '79125cd9-84fc-4d9b-861a-dc73b7e1695f'
ORDER BY "timestamp" DESC 
LIMIT 1;

SELECT 'Analyse des changements terminée' as message;