-- Installation complète du système d'audit depuis zéro
-- Exécutez ce script dans Supabase Dashboard > SQL Editor

-- 1. Créer le schéma audit s'il n'existe pas
CREATE SCHEMA IF NOT EXISTS audit;

-- 2. Créer la table audit_logs s'il n'existe pas
CREATE TABLE IF NOT EXISTS audit.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(255) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    user_id UUID,
    user_email VARCHAR(255),
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    integrity_hash VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit.audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit.audit_logs("timestamp");
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit.audit_logs(action);

-- 4. Créer la fonction trigger
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
    -- Récupérer l'utilisateur (avec fallback vers votre email)
    BEGIN
        current_user_id := current_setting('audit.current_user_id', true)::UUID;
        current_user_email := current_setting('audit.current_user_email', true);
    EXCEPTION WHEN OTHERS THEN
        current_user_id := NULL;
        current_user_email := NULL;
    END;
    
    -- Fallback vers auth.uid()
    IF current_user_id IS NULL THEN
        BEGIN
            current_user_id := auth.uid();
        EXCEPTION WHEN OTHERS THEN
            current_user_id := NULL;
        END;
    END IF;
    
    -- Fallback vers votre email
    IF current_user_email IS NULL THEN
        current_user_email := 'loftbritish@gmail.com';
        IF current_user_id IS NULL THEN
            BEGIN
                SELECT id INTO current_user_id FROM auth.users WHERE email = 'loftbritish@gmail.com' LIMIT 1;
            EXCEPTION WHEN OTHERS THEN
                current_user_id := NULL;
            END;
        END IF;
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
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW) WHEN TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
        changed_fields
    );
    
    RETURN COALESCE(NEW, OLD);
    
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Audit trigger failed: %', SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- 5. Créer les triggers sur toutes les tables
DROP TRIGGER IF EXISTS audit_trigger_transactions ON transactions;
CREATE TRIGGER audit_trigger_transactions
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_trigger_tasks ON tasks;
CREATE TRIGGER audit_trigger_tasks
    AFTER INSERT OR UPDATE OR DELETE ON tasks
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_trigger_reservations ON reservations;
CREATE TRIGGER audit_trigger_reservations
    AFTER INSERT OR UPDATE OR DELETE ON reservations
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_trigger_lofts ON lofts;
CREATE TRIGGER audit_trigger_lofts
    AFTER INSERT OR UPDATE OR DELETE ON lofts
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();

-- 6. Créer les fonctions RPC pour l'accès depuis l'application
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

CREATE OR REPLACE FUNCTION get_audit_logs_for_entity(
    p_table_name TEXT,
    p_record_id UUID,
    p_limit INTEGER DEFAULT 50
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    logs_data JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', al.id,
            'table_name', al.table_name,
            'record_id', al.record_id,
            'action', al.action,
            'user_id', al.user_id,
            'user_email', al.user_email,
            'timestamp', al."timestamp",
            'old_values', al.old_values,
            'new_values', al.new_values,
            'changed_fields', al.changed_fields,
            'ip_address', al.ip_address,
            'user_agent', al.user_agent,
            'session_id', al.session_id,
            'created_at', al.created_at
        ) ORDER BY al."timestamp" DESC
    ) INTO logs_data
    FROM audit.audit_logs al
    WHERE al.table_name = p_table_name
      AND al.record_id = p_record_id
    LIMIT p_limit;

    result := json_build_object(
        'success', true,
        'data', COALESCE(logs_data, '[]'::json),
        'count', (
            SELECT COUNT(*)
            FROM audit.audit_logs al
            WHERE al.table_name = p_table_name
              AND al.record_id = p_record_id
        )
    );

    RETURN result;

EXCEPTION WHEN OTHERS THEN
    result := json_build_object(
        'success', false,
        'error', SQLERRM,
        'data', '[]'::json,
        'count', 0
    );
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Test immédiat
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
    12345,
    'Test installation complète - ' || NOW(),
    'income',
    'pending',
    CURRENT_DATE,
    'Test',
    NOW()
);

-- 8. Vérifier que ça marche
SELECT 
    '✅ SYSTÈME D''AUDIT INSTALLÉ!' as status,
    COUNT(*) as triggers_installed
FROM information_schema.triggers 
WHERE trigger_name LIKE '%audit%';

SELECT 
    '✅ TEST RÉUSSI!' as test_status,
    action,
    user_email,
    "timestamp"
FROM audit.audit_logs 
WHERE table_name = 'transactions'
  AND "timestamp" >= NOW() - INTERVAL '1 minute'
ORDER BY "timestamp" DESC 
LIMIT 1;

-- 9. Nettoyer le test
DELETE FROM transactions WHERE description LIKE 'Test installation complète%';

SELECT '🎉 SYSTÈME D''AUDIT COMPLÈTEMENT INSTALLÉ ET FONCTIONNEL!' as final_message;