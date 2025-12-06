-- =====================================================
-- DEBUG: Voir les 3 partners
-- =====================================================

-- Voir les détails des 3 partners
SELECT 
  o.id,
  o.user_id,
  o.name,
  o.business_name,
  o.email,
  o.phone,
  o.address,
  o.business_type,
  o.verification_status,
  o.created_at,
  p.email as profile_email,
  p.full_name as profile_name,
  p.role as profile_role
FROM owners o
LEFT JOIN profiles p ON o.user_id = p.id
WHERE o.user_id IS NOT NULL
ORDER BY o.created_at DESC;

-- Vérifier que les profiles existent
SELECT 
  'Vérification profiles' as check_type,
  COUNT(*) as profiles_count
FROM profiles
WHERE id IN (
  SELECT user_id FROM owners WHERE user_id IS NOT NULL
);
