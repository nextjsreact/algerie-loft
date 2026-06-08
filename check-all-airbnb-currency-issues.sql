-- Vérifier TOUTES les réservations Airbnb avec problème de devise
-- (celles qui ont currency_code = 'DZD' au lieu de la vraie devise)

-- 1. Compter les réservations Airbnb par devise
SELECT 
  currency_code,
  COUNT(*) as nombre,
  SUM(total_amount) as montant_total
FROM reservations
WHERE source = 'airbnb_scraper'
GROUP BY currency_code
ORDER BY nombre DESC;

-- 2. Réservations Airbnb avec currency_code = 'DZD' (suspect pour Airbnb)
SELECT 
  id,
  guest_name,
  check_in_date,
  check_out_date,
  total_amount,
  currency_code,
  original_currency_code,
  original_amount,
  airbnb_confirmation_code,
  created_at
FROM reservations
WHERE source = 'airbnb_scraper'
  AND currency_code = 'DZD'
  AND original_currency_code IS NULL
ORDER BY check_in_date DESC
LIMIT 20;

-- 3. Statistiques
SELECT 
  'Total réservations Airbnb' as metric,
  COUNT(*) as value
FROM reservations
WHERE source = 'airbnb_scraper'

UNION ALL

SELECT 
  'Avec devise étrangère correcte' as metric,
  COUNT(*) as value
FROM reservations
WHERE source = 'airbnb_scraper'
  AND currency_code != 'DZD'
  AND original_currency_code IS NOT NULL

UNION ALL

SELECT 
  'Avec problème de devise (DZD)' as metric,
  COUNT(*) as value
FROM reservations
WHERE source = 'airbnb_scraper'
  AND currency_code = 'DZD'
  AND original_currency_code IS NULL;
