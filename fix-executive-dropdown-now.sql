-- SOLUTION RAPIDE : Corriger le dropdown executive
-- =================================================
-- 
-- PROBLÈME : Ton utilisateur executive est lié à un owner
-- SOLUTION : Supprimer ce lien pour voir tous les owners
-- CORRECTION : Utiliser la table PROFILES (pas auth.users)

-- 1. Voir le problème actuel
SELECT 
    'PROBLÈME DÉTECTÉ:' as info,
    o.id as owner_id,
    o.name as owner_name,
    o.user_id,
    u.email as user_email,
    p.role as user_role
FROM owners o
JOIN auth.users u ON o.user_id = u.id
JOIN profiles p ON o.user_id = p.id
WHERE p.role = 'executive';

-- 2. CORRECTION : Supprimer le lien user_id pour les executives
UPDATE owners 
SET user_id = NULL 
WHERE user_id IN (
    SELECT p.id 
    FROM profiles p 
    WHERE p.role = 'executive'
);

-- 3. Vérifier que c'est corrigé
SELECT 
    'APRÈS CORRECTION:' as info,
    COUNT(*) as total_owners,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as owners_with_user_link,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as owners_without_user_link
FROM owners;

-- 4. Vérifier qu'aucun executive n'est plus lié
SELECT 
    'EXECUTIVES ENCORE LIÉS:' as info,
    COUNT(*) as count
FROM owners o
JOIN profiles p ON o.user_id = p.id
WHERE p.role = 'executive';

-- 5. Voir tous les rôles dans profiles pour vérification
SELECT 
    'RÔLES DANS PROFILES:' as info,
    role,
    COUNT(*) as count
FROM profiles 
GROUP BY role
ORDER BY role;

-- Si le résultat de la requête 4 est 0, c'est corrigé !
-- Maintenant ton dropdown devrait montrer tous les 26 owners