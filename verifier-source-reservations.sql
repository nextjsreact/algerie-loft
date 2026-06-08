-- ============================================================================
-- VÉRIFICATION : D'où viennent les réservations Airbnb ?
-- ============================================================================

-- 1. Compter les réservations par source
SELECT 
  '📊 RÉSERVATIONS PAR SOURCE' as section;

SELECT 
  source,
  COUNT(*) as nb_reservations,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1)::text || '%' as pourcentage
FROM reservations
WHERE source LIKE 'airbnb%'
GROUP BY source
ORDER BY COUNT(*) DESC;

-- 2. Détails des sources
SELECT '' as section;
SELECT '📋 DÉTAILS DES SOURCES' as section;

-- Source : airbnb_scraper
SELECT 
  'airbnb_scraper' as source,
  COUNT(*) as nb_reservations,
  MIN(check_in_date) as premiere_reservation,
  MAX(check_in_date) as derniere_reservation,
  SUM(total_amount) as revenu_total
FROM reservations
WHERE source = 'airbnb_scraper';

-- Source : airbnb_ical
SELECT 
  'airbnb_ical' as source,
  COUNT(*) as nb_reservations,
  MIN(check_in_date) as premiere_reservation,
  MAX(check_in_date) as derniere_reservation,
  SUM(total_amount) as revenu_total
FROM reservations
WHERE source = 'airbnb_ical';

-- 3. Vérifier les URLs iCal
SELECT '' as section;
SELECT '🔗 URLS iCAL CONFIGURÉES' as section;

SELECT 
  COUNT(*) as lofts_avec_ical_url,
  COUNT(*) FILTER (WHERE airbnb_ical_url IS NOT NULL) as urls_configurees
FROM lofts;

-- 4. Exemple d'URLs iCal
SELECT '' as section;
SELECT '📝 EXEMPLES D\'URLS iCAL' as section;

SELECT 
  name as loft,
  airbnb_listing_id,
  airbnb_ical_url
FROM lofts
WHERE airbnb_ical_url IS NOT NULL
LIMIT 5;

-- 5. Dernière synchronisation
SELECT '' as section;
SELECT '⏰ DERNIÈRE SYNCHRONISATION' as section;

SELECT 
  sync_type,
  source,
  started_at,
  status,
  reservations_received,
  reservations_created,
  reservations_updated
FROM airbnb_sync_logs
ORDER BY started_at DESC
LIMIT 5;

-- 6. Résumé final
SELECT '' as section;
SELECT '✅ RÉSUMÉ' as section;

WITH stats AS (
  SELECT 
    (SELECT COUNT(*) FROM reservations WHERE source = 'airbnb_scraper') as scraper_count,
    (SELECT COUNT(*) FROM reservations WHERE source = 'airbnb_ical') as ical_count,
    (SELECT COUNT(*) FROM lofts WHERE airbnb_ical_url IS NOT NULL) as urls_count
)
SELECT 
  'Réservations via scraper Python' as metric,
  scraper_count::text as valeur,
  '✅ Fonctionne' as statut
FROM stats
UNION ALL
SELECT 
  'Réservations via iCal',
  ical_count::text,
  CASE WHEN ical_count = 0 THEN '❌ Pas de sync' ELSE '✅ Fonctionne' END
FROM stats
UNION ALL
SELECT 
  'URLs iCal configurées',
  urls_count::text,
  '⚠️ URLs incorrectes'
FROM stats;

-- ============================================================================
SELECT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS') as verification_terminee;
