-- ============================================================================
-- Vérification des données de test réalistes (HM2026)
-- ============================================================================

-- 1. Réservations créées avec coordonnées complètes
SELECT 
  '=== RÉSERVATIONS CRÉÉES ===' as section,
  airbnb_confirmation_code as "Code",
  guest_name as "Nom",
  guest_email as "Email",
  guest_phone as "Téléphone",
  guest_nationality as "Nat",
  check_in_date as "Arrivée",
  check_out_date as "Départ",
  total_amount as "Montant",
  status as "Statut",
  source as "Source"
FROM reservations 
WHERE airbnb_confirmation_code LIKE 'HM2026%'
ORDER BY check_in_date;

-- 2. Réservation ignorée (en staging car listing non mappé)
SELECT 
  '=== RÉSERVATION EN STAGING (non mappée) ===' as section,
  airbnb_id as "Code",
  guest_name as "Nom",
  guest_email as "Email",
  guest_phone as "Téléphone",
  listing_id as "Listing ID",
  mapping_status as "Mapping",
  validation_status as "Validation",
  reconciliation_status as "Réconciliation"
FROM airbnb_reservations_staging 
WHERE airbnb_id LIKE 'HM2026%'
ORDER BY created_at DESC;

-- 3. Statistiques finales
SELECT 
  '=== STATISTIQUES ===' as section,
  COUNT(*) as "Total réservations Airbnb",
  COUNT(CASE WHEN guest_email IS NOT NULL AND guest_email != '' THEN 1 END) as "Avec email",
  COUNT(CASE WHEN guest_phone IS NOT NULL AND guest_phone != '' THEN 1 END) as "Avec téléphone",
  COUNT(CASE WHEN guest_nationality IS NOT NULL AND guest_nationality != '' THEN 1 END) as "Avec nationalité",
  SUM(total_amount) as "Montant total (DZD)"
FROM reservations
WHERE source = 'airbnb_scraper';

-- 4. Listing IDs détectés
SELECT 
  '=== LISTING IDs DÉTECTÉS ===' as section,
  listing_id as "Listing ID",
  COUNT(*) as "Nb réservations",
  STRING_AGG(DISTINCT guest_name, ', ') as "Voyageurs"
FROM airbnb_reservations_staging
WHERE airbnb_id LIKE 'HM2026%'
GROUP BY listing_id
UNION ALL
SELECT 
  '=== LISTING IDs MAPPÉS ===' as section,
  l.airbnb_listing_id as "Listing ID",
  COUNT(r.id) as "Nb réservations",
  l.name as "Loft"
FROM lofts l
LEFT JOIN reservations r ON r.loft_id = l.id AND r.source = 'airbnb_scraper'
WHERE l.airbnb_listing_id IS NOT NULL
GROUP BY l.airbnb_listing_id, l.name;
