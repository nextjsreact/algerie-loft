-- Script pour accorder le rôle superuser à un utilisateur
-- Remplacez 'votre@email.com' par votre adresse email

-- Méthode 1: Utiliser la fonction create_initial_superuser (si elle existe)
-- SELECT create_initial_superuser('votre@email.com', 'system');

-- Méthode 2: Insertion directe dans superuser_profiles
DO $$
DECLARE
    target_user_id UUID;
    user_email VARCHAR(255) := 'votre@email.com'; -- CHANGEZ CETTE VALEUR
BEGIN
    -- Trouver l'ID de l'utilisateur par email
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = user_email;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur avec email % non trouvé', user_email;
    END IF;
    
    -- Vérifier si l'utilisateur est déjà superuser
    IF EXISTS (SELECT 1 FROM superuser_profiles WHERE user_id = target_user_id) THEN
        RAISE NOTICE 'Utilisateur % est déjà superuser', user_email;
    ELSE
        -- Créer le profil superuser
        INSERT INTO superuser_profiles (
            user_id,
            granted_by,
            permissions,
            is_active,
            session_timeout_minutes,
            require_2fa
        ) VALUES (
            target_user_id,
            target_user_id, -- Auto-accordé
            '["all"]'::jsonb, -- Toutes les permissions
            TRUE,
            30, -- Timeout de session de 30 minutes
            FALSE -- 2FA optionnel (changez à TRUE si vous voulez l'activer)
        );
        
        RAISE NOTICE 'Rôle superuser accordé à %', user_email;
    END IF;
END $$;

-- Méthode 3: Si la table superuser_profiles n'existe pas, créer un utilisateur admin simple
-- UPDATE auth.users 
-- SET raw_user_meta_data = jsonb_set(
--     COALESCE(raw_user_meta_data, '{}'::jsonb),
--     '{role}',
--     '"superuser"'
-- )
-- WHERE email = 'votre@email.com';

-- Vérifier le résultat
SELECT 
    u.email,
    u.raw_user_meta_data->>'role' as role,
    sp.is_active as superuser_active,
    sp.permissions as superuser_permissions
FROM auth.users u
LEFT JOIN superuser_profiles sp ON sp.user_id = u.id
WHERE u.email = 'votre@email.com'; -- CHANGEZ CETTE VALEUR
