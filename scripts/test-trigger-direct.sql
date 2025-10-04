-- Test direct du trigger pour voir s'il fonctionne
-- Exécutez ce script dans Supabase Dashboard > SQL Editor

-- 1. Vérifier les logs existants pour votre nouvelle transaction
SELECT 
    'LOGS EXISTANTS POUR VOTRE TRANSACTION' as section,
    table_name,
    record_id,
    action,
    user_email,
    "timestamp"
FROM audit.audit_logs 
WHERE record_id = '79125cd9-84fc-4d9b-861a-dc73b7e1695f'
ORDER BY "timestamp" DESC;

-- 2. Test direct du trigger avec modification SQL
UPDATE transactions 
SET description = description || ' - Test trigger direct ' || NOW()
WHERE id = '79125cd9-84fc-4d9b-861a-dc73b7e1695f';

-- 3. Vérifier si le trigger a créé un log
SELECT 
    'APRÈS TEST DIRECT' as section,
    table_name,
    record_id,
    action,
    user_email,
    "timestamp",
    array_to_string(changed_fields, ', ') as changed_fields
FROM audit.audit_logs 
WHERE record_id = '79125cd9-84fc-4d9b-861a-dc73b7e1695f'
ORDER BY "timestamp" DESC;

-- 4. Test avec contexte utilisateur défini
SELECT audit.set_audit_context(
    'b47e4e4e-4e4e-4e4e-4e4e-4e4e4e4e4e4e'::UUID,
    'loftbritish@gmail.com'
);

-- 5. Modification avec contexte
UPDATE transactions 
SET amount = amount + 1
WHERE id = '79125cd9-84fc-4d9b-861a-dc73b7e1695f';

-- 6. Vérifier le résultat avec contexte
SELECT 
    'AVEC CONTEXTE UTILISATEUR' as section,
    table_name,
    record_id,
    action,
    user_email,
    "timestamp",
    array_to_string(changed_fields, ', ') as changed_fields
FROM audit.audit_logs 
WHERE record_id = '79125cd9-84fc-4d9b-861a-dc73b7e1695f'
ORDER BY "timestamp" DESC
LIMIT 3;

-- 7. Nettoyer le contexte
SELECT audit.clear_audit_context();

-- 8. Vérifier tous les logs récents
SELECT 
    'TOUS LES LOGS RÉCENTS' as section,
    table_name,
    record_id,
    action,
    user_email,
    "timestamp"
FROM audit.audit_logs 
WHERE "timestamp" >= NOW() - INTERVAL '10 minutes'
ORDER BY "timestamp" DESC
LIMIT 10;

SELECT 'Test direct du trigger terminé' as message;