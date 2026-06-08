-- ================================================================
-- CORRECTION: Reclasser les réservations terminées mal classées
-- ================================================================
--
-- PROBLÈME:
-- 7 réservations Airbnb sont marquées 'confirmed' alors qu'elles
-- sont terminées (statuts "Ancien voyageur", "En attente de commentaire")
--
-- SOLUTION:
-- 1. Identifier ces réservations via staging
-- 2. Les mettre à jour avec status = 'completed'
-- 3. Vérifier les résultats
--
-- ================================================================

-- ÉTAPE 1: Identifier les réservations à corriger
-- ================================================================

-- 1a. Voir les réservations avec statuts "terminés" dans staging
SELECT 
  s.airbnb_id,
  s.guest_name,
  s.check_in_date,
  s.check_out_date,
  s.raw_data->>'statut' as statut_brut_airbnb,
  r.id as reservation_id,
  r.status as statut_actuel_db,
  r.synced_at as derniere_sync
FROM airbnb_reservations_staging s
LEFT JOIN reservations r ON r.airbnb_confirmation_code = s.airbnb_id
WHERE s.raw_data->>'statut' IN (
  'Ancien voyageur',
  'En attente de commentaire du voyageur',
  'Laissez un commentaire sur le voyageur'
)
ORDER BY s.check_in_date DESC;

-- 1b. Compter combien seront affectées
SELECT 
  s.raw_data->>'statut' as statut_airbnb,
  COUNT(*) as nombre_a_corriger,
  COUNT(CASE WHEN r.status = 'confirmed' THEN 1 END) as actuellement_confirmed,
  COUNT(CASE WHEN r.status = 'completed' THEN 1 END) as deja_completed
FROM airbnb_reservations_staging s
LEFT JOIN reservations r ON r.airbnb_confirmation_code = s.airbnb_id
WHERE s.raw_data->>'statut' IN (
  'Ancien voyageur',
  'En attente de commentaire du voyageur',
  'Laissez un commentaire sur le voyageur'
)
GROUP BY s.raw_data->>'statut'
ORDER BY nombre_a_corriger DESC;

-- ================================================================
-- ÉTAPE 2: CORRECTION - Mettre à jour les statuts
-- ================================================================

-- ⚠️ ATTENTION: Cette requête va MODIFIER la base de données
-- Vérifiez les résultats de l'étape 1 avant d'exécuter

-- Mise à jour des réservations avec statuts terminés
UPDATE reservations r
SET 
  status = 'completed',
  updated_at = NOW()
FROM airbnb_reservations_staging s
WHERE r.airbnb_confirmation_code = s.airbnb_id
  AND r.source = 'airbnb_scraper'
  AND s.raw_data->>'statut' IN (
    'Ancien voyageur',
    'En attente de commentaire du voyageur',
    'Laissez un commentaire sur le voyageur'
  )
  AND r.status != 'completed'  -- Ne pas re-mettre à jour celles déjà corrigées
RETURNING 
  r.id,
  r.airbnb_confirmation_code,
  r.guest_name,
  r.status as nouveau_statut;

-- ================================================================
-- ÉTAPE 3: VÉRIFICATION
-- ================================================================

-- 3a. Voir la nouvelle distribution des statuts
SELECT 
  status,
  COUNT(*) as nombre,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as pourcentage
FROM reservations
WHERE source = 'airbnb_scraper'
GROUP BY status
ORDER BY nombre DESC;

-- 3b. Vérifier qu'il n'y a plus de réservations mal classées
SELECT 
  COUNT(*) as reservations_mal_classees
FROM airbnb_reservations_staging s
INNER JOIN reservations r ON r.airbnb_confirmation_code = s.airbnb_id
WHERE r.source = 'airbnb_scraper'
  AND s.raw_data->>'statut' IN (
    'Ancien voyageur',
    'En attente de commentaire du voyageur',
    'Laissez un commentaire sur le voyageur'
  )
  AND r.status != 'completed';

-- Si résultat = 0, alors la correction est réussie ✅

-- 3c. Voir les détails des réservations corrigées
SELECT 
  r.id,
  r.guest_name,
  r.airbnb_confirmation_code,
  r.check_in_date,
  r.check_out_date,
  r.status,
  s.raw_data->>'statut' as statut_airbnb,
  r.updated_at as date_correction
FROM reservations r
INNER JOIN airbnb_reservations_staging s ON s.airbnb_id = r.airbnb_confirmation_code
WHERE r.source = 'airbnb_scraper'
  AND r.status = 'completed'
  AND s.raw_data->>'statut' IN (
    'Ancien voyageur',
    'En attente de commentaire du voyageur',
    'Laissez un commentaire sur le voyageur'
  )
ORDER BY r.updated_at DESC;

-- ================================================================
-- RÉSUMÉ ATTENDU APRÈS CORRECTION
-- ================================================================

/*
AVANT CORRECTION:
┌───────────┬────────┬──────────────┐
│  Status   │ Nombre │ Pourcentage  │
├───────────┼────────┼──────────────┤
│ confirmed │   74   │    97.37%    │
│ completed │    2   │     2.63%    │
└───────────┴────────┴──────────────┘

APRÈS CORRECTION:
┌───────────┬────────┬──────────────┐
│  Status   │ Nombre │ Pourcentage  │
├───────────┼────────┼──────────────┤
│ confirmed │   67   │    88.16%    │ ← -7
│ completed │    9   │    11.84%    │ ← +7
└───────────┴────────┴──────────────┘

✅ Plus précis et correct !

IMPACT:
- ✅ Statistiques correctes
- ✅ Taux d'occupation précis
- ✅ Disponibilité correcte (réservations passées ne bloquent plus)
*/

-- ================================================================
-- NOTES IMPORTANTES
-- ================================================================

/*
1. Cette correction est SAFE:
   - Elle ne touche que les réservations Airbnb
   - Elle ne modifie que celles avec statuts "terminés" connus
   - Elle préserve les autres champs

2. Futures synchronisations:
   - Le traducteur a été mis à jour
   - Les prochaines syncs classeront correctement les nouveaux statuts
   - Plus besoin de cette correction

3. Si vous voulez ANNULER la correction:
   UPDATE reservations
   SET status = 'confirmed', updated_at = NOW()
   WHERE id IN (SELECT id FROM ... voir liste en 3c)
*/
