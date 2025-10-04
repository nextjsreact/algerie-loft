-- Trigger d'audit avec debug pour voir exactement ce qui se passe
-- Exécutez ce script dans Supabase Dashboard > SQL Editor

CREATE OR REPLACE FUNCTION audit.audit_trigger_function_debug()
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
    debug_info TEXT := '';
BEGIN
    -- Récupérer l'utilisateur (version simplifiée qui fonctionne)
    BEGIN
        current_user_id := current_setting('audit.current_user_id', true)::UUID;
        current_user_email := current_setting('audit.current_user_email', true);
    EXCEPTION WHEN OTHERS THEN
        current_user_id := NULL;
        current_user_email := NULL;
    END;
    
    -- Fallback vers votre email
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
    
    -- Pour UPDATE, examiner TOUS les champs avec debug
    IF TG_OP = 'UPDATE' THEN
        debug_info := 'Checking fields: ';
        
        FOR field_name IN 
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = TG_TABLE_SCHEMA 
            AND table_name = TG_TABLE_NAME
            AND column_name NOT IN ('updated_at', 'created_at')
            ORDER BY column_name
        LOOP
            -- Comparer les valeurs
            EXECUTE format('SELECT ($1).%I::TEXT, ($2).%I::TEXT', field_name, field_name) 
            INTO old_val, new_val 
            USING OLD, NEW;
            
            -- Ajouter au debug
            debug_info := debug_info || field_name || '(' || 
                         COALESCE(old_val, 'NULL') || '->' || 
                         COALESCE(new_val, 'NULL') || ') ';
            
            -- Vérifier si différent
            IF old_val IS DISTINCT FROM new_val THEN
                changed_fields := array_append(changed_fields, field_name);
                debug_info := debug_info || '[CHANGED] ';
            ELSE
                debug_info := debug_info || '[SAME] ';
            END IF;
        END LOOP;
        
        -- Logger le debug
        RAISE NOTICE 'AUDIT DEBUG: %', debug_info;
        RAISE NOTICE 'CHANGED FIELDS: %', array_to_string(changed_fields, ', ');
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
    RAISE WARNING 'Audit trigger failed: %', SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Remplacer le trigger par la version debug
DROP TRIGGER IF EXISTS audit_trigger_transactions ON transactions;
CREATE TRIGGER audit_trigger_transactions
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function_debug();

-- Test immédiat avec changements multiples
UPDATE transactions 
SET 
    amount = 99999,
    status = 'pending',
    description = description || ' - Test debug ' || NOW()
WHERE id = '229afc15-84a5-4b93-b65a-fd133c063653';

-- Vérifier les logs PostgreSQL pour voir les messages NOTICE
-- Puis vérifier le résultat dans audit_logs
SELECT 
    action,
    user_email,
    "timestamp",
    array_to_string(changed_fields, ', ') as changed_fields_list
FROM audit.audit_logs 
WHERE table_name = 'transactions'
  AND record_id = '229afc15-84a5-4b93-b65a-fd133c063653'
ORDER BY "timestamp" DESC 
LIMIT 1;

SELECT 'Trigger debug installé! Vérifiez les logs PostgreSQL pour les messages NOTICE.' as message;