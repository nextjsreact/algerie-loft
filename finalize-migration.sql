-- =====================================================
-- FINALISATION DE LA MIGRATION - EXÉCUTER DANS SUPABASE
-- =====================================================
-- ⚠️  ATTENTION: Ce script est IRRÉVERSIBLE!
-- 
-- AVANT D'EXÉCUTER:
-- ✅ Backup créé: backup-loft-owners.json, backup-partner-profiles.json
-- ✅ 26 propriétaires dans la table owners
-- ✅ Relation lofts -> owners testée et fonctionnelle
--
-- CE SCRIPT VA:
-- 1. Supprimer les colonnes owner_id et partner_id de lofts
-- 2. Renommer new_owner_id en owner_id
-- 3. Supprimer les tables loft_owners et partner_profiles
--
-- COMMENT EXÉCUTER:
-- 1. Ouvrir Supabase Dashboard
-- 2. Aller dans SQL Editor
-- 3. Copier-coller ce script
-- 4. Cliquer sur "Run"
-- =====================================================

BEGIN;

-- =====================================================
-- ÉTAPE 1: Nettoyage des colonnes dans lofts
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '📋 ÉTAPE 1: Nettoyage des colonnes dans lofts';
END $$;

-- Supprimer l'ancienne colonne owner_id (qui pointait vers loft_owners)
ALTER TABLE lofts DROP COLUMN IF EXISTS owner_id CASCADE;

-- Supprimer la colonne partner_id (qui pointait vers partner_profiles)
ALTER TABLE lofts DROP COLUMN IF EXISTS partner_id CASCADE;

DO $$ 
BEGIN
  RAISE NOTICE '✅ Anciennes colonnes supprimées';
END $$;

-- =====================================================
-- ÉTAPE 2: Renommer new_owner_id en owner_id
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '📋 ÉTAPE 2: Renommage de new_owner_id en owner_id';
END $$;

-- Renommer new_owner_id en owner_id
ALTER TABLE lofts RENAME COLUMN new_owner_id TO owner_id;

DO $$ 
BEGIN
  RAISE NOTICE '✅ Colonne renommée';
END $$;

-- Vérification intermédiaire
SELECT 
  '✅ Colonnes mises à jour!' as status,
  COUNT(*) as total_lofts,
  COUNT(owner_id) as lofts_with_owner
FROM lofts;

-- =====================================================
-- ÉTAPE 3: Supprimer les anciennes tables
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '📋 ÉTAPE 3: Suppression des anciennes tables';
END $$;

-- Supprimer loft_owners
DROP TABLE IF EXISTS loft_owners CASCADE;

-- Supprimer partner_profiles
DROP TABLE IF EXISTS partner_profiles CASCADE;

-- Supprimer partners (si elle existe)
DROP TABLE IF EXISTS partners CASCADE;

DO $$ 
BEGIN
  RAISE NOTICE '✅ Anciennes tables supprimées';
END $$;

-- =====================================================
-- ÉTAPE 4: Vérification finale
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '📋 ÉTAPE 4: Vérification finale';
END $$;

-- Lister les tables restantes
SELECT 
  '📊 Tables restantes:' as info,
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN ('owners', 'lofts', 'loft_owners', 'partner_profiles', 'partners')
ORDER BY table_name;

-- Statistiques finales
SELECT 
  '✅ MIGRATION FINALISÉE!' as status,
  (SELECT COUNT(*) FROM owners) as total_owners,
  (SELECT COUNT(*) FROM lofts) as total_lofts,
  (SELECT COUNT(*) FROM lofts WHERE owner_id IS NOT NULL) as lofts_with_owner;

-- Test de la relation
SELECT 
  '🧪 Test de la relation lofts -> owners:' as test,
  l.name as loft_name,
  o.name as owner_name
FROM lofts l
LEFT JOIN owners o ON l.owner_id = o.id
WHERE l.owner_id IS NOT NULL
LIMIT 5;

COMMIT;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 MIGRATION TERMINÉE AVEC SUCCÈS!';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Structure finale:';
  RAISE NOTICE '   - Table owners (propriétaires unifiés)';
  RAISE NOTICE '   - Table lofts avec colonne owner_id';
  RAISE NOTICE '   - Anciennes tables supprimées';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Prochaines étapes:';
  RAISE NOTICE '   1. Redémarrer l''application: npm run dev';
  RAISE NOTICE '   2. Tester la création/édition de lofts';
  RAISE NOTICE '   3. Vérifier que tout fonctionne';
  RAISE NOTICE '';
  RAISE NOTICE '💾 Backup disponible:';
  RAISE NOTICE '   - backup-loft-owners.json';
  RAISE NOTICE '   - backup-partner-profiles.json';
  RAISE NOTICE '';
END $$;
