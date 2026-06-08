-- Vérifier les données de la réservation pour Seloua Djemadi
-- Pour comprendre pourquoi la devise ne s'affiche pas

SELECT 
  id,
  guest_name,
  check_in_date,
  check_out_date,
  total_amount,
  currency_code,
  currency_ratio,
  original_amount,
  original_currency_code,
  price_per_night_input,
  source,
  airbnb_confirmation_code
FROM reservations
WHERE guest_name LIKE '%Seloua%' OR guest_name LIKE '%Djemadi%'
ORDER BY created_at DESC
LIMIT 5;
