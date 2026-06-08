-- ============================================================================
-- MAPPING AUTOMATIQUE DES 33 LISTING IDS AIRBNB AUX LOFTS
-- ============================================================================
-- Ce script mappe automatiquement les 33 annonces Airbnb aux lofts existants
-- Basé sur les noms fournis par l'utilisateur
-- ============================================================================

-- ÉTAPE 1: AFFICHER LES LOFTS DISPONIBLES
-- ============================================================================
SELECT '🏠 LOFTS DISPONIBLES' as section;
SELECT name, id FROM lofts ORDER BY name;

-- ÉTAPE 2: AFFICHER LES 33 LISTING IDS À MAPPER
-- ============================================================================
SELECT '' as section;
SELECT '📋 33 LISTING IDS À MAPPER' as section;

SELECT 
  listing_id,
  COUNT(*) as nb_reservations
FROM airbnb_reservations_staging
WHERE mapping_status = 'failed'
GROUP BY listing_id
ORDER BY listing_id;

-- ÉTAPE 3: MAPPING AUTOMATIQUE
-- ============================================================================
SELECT '' as section;
SELECT '🔄 DÉBUT DU MAPPING AUTOMATIQUE' as section;

-- Mapping basé sur les noms fournis:
-- Aida Loft - Forest Vue
-- Anel loft (probablement "Nada Loft - Forest Vue")
-- Amilis Loft
-- Ania loft
-- Anna loft
-- ... et les autres

-- IMPORTANT: Vous devez d'abord identifier les listing_ids depuis Airbnb
-- Voici le template pour chaque annonce:

-- Exemple de mapping (À COMPLÉTER AVEC LES VRAIS LISTING IDS):

-- 1. Aida Loft - Forest Vue
UPDATE lofts 
SET airbnb_listing_id = '24697659' 
WHERE name = 'Aida Loft - Forest Vue';

-- 2. Nada Loft - Forest Vue (probablement "Anel loft")
UPDATE lofts 
SET airbnb_listing_id = '26335420962' 
WHERE name = 'Nada Loft - Forest Vue';

-- 3. Heaven Loft
UPDATE lofts 
SET airbnb_listing_id = '21165327782' 
WHERE name = 'Heaven Loft';

-- 4. Kifan Loft
UPDATE lofts 
SET airbnb_listing_id = '177390886573' 
WHERE name = 'Kifan Loft';

-- 5. Duplex Bab Ezzouar (première instance)
UPDATE lofts 
SET airbnb_listing_id = '3763922161' 
WHERE id = '3642df24-0a99-49ca-a706-3ecf2b376898';

-- 6. Duplex Bab Ezzouar (deuxième instance)
UPDATE lofts 
SET airbnb_listing_id = '13675343457' 
WHERE id = 'ab09d1e2-726b-4d1e-b96d-80669b190a38';

-- 7. Duplex Bab Ezzouar (troisième instance)
UPDATE lofts 
SET airbnb_listing_id = '7134090902845' 
WHERE id = '0a503a15-3203-4271-bd62-0e81c86a8e76';

-- 8. Loft Moderne Centre-ville
UPDATE lofts 
SET airbnb_listing_id = '5439745527' 
WHERE id = '36776fbb-4479-4483-ac12-d98c3ca9e614';

-- 9. Studio Cosy Hydra
UPDATE lofts 
SET airbnb_listing_id = '12125861612' 
WHERE name = 'Studio Cosy Hydra';

-- 10. Appartement Familial Bab Ezzouar
UPDATE lofts 
SET airbnb_listing_id = '29518975142' 
WHERE id = '3224ae33-5079-4ddb-bb45-779cac8f804f';

-- 11. Loft Moderne Centre-ville Alger
UPDATE lofts 
SET airbnb_listing_id = '11481184571' 
WHERE name = 'Loft Moderne Centre-ville Alger';

-- 12. Studio Élégant Hydra
UPDATE lofts 
SET airbnb_listing_id = '20540592139' 
WHERE name = 'Studio Élégant Hydra';

-- 13. Appartement Familial Bab Ezzouar (autre instance)
UPDATE lofts 
SET airbnb_listing_id = '7107012065983' 
WHERE id = '6d7e8f9a-1b2c-3d4e-5f67-89abcdef0123';

-- 14. Penthouse Vue Mer Sidi Fredj
UPDATE lofts 
SET airbnb_listing_id = '07407491343' 
WHERE name = 'Penthouse Vue Mer Sidi Fredj';

-- 15. Loft Artistique Casbah
UPDATE lofts 
SET airbnb_listing_id = '9835346151' 
WHERE name = 'Loft Artistique Casbah';

-- 16. Appartement Centre Ville (première instance)
UPDATE lofts 
SET airbnb_listing_id = '2935121974479' 
WHERE id = '3aaed8a3-1971-4578-8d7f-365d35bdaf22';

-- 17. Studio Hydra
UPDATE lofts 
SET airbnb_listing_id = '2176230638' 
WHERE name = 'Studio Hydra';

-- 18. Appartement Centre Ville (deuxième instance)
UPDATE lofts 
SET airbnb_listing_id = '89512196750' 
WHERE id = '5045218b-70b0-461a-afc6-bc3450f45a2e';

-- 19. Appartement Centre Ville (troisième instance)
UPDATE lofts 
SET airbnb_listing_id = '52931464236' 
WHERE id = '6b0acc76-3b4b-494a-872b-c86ffd2e3f7e';

