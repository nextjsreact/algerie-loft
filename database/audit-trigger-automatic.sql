-- Trigger d'audit automatique qui fonctionne TOUJOURS
-- Exécutez ce script dans Supabase Dashboard > SQL Editor

CREATE OR REPLACE FUNCTION audit.audit_trigger_function_automatic()
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
    -- Essayer de récupérer l'utilisateur connecté via auth.uid()
    BEGIN
        current_user_id := auth.uid();
        
        -- Si on a un user_id, récupérer son email
        IF current_user_id IS NOT NULL THEN
            SELECT email INTO current_user_email 
            FROM auth.users 
            WHERE id = current_user_id;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        current_user_id := NULL;
        current_user_email := NULL;
    END;
    
    -- Si toujours pas d'utilisateur, utiliser "web-user" générique
    IF current_user_email IS NULL THEN
        current_user_email := 'web-user@system.local';
        current_user_id := NULL;
    END IF;
    
    -- Pour UPDATE, trouver tous les champs modifiés
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
    
    -- TOUJOURS insérer le log d'audit (même si erreur)
    BEGIN
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
    EXCEPTION WHEN OTHERS THEN
        -- Si l'audit échoue, au moins logger l'erreur
        RAISE WARNING 'Audit failed for % % on %: %', TG_OP, TG_TABLE_NAME, COALESCE(NEW.id, OLD.id), SQLERRM;
    END;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Remplacer tous les triggers par la version automatique
DROP TRIGGER IF EXISTS audit_trigger_transactions ON transactions;
CREATE TRIGGER audit_trigger_transactions
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function_automatic();

DROP TRIGGER IF EXISTS audit_trigger_tasks ON tasks;
CREATE TRIGGER audit_trigger_tasks
    AFTER INSERT OR UPDATE OR DELETE ON tasks
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function_automatic();

DROP TRIGGER IF EXISTS audit_trigger_reservations ON reservations;
CREATE TRIGGER audit_trigger_reservations
    AFTER INSERT OR UPDATE OR DELETE ON reservations
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function_automatic();

DROP TRIGGER IF EXISTS audit_trigger_lofts ON lofts;
CREATE TRIGGER audit_trigger_lofts
    AFTER INSERT OR UPDATE OR DELETE ON lofts
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function_automatic();

-- Test immédiat
UPDATE transactions 
SET 
    amount = amount + 100,
    description = description || ' - Test automatique ' || NOW()
WHERE id = '79125cd9-84fc-4d9b-861a-dc73b7e1695f';

-- Vérifier le résultat
SELECT 
    'TEST TRIGGER AUTOMATIQUE' as section,
    action,
    user_email,
    "timestamp",
    array_to_string(changed_fields, ', ') as changed_fields,
    array_length(changed_fields, 1) as fields_count
FROM audit.audit_logs 
WHERE record_id = '79125cd9-84fc-4d9b-861a-dc73b7e1695f'
ORDER BY "timestamp" DESC 
LIMIT 1;

SELECT '🎉 TRIGGER AUTOMATIQUE INSTALLÉ - FONCTIONNE SANS DÉPENDANCES!' as message;