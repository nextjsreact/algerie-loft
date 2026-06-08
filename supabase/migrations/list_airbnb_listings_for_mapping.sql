-- ============================================================================
-- Script: Lister les Listing IDs Airbnb pour Mapping
-- ============================================================================
-- Description: Identifie tous les listing_id Airbnb et aide à créer le mapping
--              avec les lofts existants
-- Usage: Exécuter dans Supabase SQL Editor après l'import des données
-- ============================================================================

-- ============================================================================
-- 1. LISTE DES LISTING IDS AVEC STATISTIQUES
-- ============================================================================
SELECT 
  '📊 LISTING IDS AIRBNB À MAPPER' as section,
  '' as listing_id,
  '' as nb_reservations,
  '' as premiere_date,
  '' as derniere_date,
  '' as montant_total;

-- Extraire les listing_id depuis les données JSON dans staging
-- (si les données sont dans staging)
WITH listing_stats AS (
  SELECT 
    listing_id,
    COUNT(*) as nb_reservations,
    MIN(check_in_date) as premiere_date,
    MAX(check_out_date) as derniere_date,
    SUM(total_amount) as montant_total
  FROM airbnb_reservations_staging
  GROUP BY listing_id
)
SELECT 
  '' as section,
  listing_id,
  nb_reservations::text as nb_reservations,
  TO_CHAR(premiere_date, 'DD/MM/YYYY') as premiere_date,
  TO_CHAR(derniere_date, 'DD/MM/YYYY') as derniere_date,
  ROUND(montant_total, 2)::text as montant_total
FROM listing_stats
ORDER BY nb_reservations DESC;

-- ============================================================================
-- 2. ALTERNATIVE : Si les données sont déjà dans reservations
-- ============================================================================
-- Décommenter si les données sont dans reservations mais sans loft_id

-- SELECT 
--   '📊 LISTING IDS DEPUIS RESERVATIONS' as section,
--   '' as airbnb_code_prefix,
--   '' as nb_reservations,
--   '' as premiere_date,
--   '' as derniere_date;

-- WITH listing_from_reservations AS (
--   SELECT 
--     SUBSTRING(airbnb_confirmation_code FROM 1 FOR 8) as code_prefix,
--     COUNT(*) as nb_reservations,
--     MIN(check_in_date) as premiere_date,
--     MAX(check_out_date) as derniere_date
--   FROM reservations
--   WHERE source = 'airbnb'
--     AND loft_id IS NULL
--   GROUP BY SUBSTRING(airbnb_confirmation_code FROM 1 FOR 8)
-- )
-- SELECT 
--   '' as section,
--   code_prefix as airbnb_code_prefix,
--   nb_reservations::text as nb_reservations,
--   TO_CHAR(premiere_date, 'DD/MM/YYYY') as premiere_date,
--   TO_CHAR(derniere_date, 'DD/MM/YYYY') as derniere_date
-- FROM listing_from_reservations
-- ORDER BY nb_reservations DESC;

-- ============================================================================
-- 3. LOFTS EXISTANTS (POUR RÉFÉRENCE)
-- ============================================================================
SELECT 
  '' as section,
  '' as listing_id,
  '' as nb_reservations,
  '' as premiere_date,
  '' as derniere_date,
  '' as montant_total;

SELECT 
  '🏠 LOFTS EXISTANTS' as section,
  '' as loft_id,
  '' as loft_name,
  '' as airbnb_listing_id,
  '' as status;

SELECT 
  '' as section,
  id::text as loft_id,
  name as loft_name,
  COALESCE(airbnb_listing_id, '❌ Non mappé') as airbnb_listing_id,
  CASE 
    WHEN airbnb_listing_id IS NOT NULL THEN '✅ Mappé'
    ELSE '⚠️ À mapper'
  END as status
FROM lofts
ORDER BY name;

-- ============================================================================
-- 4. TEMPLATE SQL POUR CRÉER LE MAPPING
-- ============================================================================
SELECT 
  '' as section,
  '' as loft_id,
  '' as loft_name,
  '' as airbnb_listing_id,
  '' as status;

SELECT 
  '📝 TEMPLATE SQL POUR MAPPING' as section,
  '' as sql_command,
  '' as description,
  '' as exemple,
  '' as notes;

SELECT 
  '' as section,
  'UPDATE lofts SET airbnb_listing_id = ''LISTING_ID'' WHERE id = ''LOFT_UUID'';' as sql_command,
  'Mapper un loft par UUID' as description,
  'UPDATE lofts SET airbnb_listing_id = ''27940108'' WHERE id = ''123e4567-e89b-12d3-a456-426614174000'';' as exemple,
  'Utiliser l''UUID du loft (plus sûr)' as notes;

