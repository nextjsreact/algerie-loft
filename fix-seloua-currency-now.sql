-- Script de correction IMMÉDIATE pour la réservation Seloua Djemadi
-- Basé sur les données trouvées dans staging

-- ÉTAPE 1: Vérifier l'état actuel
SELECT 
  id,
  guest_name,
  airbnb_confirmation_code,
  total_amount,
  currency_code,
  original_currency_code,
  original_amount,
  currency_ratio
FROM reservations
WHERE airbnb_confirmation_code = 'HMDS5ZFM93';

-- ÉTAPE 2: Appliquer la correction
UPDATE reservations
SET 
  original_currency_code = 'GBP',
  original_amount = 49.01,
  currency_ratio = 270,
  updated_at = NOW()
WHERE airbnb_confirmation_code = 'HMDS5ZFM93';

-- ÉTAPE 3: Vérifier que la correction a été appliquée
SELECT 
  id,
  guest_name,
  airbnb_confirmation_code,
  total_amount,
  currency_code,
  original_currency_code,
  original_amount,
  currency_ratio,
  updated_at
FROM reservations
WHERE airbnb_confirmation_code = 'HMDS5ZFM93';

-- ✅ Après cette correction, l'affichage frontend devrait montrer :
-- - Montant principal : 49,01 GBP
-- - Conversion : 13 232,70 DZD  
-- - Taux : 1 GBP = 270,00 DZD
