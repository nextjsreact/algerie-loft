-- Vérifier si les données de devise originale existent dans staging pour Seloua
SELECT 
  airbnb_id,
  guest_name,
  currency_code,
  total_amount,
  raw_data->>'devise' as raw_devise,
  raw_data->>'montant_total' as raw_montant_total,
  raw_data->>'original_currency_code' as raw_original_currency_code,
  raw_data->>'original_amount' as raw_original_amount,
  raw_data->>'currency_ratio' as raw_currency_ratio,
  created_at
FROM airbnb_reservations_staging
WHERE guest_name LIKE '%Seloua%' OR guest_name LIKE '%Djemadi%'
ORDER BY created_at DESC
LIMIT 5;
