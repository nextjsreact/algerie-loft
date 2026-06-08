-- Script pour corriger le statut de paiement des réservations Airbnb confirmées
-- Les réservations Airbnb confirmées devraient avoir payment_status = 'paid'
-- car le paiement est géré par Airbnb

-- ÉTAPE 1: Identifier les réservations concernées
SELECT 
  id,
  guest_name,
  airbnb_confirmation_code,
  status,
  payment_status,
  total_amount,
  check_in_date,
  synced_at
FROM reservations
WHERE source = 'airbnb_scraper'
  AND status = 'confirmed'
  AND payment_status != 'paid'
ORDER BY check_in_date DESC;

-- ⚠️ Vérifiez le résultat ci-dessus avant de continuer

-- ÉTAPE 2: Corriger le statut de paiement (décommenter pour exécuter)
/*
UPDATE reservations
SET 
  payment_status = 'paid',
  updated_at = NOW()
WHERE source = 'airbnb_scraper'
  AND status = 'confirmed'
  AND payment_status != 'paid';
*/

-- ÉTAPE 3: Vérifier les corrections (décommenter après avoir exécuté l'ÉTAPE 2)
/*
SELECT 
  'Corrections appliquées ✅' as status,
  COUNT(*) as nombre_reservations_corrigees
FROM reservations
WHERE source = 'airbnb_scraper'
  AND status = 'confirmed'
  AND payment_status = 'paid'
  AND updated_at > NOW() - INTERVAL '1 minute';
*/

-- ÉTAPE 4: Vérifier quelques exemples
/*
SELECT 
  guest_name,
  airbnb_confirmation_code,
  status,
  payment_status,
  total_amount,
  check_in_date
FROM reservations
WHERE source = 'airbnb_scraper'
  AND status = 'confirmed'
  AND updated_at > NOW() - INTERVAL '1 minute'
ORDER BY check_in_date DESC
LIMIT 10;
*/

-- Note: Pour les prochaines synchronisations, le code corrigé
-- mettra automatiquement payment_status = 'paid' pour les réservations confirmées
