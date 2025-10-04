-- Voir tous les audits récents pour toutes les transactions
-- Exécutez ce script dans Supabase Dashboard > SQL Editor

-- 1. Voir tous les audits des dernières 24 heures
SELECT 
    table_name,
    record_id,
    action,
    user_email,
    "timestamp",
    array_to_string(changed_fields, ', ') as changed_fields_list
FROM audit.audit_logs 
WHERE table_name = 'transactions'
  AND "timestamp" >= NOW() - INTERVAL '24 hours'
ORDER BY "timestamp" DESC 
LIMIT 10;

-- 2. Voir spécifiquement les créations (INSERT) récentes
SELECT 
    record_id,
    user_email,
    "timestamp",
    jsonb_pretty(new_values) as created_transaction
FROM audit.audit_logs 
WHERE table_name = 'transactions'
  AND action = 'INSERT'
  AND "timestamp" >= NOW() - INTERVAL '1 hour'
ORDER BY "timestamp" DESC 
LIMIT 5;

-- 3. Voir les transactions créées récemment dans la table principale
SELECT 
    id,
    amount,
    description,
    status,
    created_at
FROM transactions 
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC 
LIMIT 5;

SELECT 'Vérification des audits récents terminée' as message;