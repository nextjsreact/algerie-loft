-- Script SIMPLIFIÉ pour corriger le payment_status des réservations Airbnb confirmées
-- À exécuter IMMÉDIATEMENT

-- Vérifier combien de réservations sont concernées
SELECT COUNT(*) as nb_reservations_a_corriger
FROM reservations
WHERE source = 'airbnb_scraper'
  AND status = 'confirmed'
  AND payment_status != 'paid';

-- CORRIGER (décommenter pour exécuter)
/*
UPDATE reservations
SET payment_status = 'paid', updated_at = NOW()
WHERE source = 'airbnb_scraper'
  AND status = 'confirmed'
  AND payment_status != 'paid';
*/

-- Vérifier après correction
/*
SELECT 
  guest_name,
  status,
  payment_status,
  total_amount,
  check_in_date
FROM reservations
WHERE source = 'airbnb_scraper'
  AND status = 'confirmed'
  AND updated_at > NOW() - INTERVAL '1 minute'
LIMIT 10;
*/
