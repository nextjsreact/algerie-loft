-- SCRIPT DE RÉINITIALISATION DES MOTS DE PASSE EMPLOYÉS
-- ATTENTION: À utiliser avec précaution, nécessite des privilèges administrateur

-- Étape 1: Lister tous les employés actuels
SELECT 'Employés actuels:' as info;
SELECT 
    au.id,
    au.email,
    p.full_name,
    p.role,
    au.created_at,
    au.last_sign_in_at,
    au.email_confirmed_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.role IN ('admin', 'manager', 'executive', 'member')
ORDER BY p.role, au.created_at;

-- Étape 2: Réinitialiser le mot de passe d'un employé spécifique
-- REMPLACE 'employee@example.com' par l'email réel
-- REMPLACE 'NouveauMotDePasse123!' par le nouveau mot de passe

/*
UPDATE auth.users 
SET 
    encrypted_password = crypt('NouveauMotDePasse123!', gen_salt('bf')),
    updated_at = NOW()
WHERE email = 'employee@example.com';
*/

-- Étape 3: Forcer la confirmation d'email si nécessaire
/*
UPDATE auth.users 
SET 
    email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email = 'employee@example.com';
*/

-- Étape 4: Script pour réinitialiser plusieurs employés à la fois
-- DÉCOMMENTE ET MODIFIE SELON TES BESOINS

/*
-- Réinitialiser tous les employés avec un mot de passe temporaire
UPDATE auth.users 
SET 
    encrypted_password = crypt('TempPassword2024!', gen_salt('bf')),
    updated_at = NOW()
WHERE id IN (
    SELECT au.id 
    FROM auth.users au
    JOIN profiles p ON au.id = p.id
    WHERE p.role IN ('member', 'manager') -- Exclut admin et executive
);
*/

-- Étape 5: Vérification après modification
SELECT 'Vérification après modification:' as info;
SELECT 
    au.email,
    au.updated_at,
    au.email_confirmed_at,
    p.role
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.role IN ('admin', 'manager', 'executive', 'member')
ORDER BY au.updated_at DESC;

-- Étape 6: Script pour créer des mots de passe temporaires uniques
-- Génère un mot de passe différent pour chaque employé

/*
DO $$
DECLARE
    user_record RECORD;
    temp_password TEXT;
BEGIN
    FOR user_record IN 
        SELECT au.id, au.email, p.full_name
        FROM auth.users au
        JOIN profiles p ON au.id = p.id
        WHERE p.role = 'member' -- Ou autre rôle
    LOOP
        -- Génère un mot de passe temporaire unique
        temp_password := 'Temp' || EXTRACT(YEAR FROM NOW()) || '!' || 
                        SUBSTRING(user_record.email FROM 1 FOR 3) || 
                        LPAD(EXTRACT(DAY FROM NOW())::TEXT, 2, '0');
        
        -- Met à jour le mot de passe
        UPDATE auth.users 
        SET 
            encrypted_password = crypt(temp_password, gen_salt('bf')),
            updated_at = NOW()
        WHERE id = user_record.id;
        
        -- Log pour traçabilité (optionnel)
        RAISE NOTICE 'Mot de passe mis à jour pour: % - Nouveau mot de passe: %', 
                     user_record.email, temp_password;
    END LOOP;
END $$;
*/

SELECT 'Script de réinitialisation des mots de passe terminé!' as status;
SELECT 'IMPORTANT: Informez les employés de leurs nouveaux mots de passe!' as reminder;