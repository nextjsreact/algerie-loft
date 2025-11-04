-- Vérification des résultats du script de correction
-- Pour s'assurer que la correction a bien été appliquée

SELECT 'VERIFICATION - Profile actuel:' as check_type, 
       id, email, role, updated_at
FROM profiles 
WHERE email = 'nextjsreact@gmail.com';

SELECT 'VERIFICATION - Auth metadata actuel:' as check_type, 
       id, email, 
       raw_user_meta_data->>'role' as metadata_role,
       raw_user_meta_data->>'active_role' as active_role,
       raw_user_meta_data
FROM auth.users 
WHERE email = 'nextjsreact@gmail.com';

-- Vérifier s'il y a d'autres comptes avec le même email
SELECT 'VERIFICATION - Comptes similaires:' as check_type,
       id, email, role, created_at
FROM profiles 
WHERE email LIKE '%nextjsreact%' OR email LIKE '%gmail%'
ORDER BY created_at DESC;