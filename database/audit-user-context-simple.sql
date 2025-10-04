-- Script simplifié pour améliorer la capture d'utilisateur dans les audits
-- Exécutez ce script dans Supabase Dashboard > SQL Editor

-- =====================================================
-- 1. FONCTION POUR DÉFINIR LE CONTEXTE UTILISATEUR
-- =====================================================

CREATE OR REPLACE FUNCTION audit.set_audit_context(
    user_id UUID,
    user_email TEXT DEFAULT NULL,
    ip_address TEXT DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    session_id TEXT DEFAULT NULL
)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
    -- Définir toutes les variables de contexte
    PERFORM set_config('audit.current_user_id', user_id::TEXT, true);
    
    IF user_email IS NOT NULL THEN
        PERFORM set_config('audit.current_user_email', user_email, true);
    END IF;
    
    IF ip_address IS NOT NULL THEN
        PERFORM set_config('audit.current_ip_address', ip_address, true);
    END IF;
    
    IF user_agent IS NOT NULL THEN
        PERFORM set_config('audit.current_user_agent', user_agent, true);
    END IF;
    
    IF session_id IS NOT NULL THEN
        PERFORM set_config('audit.current_session_id', session_id, true);
    END IF;
END;
$$;

-- =====================================================
-- 2. FONCTION POUR NETTOYER LE CONTEXTE
-- =====================================================

CREATE OR REPLACE FUNCTION audit.clear_audit_context()
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
    -- Nettoyer toutes les variables de contexte
    PERFORM set_config('audit.current_user_id', NULL, true);
    PERFORM set_config('audit.current_user_email', NULL, true);
    PERFORM set_config('audit.current_ip_address', NULL, true);
    PERFORM set_config('audit.current_user_agent', NULL, true);
    PERFORM set_config('audit.current_session_id', NULL, true);
END;
$$;

-- =====================================================
-- 3. AMÉLIORER LA FONCTION TRIGGER EXISTANTE
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
    -- Essayer de récupérer l'utilisateur depuis le contexte de session d'abord
    BEGIN
        current_user_id := current_setting('audit.current_user_id', true)::UUID;
    EXCEPTION WHEN OTHERS THEN
        current_user_id := NULL;
    END;
    
    -- Si pas trouvé dans le contexte, essayer auth.uid()
    IF current_user_id IS NULL THEN
        BEGIN
            current_user_id := auth.uid();
        EXCEPTION WHEN OTHERS THEN
            current_user_id := NULL;
        END;
    END IF;
    
    -- Récupérer l'email depuis le contexte de session d'abord
    BEGIN
        current_user_email := current_setting('audit.current_user_email', true);
    EXCEPTION WHEN OTHERS THEN
        current_user_email := NULL;
    END;
    
    -- Si pas trouvé dans le contexte, essayer de le récupérer depuis auth.users
    IF current_user_email IS NULL AND current_user_id IS NOT NULL THEN
        BEGIN
            SELECT email INTO current_user_email 
            FROM auth.users 
            WHERE id = current_user_id;
        EXCEPTION WHEN OTHERS THEN
            current_user_email := NULL;
        END;
    END IF;
    
    -- Pour les opérations UPDATE, déterminer quels champs ont changé
    IF TG_OP = 'UPDATE' THEN
        -- Obtenir tous les noms de colonnes pour la table
        FOR field_name IN 
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = TG_TABLE_SCHEMA 
            AND table_name = TG_TABLE_NAME
            AND column_name NOT IN ('updated_at', 'created_at') -- Exclure les champs timestamp
        LOOP
            -- Comparer les anciennes et nouvelles valeurs
            EXECUTE format('SELECT ($1).%I::TEXT, ($2).%I::TEXT', field_name, field_name) 
            INTO old_val, new_val 
            USING OLD, NEW;
            
            -- Ajouter à changed_fields si les valeurs sont différentes
            IF old_val IS DISTINCT FROM new_val THEN
                changed_fields := array_append(changed_fields, field_name);
            END IF;
        END LOOP;
    END IF;
    
    -- Insérer l'enregistrement d'audit
    INSERT INTO audit.audit_logs (
        table_name,
        record_id,
        action,
        user_id,
        user_email,
        "timestamp",
        old_values,
        new_values,
        changed_fields,
        ip_address,
        user_agent,
        session_id
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
        changed_fields,
        current_setting('audit.current_ip_address', true), -- IP depuis le contexte
        current_setting('audit.current_user_agent', true), -- User agent depuis le contexte
        current_setting('audit.current_session_id', true)  -- Session ID depuis le contexte
    );
    
    -- Retourner l'enregistrement approprié
    RETURN COALESCE(NEW, OLD);
    
EXCEPTION WHEN OTHERS THEN
    -- Logger l'erreur mais ne pas faire échouer l'opération principale
    RAISE WARNING 'Audit trigger failed for table %: %', TG_TABLE_NAME, SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- =====================================================
-- 4. TEST RAPIDE
-- =====================================================

-- Test avec contexte utilisateur
SELECT audit.set_audit_context(
    'b47e4e4e-4e4e-4e4e-4e4e-4e4e4e4e4e4e'::UUID,
    'test@example.com',
    '192.168.1.1',
    'Mozilla/5.0 Test Browser',
    'session_123'
);

-- Vérifier que le contexte est défini
SELECT 
    current_setting('audit.current_user_id', true) as user_id,
    current_setting('audit.current_user_email', true) as user_email;

-- Nettoyer le contexte de test
SELECT audit.clear_audit_context();

-- Message de succès
SELECT 'Fonctions de contexte d''audit créées avec succès!' as message;
SELECT 'Vous pouvez maintenant tester en modifiant une transaction.' as next_step;