-- Corriger les permissions pour la fonction trigger
-- La fonction doit pouvoir écrire dans audit_logs

-- 1. Donner les permissions à la fonction (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION audit.audit_trigger_function()
RETURNS TRIGGER 
SECURITY DEFINER -- Cette ligne est cruciale pour les permissions
AS $$
DECLARE
    changed_fields TEXT[] := '{}';
    field_name TEXT;
    old_val TEXT;
    new_val TEXT;
    current_user_email VARCHAR(255);
    old_record JSONB;
    new_record JSONB;
BEGIN
    -- Récupérer l'email de l'utilisateur depuis auth.users via le JWT
    SELECT COALESCE(
        auth.jwt() ->> 'email',
        current_setting('request.jwt.claims', true)::json ->> 'email',
        'system@unknown.com'
    ) INTO current_user_email;
    
    -- Convertir les records en JSONB pour comparaison
    IF TG_OP = 'DELETE' THEN
        old_record := to_jsonb(OLD);
        new_record := '{}'::jsonb;
    ELSIF TG_OP = 'INSERT' THEN
        old_record := '{}'::jsonb;
        new_record := to_jsonb(NEW);
    ELSE -- UPDATE
        old_record := to_jsonb(OLD);
        new_record := to_jsonb(NEW);
    END IF;
    
    -- Pour UPDATE, identifier les champs qui ont changé
    IF TG_OP = 'UPDATE' THEN
        FOR field_name IN 
            SELECT key 
            FROM jsonb_each_text(new_record) 
            WHERE key NOT IN ('created_at', 'updated_at', 'id')
        LOOP
            old_val := old_record ->> field_name;
            new_val := new_record ->> field_name;
            
            -- Ajouter le champ s'il a changé (en gérant les NULL)
            IF (old_val IS DISTINCT FROM new_val) THEN
                changed_fields := array_append(changed_fields, field_name);
            END IF;
        END LOOP;
    ELSIF TG_OP = 'INSERT' THEN
        -- Pour INSERT, tous les champs non-null sont "changés"
        SELECT array_agg(key) INTO changed_fields
        FROM jsonb_each_text(new_record) 
        WHERE key NOT IN ('created_at', 'updated_at', 'id')
          AND value IS NOT NULL 
          AND value != '';
    ELSIF TG_OP = 'DELETE' THEN
        -- Pour DELETE, tous les champs sont "changés"
        SELECT array_agg(key) INTO changed_fields
        FROM jsonb_each_text(old_record) 
        WHERE key NOT IN ('created_at', 'updated_at', 'id');
    END IF;
    
    -- Insérer le log d'audit seulement s'il y a des changements
    IF array_length(changed_fields, 1) > 0 THEN
        INSERT INTO audit.audit_logs (
            table_name,
            record_id,
            action,
            old_values,
            new_values,
            changed_fields,
            user_email,
            timestamp
        ) VALUES (
            TG_TABLE_NAME,
            COALESCE((NEW).id, (OLD).id),
            TG_OP,
            old_record,
            new_record,
            changed_fields,
            current_user_email,
            NOW()
        );
    END IF;
    
    -- Retourner la bonne valeur selon l'opération
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. Donner les permissions explicites
GRANT INSERT ON audit.audit_logs TO authenticated;
GRANT INSERT ON audit.audit_logs TO service_role;

-- 3. Test immédiat
UPDATE transactions 
SET amount = amount + 1 
WHERE id = '79125cd9-84fc-4d9b-861a-dc73b7e1695f';

SELECT 'Permissions fixed and tested' as message;