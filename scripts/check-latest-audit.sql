-- Vérifier le dernier log d'audit pour voir ce qui a été détecté
-- Exécutez ce script dans Supabase Dashboard > SQL Editor

-- 1. Voir le dernier log d'audit
SELECT 
    action,
    user_email,
    "timestamp",
    array_to_string(changed_fields, ', ') as changed_fields_list,
    jsonb_pretty(old_values) as old_values_formatted,
    jsonb_pretty(new_values) as new_values_formatted
FROM audit.audit_logs 
WHERE table_name = 'transactions'
  AND record_id = '229afc15-84a5-4b93-b65a-fd133c063653'
ORDER BY "timestamp" DESC 
LIMIT 1;

-- 2. Comparer champ par champ pour voir les vraies différences
WITH latest_audit AS (
    SELECT old_values, new_values
    FROM audit.audit_logs 
    WHERE table_name = 'transactions'
      AND record_id = '229afc15-84a5-4b93-b65a-fd133c063653'
    ORDER BY "timestamp" DESC 
    LIMIT 1
)
SELECT 
    key as field_name,
    old_values->>key as old_value,
    new_values->>key as new_value,
    CASE 
        WHEN old_values->>key IS DISTINCT FROM new_values->>key 
        THEN 'DIFFERENT' 
        ELSE 'SAME' 
    END as comparison
FROM latest_audit,
     jsonb_object_keys(old_values) as key
ORDER BY key;

-- 3. Voir les valeurs actuelles dans la table transactions
SELECT 
    amount,
    status,
    description,
    date,
    category,
    loft_id,
    currency_id,
    payment_method_id,
    ratio_at_transaction,
    equivalent_amount_default_currency
FROM transactions 
WHERE id = '229afc15-84a5-4b93-b65a-fd133c063653';

SELECT 'Vérification terminée - comparez les résultats ci-dessus' as message;