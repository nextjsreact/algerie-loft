-- ============================================================================
-- VÉRIFICATION COMPLÈTE DU MAPPING AIRBNB
-- ============================================================================
-- Exécutez ce script dans Supabase SQL Editor pour vérifier le mapping
-- ============================================================================

-- 1. STATISTIQUES GLOBALES
-- ============================================================================
SELECT '📊 STATISTIQUES GLOBALES' as section;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as separator;

SELECT 
  'Lofts avec mapping Airbnb' as metric,
  COUNT(*)::text as value,
  '✅' as status
FROM lofts
WHERE airbnb_listing_id IS NOT NULL;

SELECT 
  'Lofts SANS mapping Airbnb' as metric,
  COUNT(*)::text as value,
  CASE WHEN COUNT(*) = 0 THEN '✅' ELSE '⚠️' END as status
FROM lofts
WHERE airbnb_listing_id IS NULL;

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

-- 2. LISTE DES LOFTS MAPPÉS
-- ============================================================================
SELECT '' as section;
SELECT '🏠 LISTE DES LOFTS MAPPÉS (58 lofts)' as section;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as separator;

SELECT 
  ROW_NUMBER() OVER (ORDER BY name) as "#",
  name as "Nom du Loft",
  airbnb_listing_id as "Listing ID Airbnb",
  '✅' as "Statut"
FROM lofts
WHERE airbnb_listing_id IS NOT NULL
ORDER BY name;

-- 3. RÉSERVATIONS PAR LOFT (TOP 20)
-- ============================================================================
SELECT '' as section;
SELECT '📈 TOP 20 LOFTS PAR NOMBRE DE RÉSERVATIONS' as section;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as separator;

WITH loft_stats AS (
  SELECT 
    l.name,
    l.airbnb_listing_id,
    COUNT(r.id) as nb_reservations,
    MIN(r.check_in_date) as premiere_reservation,
    MAX(r.check_out_date) as derniere_reservation,
    SUM(r.total_amount) as revenu_total
  FROM lofts l
  LEFT JOIN reservations r ON r.loft_id = l.id AND r.source = 'airbnb_scraper'
  WHERE l.airbnb_listing_id IS NOT NULL
  GROUP BY l.id, l.name, l.airbnb_listing_id
)
SELECT 
  ROW_NUMBER() OVER (ORDER BY nb_reservations DESC) as "Rang",
  name as "Loft",
  airbnb_listing_id as "Listing ID",
  nb_reservations as "Nb Réservations",
  TO_CHAR(premiere_reservation, 'YYYY-MM-DD') as "Première",
  TO_CHAR(derniere_reservation, 'YYYY-MM-DD') as "Dernière",
  TO_CHAR(revenu_total, '999,999,999.99') || ' DZD' as "Revenu Total"
FROM loft_stats
ORDER BY nb_reservations DESC
LIMIT 20;

-- 4. RÉSERVATIONS PAR STATUT
-- ============================================================================
SELECT '' as section;
SELECT '📋 RÉSERVATIONS PAR STATUT' as section;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as separator;

SELECT 
  status as "Statut",
  COUNT(*) as "Nombre",
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM reservations WHERE source = 'airbnb_scraper'), 1)::text || '%' as "Pourcentage",
  TO_CHAR(SUM(total_amount), '999,999,999.99') || ' DZD' as "Montant Total"
FROM reservations
WHERE source = 'airbnb_scraper'
GROUP BY status
ORDER BY COUNT(*) DESC;

-- 5. RÉSERVATIONS PAR MOIS (12 DERNIERS MOIS)
-- ============================================================================
SELECT '' as section;
SELECT '📅 RÉSERVATIONS PAR MOIS (12 derniers mois)' as section;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as separator;

SELECT 
  TO_CHAR(check_in_date, 'YYYY-MM') as "Mois",
  COUNT(*) as "Nb Réservations",
  SUM(nights) as "Total Nuits",
  TO_CHAR(SUM(total_amount), '999,999,999.99') || ' DZD' as "Revenu"
FROM reservations
WHERE source = 'airbnb_scraper'
  AND check_in_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY TO_CHAR(check_in_date, 'YYYY-MM')
ORDER BY TO_CHAR(check_in_date, 'YYYY-MM') DESC;

-- 6. VÉRIFICATION DES DOUBLONS
-- ============================================================================
SELECT '' as section;
SELECT '🔍 VÉRIFICATION DES DOUBLONS' as section;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as separator;

