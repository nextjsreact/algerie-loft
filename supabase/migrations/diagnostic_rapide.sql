-- ============================================================================
-- DIAGNOSTIC RAPIDE - État Actuel de l'Intégration Airbnb
-- ============================================================================
-- À exécuter dans Supabase SQL Editor
-- ============================================================================

-- 1. VÉRIFIER QUE LES MIGRATIONS ONT ÉTÉ APPLIQUÉES
-- ============================================================================
SELECT '🔍 VÉRIFICATION DES MIGRATIONS' as section;

-- Colonnes dans reservations
SELECT 
  '✅ Colonnes Airbnb dans reservations' as check_name,
  COUNT(*) as colonnes_trouvees,
  CASE 
    WHEN COUNT(*) = 3 THEN '✅ OK'
    ELSE '❌ MANQUANT'
  END as statut
FROM information_schema.columns
WHERE table_name = 'reservations'
  AND column_name IN ('source', 'airbnb_confirmation_code', 'synced_at');

-- Tables Airbnb
SELECT 
  '✅ Tables Airbnb créées' as check_name,
  COUNT(*) as tables_trouvees,
  CASE 
    WHEN COUNT(*) = 3 THEN '✅ OK'
    ELSE '❌ MANQUANT'
  END as statut
FROM information_schema.tables
WHERE table_name IN (
  'airbnb_reservations_staging',
  'airbnb_sync_logs',
  'airbnb_conflicts'
);

-- Colonne airbnb_listing_id dans lofts
SELECT 
  '✅ Colonne airbnb_listing_id dans lofts' as check_name,
  COUNT(*) as colonnes_trouvees,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ OK'
    ELSE '❌ MANQUANT'
  END as statut
FROM information_schema.columns
WHERE table_name = 'lofts'
  AND column_name = 'airbnb_listing_id';

-- ============================================================================
-- 2. STATISTIQUES DES DONNÉES ACTUELLES
-- ============================================================================
SELECT '' as section;
SELECT '📊 STATISTIQUES DES DONNÉES' as section;

-- Réservations totales
SELECT 
  'Total réservations' as metric,
  COUNT(*)::text as value
FROM reservations;

-- Réservations Airbnb
SELECT 
  'Réservations Airbnb (source=airbnb)' as metric,
  COUNT(*)::text as value
FROM reservations
WHERE source = 'airbnb';

-- Réservations avec code Airbnb
SELECT 
  'Réservations avec airbnb_confirmation_code' as metric,
  COUNT(*)::text as value
FROM reservations
WHERE airbnb_confirmation_code IS NOT NULL;

-- Dernière synchronisation
SELECT 
  'Dernière synchronisation' as metric,
  TO_CHAR(MAX(synced_at), 'YYYY-MM-DD HH24:MI:SS') as value
FROM reservations
WHERE synced_at IS NOT NULL;

-- ============================================================================
-- 3. MAPPING LOFTS
-- ============================================================================
SELECT '' as section;
SELECT '🏠 MAPPING LOFTS' as section;

-- Lofts avec mapping
SELECT 
  'Lofts avec airbnb_listing_id' as metric,
  COUNT(*)::text as value
FROM lofts
WHERE airbnb_listing_id IS NOT NULL;

-- Lofts sans mapping
SELECT 
  'Lofts SANS airbnb_listing_id' as metric,
  COUNT(*)::text as value
FROM lofts
WHERE airbnb_listing_id IS NULL;

-- Total lofts
SELECT 
  'Total lofts' as metric,
  COUNT(*)::text as value
FROM lofts;

-- ============================================================================
-- 4. RÉSERVATIONS ORPHELINES (SANS LOFT)
-- ============================================================================
SELECT '' as section;
SELECT '⚠️  RÉSERVATIONS ORPHELINES' as section;

-- Réservations Airbnb sans loft_id
SELECT 
  'Réservations Airbnb SANS loft_id' as metric,
  COUNT(*)::text as value
FROM reservations
WHERE source = 'airbnb'
  AND loft_id IS NULL;

-- Réservations Airbnb avec loft_id
SELECT 
  'Réservations Airbnb AVEC loft_id' as metric,
  COUNT(*)::text as value
FROM reservations
WHERE source = 'airbnb'
  AND loft_id IS NOT NULL;

-- ============================================================================
-- 5. LOGS DE SYNCHRONISATION
-- ============================================================================
SELECT '' as section;
SELECT '📝 DERNIERS LOGS DE SYNC' as section;

SELECT 
  TO_CHAR(started_at, 'YYYY-MM-DD HH24:MI:SS') as date_sync,
  sync_type,
  status,
  COALESCE(reservations_created, 0) as creees,
  COALESCE(reservations_updated, 0) as maj,
  COALESCE(reservations_failed, 0) as echecs,
  COALESCE(reservations_skipped, 0) as ignorees
FROM airbnb_sync_logs
ORDER BY started_at DESC
LIMIT 10;

-- ============================================================================
-- 6. CONFLITS DÉTECTÉS
-- ============================================================================
SELECT '' as section;
SELECT '⚠️  CONFLITS DE RÉSERVATION' as section;

SELECT 
  'Conflits non résolus' as metric,
  COUNT(*)::text as value
FROM airbnb_conflicts
WHERE status = 'open';

SELECT 
  'Conflits résolus' as metric,
  COUNT(*)::text as value
FROM airbnb_conflicts
WHERE status != 'open';

-- ============================================================================
-- 7. ACTIONS REQUISES
-- ============================================================================
SELECT '' as section;
SELECT '🎯 ACTIONS REQUISES' as section;

-- Si migrations manquantes
SELECT 
  '❌ URGENT: Appliquer les migrations SQL' as action,
  'Exécuter APPLY_ALL_AIRBNB_MIGRATIONS.sql' as solution
WHERE (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_name = 'reservations'
    AND column_name IN ('source', 'airbnb_confirmation_code', 'synced_at')
) < 3;

-- Si aucun loft mappé
SELECT 
  '⚠️  IMPORTANT: Mapper les lofts Airbnb' as action,
  'Exécuter list_airbnb_listings_for_mapping.sql' as solution
WHERE (
  SELECT COUNT(*) FROM lofts WHERE airbnb_listing_id IS NOT NULL
) = 0;

-- Si réservations orphelines
SELECT 
  '⚠️  ATTENTION: Réservations sans loft' as action,
  COUNT(*)::text || ' réservations à mapper' as solution
FROM reservations
WHERE source = 'airbnb'
  AND loft_id IS NULL
HAVING COUNT(*) > 0;

-- ============================================================================
-- FIN DU DIAGNOSTIC
-- ============================================================================
SELECT '' as section;
SELECT '✅ DIAGNOSTIC TERMINÉ' as section;
SELECT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS') as timestamp;
