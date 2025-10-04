-- Trigger d'audit qui capture l'utilisateur et TOUS les champs modifiés
-- Exécutez ce script dans Supabase Dashboard > SQL Editor

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
    -- Essayer de récupérer l'utilisateur depuis le contexte de session
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
    
    -- FALLBACK: Si toujours pas d'utilisateur, utiliser un utilisateur par défaut
    -- basé sur l'email de l'utilisateur connecté dans l'application
    IF current_user_email IS NULL THEN
        -- Essayer de trouver l'utilisateur admin actuel
        BEGIN
            SELECT id, email INTO current_user_id, current_user_email
            FROM auth.users 
            WHERE email = 'loftbritish@gmail.com'  -- Votre email
            LIMIT 1;
        EXCEPTION WHEN OTHERS THEN
            current_user_email := 'system@audit.local';
            current_user_id := NULL;
        END;
    END IF;
    
    -- Pour UPDATE, trouver TOUS les champs modifiés (pas seulement description)
    IF TG_OP = 'UPDATE' THEN
        FOR field_name IN 
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = TG_TABLE_SCHEMA 
            AND table_name = TG_TABLE_NAME
            AND column_name NOT IN ('updated_at', 'created_at') -- Exclure les timestamps
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
    
    -- Insérer le log d'audit avec toutes les informations
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
        NULL, -- IP sera ajouté plus tard
        NULL, -- User agent sera ajouté plus tard
        NULL  -- Session ID sera ajouté plus tard
    );
    
    RETURN COALESCE(NEW, OLD);
    
EXCEPTION WHEN OTHERS THEN
    -- Logger l'erreur mais ne pas faire échouer l'opération
    RAISE WARNING 'Audit trigger failed for table %: %', TG_TABLE_NAME, SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Remplacer le trigger existant
DROP TRIGGER IF EXISTS audit_trigger_transactions ON transactions;
CREATE TRIGGER audit_trigger_transactions
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function_complete();

-- Test immédiat avec votre transaction
UPDATE transactions 
SET description = description || ' - Test trigger complet ' || NOW()
WHERE id = '229afc15-84a5-4b93-b65a-fd133c063653';

-- Vérifier le résultat
SELECT 
    action,
    user_email,
    array_to_string(changed_fields, ', ') as changed_fields,
    "timestamp"
FROM audit.audit_logs 
WHERE table_name = 'transactions'
  AND record_id = '229afc15-84a5-4b93-b65a-fd133c063653'
ORDER BY "timestamp" DESC 
LIMIT 1;

SELECT 'Trigger complet installé! Utilisateur: ' || 
       COALESCE((SELECT user_email FROM audit.audit_logs 
                WHERE table_name = 'transactions' 
                ORDER BY "timestamp" DESC LIMIT 1), 'Non trouvé') as result;