-- Installation des triggers d'audit pour les tables dans le schéma auth
-- Exécutez ce script SEULEMENT si vos tables sont dans le schéma auth

-- 1. Supprimer les anciens triggers (au cas où)
DROP TRIGGER IF EXISTS audit_trigger_transactions ON auth.transactions;
DROP TRIGGER IF EXISTS audit_trigger_tasks ON auth.tasks;
DROP TRIGGER IF EXISTS audit_trigger_reservations ON auth.reservations;
DROP TRIGGER IF EXISTS audit_trigger_lofts ON auth.lofts;

-- 2. Créer les triggers sur les tables du schéma auth
CREATE TRIGGER audit_trigger_transactions
    AFTER INSERT OR UPDATE OR DELETE ON auth.transactions
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();

CREATE TRIGGER audit_trigger_tasks
    AFTER INSERT OR UPDATE OR DELETE ON auth.tasks
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();

CREATE TRIGGER audit_trigger_reservations
    AFTER INSERT OR UPDATE OR DELETE ON auth.reservations
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();

CREATE TRIGGER audit_trigger_lofts
    AFTER INSERT OR UPDATE OR DELETE ON auth.lofts
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();

-- 3. Test avec une table du schéma auth
INSERT INTO auth.transactions (
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
    54321,
    'Test trigger schéma auth - ' || NOW(),
    'income',
    'pending',
    CURRENT_DATE,
    'Test',
    NOW()
);

-- 4. Vérifier les triggers installés
SELECT 
    trigger_name,
    event_object_schema,
    event_object_table,
    string_agg(event_manipulation, ', ') as events,
    '✅ INSTALLÉ' as status
FROM information_schema.triggers 
WHERE trigger_name LIKE '%audit%'
GROUP BY trigger_name, event_object_schema, event_object_table
ORDER BY event_object_schema, event_object_table;

-- 5. Vérifier le test
SELECT 
    '✅ TEST RÉUSSI SCHÉMA AUTH!' as test_status,
    action,
    user_email,
    "timestamp"
FROM audit.audit_logs 
WHERE table_name = 'transactions'
  AND "timestamp" >= NOW() - INTERVAL '1 minute'
ORDER BY "timestamp" DESC 
LIMIT 1;

-- 6. Nettoyer le test
DELETE FROM auth.transactions WHERE description LIKE 'Test trigger schéma auth%';

SELECT '🎉 TRIGGERS INSTALLÉS SUR SCHÉMA AUTH!' as final_message;