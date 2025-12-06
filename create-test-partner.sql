-- =====================================================
-- CRÉER UN PARTNER DE TEST
-- =====================================================
-- Ce script crée un partner de test pour tester l'interface

-- ⚠️ IMPORTANT: Vous devez d'abord créer un user dans Supabase Auth
-- Dashboard → Authentication → Users → Add User
-- Email: partner-test@example.com
-- Password: (votre choix)
-- Copiez l'UUID du user créé et remplacez 'USER_UUID_ICI' ci-dessous

-- =====================================================
-- ÉTAPE 1: Créer le profil
-- =====================================================

INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
) VALUES (
  'USER_UUID_ICI', -- ← Remplacez par l'UUID du user créé
  'partner-test@example.com',
  'Partner Test',
  'partner',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET role = 'partner';

-- =====================================================
-- ÉTAPE 2: Créer l'owner/partner
-- =====================================================

INSERT INTO owners (
  user_id,
  name,
  business_name,
  email,
  phone,
  address,
  business_type,
  verification_status,
  created_at,
  updated_at
) VALUES (
  'USER_UUID_ICI', -- ← Remplacez par l'UUID du user créé
  'Partner Test',
  'Test Business SARL',
  'partner-test@example.com',
  '+213 555 123 456',
  'Alger, Algérie',
  'company',
  'pending', -- En attente de validation
  NOW(),
  NOW()
);

-- =====================================================
-- VÉRIFICATION
-- =====================================================

SELECT 
  '✅ Partner de test créé!' as status,
  o.id,
  o.name,
  o.business_name,
  o.email,
  o.verification_status,
  p.role as user_role
FROM owners o
LEFT JOIN profiles p ON o.user_id = p.id
WHERE o.user_id = 'USER_UUID_ICI'; -- ← Remplacez par l'UUID du user créé

-- =====================================================
-- INSTRUCTIONS
-- =====================================================

-- 1. Allez dans Supabase Dashboard
-- 2. Authentication → Users → Add User
-- 3. Email: partner-test@example.com
-- 4. Password: (votre choix)
-- 5. Copiez l'UUID du user
-- 6. Remplacez 'USER_UUID_ICI' dans ce script (3 endroits)
-- 7. Exécutez ce script
-- 8. Rafraîchissez /admin/partners
-- 9. Vous devriez voir le partner de test!
