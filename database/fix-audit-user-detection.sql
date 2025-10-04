-- Correction du trigger pour détecter le VRAI utilisateur connecté
-- Exécutez ce script dans Supabase Dashboard > SQL Editor

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
    -- 1. PRIORITÉ: Récupérer l'utilisateur depuis le contexte de session (défini par l'application)
    BEGIN
        current_user_id := current_setting('audit.current_user_id', true)::UUID;
        current_user_email := current_setting('audit.current_user_email', true);
        
        -- Si on a trouvé un contexte valide, l'utiliser
        IF current_user_id IS NOT NULL AND current_user_email IS NOT NULL THEN
            -- Contexte trouvé, on l'utilise
            NULL; -- Ne rien faire, on a déjà les bonnes valeurs
        ELSE
            -- Contexte incomplet, on le vide
            current_user_id := NULL;
            current_user_email := NULL;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        current_user_id := NULL;
        current_user_email := NULL;
    END;
    
    -- 2. FALLBACK: Essayer auth.uid() (utilisateur Supabase connecté)
    IF current_user_id IS NULL THEN
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
    END IF;
    
    -- 3. DERNIER RECOURS: Si toujours rien, utiliser "system" (PAS un email spécifique)
    IF current_user_email IS NULL THEN
        current_user_email := 'system@audit.local';
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

-- Test immédiat pour vérifier
UPDATE transactions 
SET description = description || ' - Test utilisateur correct ' || NOW()
WHERE id = '79125cd9-84fc-4d9b-861a-dc73b7e1695f';

-- Vérifier le résultat
SELECT 
    'VÉRIFICATION UTILISATEUR' as section,
    user_email,
    user_id,
    action,
    "timestamp"
FROM audit.audit_logs 
WHERE record_id = '79125cd9-84fc-4d9b-861a-dc73b7e1695f'
ORDER BY "timestamp" DESC 
LIMIT 1;

SELECT 'Trigger corrigé - maintenant il détecte le VRAI utilisateur connecté!' as message;