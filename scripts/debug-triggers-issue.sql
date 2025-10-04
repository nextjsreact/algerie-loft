-- Diagnostic complet pour comprendre pourquoi les triggers ne s'affichent pas
-- Exécutez ce script dans Supabase Dashboard > SQL Editor

-- 1. Vérifier TOUS les triggers sur vos tables (pas seulement audit)
SELECT 
    'TOUS LES TRIGGERS SUR VOS TABLES' as section,
    trigger_name,
    event_object_table,
    string_agg(event_manipulation, ', ') as events,
    action_timing
FROM information_schema.triggers 
WHERE event_object_schema = 'public'
  AND event_object_table IN ('transactions', 'tasks', 'reservations', 'lofts')
GROUP BY trigger_name, event_object_table, action_timing
ORDER BY event_object_table, trigger_name;

-- 2. Vérifier si la fonction audit existe
SELECT 
    'FONCTIONS AUDIT' as section,
    proname as function_name,
    pronamespace::regnamespace as schema_name
FROM pg_proc 
WHERE proname LIKE '%audit%'
ORDER BY proname;

-- 3. Essayer de créer un trigger manuellement pour voir l'erreur
DO $$
DECLARE
    error_msg TEXT;
BEGIN
    -- Test 1: Vérifier si la fonction existe
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'audit_trigger_function' AND pronamespace = 'audit'::regnamespace) THEN
        RAISE NOTICE '❌ PROBLÈME: La fonction audit.audit_trigger_function() n''existe pas!';
    ELSE
        RAISE NOTICE '✅ La fonction audit.audit_trigger_function() existe';
    END IF;
    
    -- Test 2: Essayer de créer un trigger
    BEGIN
        EXECUTE 'DROP TRIGGER IF EXISTS test_trigger ON transactions';
        EXECUTE 'CREATE TRIGGER test_trigger 
                 AFTER INSERT ON transactions 
                 FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function()';
        
        RAISE NOTICE '✅ Trigger de test créé avec succès!';
        
        -- Vérifier qu'il apparaît
        IF EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'test_trigger') THEN
            RAISE NOTICE '✅ Trigger de test visible dans information_schema.triggers';
        ELSE
            RAISE NOTICE '❌ PROBLÈME: Trigger créé mais pas visible dans information_schema.triggers';
        END IF;
        
        -- Supprimer le trigger de test
        EXECUTE 'DROP TRIGGER test_trigger ON transactions';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ ERREUR lors de la création du trigger: %', SQLERRM;
    END;
    
    -- Test 3: Vérifier les permissions
    BEGIN
        IF NOT has_table_privilege('transactions', 'TRIGGER') THEN
            RAISE NOTICE '❌ PROBLÈME: Pas de permission TRIGGER sur la table transactions';
        ELSE
            RAISE NOTICE '✅ Permission TRIGGER OK sur transactions';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Impossible de vérifier les permissions TRIGGER';
    END;
    
END $$;

-- 4. Vérifier le schéma audit
SELECT 
    'SCHÉMA AUDIT' as section,
    schema_name,
    schema_owner
FROM information_schema.schemata 
WHERE schema_name = 'audit';

-- 5. Vérifier la table audit_logs
SELECT 
    'TABLE AUDIT_LOGS' as section,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'audit' 
  AND table_name = 'audit_logs';

-- 6. Essayer de recréer la fonction trigger
CREATE OR REPLACE FUNCTION audit.audit_trigger_function()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    -- Version ultra-simple pour test
    INSERT INTO audit.audit_logs (
        table_name,
        record_id,
        action,
        user_email,
        "timestamp",
        new_values
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        'loftbritish@gmail.com',
        NOW(),
        CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END
    );
    
    RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Audit trigger failed: %', SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- 7. Créer les triggers un par un avec vérification
DO $$
BEGIN
    -- Transactions
    EXECUTE 'DROP TRIGGER IF EXISTS audit_trigger_transactions ON transactions';
    EXECUTE 'CREATE TRIGGER audit_trigger_transactions 
             AFTER INSERT OR UPDATE OR DELETE ON transactions 
             FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function()';
    RAISE NOTICE '✅ Trigger créé sur transactions';
    
    -- Tasks
    EXECUTE 'DROP TRIGGER IF EXISTS audit_trigger_tasks ON tasks';
    EXECUTE 'CREATE TRIGGER audit_trigger_tasks 
             AFTER INSERT OR UPDATE OR DELETE ON tasks 
             FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function()';
    RAISE NOTICE '✅ Trigger créé sur tasks';
    
    -- Reservations
    EXECUTE 'DROP TRIGGER IF EXISTS audit_trigger_reservations ON reservations';
    EXECUTE 'CREATE TRIGGER audit_trigger_reservations 
             AFTER INSERT OR UPDATE OR DELETE ON reservations 
             FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function()';
    RAISE NOTICE '✅ Trigger créé sur reservations';
    
    -- Lofts
    EXECUTE 'DROP TRIGGER IF EXISTS audit_trigger_lofts ON lofts';
    EXECUTE 'CREATE TRIGGER audit_trigger_lofts 
             AFTER INSERT OR UPDATE OR DELETE ON lofts 
             FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function()';
    RAISE NOTICE '✅ Trigger créé sur lofts';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Erreur lors de la création des triggers: %', SQLERRM;
END $$;

-- 8. Vérification finale
SELECT 
    'VÉRIFICATION FINALE' as section,
    trigger_name,
    event_object_table,
    string_agg(event_manipulation, ', ') as events
FROM information_schema.triggers 
WHERE trigger_name LIKE '%audit%'
  AND event_object_schema = 'public'
GROUP BY trigger_name, event_object_table
ORDER BY event_object_table;

SELECT 'Diagnostic complet terminé - vérifiez les messages NOTICE ci-dessus' as message;