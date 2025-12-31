-- Vérifier le rôle de l'utilisateur habib_fr2001@yahoo.fr
SELECT 
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
FROM auth.users 
WHERE email = 'habib_fr2001@yahoo.fr';

-- Vérifier aussi dans la table profiles si elle existe
SELECT 
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
FROM profiles 
WHERE email = 'habib_fr2001@yahoo.fr';

-- Vérifier la structure des tables pour comprendre où est stocké le rôle
\d auth.users;
\d profiles;