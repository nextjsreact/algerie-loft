-- ============================================================================
-- GÉNÉRATION AUTOMATIQUE DES REQUÊTES DE MAPPING
-- ============================================================================
-- Ce script génère les requêtes UPDATE pour mapper les 33 listing_ids
-- aux lofts existants
-- ============================================================================

-- 1. LISTER TOUS LES LOFTS DISPONIBLES
-- ============================================================================
SELECT '🏠 LOFTS DISPONIBLES POUR MAPPING' as section;

SELECT 
  ROW_NUMBER() OVER (ORDER BY name) as numero,
  id as loft_uuid,
  name as loft_name,
  COALESCE(airbnb_listing_id, '❌ Non mappé') as airbnb_listing_id_actuel
FROM lofts
ORDER BY name;

-- 2. LISTER LES 33 LISTING IDS À MAPPER
-- ============================================================================
SELECT '' as section;
SELECT '📋 LISTING IDS À MAPPER (33 annonces)' as section;

WITH listing_stats AS (
  SELECT 
    listing_id,
    COUNT(*) as nb_reservations,
    MIN(check_in_date) as premiere_date,
    MAX(check_out_date) as derniere_date
  FROM airbnb_reservations_staging
  WHERE mapping_status = 'failed'
  GROUP BY listing_id
)
SELECT 
  ROW_NUMBER() OVER (ORDER BY nb_reservations DESC) as numero,
  listing_id,
  nb_reservations,
  TO_CHAR(premiere_date, 'YYYY-MM-DD') as premiere_date,
  TO_CHAR(derniere_date, 'YYYY-MM-DD') as derniere_date
FROM listing_stats
ORDER BY nb_reservations DESC;

-- 3. GÉNÉRER LES REQUÊTES UPDATE (TEMPLATE)
-- ============================================================================
SELECT '' as section;
SELECT '📝 REQUÊTES UPDATE À COMPLÉTER' as section;

-- Générer une requête UPDATE pour chaque listing_id
WITH listing_ids AS (
  SELECT DISTINCT listing_id
  FROM airbnb_reservations_staging
  WHERE mapping_status = 'failed'
  ORDER BY listing_id
),
lofts_list AS (
  SELECT 
    id,
    name,
    ROW_NUMBER() OVER (ORDER BY name) as row_num
  FROM lofts
  WHERE airbnb_listing_id IS NULL
)
SELECT 
  '-- Listing ID: ' || l.listing_id || ' (' || 
  (SELECT COUNT(*) FROM airbnb_reservations_staging WHERE listing_id = l.listing_id) || 
  ' réservations)' as requete_sql
