-- DIAGNOSTIC DU RÔLE UTILISATEUR
-- Exécute ce script pour vérifier ton rôle dans la base de données

-- Étape 1: Vérifier tous les profils avec leurs rôles
SELECT 'Tous les profils:' as info;
SELECT id, email, full_name, role, created_at, updated_at
FROM profiles
ORDER BY created_at DESC;

-- Étape 2: Vérifier les utilisateurs auth avec leurs métadonnées
SELECT 'Utilisateurs auth:' as info;
SELECT id, email, created_at, raw_user_meta_data, email_confirmed_at
FROM auth.users
ORDER BY created_at DESC;

-- Étape 3: Rechercher ton email spécifique (remplace par ton email)
-- REMPLACE 'ton-email@example.com' par ton vrai email
SELECT 'Ton profil spécifique:' as info;
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.created_at as profile_created,
    au.email as auth_email,
    au.raw_user_meta_data,
    au.created_at as auth_created
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.email LIKE '%habib%' OR p.email LIKE '%executive%' OR au.email LIKE '%habib%'
ORDER BY p.created_at DESC;

-- Étape 4: Vérifier s'il y a des doublons d'email
SELECT 'Doublons potentiels:' as info;
SELECT email, COUNT(*) as count
FROM profiles
GROUP BY email
HAVING COUNT(*) > 1;

-- Étape 5: Vérifier les rôles disponibles
SELECT 'Répartition des rôles:' as info;
SELECT role, COUNT(*) as count
FROM profiles
GROUP BY role
ORDER BY count DESC;

SELECT 'Diagnostic terminé!' as status;