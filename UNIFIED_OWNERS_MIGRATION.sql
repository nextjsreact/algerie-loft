-- =====================================================
-- MIGRATION: Unification des tables de propriétaires
-- =====================================================
-- Objectif: Créer UNE SEULE table "owners" avec tous les champs
-- et migrer les données de loft_owners et partner_profiles

-- =====================================================
-- ÉTAPE 1: Créer la nouvelle table unifiée "owners"
-- =====================================================

CREATE TABLE IF NOT EXISTS owners (
  -- Identifiants
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Informations de base (de loft_owners)
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  
  -- Informations business (de partner_profiles)
  business_name TEXT,
  business_type TEXT CHECK (business_type IN ('individual', 'company')),
  ownership_type TEXT CHECK (ownership_type IN ('company', 'third_party')),
  tax_id TEXT,
  
  -- Vérification et validation (de partner_profiles)
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended')),
  verification_documents JSONB DEFAULT '[]'::jsonb,
  portfolio_description TEXT,
  
  -- Informations bancaires (de partner_profiles)
  bank_details JSONB DEFAULT '{}'::jsonb,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contraintes
  UNIQUE(email),
  UNIQUE(user_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_owners_user_id ON owners(user_id);
CREATE INDEX IF NOT EXISTS idx_owners_email ON owners(email);
CREATE INDEX IF NOT EXISTS idx_owners_verification_status ON owners(verification_status);
CREATE INDEX IF NOT EXISTS idx_owners_business_type ON owners(business_type);

-- Commentaires
COMMENT ON TABLE owners IS 'Table unifiée pour tous les propriétaires de lofts (internes et partenaires)';
COMMENT ON COLUMN owners.user_id IS 'Lien vers le compte utilisateur (optionnel pour propriétaires internes)';
COMMENT ON COLUMN owners.name IS 'Nom du propriétaire ou contact principal';
COMMENT ON COLUMN owners.business_name IS 'Nom de l''entreprise (si différent du nom)';
COMMENT ON COLUMN owners.verification_status IS 'Statut de vérification (pending par défaut pour propriétaires internes)';

-- =====================================================
-- ÉTAPE 2: Migrer les données de loft_owners
-- =====================================================

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
  'verified' as verification_status, -- Les propriétaires existants sont automatiquement vérifiés
  created_at,
  updated_at
FROM loft_owners
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- ÉTAPE 3: Migrer les données de partner_profiles
-- =====================================================

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
  COALESCE(business_name, 'Partner') as name, -- Utiliser business_name comme name
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
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- ÉTAPE 4: Ajouter la colonne owner_id dans lofts (si pas déjà présente)
-- =====================================================

-- La colonne owner_id existe déjà, on va juste s'assurer qu'elle pointe vers owners
-- On va créer une nouvelle colonne temporaire pour la transition

ALTER TABLE lofts ADD COLUMN IF NOT EXISTS new_owner_id UUID REFERENCES owners(id);

-- Copier les owner_id existants (qui pointent vers loft_owners)
UPDATE lofts SET new_owner_id = owner_id WHERE owner_id IS NOT NULL;

-- Copier les partner_id existants (qui pointent vers partner_profiles)
UPDATE lofts SET new_owner_id = partner_id WHERE partner_id IS NOT NULL AND new_owner_id IS NULL;

-- =====================================================
-- ÉTAPE 5: Vérification
-- =====================================================

-- Compter les enregistrements
SELECT 'loft_owners' as source, COUNT(*) as count FROM loft_owners
UNION ALL
SELECT 'partner_profiles' as source, COUNT(*) as count FROM partner_profiles
UNION ALL
SELECT 'owners (nouveau)' as source, COUNT(*) as count FROM owners;

-- Vérifier les lofts
SELECT 
  COUNT(*) as total_lofts,
  COUNT(owner_id) as with_old_owner_id,
  COUNT(partner_id) as with_partner_id,
  COUNT(new_owner_id) as with_new_owner_id
FROM lofts;

-- =====================================================
-- ÉTAPE 6: Finalisation (À EXÉCUTER APRÈS VÉRIFICATION)
-- =====================================================

-- ⚠️ NE PAS EXÉCUTER AVANT D'AVOIR VÉRIFIÉ QUE TOUT FONCTIONNE!
-- 
-- -- Supprimer l'ancienne colonne owner_id
-- ALTER TABLE lofts DROP COLUMN IF EXISTS owner_id;
-- 
-- -- Renommer new_owner_id en owner_id
-- ALTER TABLE lofts RENAME COLUMN new_owner_id TO owner_id;
-- 
-- -- Supprimer partner_id
-- ALTER TABLE lofts DROP COLUMN IF EXISTS partner_id;
-- 
-- -- Supprimer les anciennes tables
-- DROP TABLE IF EXISTS loft_owners CASCADE;
-- DROP TABLE IF EXISTS partner_profiles CASCADE;
-- DROP TABLE IF EXISTS partners CASCADE;

-- =====================================================
-- ÉTAPE 7: RLS (Row Level Security)
-- =====================================================

ALTER TABLE owners ENABLE ROW LEVEL SECURITY;

-- Policy pour les admins (accès complet)
CREATE POLICY "Admins can do everything on owners"
  ON owners
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superuser')
    )
  );

-- Policy pour les propriétaires (voir leurs propres données)
CREATE POLICY "Owners can view their own data"
  ON owners
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy pour les propriétaires (modifier leurs propres données)
CREATE POLICY "Owners can update their own data"
  ON owners
  FOR UPDATE
  USING (user_id = auth.uid());

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

-- Afficher un résumé
SELECT 
  '✅ Migration terminée!' as status,
  (SELECT COUNT(*) FROM owners) as total_owners,
  (SELECT COUNT(*) FROM owners WHERE user_id IS NOT NULL) as owners_with_account,
  (SELECT COUNT(*) FROM owners WHERE user_id IS NULL) as owners_without_account;
