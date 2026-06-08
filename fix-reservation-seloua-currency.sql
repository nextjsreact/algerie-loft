-- Script pour corriger manuellement la devise de la réservation Seloua Djemadi
-- Cette réservation vient d'Airbnb mais n'a pas les bonnes informations de devise

-- ÉTAPE 1: Vérifier la réservation
SELECT 
  id,
  guest_name,
  total_amount,
  currency_code,
  original_currency_code,
  original_amount,
  source
FROM reservations
WHERE guest_name LIKE '%Seloua%' OR guest_name LIKE '%Djemadi%';

-- ÉTAPE 2: Si vous savez que c'est une réservation EUR (par exemple 53 EUR = 13232.7 DZD au taux 250)
-- Décommentez et exécutez ceci:

/*
UPDATE reservations
SET 
  currency_code = 'EUR',
  original_currency_code = 'EUR',
  original_amount = 53,  -- Montant original en EUR (13232.7 / 250 = 52.93 ≈ 53)
  currency_ratio = 250,   -- Taux de change EUR vers DZD
  price_per_night_input = 53,  -- Prix par nuit en EUR (si 1 nuit)
  updated_at = NOW()
WHERE guest_name LIKE '%Seloua%' 
  AND source = 'airbnb_scraper'
  AND check_in_date = '2026-06-07';

-- Vérifier après mise à jour
SELECT 
  id,
  guest_name,
  total_amount,
  currency_code,
  original_currency_code,
  original_amount,
  currency_ratio,
  price_per_night_input
FROM reservations
WHERE guest_name LIKE '%Seloua%';
*/

-- IMPORTANT: 
-- 1. Vérifiez d'abord le montant réel en EUR sur Airbnb
-- 2. Ajustez original_amount selon le vrai montant
-- 3. Calculez currency_ratio = total_amount / original_amount
