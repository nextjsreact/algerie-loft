-- Vérifier les statuts des réservations Airbnb et si elles bloquent la disponibilité

-- 1. Voir les réservations Airbnb confirmées
SELECT 
  r.id,
  r.guest_name,
  r.airbnb_confirmation_code,
  r.check_in_date,
  r.check_out_date,
  r.status,
  r.source,
  l.name as loft_name,
  r.created_at,
  r.synced_at
FROM reservations r
LEFT JOIN lofts l ON l.id = r.loft_id
WHERE r.source = 'airbnb_scraper'
  AND r.status IN ('confirmed', 'pending')
ORDER BY r.check_in_date DESC
LIMIT 10;

-- 2. Voir si certaines réservations Airbnb ont un statut différent
SELECT 
  status,
  COUNT(*) as count
FROM reservations
WHERE source = 'airbnb_scraper'
GROUP BY status
ORDER BY count DESC;

-- 3. Vérifier s'il y a des réservations Airbnb avec un statut qui n'est PAS 'confirmed' ou 'pending'
SELECT 
  r.id,
  r.guest_name,
  r.airbnb_confirmation_code,
  r.check_in_date,
  r.check_out_date,
  r.status,
  l.name as loft_name
FROM reservations r
LEFT JOIN lofts l ON l.id = r.loft_id
WHERE r.source = 'airbnb_scraper'
  AND r.status NOT IN ('confirmed', 'pending')
ORDER BY r.check_in_date DESC;
