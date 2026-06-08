-- Script pour corriger TOUTES les réservations Airbnb qui ont des devises originales 
-- manquantes en récupérant depuis airbnb_reservations_staging

-- ÉTAPE 1: Identifier TOUTES les réservations concernées
SELECT 
  r.id,
  r.guest_name,
  r.airbnb_confirmation_code,
  r.total_amount,
  r.currency_code,
  r.original_currency_code as current_original_currency,
  r.original_amount as current_original_amount,
  r.currency_ratio as current_ratio,
  s.raw_data->>'original_currency_code' as staging_currency,
  s.raw_data->>'original_amount' as staging_amount,
  s.raw_data->>'currency_ratio' as staging_ratio,
  s.created_at as staging_date
FROM reservations r
LEFT JOIN airbnb_reservations_staging s 
  ON s.airbnb_id = r.airbnb_confirmation_code
WHERE r.source = 'airbnb_scraper'
  AND r.currency_code = 'DZD'
  AND r.original_currency_code IS NULL
  AND s.raw_data->>'original_currency_code' IS NOT NULL
  AND s.raw_data->>'original_currency_code' != 'DZD'
ORDER BY r.created_at DESC;

-- ÉTAPE 2: Appliquer les corrections en batch
-- ⚠️ ATTENTION : Vérifiez d'abord les résultats de l'ÉTAPE 1 avant d'exécuter ceci
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

-- ÉTAPE 3: Afficher le résumé des corrections
SELECT 
  'Corrections appliquées' as status,
  COUNT(*) as nombre_reservations,
  string_agg(DISTINCT original_currency_code, ', ') as devises_trouvees
FROM reservations
WHERE source = 'airbnb_scraper'
  AND currency_code = 'DZD'
  AND original_currency_code IS NOT NULL
  AND updated_at > NOW() - INTERVAL '1 minute';

-- ÉTAPE 4: Vérifier les réservations corrigées en détail
SELECT 
  id,
  guest_name,
  airbnb_confirmation_code,
  total_amount,
  currency_code,
  original_currency_code,
  original_amount,
  currency_ratio,
  ROUND(total_amount / currency_ratio, 2) as verification_montant_original,
  updated_at
FROM reservations
WHERE source = 'airbnb_scraper'
  AND currency_code = 'DZD'
  AND original_currency_code IS NOT NULL
  AND updated_at > NOW() - INTERVAL '1 minute'
ORDER BY updated_at DESC;

-- ✅ Note : La colonne verification_montant_original devrait être très proche de original_amount
-- Si la différence est > 1, vérifier le currency_ratio
