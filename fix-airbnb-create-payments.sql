-- Script COMPLET pour corriger les paiements des réservations Airbnb
-- 1. Met à jour payment_status = 'paid'
-- 2. Crée un enregistrement de paiement dans reservation_payments

-- ÉTAPE 1: Identifier les réservations Airbnb confirmées sans paiement
SELECT 
  r.id,
  r.guest_name,
  r.airbnb_confirmation_code,
  r.total_amount,
  r.payment_status,
  r.check_in_date,
  COUNT(p.id) as nb_paiements_existants
FROM reservations r
LEFT JOIN reservation_payments p ON p.reservation_id = r.id
WHERE r.source = 'airbnb_scraper'
  AND r.status = 'confirmed'
GROUP BY r.id, r.guest_name, r.airbnb_confirmation_code, r.total_amount, r.payment_status, r.check_in_date
HAVING COUNT(p.id) = 0
ORDER BY r.check_in_date DESC;

-- ⚠️ Vérifiez le résultat ci-dessus avant de continuer

-- ÉTAPE 2: Mettre à jour payment_status (décommenter pour exécuter)
/*
UPDATE reservations
SET payment_status = 'paid', updated_at = NOW()
WHERE source = 'airbnb_scraper'
  AND status = 'confirmed'
  AND payment_status != 'paid';
*/

-- ÉTAPE 3: Créer des enregistrements de paiement pour les réservations Airbnb confirmées (décommenter pour exécuter)
/*
INSERT INTO reservation_payments (
  reservation_id,
  amount,
  payment_method,
  currency,
  original_amount,
  original_currency,
  status,
  transaction_id,
  processor_response,
  processed_at,
  created_at
)
SELECT 
  r.id as reservation_id,
  r.total_amount as amount,
  'airbnb' as payment_method,
  COALESCE(r.original_currency_code, 'DZD') as currency,
  COALESCE(r.original_amount, r.total_amount) as original_amount,
  COALESCE(r.original_currency_code, 'DZD') as original_currency,
  'completed' as status,
  r.airbnb_confirmation_code as transaction_id,
  'Paiement automatique via Airbnb' as processor_response,
  r.check_in_date as processed_at,
  NOW() as created_at
FROM reservations r
LEFT JOIN reservation_payments p ON p.reservation_id = r.id
WHERE r.source = 'airbnb_scraper'
  AND r.status = 'confirmed'
  AND r.payment_status = 'paid'
GROUP BY r.id
HAVING COUNT(p.id) = 0;
*/

-- ÉTAPE 4: Vérifier les paiements créés (décommenter après ÉTAPE 3)
/*
SELECT 
  r.guest_name,
  r.airbnb_confirmation_code,
  r.total_amount as montant_reservation,
  p.amount as montant_paiement,
  p.payment_method,
  p.currency,
  p.original_amount,
  p.original_currency,
  p.created_at
FROM reservations r
INNER JOIN reservation_payments p ON p.reservation_id = r.id
WHERE r.source = 'airbnb_scraper'
  AND r.status = 'confirmed'
  AND p.created_at > NOW() - INTERVAL '5 minutes'
ORDER BY p.created_at DESC;
*/

-- NOTES:
-- - payment_method sera 'airbnb' pour identifier ces paiements automatiques
-- - transaction_id contiendra le code de confirmation Airbnb
-- - processor_response explique que c'est un paiement automatique
-- - processed_at sera la date de check-in de la réservation
-- - Les montants en devises étrangères seront préservés (original_amount/original_currency)
