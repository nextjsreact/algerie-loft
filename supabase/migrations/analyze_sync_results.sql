-- ============================================================================
-- ANALYSE DES RÉSULTATS DE SYNCHRONISATION
-- ============================================================================
-- À exécuter dans Supabase SQL Editor après la synchronisation
-- ============================================================================

-- 1. STATISTIQUES GLOBALES
-- ============================================================================
SELECT '📊 STATISTIQUES GLOBALES' as section;

SELECT 
  'Total réservations' as metric,
  COUNT(*)::text as value
FROM reservations;

SELECT 
  'Réservations Airbnb' as metric,
  COUNT(*)::text as value
FROM reservations
WHERE source = 'airbnb_scraper';

SELECT 
  'Dernière synchronisation' as metric,
  TO_CHAR(MAX(synced_at), 'YYYY-MM-DD HH24:MI:SS') as value
FROM reservations
WHERE source = 'airbnb_scraper';

-- 2. DERNIERS LOGS DE SYNC
-- ============================================================================
SELECT '' as section;
SELECT '📝 DERNIERS LOGS DE SYNC' as section;

SELECT 
  TO_CHAR(started_at, 'YYYY-MM-DD HH24:MI:SS') as date_sync,
  sync_type,
  status,
  reservations_received,
  COALESCE(reservations_created, 0) as creees,
  COALESCE(reservations_updated, 0) as maj,
  COALESCE(reservations_skipped, 0) as ignorees,
  COALESCE(reservations_failed, 0) as echecs,
  ROUND(duration_ms / 1000.0, 1) as duree_sec
FROM airbnb_sync_logs
ORDER BY started_at DESC
LIMIT 5;

-- 3. RÉSERVATIONS PAR STATUT
-- ============================================================================
SELECT '' as section;
SELECT '📋 RÉSERVATIONS PAR STATUT' as section;

SELECT 
  status,
  COUNT(*) as nb_reservations,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM reservations WHERE source = 'airbnb_scraper'), 1) as pourcentage
FROM reservations
WHERE source = 'airbnb_scraper'
GROUP BY status
ORDER BY COUNT(*) DESC;

-- 4. RÉSERVATIONS AVEC/SANS LOFT
-- ============================================================================
SELECT '' as section;
SELECT '🏠 RÉSERVATIONS AVEC/SANS LOFT' as section;

SELECT 
  'Avec loft_id' as metric,
  COUNT(*)::text as value,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM reservations WHERE source = 'airbnb_scraper'), 1)::text || '%' as pourcentage
FROM reservations
WHERE source = 'airbnb_scraper'
  AND loft_id IS NOT NULL;

SELECT 
  'SANS loft_id' as metric,
  COUNT(*)::text as value,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM reservations WHERE source = 'airbnb_scraper'), 1)::text || '%' as pourcentage
FROM reservations
WHERE source = 'airbnb_scraper'
  AND loft_id IS NULL;

-- 5. STAGING: RÉSERVATIONS PAR STATUT DE MAPPING
-- ============================================================================
SELECT '' as section;
SELECT '🗂️  STAGING: STATUT DE MAPPING' as section;

SELECT 
  mapping_status,
  COUNT(*) as nb_reservations
FROM airbnb_reservations_staging
GROUP BY mapping_status
ORDER BY COUNT(*) DESC;

-- 6. STAGING: RÉSERVATIONS PAR STATUT DE VALIDATION
-- ============================================================================
SELECT '' as section;
SELECT '✅ STAGING: STATUT DE VALIDATION' as section;

SELECT 
  validation_status,
  COUNT(*) as nb_reservations
FROM airbnb_reservations_staging
GROUP BY validation_status
ORDER BY COUNT(*) DESC;

-- 7. STAGING: ERREURS DE VALIDATION (TOP 10)
-- ============================================================================
SELECT '' as section;
SELECT '❌ STAGING: ERREURS DE VALIDATION (TOP 10)' as section;

SELECT 
  airbnb_id,
  listing_id,
  validation_errors::text as erreurs
FROM airbnb_reservations_staging
WHERE validation_status = 'invalid'
ORDER BY created_at DESC
LIMIT 10;

-- 8. LOFTS AVEC MAPPING AIRBNB
-- ============================================================================
SELECT '' as section;
SELECT '🏠 LOFTS AVEC MAPPING AIRBNB' as section;

SELECT 
  l.name as loft_name,
  l.airbnb_listing_id,
  COUNT(r.id) as nb_reservations
FROM lofts l
LEFT JOIN reservations r ON r.loft_id = l.id AND r.source = 'airbnb_scraper'
WHERE l.airbnb_listing_id IS NOT NULL
GROUP BY l.id, l.name, l.airbnb_listing_id
ORDER BY COUNT(r.id) DESC;

-- 9. LISTING IDS NON MAPPÉS (TOP 20)
-- ============================================================================
SELECT '' as section;
SELECT '⚠️  LISTING IDS NON MAPPÉS (TOP 20)' as section;

SELECT 
  listing_id,
  COUNT(*) as nb_reservations
FROM airbnb_reservations_staging
WHERE mapping_status = 'failed'
GROUP BY listing_id
ORDER BY COUNT(*) DESC
LIMIT 20;

-- 10. PROCHAINES ÉTAPES
-- ============================================================================
SELECT '' as section;
SELECT '🎯 PROCHAINES ÉTAPES' as section;

SELECT 
  '1. Mapper les listing_ids Airbnb aux lofts' as etape
UNION ALL
SELECT 
  '2. Relancer la synchronisation pour mapper les réservations aux lofts'
UNION ALL
SELECT 
  '3. Résoudre les erreurs de validation'
UNION ALL
SELECT 
  '4. Vérifier les conflits de réservation';

-- ============================================================================
-- FIN DU RAPPORT
-- ============================================================================
SELECT '' as section;
SELECT '✅ ANALYSE TERMINÉE' as section;
SELECT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS') as timestamp;
