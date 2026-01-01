-- CORRECTION DU PROBLÈME EXECUTIVE DROPDOWN
-- ==========================================
-- 
-- Problème : L'utilisateur executive est lié à un owner via user_id
-- Solution : Supprimer ce lien pour que l'executive soit traité comme employé

-- 1. D'abord, voir quel owner est lié à ton utilisateur executive
SELECT 
    o.id,
    o.name,
    o.user_id,
    u.email
FROM owners o
LEFT JOIN auth.users u ON o.user_id = u.id
WHERE u.raw_user_meta_data->>'role' = 'executive'
   OR u.raw_user_meta_data->>'profile_role' = 'executive';

-- 2. Supprimer le lien (remplace USER_ID par ton ID utilisateur)
-- UPDATE owners 
-- SET user_id = NULL 
-- WHERE user_id = 'TON_USER_ID_EXECUTIVE';

-- 3. Vérifier que c'est corrigé
SELECT COUNT(*) as total_owners FROM owners;

-- 4. Vérifier qu'aucun executive n'est lié
SELECT 
    COUNT(*) as executives_linked_to_owners
FROM owners o
LEFT JOIN auth.users u ON o.user_id = u.id
WHERE u.raw_user_meta_data->>'role' = 'executive'
   OR u.raw_user_meta_data->>'profile_role' = 'executive';