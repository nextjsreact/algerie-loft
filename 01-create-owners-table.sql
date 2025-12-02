-- =====================================================
-- ÉTAPE 1: Créer la table unifiée "owners"
-- =====================================================
-- Exécutez ce script dans Supabase SQL Editor

CREATE TABLE IF NOT EXISTS owners (
  -- Identifiants
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Informations de base
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  
  -- Informations business
  business_name TEXT,
  business_type TEXT CHECK (business_type IN ('individual', 'company')),
  ownership_type TEXT CHECK (ownership_type IN ('company', 'third_party')),
  tax_id TEXT,
  
  -- Vérification et validation
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended')),
  verification_documents JSONB DEFAULT '[]'::jsonb,
  portfolio_description TEXT,
  
  -- Informations bancaires
  bank_details JSONB DEFAULT '{}'::jsonb,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contraintes
  UNIQUE(email)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_owners_user_id ON owners(user_id);
CREATE INDEX IF NOT EXISTS idx_owners_email ON owners(email);
CREATE INDEX IF NOT EXISTS idx_owners_verification_status ON owners(verification_status);
CREATE INDEX IF NOT EXISTS idx_owners_business_type ON owners(business_type);

-- Commentaires
COMMENT ON TABLE owners IS 'Table unifiée pour tous les propriétaires de lofts';

-- Afficher le résultat
SELECT 'Table owners créée avec succès!' as status;
