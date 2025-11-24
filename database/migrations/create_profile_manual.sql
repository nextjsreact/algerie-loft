-- Script pour créer un profil admin manuellement
-- Utilisez ce script si auth.uid() retourne NULL

-- ========================================
-- ÉTAPE 1 : Trouver votre ID utilisateur
-- ========================================

-- Exécutez cette requête pour voir tous les utilisateurs
SELECT 
  id as "User ID (copiez celui-ci)",
  email as "Email",
  created_at as "Créé le"
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- Copiez l'ID de VOTRE compte (la colonne "User ID")

-- ========================================
-- ÉTAPE 2 : Créer le profil
-- ========================================

-- Décommentez les lignes ci-dessous et remplacez VOTRE_ID_ICI
-- par l'ID que vous avez copié à l'étape 1

/*
INSERT INTO profiles (id, email, role, created_at, updated_at)
VALUES (
  'VOTRE_ID_ICI',  -- ← Remplacez par votre ID
  (SELECT email FROM auth.users WHERE id = 'VOTRE_ID_ICI'),  -- ← Même ID ici
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'admin',
  updated_at = NOW();
*/

-- ========================================
-- ÉTAPE 3 : Vérifier
-- ========================================

-- Décommentez et remplacez VOTRE_ID_ICI pour vérifier

/*
SELECT 
  id,
  email,
  role,
  '✅ Profil créé avec succès !' as status
FROM profiles
WHERE id = 'VOTRE_ID_ICI';  -- ← Même ID ici
*/

-- ========================================
-- EXEMPLE COMPLET
-- ========================================

-- Si votre ID est : 12345678-1234-1234-1234-123456789abc
-- Voici comment faire :

/*
-- 1. Créer le profil
INSERT INTO profiles (id, email, role, created_at, updated_at)
VALUES (
  '12345678-1234-1234-1234-123456789abc',
  (SELECT email FROM auth.users WHERE id = '12345678-1234-1234-1234-123456789abc'),
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'admin',
  updated_at = NOW();

-- 2. Vérifier
SELECT * FROM profiles WHERE id = '12345678-1234-1234-1234-123456789abc';
*/
