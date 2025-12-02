-- =====================================================
-- ÉTAPE 3: Mettre à jour la table lofts
-- =====================================================
-- Exécutez ce script APRÈS avoir exécuté 02-migrate-data.sql

-- Ajouter la nouvelle colonne
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS new_owner_id UUID REFERENCES owners(id);

-- Copier les owner_id existants
UPDATE lofts SET new_owner_id = owner_id WHERE owner_id IS NOT NULL;

-- Copier les partner_id existants
UPDATE lofts SET new_owner_id = partner_id WHERE partner_id IS NOT NULL AND new_owner_id IS NULL;

-- Vérification
SELECT 
  'Mise à jour terminée!' as status,
  COUNT(*) as total_lofts,
  COUNT(owner_id) as with_old_owner_id,
  COUNT(partner_id) as with_partner_id,
  COUNT(new_owner_id) as with_new_owner_id
FROM lofts;
