-- Vérifier les triggers dans TOUS les schémas
-- Exécutez ce script dans Supabase Dashboard > SQL Editor

-- 1. Voir TOUS les triggers qui existent (pas seulement audit)
SELECT 
    trigger_schema,
    trigger_name,
    event_object_schema,
    event_object_table,
    string_agg(event_manipulation, ', ') as events,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table IN ('transactions', 'tasks', 'reservations', 'lofts')
GROUP BY trigger_schema, trigger_name, event_object_schema, event_object_table, action_timing
ORDER BY event_object_schema, event_object_table;

-- 2. Voir spécifiquement les triggers audit
SELECT 
    trigger_schema,
    trigger_name,
    event_object_schema,
    event_object_table,
    '✅ TRIGGER AUDIT TROUVÉ' as status
FROM information_schema.triggers 
WHERE trigger_name LIKE '%audit%'
ORDER BY event_object_schema, event_object_table;

-- 3. Vérifier si la fonction trigger existe
SELECT 
    proname as function_name,
    pronamespace::regnamespace as schema_name,
    '✅ FONCTION TROUVÉE' as status
FROM pg_proc 
WHERE proname LIKE '%audit_trigger%'
ORDER BY proname;

-- 4. Test direct de création de trigger (pour voir les erreurs)
DO $$
BEGIN
    -- Essayer de créer un trigger de test
    BEGIN
        EXECUTE 'CREATE TRIGGER test_audit_trigger 
                 AFTER INSERT ON transactions 
                 FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function()';
        
        RAISE NOTICE '✅ Trigger de test créé avec succès sur public.transactions';
        
        -- Supprimer le trigger de test
        EXECUTE 'DROP TRIGGER test_audit_trigger ON transactions';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Erreur création trigger sur public.transactions: %', SQLERRM;
        
        -- Essayer sur auth.transactions
        BEGIN
            EXECUTE 'CREATE TRIGGER test_audit_trigger 
                     AFTER INSERT ON auth.transactions 
                     FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function()';
            
            RAISE NOTICE '✅ Trigger de test créé avec succès sur auth.transactions';
            
            -- Supprimer le trigger de test
            EXECUTE 'DROP TRIGGER test_audit_trigger ON auth.transactions';
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ Erreur création trigger sur auth.transactions: %', SQLERRM;
        END;
    END;
END $$;

SELECT 'Vérification complète des triggers terminée' as message;