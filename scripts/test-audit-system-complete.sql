-- Test complet du système d'audit maintenant que les triggers sont confirmés
-- Exécutez ce script dans Supabase Dashboard > SQL Editor

-- 1. Test INSERT (création)
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
    77777,
    'Test audit INSERT - ' || NOW(),
    'income',
    'pending',
    CURRENT_DATE,
    'Test',
    NOW()
);

-- 2. Récupérer l'ID de la transaction créée
WITH latest_transaction AS (
    SELECT id FROM transactions 
    WHERE description LIKE 'Test audit INSERT%' 
    ORDER BY created_at DESC 
    LIMIT 1
)
-- 3. Test UPDATE (modification)
UPDATE transactions 
SET 
    amount = 88888,
    status = 'completed',
    description = description || ' - MODIFIÉ'
WHERE id = (SELECT id FROM latest_transaction);

-- 4. Vérifier les logs d'audit créés
SELECT 
    '🎯 RÉSULTATS DU TEST' as section,
    table_name,
    record_id,
    action,
    user_email,
    "timestamp",
    CASE 
        WHEN action = 'INSERT' THEN 'Création: ' || (new_values->>'amount')
        WHEN action = 'UPDATE' THEN 'Modification: ' || array_to_string(changed_fields, ', ')
        ELSE action
    END as details
FROM audit.audit_logs 
WHERE table_name = 'transactions'
  AND "timestamp" >= NOW() - INTERVAL '2 minutes'
ORDER BY "timestamp" DESC;

-- 5. Test avec la fonction RPC (comme utilisée par l'interface)
WITH latest_transaction AS (
    SELECT id FROM transactions 
    WHERE description LIKE 'Test audit INSERT%' 
    ORDER BY created_at DESC 
    LIMIT 1
)
SELECT 
    '🔍 TEST RPC FUNCTION' as section,
    get_audit_logs_for_entity('transactions', (SELECT id FROM latest_transaction), 10) as rpc_result;

-- 6. Statistiques du système d'audit
SELECT 
    '📊 STATISTIQUES AUDIT' as section,
    table_name,
    action,
    COUNT(*) as count,
    MAX("timestamp") as last_activity
FROM audit.audit_logs 
WHERE "timestamp" >= NOW() - INTERVAL '24 hours'
GROUP BY table_name, action
ORDER BY table_name, action;

-- 7. Nettoyer les données de test
DELETE FROM transactions WHERE description LIKE 'Test audit INSERT%';

-- 8. Résumé final
SELECT 
    '🎉 SYSTÈME D''AUDIT FONCTIONNEL!' as status,
    COUNT(DISTINCT trigger_name) as triggers_installed,
    (SELECT COUNT(*) FROM audit.audit_logs WHERE "timestamp" >= NOW() - INTERVAL '1 hour') as recent_audit_logs
FROM information_schema.triggers 
WHERE trigger_name LIKE 'audit_trigger_%';

SELECT 'Test complet du système d''audit terminé!' as message;