SELECT 
  '' as section,
  'UPDATE lofts SET airbnb_listing_id = ''LISTING_ID'' WHERE name = ''NOM_LOFT'';' as sql_command,
  'Mapper un loft par nom' as description,
  'UPDATE lofts SET airbnb_listing_id = ''27940108'' WHERE name = ''Loft Alger Centre'';' as exemple,
  'Utiliser le nom du loft (plus lisible)' as notes;

-- ============================================================================
-- 5. VÉRIFICATION DU MAPPING
-- ============================================================================
SELECT 
  '' as section,
  '' as sql_command,
  '' as description,
  '' as exemple,
  '' as notes;

SELECT 
  '✅ VÉRIFICATION DU MAPPING' as section,
  '' as metric,
  '' as value;

SELECT 
  'Lofts avec mapping Airbnb' as metric,
  COUNT(*)::text as value
FROM lofts
WHERE airbnb_listing_id IS NOT NULL;

SELECT 
  'Lofts sans mapping Airbnb' as metric,
  COUNT(*)::text as value
FROM lofts
WHERE airbnb_listing_id IS NULL;

SELECT 
  'Listing IDs uniques dans staging' as metric,
  COUNT(DISTINCT listing_id)::text as value
FROM airbnb_reservations_staging;

-- ============================================================================
-- 6. RÉSERVATIONS ORPHELINES (SANS LOFT MAPPÉ)
-- ============================================================================
SELECT 
  '' as section,
  '' as metric,
  '' as value;

SELECT 
  '⚠️ RÉSERVATIONS ORPHELINES' as section,
  '' as listing_id,
  '' as nb_reservations,
  '' as action_requise;

-- Listing IDs qui n'ont pas de loft mappé
WITH orphan_listings AS (
  SELECT 
    s.listing_id,
    COUNT(*) as nb_reservations
  FROM airbnb_reservations_staging s
  LEFT JOIN lofts l ON l.airbnb_listing_id = s.listing_id
  WHERE l.id IS NULL
  GROUP BY s.listing_id
)
SELECT 
  '' as section,
  listing_id,
  nb_reservations::text as nb_reservations,
  'Mapper ce listing_id à un loft' as action_requise
FROM orphan_listings
ORDER BY nb_reservations DESC;

-- ============================================================================
-- 7. EXPORT CSV POUR EXCEL (OPTIONNEL)
-- ============================================================================
-- Décommenter pour exporter au format CSV (copier-coller dans Excel)

-- COPY (
--   SELECT 
--     listing_id,
--     COUNT(*) as nb_reservations,
--     MIN(check_in_date) as premiere_date,
--     MAX(check_out_date) as derniere_date,
--     SUM(total_amount) as montant_total,
--     '' as loft_name,
--     '' as loft_uuid
--   FROM airbnb_reservations_staging
--   GROUP BY listing_id
--   ORDER BY COUNT(*) DESC
-- ) TO '/tmp/airbnb_listings_to_map.csv' WITH CSV HEADER;

-- ============================================================================
-- 8. EXEMPLE DE MAPPING COMPLET
-- ============================================================================
SELECT 
  '' as section,
  '' as listing_id,
  '' as nb_reservations,
  '' as action_requise;

SELECT 
  '📋 EXEMPLE DE MAPPING COMPLET' as section,
  '' as etape,
  '' as description;

SELECT 
  '1' as etape,
  'Identifier les listing_id depuis la section 1' as description
UNION ALL
SELECT 
  '2' as etape,
  'Trouver les lofts correspondants depuis la section 3' as description
UNION ALL
SELECT 
  '3' as etape,
  'Créer les requêtes UPDATE avec le template de la section 4' as description
UNION ALL
SELECT 
  '4' as etape,
  'Exécuter les requêtes UPDATE' as description
UNION ALL
SELECT 
  '5' as etape,
  'Vérifier le mapping avec la section 5' as description
UNION ALL
SELECT 
  '6' as etape,
  'Relancer la synchronisation pour mapper les réservations aux lofts' as description;

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
SELECT 
  '' as section,
  '' as etape,
  '' as description;

SELECT 
  '✅ SCRIPT TERMINÉ' as section,
  TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS') as timestamp,
  'Utilisez les résultats ci-dessus pour créer le mapping' as next_action;
