-- Script pour vérifier le statut des partenaires dans les deux tables

-- Vérifier la table partners (ancien système - utilise 'approved')
SELECT 
  'partners table' as source,
  p.id,
  p.user_id,
  p.business_name,
  p.verification_status,
  pr.email,
  pr.full_name,
  pr.role
FROM partners p
LEFT JOIN profiles pr ON p.user_id = pr.id
WHERE p.verification_status = 'approved'
ORDER BY p.created_at DESC;

-- Vérifier la table partner_profiles (nouveau système - utilise 'verified')
SELECT 
  'partner_profiles table' as source,
  pp.id,
  pp.user_id,
  pp.business_name,
  pp.verification_status,
  pr.email,
  pr.full_name,
  pr.role
FROM partner_profiles pp
LEFT JOIN profiles pr ON pp.user_id = pr.id
WHERE pp.verification_status = 'verified'
ORDER BY pp.created_at DESC;

-- Vérifier les utilisateurs qui ont un profil dans partners mais pas dans partner_profiles
SELECT 
  'Missing in partner_profiles' as issue,
  p.id as partner_id,
  p.user_id,
  p.business_name,
  p.verification_status as partners_status,
  pr.email,
  pr.full_name,
  pr.role
FROM partners p
LEFT JOIN partner_profiles pp ON p.user_id = pp.user_id
LEFT JOIN profiles pr ON p.user_id = pr.id
WHERE p.verification_status = 'approved'
  AND pp.id IS NULL;
