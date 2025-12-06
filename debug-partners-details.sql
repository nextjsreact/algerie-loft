-- =====================================================
-- DEBUG: Voir les détails des 3 partners
-- =====================================================

-- 1. Voir tous les partners avec leurs détails
SELECT 
  id,
  name,
  business_name,
  email,
  phone,
  verification_status,
  user_id,
  created_at,
  approved_at,
  rejected_at,
  approved_by,
  rejected_by,
  rejection_reason,
  admin_notes
FROM owners 
WHERE user_id IS NOT NULL
ORDER BY created_at DESC;

-- 2. Compter par statut
SELECT 
  verification_status,
  COUNT(*) as count
FROM owners 
WHERE user_id IS NOT NULL
GROUP BY verification_status;

-- 3. Vérifier les profiles associés
SELECT 
  o.id as owner_id,
  o.name as owner_name,
  o.user_id,
  p.email as profile_email,
  p.full_name as profile_name,
  p.role as profile_role
FROM owners o
LEFT JOIN profiles p ON o.user_id = p.id
WHERE o.user_id IS NOT NULL;

-- 4. Vérifier les lofts associés
SELECT 
  o.id as owner_id,
  o.name as owner_name,
  COUNT(l.id) as lofts_count
FROM owners o
LEFT JOIN lofts l ON l.owner_id = o.id
WHERE o.user_id IS NOT NULL
GROUP BY o.id, o.name;
