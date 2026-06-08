-- Script pour corriger les paiements existants avec problèmes d'arrondi
-- Cas : paiement créé avec Math.round() au lieu de 2 décimales

-- ÉTAPE 1: Identifier les paiements avec problème d'arrondi
-- (différence entre montant payé et montant dû < 1 DA)
SELECT 
  r.id as reservation_id,
  r.guest_name,
  r.airbnb_confirmation_code,
  r.total_amount as montant_du,
  COALESCE(SUM(p.amount), 0) as montant_paye,
  r.total_amount - COALESCE(SUM(p.amount), 0) as difference,
  p.id as payment_id,
  p.amount as payment_amount,
  r.original_amount,
  r.original_currency_code,
  r.currency_ratio
FROM reservations r
LEFT JOIN reservation_payments p ON p.reservation_id = r.id
WHERE r.source = 'airbnb_scraper'
  AND r.status = 'confirmed'
GROUP BY r.id, r.guest_name, r.airbnb_confirmation_code, r.total_amount, r.original_amount, r.original_currency_code, r.currency_ratio, p.id, p.amount
HAVING ABS(r.total_amount - COALESCE(SUM(p.amount), 0)) BETWEEN 0.01 AND 0.99
ORDER BY ABS(r.total_amount - COALESCE(SUM(p.amount), 0)) DESC;

-- ÉTAPE 2: Corriger les paiements (ajuster au montant exact avec centimes)
-- Pour Adrian Patterson : 24632 → 24632.1
-- Décommenter pour exécuter :

/*
UPDATE reservation_payments p
SET 
  amount = r.total_amount,
  updated_at = NOW()
FROM reservations r
WHERE p.reservation_id = r.id
  AND r.source = 'airbnb_scraper'
  AND r.status = 'confirmed'
  AND ABS(r.total_amount - p.amount) BETWEEN 0.01 AND 0.99
  AND NOT EXISTS (
    SELECT 1 FROM reservation_payments p2 
    WHERE p2.reservation_id = r.id AND p2.id != p.id
  );
*/

-- ÉTAPE 3: Vérifier les corrections (décommenter après ÉTAPE 2)
/*
SELECT 
  r.guest_name,
  r.airbnb_confirmation_code,
  r.total_amount as montant_du,
  p.amount as montant_paye,
  r.total_amount - p.amount as difference,
  p.updated_at
FROM reservations r
INNER JOIN reservation_payments p ON p.reservation_id = r.id
WHERE r.source = 'airbnb_scraper'
  AND r.status = 'confirmed'
  AND p.updated_at > NOW() - INTERVAL '2 minutes'
ORDER BY p.updated_at DESC;
*/

-- ÉTAPE 4: Vérification spécifique pour Adrian Patterson
/*
SELECT 
  r.id,
  r.guest_name,
  r.total_amount as montant_du,
  p.amount as montant_paye,
  r.total_amount - p.amount as reste,
  p.original_amount,
  p.original_currency
FROM reservations r
LEFT JOIN reservation_payments p ON p.reservation_id = r.id
WHERE r.guest_name LIKE '%Adrian%' OR r.guest_name LIKE '%Patterson%';
*/

-- NOTES:
-- - Ce script corrige UNIQUEMENT les paiements existants avec petites différences d'arrondi
-- - Il ajuste le montant du paiement pour qu'il corresponde exactement au total_amount
-- - Condition de sécurité : ne corrige que s'il n'y a qu'UN SEUL paiement pour la réservation
-- - Les nouveaux paiements créés utiliseront automatiquement le code corrigé (2 décimales)
