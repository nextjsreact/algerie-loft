-- Test rapide pour vérifier si les fonctions d'audit existent
-- Exécutez ce script dans Supabase Dashboard > SQL Editor

-- 1. Vérifier si les fonctions existent
SELECT 
    proname as function_name,
    pronamespace::regnamespace as schema_name,
    pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc 
WHERE proname LIKE '%audit%' 
ORDER BY proname;

-- 2. Tester la fonction set_audit_context si elle existe
DO $$
BEGIN
    -- Essayer d'appeler la fonction
    PERFORM audit.set_audit_context(
        'test-user-id'::UUID,
        'test@example.com'
    );
    
    -- Vérifier que les variables sont définies
    RAISE NOTICE 'User ID: %', current_setting('audit.current_user_id', true);
    RAISE NOTICE 'User Email: %', current_setting('audit.current_user_email', true);
    
    -- Nettoyer
    PERFORM audit.clear_audit_context();
    
    RAISE NOTICE 'Fonctions d''audit OK!';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erreur avec les fonctions d''audit: %', SQLERRM;
END $$;

-- 3. Vérifier le trigger actuel
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_name LIKE '%audit%'
ORDER BY event_object_table;

-- 4. Tester le trigger avec une vraie modification
-- (Remplacez l'UUID par celui de votre transaction)
UPDATE transactions 
SET description = description || ' - Test trigger ' || NOW()
WHERE id = '229afc15-84a5-4b93-b65a-fd133c063653';

-- 5. Vérifier les nouveaux logs
SELECT 
    id,
    action,
    user_email,
    array_to_string(changed_fields, ', ') as changed_fields,
    "timestamp"
FROM audit.audit_logs 
WHERE table_name = 'transactions'
  AND record_id = '229afc15-84a5-4b93-b65a-fd133c063653'
ORDER BY "timestamp" DESC 
LIMIT 5;