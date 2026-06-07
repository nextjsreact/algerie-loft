-- Vérification des statuts des réservations Airbnb
-- Pour comprendre pourquoi certaines réservations sont en statut "pending"

-- 1. Compter les réservations Airbnb par statut
SELECT 
  status as "Statut",
  COUNT(*) as "Nombre de réservations",
  ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM reservations WHERE source = 'airbnb_scraper'), 0), 1)::text || '%' as "Pourcentage"
FROM reservations
WHERE source = 'airbnb_scraper'
GROUP BY status
ORDER BY COUNT(*) DESC;

-- 2. Voir quelques exemples de réservations "pending"
SELECT 
  airbnb_confirmation_code as "Code Airbnb",
  guest_name as "Voyageur",
  check_in_date as "Arrivée",
  check_out_date as "Départ",
  total_amount as "Montant",
  created_at as "Créée le",
  last_manual_edit_at as "Dernière modification manuelle"
FROM reservations
WHERE source = 'airbnb_scraper' AND status = 'pending'
ORDER BY check_in_date DESC
LIMIT 10;

-- 3. Vérifier les données brutes dans staging pour voir le statut original
SELECT 
  airbnb_id as "Code Airbnb",
  status as "Statut traduit",
  raw_data->>'statut' as "Statut original (FR)",
  guest_name as "Voyageur",
  check_in_date as "Arrivée"
FROM airbnb_reservations_staging
WHERE reconciliation_status = 'created'
  AND reservation_id IN (
    SELECT id FROM reservations 
    WHERE source = 'airbnb_scraper' AND status = 'pending'
  )
ORDER BY check_in_date DESC
LIMIT 10;

-- 4. Compter les statuts originaux français dans staging
SELECT 
  raw_data->>'statut' as "Statut original (FR)",
  COUNT(*) as "Nombre",
  ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM airbnb_reservations_staging), 0), 1)::text || '%' as "Pourcentage"
FROM airbnb_reservations_staging
WHERE raw_data->>'statut' IS NOT NULL
GROUP BY raw_data->>'statut'
ORDER BY COUNT(*) DESC;
