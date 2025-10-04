-- Réinstaller complètement les triggers d'audit
-- Exécutez ce script dans Supabase Dashboard > SQL Editor

-- 1. Supprimer les anciens triggers
DROP TRIGGER IF EXISTS audit_trigger_transactions ON transactions;
DROP TRIGGER IF EXISTS audit_trigger_tasks ON tasks;
DROP TRIGGER IF EXISTS audit_trigger_reservations ON reservations;
DROP TRIGGER IF EXISTS audit_trigger_lofts ON lofts;

-- 2. Créer la fonction trigger complète
CREATE OR REPLACE FUNCTION audit.audit_trigger_function_complete()
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
    -- Récupérer l'utilisateur depuis le contexte de session
    BEGIN
        current_user_id := current_setting('audit.current_user_id', true)::UUID;
        current_user_email := current_setting('audit.current_user_email', true);
    EXCEPTION WHEN OTHERS THEN
        current_user_id := NULL;
        current_user_email := NULL;
    END;
    
    -- Si pas de contexte, essayer auth.uid()
    IF current_user_id IS NULL THEN
        BEGIN
            current_user_id := auth.uid();
        EXCEPTION WHEN OTHERS THEN
            current_user_id := NULL;
        END;
    END IF;
    
    -- Si on a un user_id mais pas d'email, essayer de le récupérer
    IF current_user_email IS NULL AND current_user_id IS NOT NULL THEN
        BEGIN
            SELECT email INTO current_user_email 
            FROM auth.users 
            WHERE id = current_user_id;
        EXCEPTION WHEN OTHERS THEN
            current_user_email := NULL;
        END;
    END IF;
    
    -- Fallback vers votre email si toujours pas d'utilisateur
    IF current_user_email IS NULL THEN
        BEGIN
            SELECT id, email INTO current_user_id, current_user_email
            FROM auth.users 
            WHERE email = 'loftbritish@gmail.com'
            LIMIT 1;
        EXCEPTION WHEN OTHERS THEN
            current_user_email := 'loftbritish@gmail.com';
        END;
    END IF;
    
    -- Pour UPDATE, trouver tous les champs modifiés
    IF TG_OP = 'UPDATE' THEN
        FOR field_name IN 
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = TG_TABLE_SCHEMA 
            AND table_name = TG_TABLE_NAME
            AND column_name NOT IN ('updated_at', 'created_at')
            ORDER BY column_name
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
        NULL,
        NULL,
        NULL
    );
    
    RETURN COALESCE(NEW, OLD);
    
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Audit trigger failed for table %: %', TG_TABLE_NAME, SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- 3. Créer les triggers pour toutes les tables
CREATE TRIGGER audit_trigger_transactions
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function_complete();

CREATE TRIGGER audit_trigger_tasks
    AFTER INSERT OR UPDATE OR DELETE ON tasks
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function_complete();

CREATE TRIGGER audit_trigger_reservations
    AFTER INSERT OR UPDATE OR DELETE ON reservations
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function_complete();

CREATE TRIGGER audit_trigger_lofts
    AFTER INSERT OR UPDATE OR DELETE ON lofts
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function_complete();

-- 4. Test immédiat
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
    99999,
    'Test trigger réinstallé - ' || NOW(),
    'income',
    'pending',
    CURRENT_DATE,
    'Test',
    NOW()
);

-- 5. Vérifier le résultat
SELECT 
    action,
    user_email,
    "timestamp",
    jsonb_extract_path_text(new_values, 'description') as description
FROM audit.audit_logs 
WHERE table_name = 'transactions'
  AND action = 'INSERT'
  AND "timestamp" >= NOW() - INTERVAL '1 minute'
ORDER BY "timestamp" DESC 
LIMIT 1;

-- 6. Nettoyer le test
DELETE FROM transactions WHERE description LIKE 'Test trigger réinstallé%';

SELECT 'Triggers d''audit réinstallés et testés!' as message;