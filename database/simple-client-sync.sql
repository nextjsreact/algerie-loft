-- =====================================================
-- SIMPLE CLIENT SYNC - Version testée pour Supabase
-- =====================================================

-- 1. Fonction de synchronisation des clients
CREATE OR REPLACE FUNCTION sync_client_to_customers()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
    full_name TEXT;
    first_name TEXT;
    last_name TEXT;
BEGIN
    -- Récupérer le rôle utilisateur
    user_role := NEW.raw_user_meta_data->>'role';
    
    -- Traiter seulement les clients
    IF user_role = 'client' THEN
        -- Extraire le nom complet
        full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
        
        -- Séparer prénom et nom
        first_name := split_part(full_name, ' ', 1);
        last_name := CASE 
            WHEN position(' ' in full_name) > 0 THEN 
                substring(full_name from position(' ' in full_name) + 1)
            ELSE 
                first_name
        END;
        
        -- Insérer dans la table customers
        INSERT INTO public.customers (
            id,
            first_name,
            last_name,
            email,
            status,
            email_verified,
            preferences,
            created_by,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            first_name,
            last_name,
            NEW.email,
            'prospect',
            CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
            '{"language": "fr", "currency": "DZD", "notifications": {"email": true, "sms": false, "marketing": false}}'::jsonb,
            NEW.id,
            NEW.created_at,
            NEW.updated_at
        )
        ON CONFLICT (id) DO UPDATE SET
            email_verified = CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
            updated_at = NEW.updated_at;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Créer le trigger
DROP TRIGGER IF EXISTS sync_client_customers_trigger ON auth.users;

CREATE TRIGGER sync_client_customers_trigger
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_client_to_customers();

-- 3. Fonction pour synchroniser les utilisateurs existants
CREATE OR REPLACE FUNCTION sync_existing_clients()
RETURNS TEXT AS $$
DECLARE
    client_user RECORD;
    sync_count INTEGER := 0;
    full_name TEXT;
    first_name TEXT;
    last_name TEXT;
BEGIN
    -- Parcourir tous les clients existants
    FOR client_user IN 
        SELECT * FROM auth.users 
        WHERE raw_user_meta_data->>'role' = 'client'
    LOOP
        -- Vérifier si le client existe déjà dans customers
        IF NOT EXISTS (SELECT 1 FROM public.customers WHERE id = client_user.id) THEN
            -- Extraire le nom
            full_name := COALESCE(client_user.raw_user_meta_data->>'full_name', split_part(client_user.email, '@', 1));
            first_name := split_part(full_name, ' ', 1);
            last_name := CASE 
                WHEN position(' ' in full_name) > 0 THEN 
                    substring(full_name from position(' ' in full_name) + 1)
                ELSE 
                    first_name
            END;
            
            -- Insérer le client
            INSERT INTO public.customers (
                id,
                first_name,
                last_name,
                email,
                status,
                email_verified,
                preferences,
                created_by,
                created_at,
                updated_at
            ) VALUES (
                client_user.id,
                first_name,
                last_name,
                client_user.email,
                'active',
                CASE WHEN client_user.email_confirmed_at IS NOT NULL THEN true ELSE false END,
                '{"language": "fr", "currency": "DZD", "notifications": {"email": true, "sms": false, "marketing": false}}'::jsonb,
                client_user.id,
                client_user.created_at,
                COALESCE(client_user.updated_at, client_user.created_at)
            );
            
            sync_count := sync_count + 1;
        END IF;
    END LOOP;
    
    RETURN format('✅ Synchronisé %s clients existants', sync_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Accorder les permissions
GRANT EXECUTE ON FUNCTION sync_client_to_customers() TO service_role;
GRANT EXECUTE ON FUNCTION sync_existing_clients() TO service_role;

-- 5. Message de confirmation
SELECT 'Trigger de synchronisation client créé avec succès! 🎉' as status;

-- 6. Pour synchroniser les clients existants, exécutez :
-- SELECT sync_existing_clients();