-- =====================================================
-- VÉRIFICATION DES DONNÉES DANS LA TABLE OWNERS
-- =====================================================
-- Exécutez ce script dans Supabase SQL Editor

-- 1. Compter tous les owners
SELECT 
  'Total owners' as type,
  COUNT(*) as count
FROM owners;

-- 2. Compter les propriétaires internes (user_id = NULL)
SELECT 
  'Propriétaires internes (user_id = NULL)' as type,
  COUNT(*) as count
FROM owners
WHERE user_id IS NULL;

-- 3. Compter les partners (user_id présent)
SELECT 
  'Partners (user_id présent)' as type,
  COUNT(*) as count
FROM owners
WHERE user_id IS NOT NULL;

-- 4. Voir les détails des partners
SELECT 
  '=== PARTNERS (avec user_id) ===' as info;

SELECT 
  id,
  name,
  business_name,
  email,
  phone,
  user_id,
  verification_status,
  created_at
FROM owners
WHERE user_id IS NOT NULL
ORDER BY created_at DESC;

-- 5. Voir les détails des propriétaires internes
SELECT 
  '=== PROPRIÉTAIRES INTERNES (sans user_id) ===' as info;

SELECT 
  id,
  name,
  email,
  phone,
  user_id,
  ownership_type,
  created_at
FROM owners
WHERE user_id IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- 6. Vérifier s'il y a des users dans profiles qui pourraient être partners
SELECT 
  '=== USERS AVEC RÔLE PARTNER ===' as info;

SELECT 
  p.id,
  p.full_name,
  p.email,
  p.role,
  o.id as owner_id,
  o.name as owner_name
FROM profiles p
LEFT JOIN owners o ON o.user_id = p.id
WHERE p.role = 'partner';
