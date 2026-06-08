-- ============================================================================
-- EXTRACTION DES LISTING IDS POUR MAPPING
-- ============================================================================
-- Ce script extrait tous les listing_id uniques depuis les réservations Airbnb
-- et génère les requêtes SQL UPDATE pour créer le mapping
-- ============================================================================

-- 1. LISTER TOUS LES LOFTS EXISTANTS
-- ============================================================================
SELECT '🏠 LOFTS EXISTANTS DANS LA BASE' as section;

SELECT 
  id as loft_uuid,
  name as loft_name,
  COALESCE(airbnb_listing_id, '❌ Non mappé') as airbnb_listing_id,
  CASE 
    WHEN airbnb_listing_id IS NOT NULL THEN '✅ Mappé'
    ELSE '⚠️  À mapper'
  END as statut
FROM lofts
ORDER BY name;

-- ============================================================================
-- 2. EXTRAIRE LES LISTING IDS DEPUIS LES CODES DE CONFIRMATION
-- ============================================================================
-- Note: Les codes Airbnb ont le format HMABCD123 où les chiffres peuvent
-- correspondre au listing_id, mais ce n'est pas toujours le cas.
-- Il faut identifier manuellement les listing_ids.

SELECT '' as section;
SELECT '📊 ANALYSE DES CODES DE CONFIRMATION AIRBNB' as section;

-- Compter les réservations par préfixe de code
WITH code_analysis AS (
  SELECT 
    SUBSTRING(airbnb_confirmation_code FROM 1 FOR 2) as prefix,
    COUNT(*) as nb_reservations,
    COUNT(DISTINCT SUBSTRING(airbnb_confirmation_code FROM 3)) as nb_codes_uniques,
    MIN(check_in_date) as premiere_date,
    MAX(check_out_date) as derniere_date,
    STRING_AGG(DISTINCT SUBSTRING(airbnb_confirmation_code FROM 1 FOR 10), ', ') as exemples_codes
  FROM reservations
  WHERE source = 'airbnb'
    AND airbnb_confirmation_code IS NOT NULL
  GROUP BY SUBSTRING(airbnb_confirmation_code FROM 1 FOR 2)
)
SELECT 
  prefix,
  nb_reservations,
  nb_codes_uniques,
  TO_CHAR(premiere_date, 'YYYY-MM-DD') as premiere_date,
  TO_CHAR(derniere_date, 'YYYY-MM-DD') as derniere_date,
  LEFT(exemples_codes, 100) as exemples_codes
FROM code_analysis
ORDER BY nb_reservations DESC;

-- ============================================================================
-- 3. RÉSERVATIONS PAR LOFT (SI DÉJÀ MAPPÉES)
-- ============================================================================
SELECT '' as section;
SELECT '📊 RÉSERVATIONS PAR LOFT (SI MAPPÉES)' as section;

SELECT 
  l.name as loft_name,
  l.airbnb_listing_id,
  COUNT(r.id) as nb_reservations_airbnb,
  MIN(r.check_in_date) as premiere_reservation,
  MAX(r.check_out_date) as derniere_reservation
FROM lofts l
LEFT JOIN reservations r ON r.loft_id = l.id AND r.source = 'airbnb'
WHERE l.airbnb_listing_id IS NOT NULL
GROUP BY l.id, l.name, l.airbnb_listing_id
ORDER BY COUNT(r.id) DESC;

-- ============================================================================
-- 4. RÉSERVATIONS ORPHELINES (SANS LOFT)
-- ============================================================================
SELECT '' as section;
SELECT '⚠️  RÉSERVATIONS SANS LOFT (TOP 20)' as section;

SELECT 
  airbnb_confirmation_code,
  guest_name,
  TO_CHAR(check_in_date, 'YYYY-MM-DD') as check_in,
  TO_CHAR(check_out_date, 'YYYY-MM-DD') as check_out,
  nights,
  status,
  total_amount,
  currency_code
FROM reservations
WHERE source = 'airbnb'
  AND loft_id IS NULL
ORDER BY check_in_date DESC
LIMIT 20;

-- ============================================================================
-- 5. TEMPLATE SQL POUR CRÉER LE MAPPING
-- ============================================================================
SELECT '' as section;
SELECT '📝 TEMPLATE SQL POUR MAPPING' as section;

-- Afficher un exemple de requête UPDATE
SELECT 
  '-- Exemple de mapping:' as template
UNION ALL
SELECT 
  'UPDATE lofts SET airbnb_listing_id = ''27940108'' WHERE name = ''Nom du Loft'';'
UNION ALL
SELECT 
  'UPDATE lofts SET airbnb_listing_id = ''40739075'' WHERE name = ''Autre Loft'';'
UNION ALL
SELECT 
  ''
UNION ALL
SELECT 
  '-- Ou par UUID (plus sûr):'
UNION ALL
SELECT 
  'UPDATE lofts SET airbnb_listing_id = ''27940108'' WHERE id = ''uuid-du-loft'';';

-- ============================================================================
-- 6. GÉNÉRER LES REQUÊTES UPDATE POUR TOUS LES LOFTS
-- ============================================================================
SELECT '' as section;
SELECT '🔧 REQUÊTES UPDATE À COMPLÉTER' as section;

-- Générer une requête UPDATE pour chaque loft
SELECT 
  'UPDATE lofts SET airbnb_listing_id = ''LISTING_ID_ICI'' WHERE id = ''' || id || '''; -- ' || name as requete_sql
FROM lofts
WHERE airbnb_listing_id IS NULL
ORDER BY name;

-- ============================================================================
-- 7. STATISTIQUES FINALES
-- ============================================================================
SELECT '' as section;
SELECT '📊 STATISTIQUES FINALES' as section;

SELECT 
  'Total lofts' as metric,
  COUNT(*)::text as value
FROM lofts
UNION ALL
SELECT 
  'Lofts avec mapping Airbnb',
  COUNT(*)::text
FROM lofts
WHERE airbnb_listing_id IS NOT NULL
UNION ALL
SELECT 
  'Lofts SANS mapping Airbnb',
  COUNT(*)::text
FROM lofts
WHERE airbnb_listing_id IS NULL
UNION ALL
SELECT 
  'Réservations Airbnb totales',
  COUNT(*)::text
FROM reservations
WHERE source = 'airbnb'
UNION ALL
SELECT 
  'Réservations Airbnb AVEC loft',
  COUNT(*)::text
FROM reservations
WHERE source = 'airbnb'
  AND loft_id IS NOT NULL
UNION ALL
SELECT 
  'Réservations Airbnb SANS loft',
  COUNT(*)::text
FROM reservations
WHERE source = 'airbnb'
  AND loft_id IS NULL;

-- ============================================================================
-- 8. PROCHAINES ÉTAPES
-- ============================================================================
SELECT '' as section;
SELECT '🎯 PROCHAINES ÉTAPES' as section;

SELECT 
  '1. Identifier les listing_ids Airbnb (depuis le site Airbnb)' as etape
UNION ALL
SELECT 
  '2. Compléter les requêtes UPDATE ci-dessus avec les vrais listing_ids'
UNION ALL
SELECT 
  '3. Exécuter les requêtes UPDATE'
UNION ALL
SELECT 
  '4. Relancer la synchronisation pour mapper les réservations aux lofts'
UNION ALL
SELECT 
  '5. Vérifier avec diagnostic_rapide.sql';

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
SELECT '' as section;
SELECT '✅ EXTRACTION TERMINÉE' as section;
SELECT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS') as timestamp;
