-- Script automatique pour créer/corriger votre profil
-- Exécutez ce script et il fera tout automatiquement

-- ========================================
-- Solution automatique : INSERT ou UPDATE
-- ========================================

-- Cette commande crée le profil s'il n'existe pas,
-- ou met à jour le rôle s'il existe déjà
INSERT INTO profiles (id, email, role, created_at, updated_at)
VALUES (
  auth.uid(),
  (SELECT email FROM auth.users WHERE id = auth.uid()),
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'admin',
  updated_at = NOW();

-- ========================================
-- Vérification
-- ========================================
SELECT 
  '✅ SUCCÈS' as "Résultat",
  email as "Votre email",
  role as "Votre rôle",
  'Vous pouvez maintenant créer des annonces !' as "Message"
FROM profiles
WHERE id = auth.uid();
