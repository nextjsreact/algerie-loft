-- DIAGNOSTIC SPÉCIFIQUE POUR nextjsreact@gmail.com
-- Ce script va identifier le problème exact avec ton compte

-- Étape 1: Vérifier ton profil dans la table profiles
SELECT 'Ton profil dans profiles:' as info;
SELECT id, email, full_name, role, created_at, updated_at
FROM profiles
WHERE email = 'nextjsreact@gmail.com';

-- Étape 2: Vérifier ton compte dans auth.users
SELECT 'Ton compte dans auth.users:' as info;
SELECT id, email, created_at, email_confirmed_at, last_sign_in_at, raw_user_meta_data
FROM auth.users
WHERE email = 'nextjsreact@gmail.com';

-- Étape 3: Vérifier s'il y a des doublons ou variations d'email
SELECT 'Comptes similaires:' as info;
SELECT id, email, full_name, role, created_at
FROM profiles
WHERE email LIKE '%nextjsreact%' OR email LIKE '%gmail%'
ORDER BY created_at DESC;

-- Étape 4: Corriger le rôle si nécessaire (décommente si besoin)
/*
UPDATE profiles 
SET 
    role = 'executive',
    updated_at = NOW()
WHERE email = 'nextjsreact@gmail.com';
*/

-- Étape 5: Vérification après correction
SELECT 'Après correction (si appliquée):' as info;
SELECT id, email, full_name, role, created_at, updated_at
FROM profiles
WHERE email = 'nextjsreact@gmail.com';

-- Étape 6: Vérifier tous les rôles executive
SELECT 'Tous les comptes executive:' as info;
SELECT id, email, full_name, role, created_at
FROM profiles
WHERE role = 'executive'
ORDER BY created_at DESC;

SELECT 'Diagnostic terminé pour nextjsreact@gmail.com!' as status;