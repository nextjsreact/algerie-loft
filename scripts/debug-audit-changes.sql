-- Script pour déboguer pourquoi tous les champs ne sont pas détectés
-- Exécutez ce script dans Supabase Dashboard > SQL Editor

-- 1. Voir les données actuelles de la transaction
SELECT 
    id,
    amount,
    status,
    date,
    category,
    loft_id,
    currency_id,
    payment_method_id,
    description
FROM transactions 
WHERE id = '229afc15-84a5-4b93-b65a-fd133c063653';

-- 2. Voir le dernier log d'audit avec toutes les valeurs
SELECT 
    action,
    user_email,
    "timestamp",
    array_to_string(changed_fields, ', ') as changed_fields_list,
    old_values,
    new_values
FROM audit.audit_logs 
WHERE table_name = 'transactions'
  AND record_id = '229afc15-84a5-4b93-b65a-fd133c063653'
ORDER BY "timestamp" DESC 
LIMIT 1;

-- 3. Comparer les old_values et new_values pour voir les différences
SELECT 
    "timestamp",
    jsonb_object_keys(old_values) as field_name,
    old_values->>jsonb_object_keys(old_values) as old_value,
    new_values->>jsonb_object_keys(old_values) as new_value,
    CASE 
        WHEN old_values->>jsonb_object_keys(old_values) IS DISTINCT FROM new_values->>jsonb_object_keys(old_values)
        THEN 'CHANGED'
        ELSE 'SAME'
    END as status
FROM audit.audit_logs,
     jsonb_object_keys(old_values) 
WHERE table_name = 'transactions'
  AND record_id = '229afc15-84a5-4b93-b65a-fd133c063653'
  AND "timestamp" = (
      SELECT MAX("timestamp") 
      FROM audit.audit_logs 
      WHERE table_name = 'transactions' 
        AND record_id = '229afc15-84a5-4b93-b65a-fd133c063653'
  )
ORDER BY field_name;

-- 4. Test manuel du trigger pour voir ce qu'il détecte
-- Faire une modification qui devrait changer plusieurs champs
UPDATE transactions 
SET 
    amount = amount + 1,  -- Changer le montant
    status = CASE 
        WHEN status = 'failed' THEN 'pending'::transaction_status
        ELSE 'failed'::transaction_status
    END,  -- Changer le statut
    description = description || ' - Debug test ' || NOW()
WHERE id = '229afc15-84a5-4b93-b65a-fd133c063653';

-- 5. Voir le nouveau log créé
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

SELECT 'Debug terminé - vérifiez les résultats ci-dessus' as message;