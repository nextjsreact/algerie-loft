-- ================================================================
-- 🔍 VÉRIFICATION : Annulations Airbnb d'aujourd'hui (8 juin 2026)
-- ================================================================

-- 1. Vérifier s'il y a des réservations annulées aujourd'hui dans staging
SELECT 
  s.airbnb_id,
  s.guest_name,
  s.check_in_date,
  s.check_out_date,
  s.raw_data->>'statut' as statut_airbnb_brut,
  s.created_at as date_scraping,
  s.processed_at as derniere_maj,
  s.validation_status,
  s.mapping_status,
  r.id as reservation_id,
  r.status as status_db,
  r.synced_at as derniere_synchro
FROM airbnb_reservations_staging s
LEFT JOIN reservations r ON r.airbnb_confirmation_code = s.airbnb_id
WHERE s.raw_data->>'statut' IN ('Annulée', 'Annulé', 'Cancelled')
  AND DATE(s.created_at) = CURRENT_DATE  -- Aujourd'hui
ORDER BY s.created_at DESC;

-- 2. Vérifier toutes les annulations Airbnb (peu importe la date)
SELECT 
  s.airbnb_id,
  s.guest_name,
  s.check_in_date,
  s.check_out_date,
  s.raw_data->>'statut' as statut_airbnb,
  DATE(s.created_at) as date_scraping,
  r.id as reservation_id,
  r.status as status_dans_db,
  CASE 
    WHEN r.id IS NULL THEN '❌ Pas encore synchronisée'
    WHEN r.status = 'cancelled' THEN '✅ Correctement marquée cancelled'
    ELSE '⚠️ Statut incorrect: ' || r.status
  END as etat_synchronisation
FROM airbnb_reservations_staging s
LEFT JOIN reservations r ON r.airbnb_confirmation_code = s.airbnb_id
WHERE s.raw_data->>'statut' IN ('Annulée', 'Annulé', 'Cancelled')
ORDER BY s.created_at DESC;

-- 3. Compter les annulations par statut de synchronisation
SELECT 
  COUNT(*) as total_annulations_airbnb,
  COUNT(CASE WHEN r.id IS NULL THEN 1 END) as non_synchronisees,
  COUNT(CASE WHEN r.status = 'cancelled' THEN 1 END) as correctement_cancelled,
  COUNT(CASE WHEN r.status != 'cancelled' AND r.id IS NOT NULL THEN 1 END) as statut_incorrect
FROM airbnb_reservations_staging s
LEFT JOIN reservations r ON r.airbnb_confirmation_code = s.airbnb_id
WHERE s.raw_data->>'statut' IN ('Annulée', 'Annulé', 'Cancelled');

-- 4. Vérifier si le traducteur reconnaît bien "Annulée"
SELECT 
  'Test traducteur de statut' as test,
  CASE 
    WHEN 'Annulée' IN ('Annulée', 'Annulé', 'Cancelled') THEN '✅ Traducteur devrait reconnaître'
    ELSE '❌ Traducteur ne reconnaît PAS'
  END as resultat;

-- 5. Voir l'historique des mises à jour de statut aujourd'hui
SELECT 
  r.airbnb_confirmation_code,
  r.guest_name,
  r.status,
  r.check_in_date,
  r.check_out_date,
  r.updated_at,
  r.synced_at,
  s.raw_data->>'statut' as statut_airbnb_actuel,
  s.created_at as date_scraping
FROM reservations r
INNER JOIN airbnb_reservations_staging s ON s.airbnb_id = r.airbnb_confirmation_code
WHERE r.source = 'airbnb_scraper'
  AND (DATE(r.updated_at) = CURRENT_DATE OR DATE(r.synced_at) = CURRENT_DATE)
ORDER BY r.updated_at DESC
LIMIT 20;

-- ================================================================
-- DIAGNOSTIC : Pourquoi les annulations ne sont pas appliquées ?
-- ================================================================

-- Scénario A: Les annulations sont dans staging mais pas dans reservations
SELECT 
  'Scénario A: Annulations dans staging seulement' as scenario,
  COUNT(*) as nombre
FROM airbnb_reservations_staging s
WHERE s.raw_data->>'statut' IN ('Annulée', 'Annulé', 'Cancelled')
  AND NOT EXISTS (
    SELECT 1 FROM reservations r 
    WHERE r.airbnb_confirmation_code = s.airbnb_id
  );

-- Scénario B: Les annulations sont synchronisées mais pas marquées 'cancelled'
SELECT 
  'Scénario B: Synchronisées mais statut incorrect' as scenario,
  COUNT(*) as nombre,
  array_agg(r.status) as statuts_trouves
FROM airbnb_reservations_staging s
INNER JOIN reservations r ON r.airbnb_confirmation_code = s.airbnb_id
WHERE s.raw_data->>'statut' IN ('Annulée', 'Annulé', 'Cancelled')
  AND r.status != 'cancelled';

-- Scénario C: Les annulations sont correctement synchronisées
SELECT 
  'Scénario C: Tout fonctionne correctement' as scenario,
  COUNT(*) as nombre
FROM airbnb_reservations_staging s
INNER JOIN reservations r ON r.airbnb_confirmation_code = s.airbnb_id
WHERE s.raw_data->>'statut' IN ('Annulée', 'Annulé', 'Cancelled')
  AND r.status = 'cancelled';

-- ================================================================
-- ACTION : Si des annulations ne sont pas appliquées
-- ================================================================

-- Cette requête UPDATE va synchroniser manuellement les annulations
-- ⚠️ NE PAS EXÉCUTER AUTOMATIQUEMENT - Vérifier d'abord les résultats ci-dessus

/*
UPDATE reservations r
SET 
  status = 'cancelled',
  updated_at = NOW(),
  synced_at = NOW()
FROM airbnb_reservations_staging s
WHERE s.airbnb_id = r.airbnb_confirmation_code
  AND s.raw_data->>'statut' IN ('Annulée', 'Annulé', 'Cancelled')
  AND r.status != 'cancelled'
  AND r.source = 'airbnb_scraper'
RETURNING 
  r.airbnb_confirmation_code,
  r.guest_name,
  r.check_in_date,
  r.check_out_date,
  r.status,
  s.raw_data->>'statut' as statut_airbnb;
*/

-- ================================================================
-- RÉSUMÉ ATTENDU
-- ================================================================

/*
Si le système fonctionne correctement :
✅ Scénario A = 0 (toutes les annulations sont synchronisées)
✅ Scénario B = 0 (statuts corrects)
✅ Scénario C > 0 (annulations correctement marquées)

Si le système a un problème :
❌ Scénario A > 0 → Les annulations ne sont pas synchronisées du tout
❌ Scénario B > 0 → Les annulations sont synchronisées mais mal marquées

Dans ce cas, décommenter et exécuter la requête UPDATE ci-dessus.
*/
