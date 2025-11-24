-- Script pour créer des profils pour TOUS les utilisateurs qui n'en ont pas
-- Utile si plusieurs utilisateurs n'ont pas de profil

-- ========================================
-- Créer les profils manquants
-- ========================================

-- Cette requête crée un profil pour chaque utilisateur qui n'en a pas
INSERT INTO profiles (id, email, role, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  'client' as role,  -- Rôle par défaut : client
  NOW(),
  NOW()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = u.id
);

-- ========================================
-- Vérifier les profils créés
-- ========================================

SELECT 
  COUNT(*) as "Nombre de profils créés"
FROM profiles;

-- ========================================
-- Promouvoir un utilisateur en admin
-- ========================================

-- Trouvez votre email et promouvez-vous en admin
-- Remplacez VOTRE_EMAIL@example.com par votre vrai email

/*
UPDATE profiles 
SET role = 'admin',
    updated_at = NOW()
WHERE email = 'VOTRE_EMAIL@example.com';
*/

-- ========================================
-- Vérifier votre rôle
-- ========================================

-- Remplacez VOTRE_EMAIL@example.com

/*
SELECT 
  email,
  role,
  CASE 
    WHEN role = 'admin' THEN '✅ Vous êtes admin'
    ELSE '❌ Changez votre rôle'
  END as status
FROM profiles
WHERE email = 'VOTRE_EMAIL@example.com';
*/

-- ========================================
-- ALTERNATIVE : Promouvoir par ID
-- ========================================

-- Si vous connaissez votre ID utilisateur

/*
UPDATE profiles 
SET role = 'admin',
    updated_at = NOW()
WHERE id = 'VOTRE_ID_ICI';
*/