FROM listing_ids l
UNION ALL
SELECT 
  'UPDATE lofts SET airbnb_listing_id = ''' || l.listing_id || ''' WHERE name = ''NOM_DU_LOFT_ICI''; -- ' || 
  (SELECT COUNT(*) FROM airbnb_reservations_staging WHERE listing_id = l.listing_id) || ' réservations'
FROM listing_ids l
ORDER BY requete_sql;

-- 4. EXEMPLE DE MAPPING COMPLET
-- ============================================================================
SELECT '' as section;
SELECT '💡 EXEMPLE DE MAPPING' as section;

SELECT 
  '-- Exemple de mapping complet:' as exemple
UNION ALL
SELECT 
  'UPDATE lofts SET airbnb_listing_id = ''24697659'' WHERE name = ''Loft Alger Centre'';'
UNION ALL
SELECT 
  'UPDATE lofts SET airbnb_listing_id = ''26335420962'' WHERE name = ''Appartement Hydra'';'
UNION ALL
SELECT 
  'UPDATE lofts SET airbnb_listing_id = ''21165327782'' WHERE name = ''Studio Oran'';'
UNION ALL
SELECT 
  '-- ... etc pour les 33 annonces'
UNION ALL
SELECT 
  ''
UNION ALL
SELECT 
  '-- Vérifier le mapping:'
UNION ALL
SELECT 
  'SELECT name, airbnb_listing_id FROM lofts WHERE airbnb_listing_id IS NOT NULL;';

-- 5. STATISTIQUES APRÈS MAPPING (SIMULATION)
-- ============================================================================
SELECT '' as section;
SELECT '📊 STATISTIQUES APRÈS MAPPING (SIMULATION)' as section;

SELECT 
  'Réservations qui seront mappées' as metric,
  COUNT(*)::text || ' réservations' as value
FROM airbnb_reservations_staging
WHERE mapping_status = 'failed';

SELECT 
  'Lofts nécessaires' as metric,
  COUNT(DISTINCT listing_id)::text || ' lofts' as value
FROM airbnb_reservations_staging
WHERE mapping_status = 'failed';

SELECT 
  'Lofts disponibles' as metric,
  COUNT(*)::text || ' lofts' as value
FROM lofts
WHERE airbnb_listing_id IS NULL;

-- 6. MÉTHODE ALTERNATIVE : MAPPING PAR UUID
-- ============================================================================
SELECT '' as section;
SELECT '🔧 MÉTHODE ALTERNATIVE : MAPPING PAR UUID' as section;

-- Générer les requêtes UPDATE avec UUID (plus sûr)
WITH listing_ids AS (
  SELECT DISTINCT listing_id
  FROM airbnb_reservations_staging
  WHERE mapping_status = 'failed'
  ORDER BY listing_id
)
SELECT 
  'UPDATE lofts SET airbnb_listing_id = ''' || listing_id || ''' WHERE id = ''UUID_DU_LOFT_ICI''; -- ' || 
  (SELECT COUNT(*) FROM airbnb_reservations_staging WHERE listing_id = l.listing_id) || ' réservations'
FROM listing_ids l
ORDER BY listing_id;

-- 7. AIDE POUR IDENTIFIER LES ANNONCES
-- ============================================================================
SELECT '' as section;
SELECT '🔍 AIDE POUR IDENTIFIER LES ANNONCES' as section;

SELECT 
  'Pour identifier les annonces Airbnb:' as aide
UNION ALL
SELECT 
  '1. Aller sur https://www.airbnb.com'
UNION ALL
SELECT 
  '2. Se connecter avec loft.algerie.scl@gmail.com'
UNION ALL
SELECT 
  '3. Aller dans "Annonces" → "Gérer les annonces"'
UNION ALL
SELECT 
  '4. Cliquer sur une annonce'
UNION ALL
SELECT 
  '5. L''URL contient le listing_id: https://www.airbnb.com/rooms/24697659'
UNION ALL
SELECT 
  '6. Noter le listing_id et le nom de l''annonce'
UNION ALL
SELECT 
  '7. Répéter pour les 33 annonces';

-- 8. SCRIPT DE VÉRIFICATION APRÈS MAPPING
-- ============================================================================
SELECT '' as section;
SELECT '✅ SCRIPT DE VÉRIFICATION APRÈS MAPPING' as section;

SELECT 
  '-- Après avoir exécuté les UPDATE, vérifier avec:' as verification
UNION ALL
SELECT 
  'SELECT l.name, l.airbnb_listing_id, COUNT(s.id) as nb_reservations_en_attente'
UNION ALL
SELECT 
  'FROM lofts l'
UNION ALL
SELECT 
  'LEFT JOIN airbnb_reservations_staging s ON s.listing_id = l.airbnb_listing_id AND s.mapping_status = ''failed'''
UNION ALL
SELECT 
  'WHERE l.airbnb_listing_id IS NOT NULL'
UNION ALL
SELECT 
  'GROUP BY l.id, l.name, l.airbnb_listing_id'
UNION ALL
SELECT 
  'ORDER BY COUNT(s.id) DESC;';

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
SELECT '' as section;
SELECT '✅ GÉNÉRATION TERMINÉE' as section;
SELECT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS') as timestamp;
