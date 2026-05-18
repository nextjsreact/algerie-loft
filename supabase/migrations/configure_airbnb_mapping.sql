-- ============================================================================
-- Configuration du Mapping Airbnb Listing ID → Loft ID
-- ============================================================================
-- Ce script permet de configurer facilement le mapping entre les listing IDs
-- Airbnb et les lofts dans la base de données

-- ============================================================================
-- ÉTAPE 1 : VOIR TOUS LES LOFTS DISPONIBLES
-- ============================================================================
-- Exécutez cette requête pour voir tous les lofts et leur mapping actuel

SELECT 
  id,
  name,
  address,
  city,
  airbnb_listing_id,
  CASE 
    WHEN airbnb_listing_id IS NOT NULL THEN '✓ Mappé'
    ELSE '✗ Non mappé'
  END as mapping_status
FROM lofts
ORDER BY 
  CASE WHEN airbnb_listing_id IS NOT NULL THEN 0 ELSE 1 END,
  name;

-- ============================================================================
-- ÉTAPE 2 : CONFIGURER LE MAPPING
-- ============================================================================
-- Décommentez et modifiez les lignes ci-dessous pour configurer le mapping

-- Exemple 1 : Mapper un loft par son nom
-- UPDATE lofts 
-- SET airbnb_listing_id = '12345678' 
-- WHERE name = 'Nom du Loft';

-- Exemple 2 : Mapper un loft par son ID
-- UPDATE lofts 
-- SET airbnb_listing_id = '87654321' 
-- WHERE id = 'uuid-du-loft';

-- Exemple 3 : Mapper plusieurs lofts en une seule requête
-- UPDATE lofts 
-- SET airbnb_listing_id = CASE 
--   WHEN name = 'Loft 1' THEN '11111111'
--   WHEN name = 'Loft 2' THEN '22222222'
--   WHEN name = 'Loft 3' THEN '33333333'
-- END
-- WHERE name IN ('Loft 1', 'Loft 2', 'Loft 3');

-- ============================================================================
-- ÉTAPE 3 : VÉRIFIER LE MAPPING
-- ============================================================================
-- Exécutez cette requête pour vérifier que le mapping a été appliqué

SELECT 
  id,
  name,
  airbnb_listing_id,
  '✓ Mapping configuré' as status
FROM lofts
WHERE airbnb_listing_id IS NOT NULL
ORDER BY name;

-- ============================================================================
-- ÉTAPE 4 : SUPPRIMER UN MAPPING (SI NÉCESSAIRE)
-- ============================================================================
-- Décommentez pour supprimer un mapping

-- Par nom de loft
-- UPDATE lofts 
-- SET airbnb_listing_id = NULL 
-- WHERE name = 'Nom du Loft';

-- Par listing_id
-- UPDATE lofts 
-- SET airbnb_listing_id = NULL 
-- WHERE airbnb_listing_id = '12345678';

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================
-- 1. Un listing_id ne peut être associé qu'à UN SEUL loft (contrainte UNIQUE)
-- 2. Si vous essayez d'assigner le même listing_id à 2 lofts, vous aurez une erreur
-- 3. Le listing_id est le numéro que vous voyez dans l'URL Airbnb de votre annonce
--    Exemple : https://www.airbnb.com/rooms/12345678 → listing_id = '12345678'
-- 4. Après avoir configuré le mapping, testez avec le script test-airbnb-sync.ps1

-- ============================================================================
-- TEMPLATE POUR MAPPING EN MASSE (À PERSONNALISER)
-- ============================================================================
-- Copiez ce template et remplacez les valeurs par vos données réelles

/*
UPDATE lofts 
SET airbnb_listing_id = CASE 
  WHEN name = 'Alger Centre' THEN '11111111'
  WHEN name = 'Oran Plage' THEN '22222222'
  WHEN name = 'Constantine Vue' THEN '33333333'
  WHEN name = 'Annaba Marina' THEN '44444444'
  WHEN name = 'Tlemcen Historique' THEN '55555555'
END
WHERE name IN (
  'Alger Centre',
  'Oran Plage',
  'Constantine Vue',
  'Annaba Marina',
  'Tlemcen Historique'
);
*/

-- ============================================================================
-- VÉRIFICATION FINALE
-- ============================================================================
SELECT 
  COUNT(*) as total_lofts,
  COUNT(*) FILTER (WHERE airbnb_listing_id IS NOT NULL) as mapped_lofts,
  COUNT(*) FILTER (WHERE airbnb_listing_id IS NULL) as unmapped_lofts,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE airbnb_listing_id IS NOT NULL) / COUNT(*),
    2
  ) as mapping_percentage
FROM lofts;
