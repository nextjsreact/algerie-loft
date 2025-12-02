-- =====================================================
-- ÉTAPE 2: Migrer les données (VERSION CORRIGÉE)
-- =====================================================
-- Exécutez ce script APRÈS avoir exécuté 01-create-owners-table.sql

-- D'abord, supprimer la contrainte UNIQUE sur email (temporairement)
ALTER TABLE owners DROP CONSTRAINT IF EXISTS owners_email_key;

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
  pp.id,
  pp.user_id,
  COALESCE(pp.business_name, 'Partner') as name,
  pp.business_name,
  pp.phone,
  pp.address,
  pp.business_type,
  pp.tax_id,
  pp.verification_status,
  to_jsonb(pp.verification_documents) as verification_documents, -- Conversion text[] -> jsonb
  pp.bank_details,
  pp.portfolio_description,
  pp.created_at,
  pp.updated_at
FROM partner_profiles pp
WHERE pp.id NOT IN (SELECT id FROM owners)
ON CONFLICT (id) DO NOTHING;

-- Mettre à jour les emails manquants depuis profiles (pour les partenaires avec user_id)
UPDATE owners o
SET email = p.email
FROM profiles p
WHERE o.user_id = p.id
  AND o.email IS NULL
  AND p.email IS NOT NULL;

-- Vérification
SELECT 
  'Migration terminée!' as status,
  (SELECT COUNT(*) FROM loft_owners) as loft_owners_count,
  (SELECT COUNT(*) FROM partner_profiles) as partner_profiles_count,
  (SELECT COUNT(*) FROM owners) as owners_count,
  (SELECT COUNT(*) FROM owners WHERE email IS NOT NULL) as owners_with_email;

-- Afficher les propriétaires
SELECT 
  id, 
  name, 
  email, 
  business_name, 
  verification_status,
  CASE WHEN user_id IS NOT NULL THEN 'Avec compte' ELSE 'Sans compte' END as type_compte
FROM owners
ORDER BY name;
