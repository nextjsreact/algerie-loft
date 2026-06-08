-- Script pour déboguer la réservation Camomille loft avec incohérence

-- Trouver la réservation
SELECT 
  r.id,
  r.guest_name,
  r.airbnb_confirmation_code,
  r.check_in_date,
  r.check_out_date,
  -- Dates et nuits
  r.check_out_date::date - r.check_in_date::date as nights_calculated,
  -- Montants
  r.total_amount as montant_total_dzd,
  r.currency_code,
  r.original_amount,
  r.original_currency_code,
  r.currency_ratio,
  -- Prix par nuit
  r.price_per_night_input,
  -- Calculs
  CASE 
    WHEN r.original_amount IS NOT NULL AND (r.check_out_date::date - r.check_in_date::date) > 0 
    THEN r.original_amount / (r.check_out_date::date - r.check_in_date::date)
    ELSE NULL
  END as price_per_night_original,
  CASE 
    WHEN r.total_amount IS NOT NULL AND (r.check_out_date::date - r.check_in_date::date) > 0 
    THEN r.total_amount / (r.check_out_date::date - r.check_in_date::date)
    ELSE NULL
  END as price_per_night_dzd,
  -- Source
  r.source,
  r.created_at,
  r.synced_at
FROM reservations r
WHERE r.loft_id = (SELECT id FROM lofts WHERE name LIKE '%Camomille%' LIMIT 1)
  AND r.check_in_date >= '2026-06-01'
ORDER BY r.check_in_date DESC
LIMIT 5;

-- Vérifier s'il y a plusieurs réservations qui se chevauchent
SELECT 
  r.guest_name,
  r.check_in_date,
  r.check_out_date,
  r.total_amount,
  r.original_amount,
  r.original_currency_code,
  r.status
FROM reservations r
WHERE r.loft_id = (SELECT id FROM lofts WHERE name LIKE '%Camomille%' LIMIT 1)
  AND r.check_in_date BETWEEN '2026-06-01' AND '2026-06-30'
  AND r.status IN ('confirmed', 'pending')
ORDER BY r.check_in_date;
