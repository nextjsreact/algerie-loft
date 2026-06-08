-- Diagnostic : Vérifier si staging contient la vraie devise pour les réservations Airbnb

-- 1. Voir les données brutes de la réservation Seloua
SELECT 
  s.airbnb_id,
  s.currency_code as staging_currency,
  s.raw_data->>'devise' as raw_devise,
  s.raw_data->>'montant_total' as raw_montant,
  r.total_amount as reservation_total_dzd,
  r.currency_code as reservation_currency
FROM airbnb_reservations_staging s
JOIN reservations r ON r.airbnb_confirmation_code = s.airbnb_id
WHERE s.guest_name LIKE '%Seloua%';

-- 2. Statistiques sur les devises dans staging
SELECT 
  currency_code,
  COUNT(*) as nombre,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as pourcentage
FROM airbnb_reservations_staging
GROUP BY currency_code
ORDER BY nombre DESC;

-- 3. Vérifier si raw_data contient des devises différentes
SELECT 
  raw_data->>'devise' as devise_dans_raw_data,
  COUNT(*) as nombre
FROM airbnb_reservations_staging
WHERE raw_data->>'devise' IS NOT NULL
GROUP BY raw_data->>'devise'
ORDER BY nombre DESC;

-- 4. Cas problématiques : DZD dans reservations mais autre devise possible dans staging
SELECT 
  r.id,
  r.guest_name,
  r.total_amount as dzd_amount,
  r.currency_code as res_currency,
  s.currency_code as staging_currency,
  s.raw_data->>'devise' as raw_devise,
  s.raw_data->>'montant_total' as raw_montant
FROM reservations r
JOIN airbnb_reservations_staging s ON s.airbnb_id = r.airbnb_confirmation_code
WHERE r.source = 'airbnb_scraper'
  AND r.currency_code = 'DZD'
  AND r.original_currency_code IS NULL
LIMIT 10;
