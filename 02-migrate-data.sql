-- =====================================================
-- ÉTAPE 2: Migrer les données
-- =====================================================
-- Exécutez ce script APRÈS avoir exécuté 01-create-owners-table.sql

-- Migrer loft_owners
INSERT INTO owners (
  id,
  name,
  email,
  phone,
  address,
  ownership_type,
  verification_status,
  created_at,
  updated_at
)
SELECT 
  id,
  name,
  email,
  phone,
  address,
  ownership_type,
  'verified' as verification_status,
  created_at,
  updated_at
FROM loft_owners
ON CONFLICT (id) DO NOTHING;

-- Migrer partner_profiles (sans email pour éviter les doublons)
INSERT INTO owners (
  id,
  user_id,
  name,
  business_name,
  phone,
  address,
  business_type,
  tax_id,
  verification_status,
  verification_documents,
  bank_details,
  portfolio_description,
  created_at,
  updated_at
)
SELECT 
  id,
  user_id,
  COALESCE(business_name, 'Partner') as name,
  business_name,
  phone,
  address,
  business_type,
  tax_id,
  verification_status,
  verification_documents,
  bank_details,
  portfolio_description,
  created_at,
  updated_at
FROM partner_profiles
WHERE id NOT IN (SELECT id FROM owners)
ON CONFLICT (id) DO NOTHING;

-- Vérification
SELECT 
  'Migration terminée!' as status,
  (SELECT COUNT(*) FROM loft_owners) as loft_owners_count,
  (SELECT COUNT(*) FROM partner_profiles) as partner_profiles_count,
  (SELECT COUNT(*) FROM owners) as owners_count;
