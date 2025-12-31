-- Vérifier le rôle actuel de l'utilisateur habib_fr2001@yahoo.fr
SELECT 
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
FROM auth.users 
WHERE email = 'habib_fr2001@yahoo.fr';

-- Vérifier aussi dans la table profiles
SELECT 
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
FROM profiles 
WHERE email = 'habib_fr2001@yahoo.fr';

-- Si l'utilisateur existe mais a le mauvais rôle, le corriger
-- DÉCOMMENTEZ LA LIGNE CI-DESSOUS SEULEMENT SI NÉCESSAIRE :
-- UPDATE auth.users SET role = 'manager' WHERE email = 'habib_fr2001@yahoo.fr';
-- UPDATE profiles SET role = 'manager' WHERE email = 'habib_fr2001@yahoo.fr';

-- Créer un utilisateur de test avec le rôle manager si nécessaire
-- DÉCOMMENTEZ LES LIGNES CI-DESSOUS SI VOUS VOULEZ CRÉER UN NOUVEL UTILISATEUR :
/*
INSERT INTO auth.users (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'manager.test@example.com',
    'Manager Test',
    'manager',
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    role = 'manager',
    full_name = 'Manager Test',
    updated_at = NOW();

INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'manager.test@example.com',
    'Manager Test',
    'manager',
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    role = 'manager',
    full_name = 'Manager Test',
    updated_at = NOW();
*/

-- Vérifier tous les utilisateurs et leurs rôles
SELECT 
    email,
    full_name,
    role,
    'auth.users' as source
FROM auth.users 
WHERE email IN ('habib_fr2001@yahoo.fr', 'manager.test@example.com')
UNION ALL
SELECT 
    email,
    full_name,
    role,
    'profiles' as source
FROM profiles 
WHERE email IN ('habib_fr2001@yahoo.fr', 'manager.test@example.com')
ORDER BY email, source;