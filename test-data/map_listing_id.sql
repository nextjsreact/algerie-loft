-- Script SQL pour mapper un listing_id Airbnb à un loft
-- À exécuter dans Supabase SQL Editor

-- 1. Trouver un loft existant
SELECT id, name, address 
FROM lofts 
LIMIT 5;

-- 2. Copier l'ID d'un loft et remplacer {LOFT_ID} ci-dessous
-- Exemple: UPDATE lofts SET airbnb_listing_id = '12345678' WHERE id = 'abc123...';

-- Mapper le listing_id 12345678 au premier loft
UPDATE lofts 
SET airbnb_listing_id = '12345678' 
WHERE id = (SELECT id FROM lofts LIMIT 1);

-- 3. Vérifier le mapping
SELECT id, name, airbnb_listing_id 
FROM lofts 
WHERE airbnb_listing_id IS NOT NULL;

-- 4. Maintenant, re-uploadez le fichier JSON dans l'interface admin
-- Les réservations HMTEST001 et HMTEST002 seront créées !
