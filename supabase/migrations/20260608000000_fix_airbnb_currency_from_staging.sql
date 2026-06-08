-- Migration pour corriger les devises des réservations Airbnb
-- en récupérant la vraie devise depuis les données brutes staging

-- Étape 1: Vérifier les données staging pour extraire la devise réelle
-- Les données brutes contiennent souvent la vraie devise

DO $$
DECLARE
  rec RECORD;
  raw_devise TEXT;
  raw_montant NUMERIC;
  calculated_ratio NUMERIC;
BEGIN
  -- Pour chaque réservation Airbnb avec currency_code = 'DZD'
  FOR rec IN 
    SELECT 
      r.id as reservation_id,
      r.total_amount,
      r.airbnb_confirmation_code,
      s.raw_data,
      s.currency_code as staging_currency
    FROM reservations r
    LEFT JOIN airbnb_reservations_staging s 
      ON s.airbnb_id = r.airbnb_confirmation_code
    WHERE r.source = 'airbnb_scraper'
      AND r.currency_code = 'DZD'
      AND r.original_currency_code IS NULL
      AND s.raw_data IS NOT NULL
  LOOP
    -- Essayer d'extraire la devise des données brutes
    raw_devise := rec.staging_currency;
    
    -- Si la devise staging n'est pas DZD, l'utiliser
    IF raw_devise IS NOT NULL AND raw_devise != 'DZD' THEN
      -- Extraire le montant original depuis raw_data
      raw_montant := (rec.raw_data->>'montant_total')::NUMERIC;
      
      IF raw_montant IS NOT NULL AND raw_montant > 0 THEN
        -- Calculer le ratio : total_dzd / montant_original
        calculated_ratio := rec.total_amount / raw_montant;
        
        -- Mettre à jour la réservation
        UPDATE reservations
        SET 
          currency_code = raw_devise,
          original_currency_code = raw_devise,
          original_amount = raw_montant,
          currency_ratio = calculated_ratio,
          updated_at = NOW()
        WHERE id = rec.reservation_id;
        
        RAISE NOTICE 'Updated reservation % : % % (ratio: %)', 
          rec.airbnb_confirmation_code, raw_montant, raw_devise, calculated_ratio;
      END IF;
    END IF;
  END LOOP;
END $$;

-- Vérifier le résultat
SELECT 
  'Réservations Airbnb corrigées' as metric,
  COUNT(*) as count
FROM reservations
WHERE source = 'airbnb_scraper'
  AND currency_code != 'DZD'
  AND original_currency_code IS NOT NULL;

COMMENT ON COLUMN reservations.original_currency_code IS 
  'Code devise originale Airbnb (EUR, USD, GBP, etc.) - NULL si DZD ou inconnu';

COMMENT ON COLUMN reservations.original_amount IS 
  'Montant original dans la devise Airbnb avant conversion en DZD';

COMMENT ON COLUMN reservations.currency_ratio IS 
  'Taux de change utilisé : 1 devise_originale = X DZD';
