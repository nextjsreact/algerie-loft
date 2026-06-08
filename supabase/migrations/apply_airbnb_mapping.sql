-- ============================================================================
-- MAPPING AUTOMATIQUE DES 33 ANNONCES AIRBNB AUX LOFTS
-- ============================================================================
-- Ce script mappe les listing_ids Airbnb aux lofts existants
-- Basé sur les noms de lofts fournis par l'utilisateur
-- ============================================================================

-- 1. VÉRIFIER LES LOFTS EXISTANTS
-- ============================================================================
SELECT '🏠 LOFTS EXISTANTS DANS LA BASE' as section;

SELECT 
  id,
  name,
  airbnb_listing_id
FROM lofts
ORDER BY name;

-- 2. APPLIQUER LE MAPPING (33 annonces)
-- ============================================================================
SELECT '' as section;
SELECT '📝 APPLICATION DU MAPPING' as section;

-- Mapping basé sur les noms fournis
-- Note: Ajustez les noms si nécessaire pour correspondre exactement à votre base

-- Aida Loft - Forest Vue
UPDATE lofts 
SET airbnb_listing_id = '24697659' 
WHERE name ILIKE '%Aida%' OR name ILIKE '%Forest%Vue%';

-- Amel loft
UPDATE lofts 
SET airbnb_listing_id = '26335420962' 
WHERE name ILIKE '%Amel%';

-- Amilis Loft
UPDATE lofts 
SET airbnb_listing_id = '21165327782' 
WHERE name ILIKE '%Amilis%';

-- Ania loft
UPDATE lofts 
SET airbnb_listing_id = '177390886573376292' 
WHERE name ILIKE '%Ania%';

-- Anna loft
UPDATE lofts 
SET airbnb_listing_id = '16136753434577' 
WHERE name ILIKE '%Anna%';

-- Les autres listing IDs (à compléter avec les noms exacts)
-- Vous devez fournir les noms des lofts pour ces listing IDs:

-- UPDATE lofts SET airbnb_listing_id = '134090902845543974552' WHERE name = 'NOM_DU_LOFT_6';
-- UPDATE lofts SET airbnb_listing_id = '121258616122951897514' WHERE name = 'NOM_DU_LOFT_7';
-- UPDATE lofts SET airbnb_listing_id = '1148118457120540592139' WHERE name = 'NOM_DU_LOFT_8';
-- UPDATE lofts SET airbnb_listing_id = '1070120659830740749134' WHERE name = 'NOM_DU_LOFT_9';
-- UPDATE lofts SET airbnb_listing_id = '9835346151' WHERE name = 'NOM_DU_LOFT_10';
-- UPDATE lofts SET airbnb_listing_id = '935121974479217623063' WHERE name = 'NOM_DU_LOFT_11';
-- UPDATE lofts SET airbnb_listing_id = '895121967505293146423' WHERE name = 'NOM_DU_LOFT_12';
-- UPDATE lofts SET airbnb_listing_id = '79161753263431323689' WHERE name = 'NOM_DU_LOFT_13';
-- UPDATE lofts SET airbnb_listing_id = '59611883639926712838' WHERE name = 'NOM_DU_LOFT_14';
-- UPDATE lofts SET airbnb_listing_id = '47612986998067821510' WHERE name = 'NOM_DU_LOFT_15';
-- UPDATE lofts SET airbnb_listing_id = '46674774805473855754' WHERE name = 'NOM_DU_LOFT_16';
-- UPDATE lofts SET airbnb_listing_id = '43112883848791562130' WHERE name = 'NOM_DU_LOFT_17';
-- UPDATE lofts SET airbnb_listing_id = '40655871700131775051' WHERE name = 'NOM_DU_LOFT_18';
-- UPDATE lofts SET airbnb_listing_id = '40014512497009222647' WHERE name = 'NOM_DU_LOFT_19';
-- UPDATE lofts SET airbnb_listing_id = '40061750572113309284' WHERE name = 'NOM_DU_LOFT_20';

-- 3. VÉRIFIER LE MAPPING APPLIQUÉ
-- ============================================================================
SELECT '' as section;
SELECT '✅ VÉRIFICATION DU MAPPING' as section;

SELECT 
  name as loft_name,
  airbnb_listing_id,
  (SELECT COUNT(*) 
   FROM airbnb_reservations_staging 
   WHERE listing_id = lofts.airbnb_listing_id) as nb_reservations_en_attente
FROM lofts
WHERE airbnb_listing_id IS NOT NULL
ORDER BY name;

-- 4. STATISTIQUES
-- ============================================================================
SELECT '' as section;
SELECT '📊 STATISTIQUES' as section;

SELECT 
  'Lofts mappés' as metric,
  COUNT(*)::text as value
FROM lofts
WHERE airbnb_listing_id IS NOT NULL;

SELECT 
  'Réservations qui seront synchronisées' as metric,
  COUNT(*)::text as value
FROM airbnb_reservations_staging s
WHERE EXISTS (
  SELECT 1 FROM lofts l 
  WHERE l.airbnb_listing_id = s.listing_id
);

-- 5. RELANCER LA SYNCHRONISATION
-- ============================================================================
SELECT '' as section;
SELECT '🔄 PROCHAINE ÉTAPE' as section;

SELECT 
  'Maintenant, relancez la synchronisation avec:' as instruction
UNION ALL
SELECT 
  '.\test-airbnb-sync.ps1'
UNION ALL
SELECT 
  ''
UNION ALL
SELECT 
  'Ou appelez l''API directement:';

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
SELECT '' as section;
SELECT '✅ MAPPING APPLIQUÉ' as section;
SELECT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS') as timestamp;
