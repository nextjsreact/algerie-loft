-- ========================================================================
-- SCRIPT DE CORRECTION IMMÉDIATE - 22 RÉSERVATIONS AIRBNB
-- ========================================================================
-- Ce script corrige les devises originales manquantes pour les réservations
-- Airbnb en récupérant les données depuis la table staging.
--
-- IMPACT : 22 réservations seront mises à jour
-- DURÉE : ~1 seconde
-- RÉVERSIBLE : Non (mais les anciennes valeurs sont NULL donc sans risque)
-- ========================================================================

-- ÉTAPE 1: Voir ce qui va être corrigé (REQUIS - à exécuter d'abord)
SELECT 
  COUNT(DISTINCT r.id) as reservations_a_corriger,
  COUNT(DISTINCT r.guest_name) as clients_uniques,
  SUM(DISTINCT r.total_amount) as montant_total_dzd,
  'GBP' as devise_originale
FROM reservations r
LEFT JOIN airbnb_reservations_staging s 
  ON s.airbnb_id = r.airbnb_confirmation_code
WHERE r.source = 'airbnb_scraper'
  AND r.currency_code = 'DZD'
  AND r.original_currency_code IS NULL
  AND s.raw_data->>'original_currency_code' IS NOT NULL
  AND s.raw_data->>'original_currency_code' != 'DZD';

-- ⚠️ Vérifiez que le résultat ci-dessus correspond à vos attentes avant de continuer

-- ========================================================================
-- ÉTAPE 2: EXÉCUTER LA CORRECTION (décommenter pour exécuter)
-- ========================================================================
/*
UPDATE reservations r
SET 
  original_currency_code = s.raw_data->>'original_currency_code',
  original_amount = (s.raw_data->>'original_amount')::NUMERIC,
  currency_ratio = CASE 
    WHEN s.raw_data->>'currency_ratio' IS NOT NULL 
      THEN (s.raw_data->>'currency_ratio')::NUMERIC
    ELSE r.total_amount / (s.raw_data->>'original_amount')::NUMERIC
  END,
  updated_at = NOW()
FROM airbnb_reservations_staging s
WHERE s.airbnb_id = r.airbnb_confirmation_code
  AND r.source = 'airbnb_scraper'
  AND r.currency_code = 'DZD'
  AND r.original_currency_code IS NULL
  AND s.raw_data->>'original_currency_code' IS NOT NULL
  AND s.raw_data->>'original_currency_code' != 'DZD';
*/

-- ========================================================================
-- ÉTAPE 3: Vérifier que la correction a bien été appliquée
-- ========================================================================
-- Décommenter après avoir exécuté l'ÉTAPE 2
/*
SELECT 
  'Corrections appliquées ✅' as status,
  COUNT(*) as nombre_reservations,
  string_agg(DISTINCT original_currency_code, ', ') as devises_trouvees,
  MIN(updated_at) as premiere_mise_a_jour,
  MAX(updated_at) as derniere_mise_a_jour
FROM reservations
WHERE source = 'airbnb_scraper'
  AND currency_code = 'DZD'
  AND original_currency_code IS NOT NULL
  AND updated_at > NOW() - INTERVAL '2 minutes';
*/

-- ========================================================================
-- ÉTAPE 4: Vérifier quelques exemples en détail
-- ========================================================================
-- Décommenter après avoir exécuté l'ÉTAPE 2
/*
SELECT 
  guest_name,
  airbnb_confirmation_code,
  original_amount,
  original_currency_code,
  total_amount,
  currency_ratio,
  ROUND(original_amount * currency_ratio, 2) as verification_calcul,
  ABS(ROUND(original_amount * currency_ratio, 2) - total_amount) as difference
FROM reservations
WHERE source = 'airbnb_scraper'
  AND currency_code = 'DZD'
  AND original_currency_code IS NOT NULL
  AND updated_at > NOW() - INTERVAL '2 minutes'
ORDER BY total_amount DESC
LIMIT 10;
*/

-- ========================================================================
-- ÉTAPE 5: Vérifier UNE réservation spécifique (Seloua pour exemple)
-- ========================================================================
-- Décommenter après avoir exécuté l'ÉTAPE 2
/*
SELECT 
  id,
  guest_name,
  airbnb_confirmation_code,
  check_in_date,
  check_out_date,
  total_amount as montant_dzd,
  currency_code,
  original_amount as montant_original,
  original_currency_code as devise_originale,
  currency_ratio as taux_change,
  updated_at
FROM reservations
WHERE airbnb_confirmation_code = 'HMDS5ZFM93';
*/

-- ========================================================================
-- NOTES
-- ========================================================================
-- 1. Exécutez d'ABORD l'ÉTAPE 1 pour confirmer le nombre de réservations
-- 2. Décommentez et exécutez l'ÉTAPE 2 pour appliquer la correction
-- 3. Décommentez et exécutez les ÉTAPES 3, 4, 5 pour vérifier
-- 4. La différence de calcul devrait être < 1 DZD (arrondis)
-- 5. Après correction, testez l'affichage frontend
-- ========================================================================
