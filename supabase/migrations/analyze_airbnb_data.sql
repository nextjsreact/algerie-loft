-- ============================================================================
-- Analyse des Données Airbnb Existantes
-- ============================================================================
-- Ce script analyse les données Airbnb déjà présentes dans la base de données

-- ============================================================================
-- 1. LOFT AVEC MAPPING AIRBNB
-- ============================================================================
SELECT 
  '=== LOFT AVEC MAPPING AIRBNB ===' as section;

SELECT 
  id,
  name,
  airbnb_listing_id,
  address,
  city,
  created_at
FROM lofts
WHERE airbnb_listing_id IS NOT NULL
ORDER BY name;

-- ============================================================================
-- 2. RÉSERVATIONS AIRBNB SYNCHRONISÉES
-- ============================================================================
SELECT 
  '=== RÉSERVATIONS AIRBNB SYNCHRONISÉES ===' as section;

SELECT 
  r.id,
  l.name as loft_name,
  r.guest_name,
  r.guest_count,
  r.check_in_date,
  r.check_out_date,
  r.nights,
  r.total_amount,
  r.currency_code,
  r.status,
  r.airbnb_confirmation_code,
  r.source,
  r.synced_at,
  r.created_at
FROM reservations r
LEFT JOIN lofts l ON r.loft_id = l.id
WHERE r.source = 'airbnb_scraper'
ORDER BY r.created_at DESC;

-- ============================================================================
-- 3. RÉSERVATIONS EN STAGING (EN ATTENTE)
-- ============================================================================
SELECT 
  '=== RÉSERVATIONS EN STAGING ===' as section;

SELECT 
  s.id,
  s.airbnb_id,
  s.listing_id,
  l.name as loft_name,
  s.guest_name,
  s.check_in_date,
  s.check_out_date,
  s.nights,
  s.total_amount,
  s.currency_code,
  s.status,
  s.mapping_status,
  s.validation_status,
  s.reconciliation_status,
  s.reconciliation_action,
  s.sync_type,
  s.created_at,
  s.processed_at
FROM airbnb_reservations_staging s
LEFT JOIN lofts l ON s.loft_id = l.id
ORDER BY s.created_at DESC;

-- ============================================================================
-- 4. LOGS DE SYNCHRONISATION
-- ============================================================================
SELECT 
  '=== LOGS DE SYNCHRONISATION ===' as section;

SELECT 
  sync_batch_id,
  sync_type,
  status,
  lofts_processed,
  reservations_received,
  reservations_created,
  reservations_updated,
  reservations_skipped,
  reservations_failed,
  conflicts_detected,
  started_at,
  completed_at,
  duration_ms,
  script_version,
  triggered_by
FROM airbnb_sync_logs
ORDER BY started_at DESC;

-- ============================================================================
-- 5. CONFLITS DÉTECTÉS
-- ============================================================================
SELECT 
  '=== CONFLITS DÉTECTÉS ===' as section;

SELECT 
  c.id as conflict_id,
  l.name as loft_name,
  l.airbnb_listing_id,
  r1.guest_name as reservation_1_guest,
  r1.airbnb_confirmation_code as res1_airbnb_code,
  r1.check_in_date as res1_checkin,
  r1.check_out_date as res1_checkout,
  r1.status as res1_status,
  r1.source as res1_source,
  r2.guest_name as reservation_2_guest,
  r2.airbnb_confirmation_code as res2_airbnb_code,
  r2.check_in_date as res2_checkin,
  r2.check_out_date as res2_checkout,
  r2.status as res2_status,
  r2.source as res2_source,
  c.overlap_start,
  c.overlap_end,
  c.overlap_nights,
  c.severity,
  c.status as conflict_status,
  c.notification_sent,
  c.created_at
FROM airbnb_conflicts c
JOIN lofts l ON c.loft_id = l.id
JOIN reservations r1 ON c.reservation_1_id = r1.id
JOIN reservations r2 ON c.reservation_2_id = r2.id
ORDER BY c.created_at DESC;

-- ============================================================================
-- 6. STATISTIQUES GLOBALES
-- ============================================================================
SELECT 
  '=== STATISTIQUES GLOBALES ===' as section;

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
  'Réservations Manuelles' as metric,
  COUNT(*) as count
FROM reservations
WHERE source = 'manual'
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
  'Syncs Échoués' as metric,
  COUNT(*) as count
FROM airbnb_sync_logs
WHERE status = 'failed'
UNION ALL
SELECT 
  'Conflits Ouverts' as metric,
  COUNT(*) as count
FROM airbnb_conflicts
WHERE status = 'open';

-- ============================================================================
-- 7. RÉSERVATIONS PAR SOURCE
-- ============================================================================
SELECT 
  '=== RÉSERVATIONS PAR SOURCE ===' as section;

SELECT 
  source,
  COUNT(*) as total_reservations,
  SUM(total_amount) as total_revenue,
  MIN(check_in_date) as earliest_checkin,
  MAX(check_out_date) as latest_checkout
FROM reservations
GROUP BY source
ORDER BY total_reservations DESC;

-- ============================================================================
-- FIN DE L'ANALYSE
-- ============================================================================
SELECT 
  '✓ Analyse terminée' as status,
  NOW() as analyzed_at;
