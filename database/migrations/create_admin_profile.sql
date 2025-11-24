-- Script pour créer votre profil admin
-- Exécutez ce script si vous avez l'erreur "Profil manquant"

-- ========================================
-- 1. Vérifier si le profil existe déjà
-- ========================================
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
    THEN '⚠️ Profil existe déjà - Utilisez UPDATE à la place'
    ELSE '✅ Pas de profil - Prêt pour INSERT'
  END as "Statut actuel";

-- ========================================
-- 2. Créer le profil (si il n'existe pas)
-- ========================================
-- Décommentez et exécutez si le profil n'existe pas :

/*
INSERT INTO profiles (id, email, role, created_at, updated_at)
VALUES (
  auth.uid(),
  (SELECT email FROM auth.users WHERE id = auth.uid()),
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;
*/

-- ========================================
-- 3. OU mettre à jour le profil existant
-- ========================================
-- Décommentez et exécutez si le profil existe déjà :

/*
UPDATE profiles 
SET 
  role = 'admin',
  updated_at = NOW()
WHERE id = auth.uid();
*/

-- ========================================
-- 4. Vérification finale
-- ========================================
SELECT 
  id,
  email,
  role,
  created_at,
  CASE 
    WHEN role = 'admin' THEN '✅ Vous êtes maintenant ADMIN'
    WHEN role = 'superuser' THEN '✅ Vous êtes SUPERUSER'
    ELSE '❌ Problème avec le rôle'
  END as "Statut"
FROM profiles
WHERE id = auth.uid();

-- ========================================
-- NOTES
-- ========================================
-- Si vous voyez une erreur "column does not exist", 
-- vérifiez que la table profiles a bien ces colonnes :
-- - id (UUID, PRIMARY KEY)
-- - email (TEXT)
-- - role (TEXT)
-- - created_at (TIMESTAMPTZ)
-- - updated_at (TIMESTAMPTZ)
