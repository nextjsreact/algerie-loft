-- DIAGNOSTIC COMPLET : Pourquoi l'executive ne voit qu'un owner
-- ============================================================

-- 1. Vérifier ton profil dans la table profiles
SELECT 
    'TON PROFIL:' as info,
    id,
    role,
    full_name,
    created_at,
    updated_at
FROM profiles 
WHERE role = 'executive'
ORDER BY created_at DESC;

-- 2. Vérifier s'il y a des liens user_id dans owners
SELECT 
    'OWNERS LIÉS À DES USERS:' as info,
    o.id as owner_id,
    o.name as owner_name,
    o.user_id,
    p.role as user_role,
    p.full_name as user_name
FROM owners o
JOIN profiles p ON o.user_id = p.id
WHERE o.user_id IS NOT NULL
ORDER BY p.role;

-- 3. Compter tous les owners
SELECT 
    'TOTAL OWNERS:' as info,
    COUNT(*) as total_owners,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as owners_with_user_link,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as owners_without_user_link
FROM owners;

-- 4. Vérifier les cookies/contexte de connexion (ne peut pas être fait en SQL)
-- Ceci doit être vérifié côté application

-- 5. Voir tous les rôles existants
SELECT 
    'RÔLES EXISTANTS:' as info,
    role,
    COUNT(*) as count
FROM profiles 
GROUP BY role
ORDER BY role;

-- 6. Vérifier si ton executive a un owner lié
SELECT 
    'EXECUTIVE AVEC OWNER LIÉ:' as info,
    p.id as user_id,
    p.full_name,
    p.role,
    o.id as owner_id,
    o.name as owner_name
FROM profiles p
LEFT JOIN owners o ON p.id = o.user_id
WHERE p.role = 'executive';

-- INTERPRÉTATION DES RÉSULTATS :
-- - Si la requête 6 montre un owner_id, c'est le problème !
-- - Si la requête 6 ne montre pas d'owner_id, le problème est ailleurs
-- - Si la requête 1 ne montre pas ton profil executive, le rôle n'est pas correct