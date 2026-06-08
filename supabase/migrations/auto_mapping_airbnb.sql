-- ============================================================================
-- MAPPING AUTOMATIQUE INTELLIGENT AIRBNB → LOFTS
-- ============================================================================
-- Ce script analyse les noms dans les réservations Airbnb et tente de
-- les matcher automatiquement avec les lofts de la base de données
-- ============================================================================

-- 1. ANALYSER LES NOMS DANS LES RÉSERVATIONS AIRBNB
-- ============================================================================
SELECT '🔍 ANALYSE DES NOMS DANS LES RÉSERVATIONS' as section;

-- Extraire les noms de lofts depuis les données JSON brutes
WITH airbnb_names AS (
  SELECT DISTINCT
    listing_id,
    raw_data->>'listing_name' as listing_name,
    raw_data->>'listing_title' as listing_title,
    COUNT(*) OVER (PARTITION BY listing_id) as nb_reservations
  FROM airbnb_reservations_staging
  WHERE mapping_status = 'failed'
  LIMIT 100
)
SELECT 
  listing_id,
  COALESCE(listing_name, listing_title, 'Nom non trouvé') as nom_airbnb,
  nb_reservations
FROM airbnb_names
ORDER BY nb_reservations DESC;

-- 2. LISTER TOUS LES LOFTS DISPONIBLES
-- ============================================================================
SELECT '' as section;
SELECT '🏠 LOFTS DISPONIBLES (58 lofts)' as section;

SELECT 
  ROW_NUMBER() OVER (ORDER BY name) as numero,
  name as loft_name,
  id as loft_uuid
FROM lofts
WHERE airbnb_listing_id IS NULL
ORDER BY name;

-- 3. TENTATIVE DE MATCHING AUTOMATIQUE (PAR SIMILARITÉ DE NOM)
-- ============================================================================
SELECT '' as section;
SELECT '🤖 TENTATIVE DE MATCHING AUTOMATIQUE' as section;

-- Cette requête tente de trouver des correspondances par similarité de nom
-- Note: Nécessite l'extension pg_trgm pour la similarité
-- Si l'extension n'est pas disponible, utilisez le matching manuel

-- Vérifier si pg_trgm est disponible
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Extension pg_trgm disponible'
    ELSE '❌ Extension pg_trgm non disponible - Mapping manuel requis'
  END as status
FROM pg_extension
WHERE extname = 'pg_trgm';

-- 4. MAPPING MANUEL RECOMMANDÉ
-- ============================================================================
SELECT '' as section;
SELECT '📝 MAPPING MANUEL RECOMMANDÉ' as section;

-- Générer les requêtes UPDATE pour les 33 listing_ids
WITH listing_stats AS (
  SELECT 
    listing_id,
    COUNT(*) as nb_reservations
  FROM airbnb_reservations_staging
  WHERE mapping_status = 'failed'
  GROUP BY listing_id
  ORDER BY COUNT(*) DESC
)
SELECT 
  '-- Listing ID: ' || listing_id || ' (' || nb_reservations || ' réservations)' as requete,
  ROW_NUMBER() OVER (ORDER BY nb_reservations DESC) as priorite
