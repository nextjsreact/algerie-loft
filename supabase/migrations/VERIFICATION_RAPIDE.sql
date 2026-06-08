-- ============================================================================
-- VÉRIFICATION RAPIDE DU MAPPING AIRBNB (1 minute)
-- ============================================================================
-- Script simplifié pour vérifier rapidement que tout fonctionne
-- ============================================================================

-- 1. STATISTIQUES PRINCIPALES
-- ============================================================================
SELECT '📊 STATISTIQUES PRINCIPALES' as section;

SELECT 
  'Lofts avec mapping Airbnb' as metric,
  COUNT(*)::text as value,
  '✅' as status
FROM lofts
WHERE airbnb_listing_id IS NOT NULL;

SELECT 
  'Réservations Airbnb avec loft' as metric,
  COUNT(*)::text as value,
  '✅' as status
FROM reservations
WHERE source = 'airbnb_scraper'
  AND loft_id IS NOT NULL;

SELECT 
  'Réservations Airbnb SANS loft' as metric,
  COUNT(*)::text as value,
  CASE WHEN COUNT(*) = 0 THEN '✅' ELSE '❌' END as status
FROM reservations
WHERE source = 'airbnb_scraper'
  AND loft_id IS NULL;

-- 2. TAUX DE MAPPING
-- ============================================================================
SELECT '' as section;
SELECT '📈 TAUX DE MAPPING' as section;

WITH stats AS (
  SELECT 
    COUNT(*) FILTER (WHERE airbnb_listing_id IS NOT NULL) as lofts_mappes,
    COUNT(*) as total_lofts
  FROM lofts
)
SELECT 
  'Lofts' as type,
  lofts_mappes::text || ' / ' || total_lofts::text as ratio,
  ROUND(lofts_mappes * 100.0 / NULLIF(total_lofts, 0), 1)::text || '%' as taux,
  CASE 
    WHEN lofts_mappes = total_lofts THEN '✅ Parfait'
    ELSE '⚠️ Incomplet'
  END as statut
FROM stats;

WITH stats AS (
  SELECT 
    COUNT(*) FILTER (WHERE loft_id IS NOT NULL) as reservations_mappees,
    COUNT(*) as total_reservations
  FROM reservations
  WHERE source = 'airbnb_scraper'
)
SELECT 
  'Réservations' as type,
  reservations_mappees::text || ' / ' || total_reservations::text as ratio,
  ROUND(reservations_mappees * 100.0 / NULLIF(total_reservations, 0), 1)::text || '%' as taux,
  CASE 
    WHEN reservations_mappees = total_reservations THEN '✅ Parfait'
    ELSE '❌ Problème'
  END as statut
FROM stats;

-- 3. TOP 5 LOFTS
-- ============================================================================
SELECT '' as section;
SELECT '🏆 TOP 5 LOFTS' as section;

SELECT 
  ROW_NUMBER() OVER (ORDER BY COUNT(r.id) DESC) as rang,
  l.name as loft,
  COUNT(r.id) as nb_reservations
FROM lofts l
LEFT JOIN reservations r ON r.loft_id = l.id AND r.source = 'airbnb_scraper'
WHERE l.airbnb_listing_id IS NOT NULL
GROUP BY l.id, l.name
ORDER BY COUNT(r.id) DESC
LIMIT 5;

-- 4. RÉSERVATIONS À VENIR
-- ============================================================================
SELECT '' as section;
SELECT '📅 RÉSERVATIONS À VENIR (7 jours)' as section;

SELECT 
  COUNT(*) as nb_reservations,
  SUM(nights) as total_nuits,
  TO_CHAR(SUM(total_amount), '999,999.99') || ' DZD' as revenu_prevu
FROM reservations
WHERE source = 'airbnb_scraper'
  AND check_in_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
  AND status NOT IN ('cancelled', 'canceled');

-- 5. REVENU TOTAL
-- ============================================================================
SELECT '' as section;
SELECT '💰 REVENU TOTAL AIRBNB' as section;

SELECT 
  COUNT(*) as nb_reservations,
  TO_CHAR(SUM(total_amount), '999,999,999.99') || ' DZD' as revenu_total,
  TO_CHAR(AVG(total_amount), '999,999.99') || ' DZD' as revenu_moyen
FROM reservations
WHERE source = 'airbnb_scraper';

-- 6. DERNIÈRE SYNCHRONISATION
-- ============================================================================
SELECT '' as section;
SELECT '⏰ DERNIÈRE SYNCHRONISATION' as section;

SELECT 
  TO_CHAR(started_at, 'YYYY-MM-DD HH24:MI:SS') as date_sync,
  sync_type as type,
  status,
  reservations_received as recues,
  COALESCE(reservations_created, 0) as creees,
  COALESCE(reservations_updated, 0) as maj,
  COALESCE(reservations_failed, 0) as echecs
FROM airbnb_sync_logs
ORDER BY started_at DESC
LIMIT 1;

-- 7. RÉSUMÉ FINAL
-- ============================================================================
SELECT '' as section;
SELECT '✅ RÉSUMÉ' as section;

WITH stats AS (
  SELECT 
    (SELECT COUNT(*) FROM lofts WHERE airbnb_listing_id IS NOT NULL) as lofts_mappes,
    (SELECT COUNT(*) FROM reservations WHERE source = 'airbnb_scraper' AND loft_id IS NOT NULL) as reservations_mappees,
    (SELECT COUNT(*) FROM reservations WHERE source = 'airbnb_scraper' AND loft_id IS NULL) as reservations_non_mappees
)
SELECT 
  CASE 
    WHEN reservations_non_mappees = 0 THEN '🎉 MAPPING PARFAIT !'
    ELSE '⚠️ MAPPING INCOMPLET'
  END as resultat,
  lofts_mappes::text || ' lofts mappés' as lofts,
  reservations_mappees::text || ' réservations mappées' as reservations,
  CASE 
    WHEN reservations_non_mappees = 0 THEN '✅ Taux: 100%'
    ELSE '❌ ' || reservations_non_mappees::text || ' réservations sans loft'
  END as details
FROM stats;

-- ============================================================================
SELECT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS') as verification_terminee;