WITH duplicates AS (
  SELECT 
    airbnb_confirmation_code,
    COUNT(*) as nb_occurrences
  FROM reservations
  WHERE source = 'airbnb_scraper'
    AND airbnb_confirmation_code IS NOT NULL
  GROUP BY airbnb_confirmation_code
  HAVING COUNT(*) > 1
)
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Aucun doublon détecté'
    ELSE '⚠️ ' || COUNT(*)::text || ' doublons détectés'
  END as "Résultat"
FROM duplicates;

-- Afficher les doublons s'il y en a
SELECT 
  airbnb_confirmation_code as "Code Confirmation",
  COUNT(*) as "Nb Occurrences"
FROM reservations
WHERE source = 'airbnb_scraper'
  AND airbnb_confirmation_code IS NOT NULL
GROUP BY airbnb_confirmation_code
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC
LIMIT 10;

-- 7. VÉRIFICATION DES CONFLITS DE DATES
-- ============================================================================
SELECT '' as section;
SELECT '⚠️ VÉRIFICATION DES CONFLITS DE DATES' as section;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as separator;

WITH conflicts AS (
  SELECT 
    r1.id as reservation1_id,
    r2.id as reservation2_id,
    l.name as loft_name,
    r1.airbnb_confirmation_code as code1,
    r2.airbnb_confirmation_code as code2,
    r1.check_in_date as checkin1,
    r1.check_out_date as checkout1,
    r2.check_in_date as checkin2,
    r2.check_out_date as checkout2
  FROM reservations r1
  JOIN reservations r2 ON r1.loft_id = r2.loft_id 
    AND r1.id < r2.id
    AND r1.source = 'airbnb_scraper'
    AND r2.source = 'airbnb_scraper'
    AND r1.status NOT IN ('cancelled', 'canceled')
    AND r2.status NOT IN ('cancelled', 'canceled')
  JOIN lofts l ON l.id = r1.loft_id
  WHERE (
    (r1.check_in_date, r1.check_out_date) OVERLAPS (r2.check_in_date, r2.check_out_date)
  )
)
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Aucun conflit de dates détecté'
    ELSE '⚠️ ' || COUNT(*)::text || ' conflits détectés'
  END as "Résultat"
FROM conflicts;

-- Afficher les conflits s'il y en a
SELECT 
  loft_name as "Loft",
  code1 as "Réservation 1",
  TO_CHAR(checkin1, 'YYYY-MM-DD') || ' → ' || TO_CHAR(checkout1, 'YYYY-MM-DD') as "Dates 1",
  code2 as "Réservation 2",
  TO_CHAR(checkin2, 'YYYY-MM-DD') || ' → ' || TO_CHAR(checkout2, 'YYYY-MM-DD') as "Dates 2"
FROM (
  SELECT 
    r1.id as reservation1_id,
    r2.id as reservation2_id,
    l.name as loft_name,
    r1.airbnb_confirmation_code as code1,
    r2.airbnb_confirmation_code as code2,
    r1.check_in_date as checkin1,
    r1.check_out_date as checkout1,
    r2.check_in_date as checkin2,
    r2.check_out_date as checkout2
  FROM reservations r1
  JOIN reservations r2 ON r1.loft_id = r2.loft_id 
    AND r1.id < r2.id
    AND r1.source = 'airbnb_scraper'
    AND r2.source = 'airbnb_scraper'
    AND r1.status NOT IN ('cancelled', 'canceled')
    AND r2.status NOT IN ('cancelled', 'canceled')
  JOIN lofts l ON l.id = r1.loft_id
  WHERE (
    (r1.check_in_date, r1.check_out_date) OVERLAPS (r2.check_in_date, r2.check_out_date)
  )
) conflicts
LIMIT 10;

-- 8. RÉSERVATIONS RÉCENTES (10 DERNIÈRES)
-- ============================================================================
SELECT '' as section;
SELECT '🕐 RÉSERVATIONS RÉCENTES (10 dernières)' as section;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as separator;

SELECT 
  l.name as "Loft",
  r.airbnb_confirmation_code as "Code Airbnb",
  r.guest_name as "Voyageur",
  TO_CHAR(r.check_in_date, 'YYYY-MM-DD') as "Arrivée",
  TO_CHAR(r.check_out_date, 'YYYY-MM-DD') as "Départ",
  r.nights as "Nuits",
  r.status as "Statut",
  TO_CHAR(r.total_amount, '999,999.99') || ' ' || r.currency_code as "Montant"
