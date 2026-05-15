-- Migration: Fix ALL Cascade Deletes on Lofts Table
-- Date: 2026-05-14
-- Description: Change ALL ON DELETE CASCADE to appropriate actions
--              to prevent lofts from being accidentally deleted

-- ============================================================================
-- PROBLÈME: Plusieurs contraintes peuvent supprimer des lofts accidentellement
-- ============================================================================

-- 1. zone_area_id: ON DELETE CASCADE → ON DELETE SET NULL
--    Supprimer une zone ne doit PAS supprimer les lofts
-- 2. internet_connection_type_id: Vérifier et corriger si nécessaire
--    Supprimer un type de connexion ne doit PAS supprimer les lofts
-- 3. owner_id: ON DELETE CASCADE → ON DELETE RESTRICT
--    Supprimer un propriétaire ne doit PAS être possible s'il a des lofts

-- ============================================================================
-- 1. FIX: zone_area_id (déjà fait dans migration 003, mais on s'assure)
-- ============================================================================

ALTER TABLE lofts
DROP CONSTRAINT IF EXISTS fk_zone_area;

ALTER TABLE lofts
DROP CONSTRAINT IF EXISTS lofts_zone_area_id_fkey;

ALTER TABLE lofts
ADD CONSTRAINT lofts_zone_area_id_fkey
FOREIGN KEY (zone_area_id) 
REFERENCES zone_areas(id) 
ON DELETE SET NULL;

-- ============================================================================
-- 2. FIX: internet_connection_type_id
-- ============================================================================

ALTER TABLE lofts
DROP CONSTRAINT IF EXISTS fk_internet_connection;

ALTER TABLE lofts
DROP CONSTRAINT IF EXISTS lofts_internet_connection_type_id_fkey;

ALTER TABLE lofts
ADD CONSTRAINT lofts_internet_connection_type_id_fkey
FOREIGN KEY (internet_connection_type_id) 
REFERENCES internet_connection_types(id) 
ON DELETE SET NULL;

-- ============================================================================
-- 3. FIX: owner_id (CRITIQUE - empêcher la suppression du propriétaire)
-- ============================================================================

-- Déterminer le nom de la table des propriétaires (owners ou loft_owners)
DO $$
DECLARE
  owner_table_name TEXT;
BEGIN
  -- Vérifier quelle table existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'owners' AND table_schema = 'public') THEN
    owner_table_name := 'owners';
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loft_owners' AND table_schema = 'public') THEN
    owner_table_name := 'loft_owners';
  ELSE
    RAISE EXCEPTION 'Aucune table de propriétaires trouvée (owners ou loft_owners)';
  END IF;

  RAISE NOTICE 'Table des propriétaires détectée: %', owner_table_name;

  -- Supprimer les anciennes contraintes
  EXECUTE 'ALTER TABLE lofts DROP CONSTRAINT IF EXISTS fk_owner';
  EXECUTE 'ALTER TABLE lofts DROP CONSTRAINT IF EXISTS lofts_owner_id_fkey';
  EXECUTE 'ALTER TABLE lofts DROP CONSTRAINT IF EXISTS lofts_new_owner_id_fkey';

  -- RESTRICT: Empêche la suppression du propriétaire s'il a des lofts
  EXECUTE format('ALTER TABLE lofts ADD CONSTRAINT lofts_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES %I(id) ON DELETE RESTRICT', owner_table_name);
  
  RAISE NOTICE 'Contrainte owner_id mise à jour avec succès';
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  zone_rule TEXT;
  internet_rule TEXT;
  owner_rule TEXT;
BEGIN
  -- Vérifier zone_area_id
  SELECT rc.delete_rule INTO zone_rule
  FROM information_schema.referential_constraints rc
  JOIN information_schema.table_constraints tc 
    ON rc.constraint_name = tc.constraint_name
  WHERE tc.table_name = 'lofts'
  AND tc.constraint_name = 'lofts_zone_area_id_fkey';

  -- Vérifier internet_connection_type_id
  SELECT rc.delete_rule INTO internet_rule
  FROM information_schema.referential_constraints rc
  JOIN information_schema.table_constraints tc 
    ON rc.constraint_name = tc.constraint_name
  WHERE tc.table_name = 'lofts'
  AND tc.constraint_name = 'lofts_internet_connection_type_id_fkey';

  -- Vérifier owner_id
  SELECT rc.delete_rule INTO owner_rule
  FROM information_schema.referential_constraints rc
  JOIN information_schema.table_constraints tc 
    ON rc.constraint_name = tc.constraint_name
  WHERE tc.table_name = 'lofts'
  AND tc.constraint_name = 'lofts_owner_id_fkey';

  -- Afficher les résultats
  RAISE NOTICE '=== VERIFICATION DES CONTRAINTES ===';
  RAISE NOTICE 'zone_area_id: % (attendu: SET NULL)', zone_rule;
  RAISE NOTICE 'internet_connection_type_id: % (attendu: SET NULL)', internet_rule;
  RAISE NOTICE 'owner_id: % (attendu: RESTRICT)', owner_rule;

  -- Vérifier que tout est correct
  IF zone_rule = 'SET NULL' AND internet_rule = 'SET NULL' AND owner_rule = 'RESTRICT' THEN
    RAISE NOTICE '✅ SUCCESS: Toutes les contraintes sont correctes !';
  ELSE
    RAISE EXCEPTION '❌ FAILED: Certaines contraintes ne sont pas correctes';
  END IF;
END $$;

-- ============================================================================
-- COMMENTAIRES POUR DOCUMENTATION
-- ============================================================================

COMMENT ON CONSTRAINT lofts_zone_area_id_fkey ON lofts IS 
'ON DELETE SET NULL: Supprimer une zone met zone_area_id à NULL (lofts conservés)';

COMMENT ON CONSTRAINT lofts_internet_connection_type_id_fkey ON lofts IS 
'ON DELETE SET NULL: Supprimer un type de connexion met internet_connection_type_id à NULL (lofts conservés)';

COMMENT ON CONSTRAINT lofts_owner_id_fkey ON lofts IS 
'ON DELETE RESTRICT: Empêche la suppression d''un propriétaire qui a des lofts (table: owners ou loft_owners)';
