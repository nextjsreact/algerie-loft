-- Test étape par étape pour l'audit avec contexte utilisateur
-- Exécutez chaque section une par une dans Supabase Dashboard > SQL Editor

-- =====================================================
-- ÉTAPE 1: Créer la fonction de contexte (simple)
-- =====================================================

CREATE OR REPLACE FUNCTION audit.set_audit_context(
    user_id UUID,
    user_email TEXT DEFAULT NULL
)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
    PERFORM set_config('audit.current_user_id', user_id::TEXT, true);
    
    IF user_email IS NOT NULL THEN
        PERFORM set_config('audit.current_user_email', user_email, true);
    END IF;
END;
$$;

-- Test de l'étape 1
SELECT 'Étape 1 terminée: Fonction set_audit_context créée' as status;

-- =====================================================
-- ÉTAPE 2: Créer la fonction de nettoyage
-- =====================================================

CREATE OR REPLACE FUNCTION audit.clear_audit_context()
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
    PERFORM set_config('audit.current_user_id', NULL, true);
    PERFORM set_config('audit.current_user_email', NULL, true);
END;
$$;

-- Test de l'étape 2
SELECT 'Étape 2 terminée: Fonction clear_audit_context créée' as status;

-- =====================================================
-- ÉTAPE 3: Tester les fonctions
-- =====================================================

-- Définir un contexte de test
SELECT audit.set_audit_context(
    'b47e4e4e-4e4e-4e4e-4e4e-4e4e4e4e4e4e'::UUID,
    'test@example.com'
);

-- Vérifier que ça marche
SELECT 
    current_setting('audit.current_user_id', true) as user_id,
    current_setting('audit.current_user_email', true) as user_email;

-- Nettoyer
SELECT audit.clear_audit_context();

-- Vérifier que c'est nettoyé
SELECT 
    current_setting('audit.current_user_id', true) as user_id_after_clear,
    current_setting('audit.current_user_email', true) as user_email_after_clear;

SELECT 'Étape 3 terminée: Tests des fonctions réussis' as status;

-- =====================================================
-- ÉTAPE 4: Améliorer le trigger (version simple)
-- =====================================================

CREATE OR REPLACE FUNCTION audit.audit_trigger_function()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
DECLARE
    changed_fields TEXT[] := '{}';
    field_name TEXT;
    old_val TEXT;
    new_val TEXT;
    current_user_id UUID;
    current_user_email VARCHAR(255);
BEGIN
    -- Récupérer l'utilisateur depuis le contexte
    BEGIN
        current_user_id := current_setting('audit.current_user_id', true)::UUID;
        current_user_email := current_setting('audit.current_user_email', true);
    EXCEPTION WHEN OTHERS THEN
        current_user_id := NULL;
        current_user_email := NULL;
    END;
    
    -- Fallback vers auth.uid() si pas de contexte
    IF current_user_id IS NULL THEN
        BEGIN
            current_user_id := auth.uid();
        EXCEPTION WHEN OTHERS THEN
            current_user_id := NULL;
        END;
    END IF;
    
    -- Pour UPDATE, trouver les champs modifiés
    IF TG_OP = 'UPDATE' THEN
        FOR field_name IN 
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = TG_TABLE_SCHEMA 
            AND table_name = TG_TABLE_NAME
            AND column_name NOT IN ('updated_at', 'created_at')
        LOOP
            EXECUTE format('SELECT ($1).%I::TEXT, ($2).%I::TEXT', field_name, field_name) 
            INTO old_val, new_val 
            USING OLD, NEW;
            
            IF old_val IS DISTINCT FROM new_val THEN
                changed_fields := array_append(changed_fields, field_name);
            END IF;
        END LOOP;
    END IF;
    
    -- Insérer le log d'audit
    INSERT INTO audit.audit_logs (
        table_name,
        record_id,
        action,
        user_id,
        user_email,
        "timestamp",
        old_values,
        new_values,
        changed_fields
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        current_user_id,
        current_user_email,
        NOW(),
        CASE 
            WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
            WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD)
            ELSE NULL 
        END,
        CASE 
            WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW)
            WHEN TG_OP = 'UPDATE' THEN to_jsonb(NEW)
            ELSE NULL 
        END,
        changed_fields
    );
    
    RETURN COALESCE(NEW, OLD);
    
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Audit trigger failed: %', SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$;

SELECT 'Étape 4 terminée: Trigger amélioré créé' as status;

-- =====================================================
-- ÉTAPE 5: Test complet
-- =====================================================

-- Définir le contexte pour le test
SELECT audit.set_audit_context(
    'b47e4e4e-4e4e-4e4e-4e4e-4e4e4e4e4e4e'::UUID,
    'test-user@example.com'
);

-- Compter les logs avant
SELECT COUNT(*) as logs_before FROM audit.audit_logs;

-- Faire une modification de test (remplacez l'ID par un vrai)
-- UPDATE transactions 
-- SET description = 'Test avec contexte utilisateur - ' || NOW()
-- WHERE id = 'VOTRE-TRANSACTION-ID-ICI';

-- Nettoyer le contexte
SELECT audit.clear_audit_context();

-- Vérifier les nouveaux logs
SELECT 
    user_email,
    action,
    array_to_string(changed_fields, ', ') as changed_fields,
    "timestamp"
FROM audit.audit_logs 
WHERE user_email = 'test-user@example.com'
ORDER BY "timestamp" DESC 
LIMIT 3;

SELECT 'Configuration terminée! Testez maintenant en modifiant une transaction via l''interface.' as final_message;