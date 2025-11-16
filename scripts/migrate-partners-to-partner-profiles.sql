-- Script pour migrer les partenaires de la table 'partners' vers 'partner_profiles'
-- Ce script copie les partenaires approuvés qui n'existent pas encore dans partner_profiles

-- Insérer les partenaires approuvés manquants dans partner_profiles
INSERT INTO partner_profiles (
  user_id,
  business_name,
  business_type,
  tax_id,
  address,
  phone,
  verification_status,
  verification_documents,
  bank_details,
  portfolio_description,
  admin_notes,
  approved_at,
  approved_by,
  rejected_at,
  rejected_by,
  rejection_reason,
  created_at,
  updated_at
)
SELECT 
  p.user_id,
  p.business_name,
  p.business_type,
  p.tax_id,
  p.address,
  p.phone,
  CASE 
    WHEN p.verification_status = 'approved' THEN 'verified'
    ELSE p.verification_status
  END as verification_status,  -- Convertir 'approved' en 'verified'
  p.verification_documents,
  p.bank_details,
  p.portfolio_description,
  p.admin_notes,
  p.approved_at,
  p.approved_by,
  p.rejected_at,
  p.rejected_by,
  p.rejection_reason,
  p.created_at,
  p.updated_at
FROM partners p
LEFT JOIN partner_profiles pp ON p.user_id = pp.user_id
WHERE pp.id IS NULL  -- Seulement les partenaires qui n'existent pas encore dans partner_profiles
  AND p.verification_status IN ('approved', 'pending', 'rejected', 'suspended');

-- Afficher le résultat
SELECT 
  'Migration completed' as status,
  COUNT(*) as migrated_count
FROM partner_profiles pp
INNER JOIN partners p ON pp.user_id = p.user_id
WHERE pp.created_at >= NOW() - INTERVAL '1 minute';
