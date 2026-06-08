-- ================================================================
-- DIAGNOSTIC: Pourquoi les réservations Airbnb ne bloquent pas la disponibilité
-- ================================================================

-- 1. Vérifier les statuts des réservations Airbnb FUTURES
SELECT 
  r.status,
  COUNT(*) as count,
  MIN(r.check_in_date) as earliest_checkin,
  MAX(r.check_in_date) as latest_checkin
FROM reservations r
WHERE r.source = 'airbnb_scraper'
  AND r.check_in_date >= CURRENT_DATE  -- Réservations futures
GROUP BY r.status
ORDER BY count DESC;

-- 2. Vérifier si certaines réservations Airbnb FUTURES ne sont ni 'confirmed' ni 'pending'
-- (Ces réservations ne bloqueront PAS la disponibilité!)
SELECT 
  r.id,
  r.guest_name,
  r.airbnb_confirmation_code,
  r.check_in_date,
  r.check_out_date,
  r.status,
  l.name as loft_name,
  r.synced_at
FROM reservations r
LEFT JOIN lofts l ON l.id = r.loft_id
WHERE r.source = 'airbnb_scraper'
  AND r.check_in_date >= CURRENT_DATE  -- Réservations futures
  AND r.status NOT IN ('confirmed', 'pending')  -- ⚠️ PROBLÈME: Ces réservations n'apparaîtront pas comme indisponibles!
ORDER BY r.check_in_date;

-- 3. Tester la fonction check_loft_availability avec une réservation Airbnb spécifique
-- Remplacer ces valeurs par une vraie réservation Airbnb:
DO $$
DECLARE
  test_loft_id UUID;
  test_check_in DATE;
  test_check_out DATE;
  is_available BOOLEAN;
BEGIN
  -- Prendre la première réservation Airbnb future
  SELECT loft_id, check_in_date, check_out_date
  INTO test_loft_id, test_check_in, test_check_out
  FROM reservations
  WHERE source = 'airbnb_scraper'
    AND check_in_date >= CURRENT_DATE
    AND status IN ('confirmed', 'pending')
  LIMIT 1;

  IF test_loft_id IS NOT NULL THEN
    -- Tester la disponibilité pendant cette période
    is_available := check_loft_availability(test_loft_id, test_check_in, test_check_out);
    
    RAISE NOTICE 'Test loft_id: %', test_loft_id;
    RAISE NOTICE 'Test dates: % to %', test_check_in, test_check_out;
    RAISE NOTICE 'Is available: % (should be FALSE)', is_available;
    
    IF is_available THEN
      RAISE WARNING 'BUG DÉTECTÉ: La période devrait être INDISPONIBLE mais la fonction retourne TRUE!';
    ELSE
      RAISE NOTICE 'OK: La fonction détecte correctement que la période est indisponible';
    END IF;
  ELSE
    RAISE NOTICE 'Aucune réservation Airbnb future trouvée pour le test';
  END IF;
END $$;

-- 4. Voir les réservations Airbnb qui se chevauchent avec d'autres réservations
-- (Cela pourrait indiquer un problème de disponibilité)
SELECT 
  r1.id as resa1_id,
  r1.guest_name as resa1_guest,
  r1.check_in_date as resa1_in,
  r1.check_out_date as resa1_out,
  r1.status as resa1_status,
  r1.source as resa1_source,
  r2.id as resa2_id,
  r2.guest_name as resa2_guest,
  r2.check_in_date as resa2_in,
  r2.check_out_date as resa2_out,
  r2.status as resa2_status,
  r2.source as resa2_source,
  l.name as loft_name,
  -- Calculer les jours de chevauchement
  LEAST(r1.check_out_date, r2.check_out_date) - GREATEST(r1.check_in_date, r2.check_in_date) as overlap_days
FROM reservations r1
JOIN reservations r2 ON r1.loft_id = r2.loft_id AND r1.id < r2.id
LEFT JOIN lofts l ON l.id = r1.loft_id
WHERE 
  -- Au moins une des deux est Airbnb
  (r1.source = 'airbnb_scraper' OR r2.source = 'airbnb_scraper')
  -- Dates futures
  AND r1.check_in_date >= CURRENT_DATE
  -- Les deux sont actives (pas annulées)
  AND r1.status IN ('confirmed', 'pending', 'completed')
  AND r2.status IN ('confirmed', 'pending', 'completed')
  -- Chevauchement de dates
  AND r1.check_in_date < r2.check_out_date
  AND r1.check_out_date > r2.check_in_date
ORDER BY r1.check_in_date, overlap_days DESC;

-- 5. Résumé des statuts par source
SELECT 
  source,
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY source), 2) as percentage
FROM reservations
WHERE check_in_date >= CURRENT_DATE  -- Seulement futures
GROUP BY source, status
ORDER BY source, count DESC;
