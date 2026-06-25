-- ============================================================
-- Script : Supprimer le mock avis/commentaire de production
-- Client : Habib (habib.belkacemi@loftalgerie.com)
-- Séjour : Dounia loft (10 → 13 mai 2026)
-- ============================================================

-- 1. IDENTIFIER le client
SELECT id, email, full_name
FROM public.profiles
WHERE email LIKE '%habib%belkacemi%' OR full_name ILIKE '%habib%';

-- 2. IDENTIFIER le loft "Dounia loft"
SELECT id, name, address
FROM public.lofts
WHERE name ILIKE '%dounia%';

-- 3. IDENTIFIER la réservation (booking) correspondante
-- Remplacer les UUID ci-dessous par ceux trouvés aux étapes 1 et 2
SELECT b.id, b.check_in, b.check_out, b.status, b.total_price, b.loft_id, b.client_id
FROM public.bookings b
WHERE b.loft_id IN (SELECT id FROM public.lofts WHERE name ILIKE '%dounia%')
  AND b.check_in = '2026-05-10'
  AND b.check_out = '2026-05-13';

-- 4. IDENTIFIER l'avis associé
SELECT r.id, r.booking_id, r.rating, r.review_text, r.response_text, r.created_at
FROM public.loft_reviews r
WHERE r.booking_id IN (
  SELECT b.id FROM public.bookings b
  WHERE b.loft_id IN (SELECT id FROM public.lofts WHERE name ILIKE '%dounia%')
    AND b.check_in = '2026-05-10'
    AND b.check_out = '2026-05-13'
);

-- ============================================================
-- ÉTAPE 5 : SUPPRIMER les données (décommenter après vérification)
-- ============================================================

-- 5a. Supprimer l'avis
-- DELETE FROM public.loft_reviews
-- WHERE booking_id IN (
--   SELECT b.id FROM public.bookings b
--   WHERE b.loft_id IN (SELECT id FROM public.lofts WHERE name ILIKE '%dounia%')
--     AND b.check_in = '2026-05-10'
--     AND b.check_out = '2026-05-13'
-- );

-- 5b. Supprimer la réservation (si c'était un mock de test)
-- DELETE FROM public.bookings
-- WHERE loft_id IN (SELECT id FROM public.lofts WHERE name ILIKE '%dounia%')
--   AND check_in = '2026-05-10'
--   AND check_out = '2026-05-13';

-- ============================================================
-- VÉRIFICATION finale
-- SELECT * FROM public.loft_reviews WHERE review_text ILIKE '%séjour excellent%';
-- SELECT * FROM public.bookings WHERE check_in = '2026-05-10' AND check_out = '2026-05-13';
-- ============================================================
