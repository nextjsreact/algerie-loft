-- ============================================================================
-- Nettoyage des données de test (HMTEST et PYTEST)
-- ============================================================================
-- Ce script supprime toutes les réservations de test dans le bon ordre
-- pour respecter les contraintes de clés étrangères

BEGIN;

-- 1. Supprimer les conflits liés aux réservations de test
DELETE FROM airbnb_conflicts 
WHERE reservation_1_id IN (
    SELECT id FROM reservations 
    WHERE airbnb_confirmation_code LIKE 'HMTEST%' 
       OR airbnb_confirmation_code LIKE 'PYTEST%'
)
OR reservation_2_id IN (
    SELECT id FROM reservations 
    WHERE airbnb_confirmation_code LIKE 'HMTEST%' 
       OR airbnb_confirmation_code LIKE 'PYTEST%'
);

-- 2. Supprimer le staging de test (doit être fait AVANT les réservations)
DELETE FROM airbnb_reservations_staging 
WHERE airbnb_id LIKE 'HMTEST%' 
   OR airbnb_id LIKE 'PYTEST%';

-- 3. Supprimer les réservations de test
DELETE FROM reservations 
WHERE airbnb_confirmation_code LIKE 'HMTEST%' 
   OR airbnb_confirmation_code LIKE 'PYTEST%';

-- 4. Optionnel: Supprimer les logs de sync de test (si vous voulez)
-- DELETE FROM airbnb_sync_logs 
-- WHERE sync_type = 'manual' 
--   AND started_at > NOW() - INTERVAL '1 day';

COMMIT;

-- Vérification: Compter ce qui reste
SELECT 
  'Après nettoyage' as status,
  (SELECT COUNT(*) FROM reservations WHERE source = 'airbnb_scraper') as "Réservations Airbnb",
  (SELECT COUNT(*) FROM airbnb_reservations_staging) as "Staging",
  (SELECT COUNT(*) FROM airbnb_conflicts) as "Conflits",
  (SELECT COUNT(*) FROM airbnb_sync_logs) as "Logs de sync";
