-- ============================================================================
-- Analyse Rapide des Données Airbnb
-- ============================================================================
-- Script simplifié pour une analyse rapide (sans erreurs de colonnes)

-- 1. LOFT AVEC MAPPING AIRBNB
SELECT 
  '=== LOFT AVEC MAPPING AIRBNB ===' as info;

SELECT 
  id,
  name,
  airbnb_listing_id,
  address,
  status
FROM lofts
WHERE airbnb_listing_id IS NOT NULL
ORDER BY name;

-- 2. STATISTIQUES GLOBALES
SELECT 
  '=== STATISTIQUES GLOBALES ===' as info;

SELECT 
  'Total Lofts' as metric,
  COUNT(*) as count
FROM lofts
UNION ALL
SELECT 
  'Lofts avec Mapping Airbnb' as metric,
  COUNT(*) as count
FROM lofts
WHERE airbnb_listing_id IS NOT NULL
UNION ALL
SELECT 
  'Total Réservations' as metric,
  COUNT(*) as count
FROM reservations
UNION ALL
SELECT 
  'Réservations Airbnb' as metric,
  COUNT(*) as count
FROM reservations
WHERE source = 'airbnb_scraper'
UNION ALL
SELECT 
  'Réservations en Staging' as metric,
  COUNT(*) as count
FROM airbnb_reservations_staging
UNION ALL
SELECT 
  'Syncs Réussis' as metric,
  COUNT(*) as count
FROM airbnb_sync_logs
WHERE status = 'success'
UNION ALL
SELECT 
  'Conflits Ouverts' as metric,
  COUNT(*) as count
FROM airbnb_conflicts
WHERE status = 'open';

-- 3. RÉSERVATIONS AIRBNB (DERNIÈRES 5)
SELECT 
  '=== DERNIÈRES RÉSERVATIONS AIRBNB ===' as info;

SELECT 
  r.id,
  l.name as loft_name,
  r.guest_name,
  r.check_in_date,
  r.check_out_date,
  r.total_amount,
  r.currency_code,
  r.status,
  r.airbnb_confirmation_code,
  r.created_at
FROM reservations r
LEFT JOIN lofts l ON r.loft_id = l.id
WHERE r.source = 'airbnb_scraper'
ORDER BY r.created_at DESC
LIMIT 5;

-- 4. RÉSERVATIONS EN STAGING (DERNIÈRES 5)
SELECT 
  '=== RÉSERVATIONS EN STAGING ===' as info;

SELECT 
  s.airbnb_id,
  s.listing_id,
  s.guest_name,
  s.check_in_date,
  s.check_out_date,
  s.mapping_status,
  s.validation_status,
  s.reconciliation_status,
  s.created_at
FROM airbnb_reservations_staging s
ORDER BY s.created_at DESC
LIMIT 5;

-- 5. DERNIERS LOGS DE SYNC
SELECT 
  '=== DERNIERS LOGS DE SYNC ===' as info;

SELECT 
  sync_batch_id,
  sync_type,
  status,
  reservations_received,
  reservations_created,
  reservations_updated,
  reservations_skipped,
  conflicts_detected,
  started_at,
  completed_at
FROM airbnb_sync_logs
ORDER BY started_at DESC
LIMIT 5;

-- 6. CONFLITS OUVERTS
SELECT 
  '=== CONFLITS OUVERTS ===' as info;

SELECT 
  c.id as conflict_id,
  l.name as loft_name,
  r1.guest_name as reservation_1_guest,
  r1.check_in_date as res1_checkin,
  r1.check_out_date as res1_checkout,
  r2.guest_name as reservation_2_guest,
  r2.check_in_date as res2_checkin,
  r2.check_out_date as res2_checkout,
  c.overlap_nights,
  c.severity,
  c.created_at
FROM airbnb_conflicts c
JOIN lofts l ON c.loft_id = l.id
JOIN reservations r1 ON c.reservation_1_id = r1.id
JOIN reservations r2 ON c.reservation_2_id = r2.id
WHERE c.status = 'open'
ORDER BY c.created_at DESC;

-- 7. LISTING IDs EN ATTENTE DE MAPPING
SELECT 
  '=== LISTING IDs EN ATTENTE DE MAPPING ===' as info;

SELECT DISTINCT
  s.listing_id,
  COUNT(*) as reservations_count,
  MIN(s.check_in_date) as earliest_checkin,
  MAX(s.check_out_date) as latest_checkout
FROM airbnb_reservations_staging s
WHERE s.mapping_status = 'failed' OR s.mapping_status = 'pending'
GROUP BY s.listing_id
ORDER BY reservations_count DESC;

-- FIN
SELECT 
  '✓ Analyse rapide terminée' as status,
  NOW() as analyzed_at;