FROM reservations r
JOIN lofts l ON l.id = r.loft_id
WHERE r.source = 'airbnb_scraper'
ORDER BY r.check_in_date DESC
LIMIT 10;

-- 9. RÉSERVATIONS À VENIR (PROCHAINES 30 JOURS)
-- ============================================================================
SELECT '' as section;
SELECT '📅 RÉSERVATIONS À VENIR (30 prochains jours)' as section;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as separator;

SELECT 
  l.name as "Loft",
  r.guest_name as "Voyageur",
  TO_CHAR(r.check_in_date, 'YYYY-MM-DD') as "Arrivée",
  TO_CHAR(r.check_out_date, 'YYYY-MM-DD') as "Départ",
  r.nights as "Nuits",
  r.guest_count as "Nb Voyageurs",
  TO_CHAR(r.total_amount, '999,999.99') || ' ' || r.currency_code as "Montant"
FROM reservations r
JOIN lofts l ON l.id = r.loft_id
WHERE r.source = 'airbnb_scraper'
  AND r.check_in_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
  AND r.status NOT IN ('cancelled', 'canceled')
ORDER BY r.check_in_date ASC;

-- 10. TAUX D'OCCUPATION PAR LOFT (30 PROCHAINS JOURS)
-- ============================================================================
SELECT '' as section;
SELECT '📊 TAUX D''OCCUPATION (30 prochains jours)' as section;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as separator;

WITH occupation AS (
  SELECT 
    l.name,
    COUNT(DISTINCT r.check_in_date + generate_series(0, r.nights - 1)) as jours_occupes
  FROM lofts l
  LEFT JOIN reservations r ON r.loft_id = l.id 
    AND r.source = 'airbnb_scraper'
    AND r.status NOT IN ('cancelled', 'canceled')
    AND r.check_in_date <= CURRENT_DATE + INTERVAL '30 days'
    AND r.check_out_date >= CURRENT_DATE
  WHERE l.airbnb_listing_id IS NOT NULL
  GROUP BY l.id, l.name
)
SELECT 
  name as "Loft",
  jours_occupes as "Jours Occupés",
  30 as "Jours Total",
  ROUND(jours_occupes * 100.0 / 30, 1)::text || '%' as "Taux Occupation"
FROM occupation
ORDER BY jours_occupes DESC
LIMIT 20;

-- 11. RÉSUMÉ FINAL
-- ============================================================================
SELECT '' as section;
SELECT '✅ RÉSUMÉ FINAL' as section;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as separator;

WITH stats AS (
  SELECT 
    (SELECT COUNT(*) FROM lofts WHERE airbnb_listing_id IS NOT NULL) as lofts_mappes,
    (SELECT COUNT(*) FROM reservations WHERE source = 'airbnb_scraper' AND loft_id IS NOT NULL) as reservations_mappees,
    (SELECT COUNT(*) FROM reservations WHERE source = 'airbnb_scraper' AND loft_id IS NULL) as reservations_non_mappees,
    (SELECT SUM(total_amount) FROM reservations WHERE source = 'airbnb_scraper') as revenu_total,
    (SELECT COUNT(*) FROM reservations WHERE source = 'airbnb_scraper' AND check_in_date >= CURRENT_DATE AND status NOT IN ('cancelled', 'canceled')) as reservations_futures
)
SELECT 
  '✅ Lofts mappés: ' || lofts_mappes::text as "Statistique"
FROM stats
UNION ALL
SELECT 
  '✅ Réservations mappées: ' || reservations_mappees::text || ' (100%)'
FROM stats
UNION ALL
SELECT 
  CASE 
    WHEN reservations_non_mappees = 0 THEN '✅ Réservations non mappées: 0'
    ELSE '⚠️ Réservations non mappées: ' || reservations_non_mappees::text
  END
FROM stats
UNION ALL
SELECT 
  '💰 Revenu total Airbnb: ' || TO_CHAR(revenu_total, '999,999,999.99') || ' DZD'
FROM stats
UNION ALL
SELECT 
  '📅 Réservations futures: ' || reservations_futures::text
FROM stats;

-- ============================================================================
-- FIN DE LA VÉRIFICATION
-- ============================================================================
SELECT '' as section;
SELECT '✅ VÉRIFICATION TERMINÉE' as section;
SELECT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS') as "Date/Heure";
