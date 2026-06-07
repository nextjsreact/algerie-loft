-- Script pour corriger les réservations Airbnb qui ont currency_code='DZD' 
-- mais qui devraient avoir original_currency_code et original_amount
-- en récupérant les données depuis airbnb_reservations_staging

-- ÉTAPE 1: Identifier les réservations concernées
SELECT 
  r.id,
  r.guest_name,
  r.airbnb_confirmation_code,
  r.total_amount,
  r.currency_code,
  r.original_currency_code,
  r.original_amount,
  r.currency_ratio,
  s.raw_data->>'devise' as staging_devise,
  s.raw_data->>'montant_total' as staging_montant,
  s.raw_data->>'original_currency_code' as staging_original_currency,
  s.raw_data->>'original_amount' as staging_original_amount,
  s.raw_data->>'currency_ratio' as staging_currency_ratio
FROM reservations r
LEFT JOIN airbnb_reservations_staging s 
  ON s.airbnb_id = r.airbnb_confirmation_code
WHERE r.source = 'airbnb_scraper'
  AND r.currency_code = 'DZD'
  AND r.original_currency_code IS NULL
  AND s.raw_data IS NOT NULL
ORDER BY r.created_at DESC;

-- ÉTAPE 2: Corriger les réservations (décommenter pour exécuter)
/*
DO $$
DECLARE
  v_reservation RECORD;
  v_raw_devise TEXT;
  v_raw_montant TEXT;
  v_raw_original_currency TEXT;
  v_raw_original_amount TEXT;
  v_raw_currency_ratio TEXT;
  v_calculated_ratio NUMERIC;
  v_updated_count INTEGER := 0;
BEGIN
  FOR v_reservation IN
    SELECT 
      r.id,
      r.airbnb_confirmation_code,
      r.total_amount,
      s.raw_data
    FROM reservations r
    LEFT JOIN airbnb_reservations_staging s 
      ON s.airbnb_id = r.airbnb_confirmation_code
    WHERE r.source = 'airbnb_scraper'
      AND r.currency_code = 'DZD'
      AND r.original_currency_code IS NULL
      AND s.raw_data IS NOT NULL
  LOOP
    -- Extraire les valeurs depuis raw_data JSON
    v_raw_devise := v_reservation.raw_data->>'devise';
    v_raw_montant := v_reservation.raw_data->>'montant_total';
    v_raw_original_currency := v_reservation.raw_data->>'original_currency_code';
    v_raw_original_amount := v_reservation.raw_data->>'original_amount';
    v_raw_currency_ratio := v_reservation.raw_data->>'currency_ratio';

    -- Si original_currency_code est présent dans raw_data, l'utiliser
    IF v_raw_original_currency IS NOT NULL AND v_raw_original_currency != 'DZD' 
       AND v_raw_original_amount IS NOT NULL THEN
      
      -- Calculer le ratio si non fourni
      IF v_raw_currency_ratio IS NULL OR v_raw_currency_ratio = '' THEN
        v_calculated_ratio := v_reservation.total_amount / v_raw_original_amount::NUMERIC;
      ELSE
        v_calculated_ratio := v_raw_currency_ratio::NUMERIC;
      END IF;

      -- Mettre à jour la réservation
      UPDATE reservations
      SET 
        original_currency_code = v_raw_original_currency,
        original_amount = v_raw_original_amount::NUMERIC,
        currency_ratio = v_calculated_ratio,
        updated_at = NOW()
      WHERE id = v_reservation.id;

      v_updated_count := v_updated_count + 1;
      
      RAISE NOTICE 'Updated reservation % (%) with original_currency_code=%, original_amount=%, ratio=%',
        v_reservation.id,
        v_reservation.airbnb_confirmation_code,
        v_raw_original_currency,
        v_raw_original_amount,
        v_calculated_ratio;
    
    -- Sinon, si devise != 'DZD', utiliser devise comme fallback
    ELSIF v_raw_devise IS NOT NULL AND v_raw_devise != 'DZD' AND v_raw_montant IS NOT NULL THEN
      
      -- Le montant est déjà en DZD dans total_amount, on ne peut pas recalculer original_amount
      -- On marque juste que la devise originale était différente
      RAISE NOTICE 'Reservation % (%) : devise originale était % mais montant original perdu',
        v_reservation.id,
        v_reservation.airbnb_confirmation_code,
        v_raw_devise;
    
    ELSE
      RAISE NOTICE 'Reservation % (%) : aucune donnée de devise originale trouvée',
        v_reservation.id,
        v_reservation.airbnb_confirmation_code;
    END IF;

  END LOOP;

  RAISE NOTICE 'Correction terminée : % réservation(s) corrigée(s)', v_updated_count;
END $$;
*/

-- ÉTAPE 3: Vérifier les corrections (décommenter après avoir exécuté l'étape 2)
/*
SELECT 
  id,
  guest_name,
  airbnb_confirmation_code,
  total_amount,
  currency_code,
  original_currency_code,
  original_amount,
  currency_ratio
FROM reservations
WHERE source = 'airbnb_scraper'
  AND currency_code = 'DZD'
  AND original_currency_code IS NOT NULL
ORDER BY updated_at DESC;
*/