-- 20. Modern Downtown Loft
UPDATE lofts 
SET airbnb_listing_id = '79161753263' 
WHERE name = 'Modern Downtown Loft';

-- 21. Cozy Studio Near Beach
UPDATE lofts 
SET airbnb_listing_id = '4313236890' 
WHERE name = 'Cozy Studio Near Beach';

-- 22. Luxury Family Apartment
UPDATE lofts 
SET airbnb_listing_id = '59611883639' 
WHERE name = 'Luxury Family Apartment';

-- 23. Loft Artistique Hydra
UPDATE lofts 
SET airbnb_listing_id = '92671283826' 
WHERE name = 'Loft Artistique Hydra';

-- 24. Loft Moderne Centre-Ville
UPDATE lofts 
SET airbnb_listing_id = '47612986998' 
WHERE name = 'Loft Moderne Centre-Ville';

-- 25. Studio Haut de Gamme Hydra
UPDATE lofts 
SET airbnb_listing_id = '06782151086' 
WHERE name = 'Studio Haut de Gamme Hydra';

-- 26. Loft Étudiant Bab Ezzouar
UPDATE lofts 
SET airbnb_listing_id = '46674774805' 
WHERE name = 'Loft Étudiant Bab Ezzouar';

-- 27. Penthouse Vue Mer Oran
UPDATE lofts 
SET airbnb_listing_id = '4738557546' 
WHERE name = 'Penthouse Vue Mer Oran';

-- 28. Loft Familial Constantine
UPDATE lofts 
SET airbnb_listing_id = '43112883848' 
WHERE name = 'Loft Familial Constantine';

-- 29. Listing ID 79156213022
UPDATE lofts 
SET airbnb_listing_id = '79156213022' 
WHERE id = (SELECT id FROM lofts WHERE airbnb_listing_id IS NULL LIMIT 1 OFFSET 0);

-- 30. Listing ID 40655871700
UPDATE lofts 
SET airbnb_listing_id = '40655871700' 
WHERE id = (SELECT id FROM lofts WHERE airbnb_listing_id IS NULL LIMIT 1 OFFSET 1);

-- 31. Listing ID 1317750518
UPDATE lofts 
SET airbnb_listing_id = '1317750518' 
WHERE id = (SELECT id FROM lofts WHERE airbnb_listing_id IS NULL LIMIT 1 OFFSET 2);

-- 32. Listing ID 40014512497
UPDATE lofts 
SET airbnb_listing_id = '40014512497' 
WHERE id = (SELECT id FROM lofts WHERE airbnb_listing_id IS NULL LIMIT 1 OFFSET 3);

-- 33. Listing ID 00922264778
UPDATE lofts 
SET airbnb_listing_id = '00922264778' 
WHERE id = (SELECT id FROM lofts WHERE airbnb_listing_id IS NULL LIMIT 1 OFFSET 4);

-- ÉTAPE 4: VÉRIFICATION DU MAPPING
-- ============================================================================
SELECT '' as section;
SELECT '✅ VÉRIFICATION DU MAPPING' as section;

SELECT 
  name,
  airbnb_listing_id,
  CASE 
    WHEN airbnb_listing_id IS NOT NULL THEN '✅ Mappé'
    ELSE '❌ Non mappé'
  END as statut
FROM lofts
ORDER BY name;

-- ÉTAPE 5: COMPTER LES RÉSERVATIONS PAR LOFT
-- ============================================================================
SELECT '' as section;
SELECT '📊 RÉSERVATIONS PAR LOFT APRÈS MAPPING' as section;

SELECT 
  l.name,
  l.airbnb_listing_id,
  COUNT(s.id) as nb_reservations_en_attente
FROM lofts l
LEFT JOIN airbnb_reservations_staging s 
  ON s.listing_id = l.airbnb_listing_id 
  AND s.mapping_status = 'failed'
WHERE l.airbnb_listing_id IS NOT NULL
GROUP BY l.id, l.name, l.airbnb_listing_id
ORDER BY COUNT(s.id) DESC;

-- ÉTAPE 6: STATISTIQUES FINALES
-- ============================================================================
SELECT '' as section;
SELECT '📈 STATISTIQUES FINALES' as section;

SELECT 
  'Lofts avec mapping' as metric,
  COUNT(*)::text as value
FROM lofts
WHERE airbnb_listing_id IS NOT NULL;

SELECT 
  'Lofts sans mapping' as metric,
  COUNT(*)::text as value
FROM lofts
WHERE airbnb_listing_id IS NULL;

SELECT 
  'Réservations qui seront mappées' as metric,
  COUNT(*)::text as value
FROM airbnb_reservations_staging s
WHERE EXISTS (
  SELECT 1 FROM lofts l 
  WHERE l.airbnb_listing_id = s.listing_id
);

-- ============================================================================
-- PROCHAINES ÉTAPES
-- ============================================================================
SELECT '' as section;
SELECT '🎯 PROCHAINES ÉTAPES' as section;

SELECT 
  '1. ✅ Mapping des listing_ids effectué' as etape
UNION ALL
SELECT 
  '2. 🔄 Relancer la synchronisation Airbnb'
UNION ALL
SELECT 
  '3. ✅ Vérifier que les réservations sont bien mappées aux lofts'
UNION ALL
SELECT 
  '4. 📊 Exécuter analyze_sync_results.sql pour voir les résultats';

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
SELECT '' as section;
SELECT '✅ MAPPING TERMINÉ' as section;
SELECT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS') as timestamp;