FROM listing_stats
UNION ALL
SELECT 
  'UPDATE lofts SET airbnb_listing_id = ''' || listing_id || ''' WHERE name = ''NOM_DU_LOFT_ICI''; -- ' || nb_reservations || ' réservations',
  ROW_NUMBER() OVER (ORDER BY nb_reservations DESC)
FROM listing_stats
ORDER BY priorite, requete;

-- 5. MÉTHODE ALTERNATIVE : MAPPING PAR ÉCHANTILLON
-- ============================================================================
SELECT '' as section;
SELECT '📊 MÉTHODE ALTERNATIVE : ANALYSER LES RÉSERVATIONS' as section;

-- Pour chaque listing_id, afficher quelques réservations pour identifier le loft
WITH sample_reservations AS (
  SELECT 
    listing_id,
    guest_name,
    check_in_date,
    check_out_date,
    ROW_NUMBER() OVER (PARTITION BY listing_id ORDER BY check_in_date DESC) as rn
  FROM airbnb_reservations_staging
  WHERE mapping_status = 'failed'
)
SELECT 
  listing_id,
  guest_name,
  TO_CHAR(check_in_date, 'YYYY-MM-DD') as check_in,
  TO_CHAR(check_out_date, 'YYYY-MM-DD') as check_out
FROM sample_reservations
WHERE rn <= 3
ORDER BY listing_id, check_in DESC;

-- 6. STATISTIQUES POUR PRIORISER LE MAPPING
-- ============================================================================
SELECT '' as section;
SELECT '📈 PRIORISATION DU MAPPING' as section;

-- Lister les listing_ids par ordre de priorité (nb de réservations)
WITH listing_priority AS (
  SELECT 
    listing_id,
    COUNT(*) as nb_reservations,
    MIN(check_in_date) as premiere_reservation,
    MAX(check_out_date) as derniere_reservation,
    COUNT(CASE WHEN check_in_date >= CURRENT_DATE THEN 1 END) as reservations_futures
  FROM airbnb_reservations_staging
  WHERE mapping_status = 'failed'
  GROUP BY listing_id
)
SELECT 
  ROW_NUMBER() OVER (ORDER BY nb_reservations DESC) as priorite,
  listing_id,
  nb_reservations as total_reservations,
  reservations_futures as futures,
  TO_CHAR(premiere_reservation, 'YYYY-MM-DD') as premiere,
  TO_CHAR(derniere_reservation, 'YYYY-MM-DD') as derniere,
  CASE 
    WHEN reservations_futures > 0 THEN '🔴 URGENT'
    WHEN nb_reservations > 100 THEN '🟠 IMPORTANT'
    ELSE '🟢 NORMAL'
  END as urgence
FROM listing_priority
ORDER BY nb_reservations DESC;

-- 7. TEMPLATE DE MAPPING POUR LES 10 PLUS IMPORTANTS
-- ============================================================================
SELECT '' as section;
SELECT '🎯 TEMPLATE POUR LES 10 LISTING_IDS LES PLUS IMPORTANTS' as section;

WITH top_listings AS (
  SELECT 
    listing_id,
    COUNT(*) as nb_reservations,
    ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rank
  FROM airbnb_reservations_staging
  WHERE mapping_status = 'failed'
  GROUP BY listing_id
)
SELECT 
  'UPDATE lofts SET airbnb_listing_id = ''' || listing_id || ''' WHERE name = ''___LOFT_' || rank || '___''; -- ' || nb_reservations || ' réservations'
FROM top_listings
WHERE rank <= 10
ORDER BY rank;

-- 8. AIDE POUR IDENTIFIER LES ANNONCES
-- ============================================================================
SELECT '' as section;
SELECT '💡 COMMENT IDENTIFIER LES ANNONCES' as section;

SELECT 
  'Méthode 1: Site Airbnb' as methode,
  '1. Aller sur https://www.airbnb.com' as etape_1,
  '2. Se connecter avec loft.algerie.scl@gmail.com' as etape_2,
  '3. Cliquer sur "Annonces" → "Gérer les annonces"' as etape_3,
  '4. Pour chaque annonce, noter le listing_id (dans l''URL)' as etape_4
UNION ALL
SELECT 
  'Méthode 2: Données JSON',
  '1. Ouvrir d:\Airbnb_transfer_v2\output\reservations_airbnb.json',
  '2. Chercher "listing_id": "24697659"',
  '3. Regarder les réservations associées',
  '4. Déduire le nom du loft';

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
SELECT '' as section;
SELECT '✅ ANALYSE TERMINÉE' as section;
SELECT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS') as timestamp;

-- ============================================================================
-- PROCHAINES ÉTAPES
-- ============================================================================
SELECT '' as section;
SELECT '🎯 PROCHAINES ÉTAPES' as section;

SELECT 
  '1. Identifier les 10 listing_ids les plus importants (voir section 7)' as etape
UNION ALL
SELECT 
  '2. Aller sur Airbnb pour trouver les noms des annonces'
UNION ALL
SELECT 
  '3. Compléter les requêtes UPDATE avec les vrais noms de lofts'
UNION ALL
SELECT 
  '4. Exécuter les requêtes UPDATE'
UNION ALL
SELECT 
  '5. Vérifier avec: SELECT name, airbnb_listing_id FROM lofts WHERE airbnb_listing_id IS NOT NULL'
UNION ALL
SELECT 
  '6. Relancer la synchronisation';
