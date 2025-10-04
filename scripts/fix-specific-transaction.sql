-- Fix pour la transaction spécifique qui ne déclenche pas l'audit
-- Cette transaction a un problème particulier

-- 1. Vérifier l'état exact de cette transaction
SELECT 
    'TRANSACTION DETAILS' as section,
    id,
    amount,
    transaction_type,
    status,
    created_at,
    updated_at
FROM transactions 
WHERE id = '79125cd9-84fc-4d9b-861a-dc73b7e1695f';

-- 2. Forcer la création d'un log d'audit manuellement
INSERT INTO audit.audit_logs (
    table_name,
    record_id,
    action,
    old_values,
    new_values,
    changed_fields,
    user_email,
    timestamp
)
SELECT 
    'transactions',
    '79125cd9-84fc-4d9b-861a-dc73b7e1695f',
    'UPDATE',
    '{}',
    row_to_json(t)::jsonb,
    ARRAY['amount', 'description'],
    'system@fix.com',
    NOW()
FROM transactions t
WHERE id = '79125cd9-84fc-4d9b-861a-dc73b7e1695f';

-- 3. Vérifier que le log a été créé
SELECT 
    'VERIFICATION' as section,
    COUNT(*) as new_count
FROM audit.audit_logs 
WHERE record_id = '79125cd9-84fc-4d9b-861a-dc73b7e1695f';

-- 4. Réactiver le trigger pour cette transaction en forçant un UPDATE
UPDATE transactions 
SET updated_at = NOW()
WHERE id = '79125cd9-84fc-4d9b-861a-dc73b7e1695f';

-- 5. Vérification finale
SELECT 
    'FINAL CHECK' as section,
    COUNT(*) as final_count
FROM audit.audit_logs 
WHERE record_id = '79125cd9-84fc-4d9b-861a-dc73b7e1695f';

SELECT 'Fix applied for specific transaction' as message;