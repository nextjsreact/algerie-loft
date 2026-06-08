-- ============================================================================
-- DIAGNOSTIC: État de guest_phone
-- État attendu après migrations 010 + 011 + 012 :
--   - NULL = pas de téléphone (scraper n'a pas pu récupérer OU ancienne valeur 'N/A' normalisée)
--   - STRING avec ≥ 5 chiffres = vrai numéro
--   - 0 occurrences de 'true', 'false', 'N/A', '0', noms, etc.
-- ============================================================================

-- 1) Répartition actuelle
SELECT
  COUNT(*) FILTER (WHERE guest_phone IS NULL)                              AS null_count,
  COUNT(*) FILTER (WHERE guest_phone IS NOT NULL
                    AND LENGTH(REGEXP_REPLACE(guest_phone, '\D', '', 'g')) >= 5) AS real_phone_count,
  COUNT(*) FILTER (WHERE guest_phone IS NOT NULL
                    AND LENGTH(REGEXP_REPLACE(guest_phone, '\D', '', 'g')) < 5)  AS suspect_count,
  COUNT(*) AS total
FROM reservations;

-- 2) Si suspect_count > 0 : voir les coupables
SELECT
  guest_phone,
  LENGTH(guest_phone) AS len,
  LENGTH(REGEXP_REPLACE(guest_phone, '\D', '', 'g')) AS digit_count,
  COUNT(*) AS occurrences,
  MIN(created_at) AS first_seen,
  MAX(created_at) AS last_seen
FROM reservations
WHERE guest_phone IS NOT NULL
  AND guest_phone <> ''
  AND guest_phone <> 'N/A'
  AND LENGTH(REGEXP_REPLACE(guest_phone, '\D', '', 'g')) < 5
GROUP BY guest_phone
ORDER BY occurrences DESC
LIMIT 30;

-- 3) Pour la réservation "Dana Le" : quel sync_log l'a traitée (FK directe, migration 010)
SELECT
  r.id,
  r.guest_name,
  r.guest_phone,
  r.guest_email,
  r.source,
  r.airbnb_confirmation_code,
  r.matched_via,
  r.created_at AS reservation_created_at,
  (SELECT json_agg(json_build_object(
    'log_id', l.id,
    'action', lr.action,
    'link_created_at', lr.created_at,
    'sync_type', l.sync_type,
    'status', l.status,
    'script_version', l.script_version,
    'started_at', l.started_at,
    'errors', l.errors
  ) ORDER BY l.started_at DESC)
   FROM airbnb_sync_log_reservations lr
   JOIN airbnb_sync_logs l ON l.id = lr.log_id
   WHERE lr.reservation_id = r.id
  ) AS sync_logs_linked
FROM reservations r
WHERE r.guest_name ILIKE '%dana%le%'
ORDER BY r.created_at DESC
LIMIT 5;

-- 4) Nettoyage (À EXÉCUTER SI suspect_count > 0)
-- UPDATE reservations
-- SET guest_phone = NULL
-- WHERE guest_phone IS NOT NULL
--   AND guest_phone <> ''
--   AND LENGTH(REGEXP_REPLACE(guest_phone, '\D', '', 'g')) < 5;
